'use strict';
// Edita aquí las opciones de la invitación. Horarios provisionales para revisar el flujo.
const CONFIG = {
  year: 2026, month: 11, timeZone: 'America/Guatemala',
  blockedDays: [12, 13, 18, 19, 27, 28, 29],
  times: Array.from({length: 35}, (_, i) => {const minutes=360+i*30;return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}),
  emailEndpoint: '', // Vacío = simulación. Luego: https://TU-WORKER.workers.dev/invite
  plans: [
    { id: 'boliche', name: 'Boliche', detail: 'El que pierde invita la cena.', icon: '🎳' },
    { id: 'cena', name: 'Vamos a cenar', detail: 'Buena comida y plática sin prisa.', icon: '🍽️' },
    { id: 'zapote', name: 'Finca El Zapote', detail: 'Un cambio de aire y buena compañía.', icon: '🌿' },
    { id: 'carmona', name: 'Finca Carmona', detail: 'Una escapada para salir de la rutina.', icon: '🌄' },
    { id: 'cafe', name: 'Café y algo dulce', detail: 'Una tarde con las mejores crepas.', icon: '☕' }
  ]
};
const state = {plan: null, date: '', time: ''};
const $ = (selector) => document.querySelector(selector);
function localNow(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:CONFIG.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
function available(date){const today=localNow().date; const day=Number(date.slice(8));return /^2026-11-\d{2}$/.test(date)&&day>=1&&day<=30&&date>=today&&!CONFIG.blockedDays.includes(day);}
function validTime(){const now=localNow();return CONFIG.times.includes(state.time)&&(state.date!==now.date||state.time>now.time);}
function dateLabel(date){return new Intl.DateTimeFormat('es-GT',{weekday:'long',day:'numeric',month:'long',timeZone:CONFIG.timeZone}).format(new Date(`${date}T12:00:00-06:00`));}
function timeLabel(time){const [h,m]=time.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'p. m.':'a. m.'}`;}
function go(step){document.querySelectorAll('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==step);document.querySelectorAll('.progress span').forEach((el,i)=>el.classList.toggle('active',i===Math.min(step,3)-1));const heading=$(`[data-step="${step}"] h2`);heading.tabIndex=-1;heading.focus({preventScroll:true});if(innerWidth<=620)$('.card').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
$('#yes').onclick=()=>go(2);
function dodge(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const button = $('#no');
  const zone = $('.answer-zone');
  const bounds = zone.getBoundingClientRect();
  const current = button.getBoundingClientRect();
  const maxX = Math.max(0, zone.clientWidth - button.offsetWidth);
  const maxY = Math.max(70, zone.clientHeight - button.offsetHeight);
  const x = event && Number.isFinite(event.clientX) && event.clientX !== 0
    ? event.clientX - bounds.left : current.left - bounds.left + current.width / 2;
  const y = event && Number.isFinite(event.clientY) && event.clientY !== 0
    ? event.clientY - bounds.top : current.top - bounds.top + current.height / 2;
  // Solo se mueve debajo del Sí: nunca lo tapa ni sale del formulario.
  const spots = [{x:0,y:70},{x:maxX,y:70},{x:0,y:maxY},{x:maxX,y:maxY}];
  spots.sort((a,b)=>Math.hypot(b.x+button.offsetWidth/2-x,b.y+button.offsetHeight/2-y)
    - Math.hypot(a.x+button.offsetWidth/2-x,a.y+button.offsetHeight/2-y));
  button.style.left = spots[0].x + 'px';
  button.style.top = spots[0].y + 'px';
  button.style.right = 'auto';
}
$('#no').addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')dodge(e);});
$('#no').addEventListener('pointerdown',dodge);
$('#no').addEventListener('click',dodge);
$('#no').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')dodge(e);});
window.addEventListener('resize',()=>{if(!document.querySelector('[data-step="1"]').hidden)dodge();});
document.querySelectorAll('[data-back]').forEach(button=>button.onclick=()=>go(Number(button.dataset.back)));
CONFIG.plans.forEach(plan=>{const button=document.createElement('button');button.className='plan';button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="plan-icon" aria-hidden="true">${plan.icon}</span><span><strong>${plan.name}</strong><small>${plan.detail}</small></span><span class="radio" aria-hidden="true"></span>`;button.onclick=()=>{state.plan=plan;document.querySelectorAll('.plan').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));$('#to-date').disabled=false;update();};$('#plans').append(button);});
function renderCalendar(){const calendar=$('#calendar');calendar.replaceChildren();for(let i=0;i<6;i++)calendar.append(document.createElement('span'));for(let day=1;day<=30;day++){const date=`2026-11-${String(day).padStart(2,'0')}`;const button=document.createElement('button');button.textContent=day;button.disabled=!available(date);button.setAttribute('aria-label',dateLabel(date)+(button.disabled?' — no disponible':''));button.setAttribute('aria-pressed',String(state.date===date));button.onclick=()=>{state.date=date;renderCalendar();renderTimes();update();};calendar.append(button);}}
function renderTimes(){const select=$('#time');select.replaceChildren(new Option('Selecciona un horario',''));const now=localNow();CONFIG.times.forEach(time=>{const option=new Option(timeLabel(time),time);option.disabled=state.date===now.date&&time<=now.time;select.add(option);});if(!validTime())state.time='';select.value=state.time;}
$('#to-date').onclick=()=>{renderCalendar();renderTimes();go(3);};
$('#time').onchange=e=>{state.time=e.target.value;update();};
function update(){const valid=state.plan&&available(state.date)&&validTime();$('#confirm').disabled=!valid;$('#selection').textContent=state.plan?`${state.plan.icon} ${state.plan.name}${state.date?' · '+dateLabel(state.date):''}${state.time?' · '+timeLabel(state.time):''}`:'Elige día y hora para completar el plan.';$('#error').textContent='';}
let submitting = false;
$('#email-fields').hidden = !CONFIG.emailEndpoint;
$('#delivery-note').textContent = CONFIG.emailEndpoint ? 'Te enviaremos el resumen por correo.' : 'Simulación: la selección está en memoria. No se envían correos y se borra al recargar.';
$('#confirm').onclick=async()=>{
  if(submitting)return;
  if(!state.plan||!available(state.date)||!validTime()){$('#error').textContent='Revisa la fecha y el horario; esa opción ya no está disponible.';renderCalendar();renderTimes();return;}
  const emailInput = $('#email');
  if(CONFIG.emailEndpoint && !emailInput.reportValidity())return;
  const draft={mode:CONFIG.emailEndpoint?'email':'simulation',plan:{id:state.plan.id,name:state.plan.name,detail:state.plan.detail},date:state.date,time:state.time,timeZone:CONFIG.timeZone,createdAt:new Date().toISOString()};
  if(CONFIG.emailEndpoint)draft.email=emailInput.value.trim();
  window.invitationDraft=draft;
  submitting=true;
  const controls = [...document.querySelectorAll('[data-step="3"] button, [data-step="3"] select, [data-step="3"] input')];
  const priorDisabled=controls.map(el=>el.disabled);
  controls.forEach(el=>el.disabled=true);
  $('#confirm').textContent=CONFIG.emailEndpoint?'Enviando…':'Confirmando…';
  $('#error').textContent='';
  try {
    if(CONFIG.emailEndpoint){
      const response=await fetch(CONFIG.emailEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft),signal:AbortSignal.timeout(20000)});
      const result=await response.json();
      if(!response.ok||result.accepted!==true)throw new Error(result.error||'No se pudo confirmar el envío.');
      $('#delivery-note').textContent='El servicio aceptó el envío a ambos correos. Revisa también la carpeta de spam.';
    }
    $('#summary').replaceChildren();
    const label=document.createElement('small');label.textContent='NUESTRO PLAN';
    const name=document.createElement('strong');name.textContent=`${state.plan.icon} ${state.plan.name}`;
    const when=document.createElement('div');when.textContent=`${dateLabel(state.date)} · ${timeLabel(state.time)}`;
    $('#summary').append(label,name,when);
    $('#payload').textContent=JSON.stringify(draft,null,2);
    go(4);
  }catch(error){$('#error').textContent=error.name==='TimeoutError'||error instanceof TypeError?'No pudimos confirmar el envío. Revisa tu correo antes de volver a intentarlo.':error.message;}
  finally{controls.forEach((el,i)=>el.disabled=priorDisabled[i]);submitting=false;$('#confirm').textContent='Confirmar plan ↗';}
};
$('#inspect').onclick=()=>$('#preview').showModal();$('#close-preview').onclick=()=>$('#preview').close();
