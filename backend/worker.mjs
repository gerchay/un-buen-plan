import { renderEmail } from './email.mjs';
// Cloudflare Worker. Los secretos se configuran en Cloudflare, nunca en GitHub Pages.
const PLANS = {boliche:'Boliche',cena:'Vamos a cenar',zapote:'Finca El Zapote',carmona:'Finca Carmona',cafe:'Café y algo dulce'};
const BLOCKED = [12,13,18,19,27,28,29];
export function validate(data, now = new Date()) {
  const date = data?.date, time = data?.time;
  if (!PLANS[data?.plan?.id] || typeof date !== 'string' || !/^2026-11-\d{2}$/.test(date)) return false;
  const day = Number(date.slice(8));
  if (day < 1 || day > 30 || BLOCKED.includes(day) || typeof time !== 'string' || !/^(?:0[6-9]|1\d|2[0-2]):(?:00|30)$|^23:00$/.test(time)) return false;
  return new Date(`${date}T${time}:00-06:00`) > now;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = {'Content-Type':'application/json','Vary':'Origin','Cache-Control':'no-store'};
    if (origin === env.ALLOWED_ORIGIN) Object.assign(headers, {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
    const reply = (status, value) => new Response(JSON.stringify(value), {status, headers});
    if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) return reply(403,{error:'Origen no permitido.'});
    if (new URL(request.url).pathname !== '/invite') return reply(404,{error:'Ruta no encontrada.'});
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (request.method !== 'POST') return reply(405,{error:'Método no permitido.'});
    // Tu copia siempre usa HOST_EMAIL; el correo de la invitada es opcional.
    if (!['BREVO_API_KEY','SENDER_EMAIL','HOST_EMAIL'].every(key=>env[key])) return reply(503,{error:'El envío todavía no está configurado.'});
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415,{error:'Se requiere JSON.'});
    let data;
    try {
      const raw = await request.text();
      if (raw.length > 4096) return reply(413,{error:'Solicitud demasiado grande.'});
      data = JSON.parse(raw);
    } catch { return reply(400,{error:'Datos inválidos.'}); }
    if (!validate(data)) return reply(400,{error:'Revisa el plan, la fecha y el horario.'});
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if ((data.email != null && typeof data.email !== 'string') || email.length > 254 || (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))) return reply(400,{error:'Revisa el correo o deja el campo vacío.'});
    const recipients = [...new Set([email,env.HOST_EMAIL.trim().toLowerCase()].filter(Boolean))];
    const { textContent, htmlContent } = renderEmail({plan:PLANS[data.plan.id],date:data.date,time:data.time,bowling:data.plan.id==='boliche'});
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({sender:{email:env.SENDER_EMAIL,name:env.SENDER_NAME||'Tenemos plan'},to:[{email:recipients[0]}],...(recipients.length>1?{bcc:[{email:recipients[1]}]}:{}),subject:'¡Tenemos plan! 🙌',textContent,htmlContent,replyTo:{email:env.HOST_EMAIL}}),
        signal:AbortSignal.timeout(15000)
      });
      if (!response.ok) return reply(502,{error:'No pudimos confirmar el envío. Revisa tu correo antes de volver a intentarlo.'});
      const result = await response.json();
      if (!result.messageId) throw new Error('Missing messageId');
      return reply(200,{accepted:true});
    } catch { return reply(502,{error:'No pudimos confirmar el envío. Revisa tu correo antes de volver a intentarlo.'}); }
  }
};
