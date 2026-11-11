import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{validate} from './worker.mjs';
const draft={plan:{id:'boliche'},date:'2026-11-14',time:'06:00',email:'guest@example.com'};
const now=new Date('2026-11-07T12:00:00-06:00');
test('fechas y horarios válidos; bloqueos y extremos',()=>{
  for(const time of ['06:00','06:30','22:30','23:00'])assert.ok(validate({...draft,time},now));
  for(const time of ['05:30','23:30','12:15'])assert.equal(validate({...draft,time},now),false);
  for(const day of [12,13,18,19,27,28,29,31])assert.equal(validate({...draft,date:`2026-11-${day}`},now),false);
  assert.equal(validate({...draft,date:'2026-12-14'},now),false);
  assert.equal(validate({...draft,date:'2026-11-06'},now),false);
  assert.equal(validate({...draft,plan:{id:'inventado'}},now),false);
});
const env={ALLOWED_ORIGIN:'https://gerchay.github.io',BREVO_API_KEY:'test-only',SENDER_EMAIL:'sender@example.com',HOST_EMAIL:'host@example.com',INVITEE_EMAIL:'guest@example.com'};
const request=(data=draft,origin=env.ALLOWED_ORIGIN)=>new Request('https://example.com/invite',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('rechaza origen no autorizado y correo inválido',async()=>{
  assert.equal((await worker.fetch(request(draft,'https://other.example'),env)).status,403);
  for(const email of [undefined,'','   ',null])assert.equal((await worker.fetch(request({...draft,email}),env)).status,400);
  assert.equal((await worker.fetch(request({...draft,email:'correo-invalido'}),env)).status,400);
});
test('envío a invitada y copia fija; fallo no se presenta como éxito',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.to[0].email,env.INVITEE_EMAIL);assert.equal(body.bcc[0].email,env.HOST_EMAIL);return Response.json({messageId:'test-id'},{status:201});};
    const response=await worker.fetch(request(),env);assert.equal(response.status,200);assert.deepEqual(await response.json(),{accepted:true});
    globalThis.fetch=async()=>Response.json({error:'test'},{status:500});
    assert.equal((await worker.fetch(request(),env)).status,502);
  }finally{globalThis.fetch=original;}
});

test('correo obligatorio, nuevo destinatario y deduplicación',async()=>{
  const original=globalThis.fetch;
  try {
    for (const [email,expected] of [[' HOST@example.com ',['host@example.com']],['new@example.com',['new@example.com','host@example.com']]]) {
      globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.deepEqual([...body.to,...(body.bcc||[])].map(x=>x.email),expected);return Response.json({messageId:'test-id'},{status:201});};
      const withoutInvitee={...env};delete withoutInvitee.INVITEE_EMAIL;
      assert.equal((await worker.fetch(request({...draft,email}),withoutInvitee)).status,200);
    }
  }finally{globalThis.fetch=original;}
});
