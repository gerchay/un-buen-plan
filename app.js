'use strict';
// Edita aquí las opciones de la invitación. Horarios provisionales para revisar el flujo.
const CONFIG = {
  year: 2026, month: 11, timeZone: 'America/Guatemala',
  blockedDays: [12, 13, 18, 19, 27, 28, 29],
  times: ['10:00', '12:00', '15:00', '17:00', '19:00'],
  plans: [
    { id: 'boliche', name: 'Boliche y cena', detail: 'El que pierde invita la cena.', icon: '🎳' },
    { id: 'cena', name: 'Vamos a cenar', detail: 'Buena comida y plática sin prisa.', icon: '🍽️' },
    { id: 'zapote', name: 'Finca El Zapote', detail: 'Un cambio de aire y buena compañía.', icon: '🌿' },
    { id: 'carmona', name: 'Finca Carmona', detail: 'Una escapada para salir de la rutina.', icon: '🌄' },
    { id: 'cafe', name: 'Café y algo dulce', detail: 'Una tarde para conversar a gusto.', icon: '☕' }
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
let dodges=0;function dodge(event){if(dodges>=3)return;if(event)event.preventDefault();dodges++;const button=$('#no');button.style.transform=`translate(${dodges%2?'-20':'0'}px,${dodges%2?'52':'0'}px)`;$('#no-note').textContent=['Ese botón anda un poco inquieto 😅','Creo que quiere que lo pienses otra vez.','Va, ya se queda quieto 🙃'][dodges-1];}
$('#no').addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')dodge(e)});
$('#no').addEventListener('click',e=>{if(dodges<3)dodge(e);else $('#no-note').textContent='Está bien, lo dejamos para otra ocasión 🙂';});
document.querySelectorAll('[data-back]').forEach(button=>button.onclick=()=>go(Number(button.dataset.back)));
CONFIG.plans.forEach(plan=>{const button=document.createElement('button');button.className='plan';button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="plan-icon" aria-hidden="true">${plan.icon}</span><span><strong>${plan.name}</strong><small>${plan.detail}</small></span><span class="radio" aria-hidden="true"></span>`;button.onclick=()=>{state.plan=plan;document.querySelectorAll('.plan').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));$('#to-date').disabled=false;update();};$('#plans').append(button);});
function renderCalendar(){const calendar=$('#calendar');calendar.replaceChildren();for(let i=0;i<6;i++)calendar.append(document.createElement('span'));for(let day=1;day<=30;day++){const date=`2026-11-${String(day).padStart(2,'0')}`;const button=document.createElement('button');button.textContent=day;button.disabled=!available(date);button.setAttribute('aria-label',dateLabel(date)+(button.disabled?' — no disponible':''));button.setAttribute('aria-pressed',String(state.date===date));button.onclick=()=>{state.date=date;renderCalendar();renderTimes();update();};calendar.append(button);}}
function renderTimes(){const select=$('#time');select.replaceChildren(new Option('Selecciona un horario',''));const now=localNow();CONFIG.times.forEach(time=>{const option=new Option(timeLabel(time),time);option.disabled=state.date===now.date&&time<=now.time;select.add(option);});if(!validTime())state.time='';select.value=state.time;}
$('#to-date').onclick=()=>{renderCalendar();renderTimes();go(3);};
$('#time').onchange=e=>{state.time=e.target.value;update();};
function update(){const valid=state.plan&&available(state.date)&&validTime();$('#confirm').disabled=!valid;$('#selection').textContent=state.plan?`${state.plan.icon} ${state.plan.name}${state.date?' · '+dateLabel(state.date):''}${state.time?' · '+timeLabel(state.time):''}`:'Elige día y hora para completar el plan.';$('#error').textContent='';}
$('#confirm').onclick=()=>{if(!state.plan||!available(state.date)||!validTime()){$('#error').textContent='Revisa la fecha y el horario; esa opción ya no está disponible.';renderCalendar();renderTimes();return;}window.invitationDraft={mode:'simulation',plan:{id:state.plan.id,name:state.plan.name,detail:state.plan.detail},date:state.date,time:state.time,timeZone:CONFIG.timeZone,createdAt:new Date().toISOString()};console.info('Selección simulada (solo en memoria):',window.invitationDraft);$('#summary').replaceChildren();const label=document.createElement('small');label.textContent='NUESTRO PLAN';const name=document.createElement('strong');name.textContent=`${state.plan.icon} ${state.plan.name}`;const when=document.createElement('div');when.textContent=`${dateLabel(state.date)} · ${timeLabel(state.time)}`;$('#summary').append(label,name,when);$('#payload').textContent=JSON.stringify(window.invitationDraft,null,2);go(4);};
$('#inspect').onclick=()=>$('#preview').showModal();$('#close-preview').onclick=()=>$('#preview').close();
