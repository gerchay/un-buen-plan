// HTML de correo: tablas y estilos en línea para Gmail, Outlook y móvil.
const escapeHTML = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderEmail({plan, date, time, bowling=false}) {
  const dateText = new Intl.DateTimeFormat('es-GT',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'America/Guatemala'}).format(new Date(`${date}T12:00:00-06:00`));
  const [hours,minutes] = time.split(':').map(Number);
  const timeText = `${hours%12||12}:${String(minutes).padStart(2,'0')} ${hours>=12?'p. m.':'a. m.'}`;
  const note = bowling ? 'El que pierde invita la cena 😏' : 'Ya solo falta que llegue el día.';
  // El calendario necesita una hora de fin: sugerimos dos horas, editables al guardar.
  const start = new Date(`${date}T${time}:00-06:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const calendarStamp = value => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const calendarURL = new URL('https://calendar.google.com/calendar/render');
  calendarURL.search = new URLSearchParams({
    action: 'TEMPLATE',
    text: plan,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    ctz: 'America/Guatemala',
    details: `¡Tenemos plan! ${note}\nDuración sugerida: 2 horas. Puedes ajustar la hora de fin y los recordatorios antes de guardar.`
  }).toString();
  const textContent = `¡Tenemos plan!\n\n${plan}\n${dateText}\n${timeText} · Hora de Guatemala\n\n${note}\n\nAgregar a Google Calendar: ${calendarURL.href}\nDuración sugerida: 2 horas. Puedes ajustarla y elegir tus recordatorios al guardar.\n\n¡Nos vemos!`;
  const htmlContent = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>¡Tenemos plan!</title></head>
<body style="margin:0;padding:0;background-color:#f6f5ef;color:#304b3d;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;color:#f6f5ef;max-height:0;max-width:0;overflow:hidden;opacity:0;">${escapeHTML(plan)} · ${escapeHTML(dateText)} · ${escapeHTML(timeText)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f5ef;"><tr><td align="center" style="padding:32px 14px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#fffef9;border:1px solid #d9ddcf;border-radius:20px;">
<tr><td style="padding:32px 26px 20px;border-top:5px solid #71886a;border-radius:20px 20px 0 0;">
<p style="margin:0 0 18px;font-size:30px;line-height:1.2;">🙌</p>
<h1 style="margin:0 0 12px;color:#304b3d;font-size:30px;line-height:1.2;font-weight:700;">¡Tenemos plan!</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:#687168;">Te dejo los detalles por aquí para que no se nos pase.</p>
</td></tr>
<tr><td style="padding:4px 26px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8ecdf;border-radius:12px;">
<tr><td style="padding:22px 20px 18px;"><p style="margin:0 0 7px;color:#687168;font-size:11px;letter-spacing:1.5px;">EL PLAN</p><p style="margin:0;color:#304b3d;font-size:23px;line-height:1.3;font-weight:700;">${escapeHTML(plan)}</p></td></tr>
<tr><td style="padding:0 20px 18px;"><p style="margin:0 0 6px;color:#687168;font-size:11px;letter-spacing:1.5px;">CUÁNDO</p><p style="margin:0;color:#304b3d;font-size:16px;line-height:1.5;">${escapeHTML(dateText)}</p><p style="margin:5px 0 0;color:#304b3d;font-size:20px;font-weight:700;">${escapeHTML(timeText)}</p><p style="margin:5px 0 0;color:#687168;font-size:12px;">Hora de Guatemala</p></td></tr>
</table></td></tr>
<tr><td align="center" style="padding:0 26px 24px;">
<a href="${escapeHTML(calendarURL.href)}" target="_blank" style="display:inline-block;background-color:#304b3d;color:#fffef9;padding:15px 20px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;text-decoration:none;line-height:1.4;">Agregar a Google Calendar</a>
<p style="margin:12px 0 0;color:#687168;font-size:12px;line-height:1.6;">Duración sugerida: 2 horas. Puedes ajustarla y elegir tus recordatorios al guardar.</p>
</td></tr>
<tr><td style="padding:0 26px 30px;"><p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#687168;">${escapeHTML(note)}</p><p style="margin:0;font-size:19px;color:#304b3d;font-weight:700;">¡Nos vemos!</p></td></tr>
</table></td></tr></table></body></html>`;
  return {textContent,htmlContent};
}
