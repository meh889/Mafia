/* Laboratorio · avisos del lado de la app (solo Chromium: usa su service worker) */
const {chromium}=require("playwright");const {servir,chequear,resumen,externo}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
const SUB={endpoint:"https://web.push.apple.com/QFalsa123",keys:{p256dh:"BPubFalsa_-123",auth:"authFalso_-9"}};
async function abrir(b,base,fecha,op){
  op=op||{};
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:op.dpr||1,locale:"es-AR",timezoneId:"America/Argentina/Buenos_Aires",hasTouch:true,isMobile:true,permissions:op.permisos||[]});
  await ctx.addInitScript((o)=>{try{
    if(!sessionStorage.getItem("__s")){sessionStorage.setItem("__s","1");localStorage.setItem("pv-t3-inaugurado",'"2026-10-01"');localStorage.setItem("pv-t3-vio-indice","true");localStorage.setItem("pv-t3-set-escritas",JSON.stringify([o.fecha]));localStorage.setItem("pv-t3-set-abrio",JSON.stringify([o.fecha]));}
    if(o.sinNoti){delete window.Notification;try{Object.defineProperty(window,"Notification",{value:undefined,configurable:true});}catch(e){}  delete window.PushManager;}
    if(o.niega&&window.Notification){try{Object.defineProperty(Notification,"permission",{get:function(){return window.__perm||"default";},configurable:true});Notification.requestPermission=function(){window.__perm="denied";return Promise.resolve("denied");};}catch(e){}}
    if(o.fingir&&window.PushManager){
      /* una suscripción de mentira que, como la de verdad, sobrevive a recargar: se guarda con su número y su llave */
      const LS="__sub_falsa";
      const leer=function(){try{return JSON.parse(localStorage.getItem(LS)||"null");}catch(e){return null;}};
      const armar=function(g){return {toJSON:function(){const j=JSON.parse(JSON.stringify(o.sub));if(g.n>1)j.endpoint+="-"+g.n;return j;},options:{applicationServerKey:new Uint8Array(g.llave).buffer},
        unsubscribe:function(){localStorage.removeItem(LS);window.__bajas=(window.__bajas||0)+1;return Promise.resolve(true);}};};
      PushManager.prototype.getSubscription=function(){const g=leer();return Promise.resolve(g?armar(g):null);};
      PushManager.prototype.subscribe=function(op){
        if(leer())return Promise.reject(new DOMException("ya hay una suscripción","InvalidStateError"));
        window.__op=op;const n=(+localStorage.getItem("__sub_cuenta")||0)+1;localStorage.setItem("__sub_cuenta",String(n));
        const g={n:n,llave:Array.from(new Uint8Array(op.applicationServerKey.buffer||op.applicationServerKey))};localStorage.setItem(LS,JSON.stringify(g));return Promise.resolve(armar(g));};
    }
  }catch(e){}},{fecha,sinNoti:!!op.sinNoti,niega:!!op.niega,fingir:op.fingir!==false,sub:SUB});
  const pg=await ctx.newPage();const errores=[];pg.on("pageerror",e=>errores.push(String(e&&e.message||e)));
  await pg.route("**/*",r=>{const u=r.request().url();return (u.startsWith(base)||externo(u))?r.continue():r.abort();});
  await pg.goto(base+"/?fecha="+fecha,{waitUntil:"load"});
  await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});
  await pg.waitForTimeout(1500);await pg.evaluate(f=>T3.cuaderno.irA(f),fecha);await pg.waitForTimeout(900);
  return {ctx,pg,errores};
}
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await chromium.launch({channel:"chromium"});
  console.log("LA TARJETA");
  let {ctx,pg,errores}=await abrir(b,base,"2026-11-30",{permisos:["notifications"]});
  chequear("antes del estreno no invita",!(await pg.$(".t3x-campana")));
  await ctx.close();
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-02",{permisos:["notifications"],dpr:2}));
  let r=await pg.evaluate(()=>{const c=document.querySelector(".t3x-campana");if(c)c.scrollIntoView({block:"center"});return {txt:c?c.innerText:"",sop:T3.avisos.soporte(),perm:T3.avisos.permiso()};});
  chequear("desde el estreno invita en la hoja de hoy",/Te aviso cuando haya hoja nueva/.test(r.txt)&&/sí, avisame/.test(r.txt),r);
  await pg.waitForTimeout(500);await pg.screenshot({path:S+"d-invita.jpg"});
  await pg.click('[data-t3x="avisos-si"]');await pg.waitForTimeout(1500);
  await pg.screenshot({path:S+"d-lista.jpg"});
  r=await pg.evaluate(async()=>{const c=document.querySelector(".t3x-campana");const a=c&&c.querySelector("a");const reg=await navigator.serviceWorker.getRegistration();
    return {txt:c?c.innerText:"",href:a?decodeURIComponent(a.href):"",a:T3.leer("avisos"),sw:reg&&reg.active?reg.active.scriptURL:"",llave:window.__op&&window.__op.applicationServerKey.length,visible:window.__op&&window.__op.userVisibleOnly};});
  const cod=(r.a&&r.a.codigo)||"";let dec=null;try{dec=JSON.parse(Buffer.from(cod.replace("MAFIAPUSH1:",""),"base64url").toString());}catch(e){}
  chequear("al aceptar registra el service worker y se suscribe con la llave pública",/sw\.js$/.test(r.sw)&&r.llave===65&&r.visible===true,r);
  chequear("el código guarda la suscripción del celular",/^MAFIAPUSH1:/.test(cod)&&dec&&dec.e===SUB.endpoint&&dec.p===SUB.keys.p256dh&&dec.a===SUB.keys.auth,dec);
  chequear("la tarjeta pasa a pedir que le mande el código a Mati",/Avisos activados/.test(r.txt)&&r.href.includes("Activé los avisos de MafiApp")&&r.href.includes(cod)&&r.a.activo&&r.a.enviado===false,{txt:r.txt});
  const [pop]=await Promise.all([ctx.waitForEvent("page").catch(()=>null),pg.click('[data-t3x="avisos-enviado"]')]);
  await pg.waitForTimeout(1700);if(pop)await pop.close().catch(()=>{});
  r=await pg.evaluate(()=>({tarjeta:!!document.querySelector(".t3x-campana"),a:T3.leer("avisos")}));
  chequear("al mandarlo, la tarjeta se va y queda anotado",!!pop&&!r.tarjeta&&r.a.enviado===true,r);
  await pg.reload();await pg.waitForTimeout(2600);
  chequear("no vuelve a aparecer",!(await pg.$(".t3x-campana")));

  console.log("EL AVISO EN SÍ (service worker)");
  const cdp=await ctx.newCDPSession(pg);const regs=[];cdp.on("ServiceWorker.workerRegistrationUpdated",e=>e.registrations.forEach(x=>regs.push(x)));
  await cdp.send("ServiceWorker.enable");await pg.waitForTimeout(600);
  const reg=regs.find(x=>x.scopeURL.startsWith(base));
  const cuerpo=JSON.stringify({web_push:8030,notification:{title:"MafiApp",body:"Ya está la hoja de hoy.",navigate:base+"/"}});
  let entrego=true;try{await cdp.send("ServiceWorker.deliverPushMessage",{origin:base,registrationId:reg.registrationId,data:cuerpo});}catch(e){entrego=String(e.message);}
  await pg.waitForTimeout(900);
  r=await pg.evaluate(async()=>{const g=await navigator.serviceWorker.getRegistration();const n=await g.getNotifications();return n.map(x=>({t:x.title,b:x.body,url:x.data&&x.data.url,tag:x.tag}));});
  chequear("al llegar un push, el service worker muestra la notificación con el texto",entrego===true&&r.length===1&&r[0].t==="MafiApp"&&r[0].b==="Ya está la hoja de hoy."&&r[0].url===base+"/",{entrego,r});
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("OTROS CASOS");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-02",{permisos:[],niega:true}));
  await pg.click('[data-t3x="avisos-si"]');await pg.waitForTimeout(1200);
  r=await pg.evaluate(()=>({txt:(document.querySelector(".t3x-campana")||{}).innerText||"",a:T3.leer("avisos",null)}));
  chequear("si el permiso se niega, lo explica y no guarda nada",/bloqueados|No dijiste que sí/.test(r.txt)&&!(r.a&&r.a.activo),r);
  await ctx.close();
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-02",{permisos:["notifications"]}));
  await pg.click('[data-t3x="avisos-no"]');await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>({tarjeta:!!document.querySelector(".t3x-campana"),a:T3.leer("avisos")}));
  chequear("«no, gracias» la saca y no insiste",!r.tarjeta&&r.a.no==="2026-12-02",r);
  await pg.reload();await pg.waitForTimeout(2500);chequear("…ni al volver a abrir",!(await pg.$(".t3x-campana")));
  await ctx.close();
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-02",{sinNoti:true}));
  r=await pg.evaluate(()=>({tarjeta:!!document.querySelector(".t3x-campana"),sop:T3.avisos.soporte()}));
  chequear("si el celular no soporta avisos, no ofrece nada",!r.tarjeta&&!r.sop.ok,r);
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{const t=document.querySelector(".t3x-taller");t.scrollIntoView({block:"center"});return t.innerText;});
  chequear("…y el taller dice por qué",/avisos/.test(r)&&/pantalla de inicio/.test(r)&&/ver por qué/.test(r),r);
  await pg.click('[data-taller="avisos-diag"]');await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>document.querySelector(".t3x-taller-caja").innerText);
  chequear("el diagnóstico lista qué falta y cómo se arregla",/notificaciones: no/.test(r)&&/borrá el ícono/.test(r),r);
  await ctx.close();

  console.log("TALLER");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-02",{permisos:["notifications","clipboard-read","clipboard-write"],dpr:2}));
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{const t=document.querySelector(".t3x-taller");t.scrollIntoView({block:"end"});return {txt:t.innerText,bot:Array.from(t.querySelectorAll("[data-taller]")).map(x=>x.getAttribute("data-taller"))};});
  chequear("el taller muestra los avisos sin activar",/sin activar/.test(r.txt)&&r.bot.includes("avisos-activar"),r);
  await pg.click('[data-taller="avisos-activar"]');await pg.waitForTimeout(1600);
  r=await pg.evaluate(async()=>({msj:document.querySelector(".t3x-taller-msj").innerText,det:document.querySelector('[data-detalle="avisos"]').innerText,porta:await navigator.clipboard.readText().catch(()=>"(sin acceso)"),a:T3.leer("avisos")}));
  chequear("activar desde el taller copia el código para el secret",/^MAFIAPUSH1:/.test(r.porta)&&r.porta===r.a.codigo&&/AVISOS_SUSCRIPCIONES/.test(r.msj)&&/activos desde/.test(r.det)&&r.a.enviado===true,r);
  await pg.evaluate(()=>document.querySelector(".t3x-taller").scrollIntoView({block:"end"}));await pg.waitForTimeout(300);
  await pg.screenshot({path:S+"d-taller.jpg"});

  console.log("CUANDO DEJAN DE LLEGAR");
  chequear("con los avisos activos, el taller ofrece renovar",await pg.evaluate(()=>!!document.querySelector('.t3x-taller [data-taller="avisos-renovar"]')));
  const c1=r.a.codigo;
  await pg.click('[data-taller="avisos-renovar"]');await pg.waitForTimeout(1600);
  r=await pg.evaluate(async()=>({msj:document.querySelector(".t3x-taller-msj").innerText,porta:await navigator.clipboard.readText().catch(()=>"(sin acceso)"),a:T3.leer("avisos"),bajas:window.__bajas||0}));
  chequear("renovar da de baja la suscripción vieja y copia un código nuevo",r.bajas===1&&/^MAFIAPUSH1:/.test(r.a.codigo)&&r.a.codigo!==c1&&r.porta===r.a.codigo&&/reemplazá el viejo/.test(r.msj)&&r.a.enviado===true,r);
  const c2=r.a.codigo;
  r=await pg.evaluate(async()=>({cambio:await T3.avisos._prueba.repasar(),a:T3.leer("avisos"),bajas:window.__bajas||0}));
  chequear("si está todo en orden, al abrir no toca nada",r.cambio===false&&r.a.codigo===c2&&r.a.enviado===true&&r.bajas===1,r);
  await pg.evaluate(()=>localStorage.removeItem("__sub_falsa"));      /* el celular la pierde por su cuenta */
  r=await pg.evaluate(async()=>({cambio:await T3.avisos._prueba.repasar(),a:T3.leer("avisos")}));
  chequear("si el celular pierde la suscripción, arma otra y deja pendiente mandar el código",r.cambio===true&&r.a.codigo!==c2&&r.a.enviado===false,r);
  const c3=r.a.codigo;
  await pg.reload();await pg.waitForTimeout(2600);
  r=await pg.evaluate(()=>{const c=document.querySelector(".t3x-campana");const a=c&&c.querySelector("a");return {txt:c?c.innerText:"",href:a?decodeURIComponent(a.href):""};});
  chequear("…y la hoja de hoy vuelve a pedir que se lo mande",/Avisos activados/.test(r.txt)&&r.href.includes(c3),r);
  await pg.waitForTimeout(2600);                                       /* que pase el repaso automático del arranque */
  await pg.evaluate(()=>{const g=JSON.parse(localStorage.getItem("__sub_falsa"));g.llave=[4,1,2,3];localStorage.setItem("__sub_falsa",JSON.stringify(g));});
  r=await pg.evaluate(async()=>({cambio:await T3.avisos._prueba.repasar(),a:T3.leer("avisos"),bajas:window.__bajas||0,llave:window.__op&&window.__op.applicationServerKey.length}));
  chequear("si la suscripción es de una llave vieja, la da de baja y saca otra con la de ahora",r.cambio===true&&r.bajas===1&&r.a.codigo!==c3&&r.llave===65,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
