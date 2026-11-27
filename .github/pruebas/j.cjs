/* Laboratorio · la quema del 1/12 (T3.quema, 27/11/2026). Idea de Mati: la primera vez que Sofi abra el cuaderno desde el
   1 de diciembre, Ponyta entra corriendo y lo prende fuego de julio a noviembre; después aparece un video de él. "Se quema
   todo": desde ahí el cuaderno arranca el 1/12. Y diciembre queda sin cartas, sin eventos y sin juegos: adviento, MafiaTCG,
   Ponyta y la tienda.
   La escena se mira con su reloj de prueba (cuadroEn): así se puede parar en un instante sin depender de la velocidad de la
   máquina. Una vez (al volver a entrar a mitad del fuego) se la deja correr sola, a su tiempo.
   No está pensado para correr con MOVIMIENTO=menos: ahí no hay fuego (eso se prueba acá mismo, en su parte). */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
const p2=n=>String(n).padStart(2,"0");
function dias(desde,hasta){const r=[];const d=new Date(desde+"T12:00:00"),f=new Date(hasta+"T12:00:00");while(d<=f){r.push(d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()));d.setDate(d.getDate()+1);}return r;}
/* el progreso de alguien que usó la app todos los días hasta el 30/11 */
const usada=(mas)=>{const t=dias("2026-07-30","2026-11-30");return Object.assign({"pv-t3-vio-indice":"true","pv-t3-set-escritas":JSON.stringify(t),"pv-t3-set-abrio":JSON.stringify(t),
  "pv-t3-set-leidas":JSON.stringify(t),"pv-t3-set-ganados":JSON.stringify(t.filter((f,i)=>i%7!==3)),"pv-t3-set-orejas":'["2026-08-14","2026-10-27"]'},mas||{});};
/* corre el elástico de la tapa, como con el dedo */
const correrElastico=pg=>pg.evaluate(()=>{const el=document.querySelector(".t3-cuaderno-elastico"),r=el.getBoundingClientRect();
  const o={bubbles:true,cancelable:true,pointerId:1,pointerType:"touch",isPrimary:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2};
  el.dispatchEvent(new PointerEvent("pointerdown",o));el.dispatchEvent(new PointerEvent("pointerup",o));});
const cuadro=(pg,t)=>pg.evaluate(t=>T3.quema._prueba.escena().cuadroEn(t),t);
/* lo que se ve del cuaderno y lo que quedó guardado */
const foto=pg=>pg.evaluate(()=>{
  const q=s=>document.querySelector(s),qq=s=>Array.from(document.querySelectorAll(s)),raiz=document.getElementById("t3"),e=T3.quema._prueba.escena();
  const ve=el=>!!el&&getComputedStyle(el).opacity!=="0"&&getComputedStyle(el).display!=="none"&&el.getBoundingClientRect().width>0;
  const h=q(".t3-cuaderno-hoja.t3-cuaderno-visible")||q(".t3-cuaderno-hoja"),dije=q(".t3-ponyta-dije"),pony=q(".t3x-quema-pony");
  return {clases:raiz.className,cerrado:raiz.classList.contains("t3-cuaderno-cerrado"),antes:raiz.classList.contains("t3x-quema-antes"),
    toca:T3.quema.toca(),hecha:T3.quema.hecha(),desde:T3.quema.desde(),frena:T3.quema.frena(),ocupado:T3.x.ocupado(),
    escena:e?e.info():null,guardado:JSON.parse(localStorage.getItem("pv-t3-quema")||"null"),
    fechas:T3.fechas().length,primera:T3.fechas()[0],todas:T3.fechas(T3.hoy,true).length,
    meses:qq(".t3-cuaderno-pestana[data-mes]").map(b=>b.textContent.trim()).join(","),activa:(q(".t3-cuaderno-pestana.t3-cuaderno-activa[data-mes]")||{}).textContent||"",
    tizones:qq(".t3x-quema-pestana").length,arden:qq(".t3-cuaderno-pestana.t3x-quema-arde").map(b=>b.getAttribute("data-mes")).join(","),
    nuevas:[".t3-cuaderno-pestana-tcg",".t3-cuaderno-pestana-adviento",".t3-cuaderno-pestana-pedidos"].map(s=>q(s)?(ve(q(s))?"se ve":"escondida"):"no está").join(","),
    hoja:h?h.getAttribute("data-fecha"):"",folio:h?((h.querySelector("[data-folio]")||{}).textContent||"").trim():"",
    enEspera:h?h.querySelectorAll(".t3-cuaderno-espera,.t3-cuaderno-espera-sello").length:0,
    tarjeta:h?!!h.querySelector(".t3x-quema-tarjeta"):false,juego:h?!!h.querySelector(".t3-cuaderno-tarjeta"):false,precinto:h?!!h.querySelector(".t3-cuaderno-washi"):false,puerta:h?!!h.querySelector(".t3-cuaderno-puerta"):false,
    replicas:!!q(".t3x-quema-hojas"),velo:!!q(".t3x-quema"),video:!!q(".t3x-quema-video"),
    dijeSola:!!dije&&dije.classList.contains("t3-ponyta-dije-sola"),ponyOpacidad:pony?+getComputedStyle(pony).opacity:null,
    escritas:(JSON.parse(localStorage.getItem("pv-t3-set-escritas")||"[]")).indexOf(T3.hoy)>=0};
});
/* ¿hay algo pintado en el lienzo del fuego? ¿y cuánto queda de las hojas viejas? */
const lienzos=pg=>pg.evaluate(()=>{
  const cuenta=c=>{if(!c)return -1;const x=c.getContext("2d"),w=c.width,h=c.height,d=x.getImageData(0,0,w,h).data;let n=0;for(let i=3;i<d.length;i+=4*97)if(d[i]>24)n++;return Math.round(n/(d.length/(4*97))*1000)/10;};
  return {fuego:cuenta(document.querySelector(".t3x-quema-fuego")),hojas:cuenta(document.querySelector(".t3x-quema-hojas"))};});
const video=pg=>pg.evaluate(()=>{const o=document.querySelector(".t3x-quema-video");if(!o)return null;const v=o.querySelector("video"),r=o.querySelector(".t3x-quema-marco").getBoundingClientRect(),b=o.querySelector(".t3x-quema-cerrar").getBoundingClientRect();
  return {primera:o.classList.contains("t3x-quema-video-primera"),anda:o.classList.contains("t3x-quema-video-anda"),fin:o.classList.contains("t3x-quema-video-fin"),
    src:(v.querySelector("source")||{}).getAttribute?v.querySelector("source").getAttribute("src"):"",poster:v.getAttribute("poster"),enLinea:v.hasAttribute("playsinline"),pausado:v.paused,mudo:v.muted,
    error:!o.querySelector(".t3x-quema-error").hidden,play:getComputedStyle(o.querySelector(".t3x-quema-play")).opacity,
    cerrar:o.querySelector(".t3x-quema-cerrar").textContent.trim(),otra:!o.querySelector(".t3x-quema-otra").hidden,
    marco:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],boton:[Math.round(b.top),Math.round(b.bottom)],alto:innerHeight,ancho:innerWidth,
    mirona:!!o.querySelector(".t3x-quema-mirona svg, .t3x-quema-mirona img"),mecha:!!o.querySelector(".t3x-quema-mecha"),
    /* cuánto papel queda por debajo de la mecha (si queda pegada al borde comido del marco, no se ve) y por debajo de la pantalla */
    bajoMecha:Math.round((o.querySelector(".t3x-quema-borde").getBoundingClientRect().bottom-o.querySelector(".t3x-quema-mecha").getBoundingClientRect().bottom)*10)/10,
    bajoPantalla:Math.round((o.querySelector(".t3x-quema-mecha").getBoundingClientRect().top-o.querySelector(".t3x-quema-pantalla").getBoundingClientRect().bottom)*10)/10,
    guardado:JSON.parse(localStorage.getItem("pv-t3-quema")||"null")};});
const tocar=async(pg,sel)=>{await pg.evaluate(s=>document.querySelector(s).click(),sel);};

(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port;
  const b=await motor().launch();
  let o,pg,r,x;

  console.log("ANTES DEL 1 DE DICIEMBRE");
  o=await abrir(b,base,"2026-11-30",{semilla:usada()});pg=o.pg;
  r=await foto(pg);
  chequear("el 30/11 no pasa nada: el cuaderno entero, con sus cinco meses y sin escena",!r.toca&&!r.hecha&&r.desde===""&&!r.escena&&!r.antes&&r.todas===r.fechas&&r.fechas>=92&&r.primera==="2026-07-30"&&r.meses==="JUL,AGO,SEP,OCT,NOV"&&r.tizones===0,r);
  await pg.evaluate(()=>{document.querySelector(".t3-cuaderno-senal").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));});await pg.waitForTimeout(700);
  x=await pg.evaluate(()=>{const i=document.querySelector(".t3-cuaderno-indice");return {bajada:i.querySelector("p").textContent,fichas:i.querySelectorAll(".t3-cuaderno-ficha").length,blancos:Array.from(i.querySelectorAll(".t3-cuaderno-ficha-t")).filter(e=>/en blanco/.test(e.textContent)).length};});
  chequear("y el índice sigue siendo «todo lo que te escribí», con sus hojas en blanco",x.bajada==="todo lo que te escribí"&&x.fichas>=92&&x.blancos>=20,x);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("EL 1 DE DICIEMBRE · antes de correr la tapa");
  o=await abrir(b,base,"2026-12-01",{quema:true,abrir:false,dpr:2,semilla:usada()});pg=o.pg;
  r=await foto(pg);
  chequear("la tapa está cerrada y la escena, armada y esperando: cinco hojas para quemar, una por mes",r.cerrado&&r.toca&&!r.hecha&&r.antes&&r.frena&&r.escena&&r.escena.fase==="espera"&&r.escena.capas===5&&r.escena.meses.join()==="2026-07,2026-08,2026-09,2026-10,2026-11"&&!r.escena.sinFuego,r);
  chequear("todavía está todo: las 93 hojas y las pestañas de los meses, con la primera (julio) marcada",r.fechas===93&&r.primera==="2026-07-30"&&r.meses==="JUL,AGO,SEP,OCT,NOV,DIC"&&r.activa==="JUL"&&r.tizones===0,r);
  chequear("arriba de la hoja de hoy (que espera en blanco) está dibujada la primera hoja del cuaderno",r.replicas&&r.hoja==="2026-12-01"&&r.enEspera>0&&!r.escritas,r);
  chequear("Ponyta todavía no llegó (el señalador cuelga solo) y lo nuevo todavía no se ve: ni el TCG, ni el adviento, ni la tienda",r.dijeSola&&r.nuevas==="escondida,escondida,escondida",r);
  x=await lienzos(pg);
  chequear("la réplica está pintada entera",x.hojas>99,x);
  await pg.screenshot({path:S+"j-tapa.jpg"});

  console.log("EL 1 DE DICIEMBRE · se corre la tapa y arde");
  await correrElastico(pg);
  await pg.waitForFunction(()=>document.getElementById("t3").classList.contains("t3-cuaderno-abierto"),null,{timeout:8000});
  r=await foto(pg);
  chequear("con la tapa abierta se ve la primera hoja y la de hoy no se presentó sola",!r.cerrado&&r.replicas&&r.enEspera>0&&!r.escritas&&r.frena&&!r.hecha,r);
  await pg.screenshot({path:S+"j-primera-hoja.jpg"});
  await cuadro(pg,.5);r=await foto(pg);x=await lienzos(pg);
  chequear("medio segundo: Ponyta ya entró corriendo y todavía no prendió nada",r.escena.fase==="arde"&&r.velo&&r.ponyOpacidad===1&&x.hojas>99&&r.arden===""&&r.escena.frente===0,{r:r.escena,x:x,p:r.ponyOpacidad});
  await cuadro(pg,1.6);r=await foto(pg);x=await lienzos(pg);
  chequear("al segundo y medio la primera hoja arde: hay un borde encendido, llamas y chispas, y la pestaña de julio se está quemando",x.fuego>.4&&r.escena.llamas>200&&r.escena.frente>0&&r.escena.chispas>0&&/2026-07/.test(r.arden)&&r.activa==="AGO",{r:r.escena,x:x,arden:r.arden,activa:r.activa});
  chequear("por los agujeros se ve la hoja que sigue (todavía no se ve la de hoy)",x.hojas>99,x);
  await pg.screenshot({path:S+"j-arde-1.jpg"});
  await cuadro(pg,3.1);r=await foto(pg);x=await lienzos(pg);
  chequear("a los tres segundos va por la mitad: ya ardieron las pestañas de julio y agosto y sigue la de septiembre",/2026-07,2026-08,2026-09/.test(r.arden)&&r.escena.llamas>200&&!r.hecha,{r:r.escena,arden:r.arden});
  await pg.screenshot({path:S+"j-arde-2.jpg"});
  await cuadro(pg,5.9);r=await foto(pg);x=await lienzos(pg);
  chequear("cuando se apaga no queda nada de las hojas viejas, ardieron las cinco pestañas y Ponyta está frenada abajo",r.escena.fase==="apagada"&&x.hojas<.5&&r.arden.split(",").length===5&&r.ponyOpacidad===1&&r.activa==="DIC"&&!r.hecha,{r:r.escena,x:x,arden:r.arden});
  await cuadro(pg,7);
  await pg.waitForSelector(".t3x-quema-video",{timeout:8000});await pg.waitForTimeout(900);
  r=await foto(pg);
  chequear("al terminar queda anotado: el cuaderno arranca el 1/12 y de las 93 hojas queda una",r.hecha&&r.desde==="2026-12-01"&&r.guardado&&r.guardado.f==="2026-12-01"&&r.fechas===1&&r.primera==="2026-12-01"&&r.todas===93,r);
  chequear("de las pestañas de julio a noviembre quedan cinco tizones; la de diciembre sigue, y la hoja conserva su número (93)",r.tizones===5&&r.meses==="DIC"&&r.activa==="DIC"&&r.folio==="· 93 ·"&&!r.replicas,r);
  chequear("Ponyta volvió al señalador",!r.dijeSola,r.dijeSola);

  console.log("EL VIDEO");
  x=await video(pg);
  chequear("aparece el video de Mati: el archivo tal cual, con su foto, para tocarlo (no arranca solo)",x&&x.primera&&x.src==="videos/1-dic.mp4"&&x.poster==="videos/1-dic.jpg"&&x.enLinea&&x.pausado&&!x.anda&&x.play!=="0"&&x.cerrar==="después"&&!x.otra,x);
  chequear("entra entero en la pantalla, con Ponyta arriba del marco y la mecha abajo",x.marco[0]>=0&&x.marco[2]<=x.ancho&&x.marco[1]>=20&&x.boton[1]<=x.alto&&x.marco[3]<x.boton[0]&&x.mirona&&x.mecha,x);
  chequear("la mecha se ve: queda sobre el papel, despegada de la pantalla y lejos del borde comido",x.bajoMecha>=14&&x.bajoPantalla>=4,{bajoMecha:x.bajoMecha,bajoPantalla:x.bajoPantalla});
  r=await foto(pg);
  chequear("mientras el video está abierto, la hoja sigue esperando y nada se recarga solo",r.frena&&r.ocupado&&!r.escritas&&r.enEspera>0,r);
  await pg.screenshot({path:S+"j-video.jpg"});
  await pg.locator(".t3x-quema-play").tap({force:true});      /* un toque de verdad: el sonido lo necesita */
  await pg.waitForFunction(()=>{const o=document.querySelector(".t3x-quema-video");return o.classList.contains("t3x-quema-video-anda")||!o.querySelector(".t3x-quema-error").hidden;},null,{timeout:20000}).catch(()=>{});
  await pg.waitForTimeout(600);
  x=await video(pg);
  /* donde el navegador sabe leer un mp4, anda (con sonido); donde no, avisa sin romperse. En los dos casos queda anotado que lo tocó */
  chequear("al tocarlo, o anda (con sonido) o avisa que no pudo cargarlo, y queda anotado que lo vio",((x.anda&&!x.pausado&&!x.mudo&&x.play==="0")||x.error)&&x.guardado.video==="2026-12-01",x);
  console.log("     (el video "+(x.anda?"anduvo":"no se pudo leer en este navegador: avisó")+")");
  await pg.screenshot({path:S+"j-video-tocado.jpg"});
  if(x.anda){
    await pg.evaluate(()=>{const v=document.querySelector(".t3x-quema-video video");v.currentTime=Math.max(0,v.duration-.4);});
    await pg.waitForFunction(()=>document.querySelector(".t3x-quema-video").classList.contains("t3x-quema-video-fin"),null,{timeout:20000}).catch(()=>{});
    x=await video(pg);
    chequear("cuando termina ofrece verlo de nuevo o seguir",x.fin&&x.otra&&x.cerrar==="seguir",x);
  }

  console.log("DESPUÉS DEL VIDEO · la hoja del 1/12");
  await tocar(pg,".t3x-quema-cerrar");
  await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video"),null,{timeout:8000});
  await pg.waitForFunction(()=>!document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible .t3-cuaderno-espera"),null,{timeout:12000}).catch(()=>{});
  await pg.waitForTimeout(1900);
  r=await foto(pg);
  chequear("al cerrarlo la hoja de hoy se presenta: quedó escrita y ya nada espera",r.escritas&&r.enEspera===0&&!r.frena&&!r.ocupado&&!r.antes,r);
  chequear("lleva el cartel y la ventanita, pero ni juego ni precinto; y el video quedó pegado para volver a verlo",r.puerta&&!r.juego&&!r.precinto&&r.tarjeta,r);
  chequear("y llegó lo nuevo: el TCG, el adviento y la tienda",r.nuevas==="se ve,se ve,se ve",r.nuevas);
  x=await pg.evaluate(()=>{const c=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible .t3x-cartel, .t3-cuaderno-hoja.t3-cuaderno-visible [class*=cartel]");return c?c.innerText.replace(/\s+/g," ").trim():"";});
  chequear("el cartel del 1/12 ya no dice que las cartas se pueden contestar",/Volvió el programador/.test(x)&&/MafiaTCG/.test(x)&&/tienda/.test(x)&&!/contestar/.test(x),x);
  await pg.screenshot({path:S+"j-hoja.jpg"});
  await tocar(pg,".t3x-quema-tarjeta");await pg.waitForSelector(".t3x-quema-video",{timeout:6000});await pg.waitForTimeout(500);
  x=await video(pg);
  chequear("tocando la foto se abre el video otra vez (ahora dice «cerrar»)",x&&!x.primera&&x.cerrar==="cerrar"&&x.pausado,x);
  await tocar(pg,".t3x-quema-cerrar");await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video"),null,{timeout:6000});await pg.waitForTimeout(300);
  await pg.evaluate(()=>{document.querySelector(".t3-cuaderno-senal").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));});await pg.waitForTimeout(700);
  x=await pg.evaluate(()=>{const i=document.querySelector(".t3-cuaderno-indice");return {bajada:i.querySelector("p").textContent,fichas:Array.from(i.querySelectorAll(".t3-cuaderno-ficha")).map(e=>e.innerText.replace(/\s+/g," ").trim())};});
  chequear("el índice ahora es «lo que no se quemó»: una sola hoja, la del 1/12, con su ventanita",x.bajada==="lo que no se quemó"&&x.fichas.length===1&&/1 DIC/i.test(x.fichas[0])&&/ventanita 1/.test(x.fichas[0]),x);
  await pg.screenshot({path:S+"j-indice.jpg"});
  await pg.evaluate(()=>document.querySelector(".t3-cuaderno-indice-cerrar").click());await pg.waitForTimeout(400);
  x=await pg.evaluate(async()=>{const antes=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible").getAttribute("data-fecha");document.querySelector(".t3-cuaderno-flecha-antes").click();await new Promise(r=>setTimeout(r,900));
    return {antes:antes,despues:document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible").getAttribute("data-fecha"),irA:(T3.cuaderno.irA("2026-10-06"),await new Promise(r=>setTimeout(r,900)),document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible").getAttribute("data-fecha"))};});
  chequear("no se puede volver a lo de antes: ni con la flecha ni pidiendo una hoja vieja",x.antes==="2026-12-01"&&x.despues==="2026-12-01"&&x.irA==="2026-12-01",x);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);

  console.log("AL VOLVER A ENTRAR");
  await pg.reload({waitUntil:"load"});
  await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});await pg.waitForTimeout(1600);
  r=await foto(pg);
  chequear("no hay escena ni video: el cuaderno abre en la hoja 93, con los tizones y la foto del video",!r.toca&&r.hecha&&!r.escena&&!r.antes&&!r.velo&&!r.video&&!r.cerrado&&r.hoja==="2026-12-01"&&r.folio==="· 93 ·"&&r.tizones===5&&r.tarjeta&&r.nuevas==="se ve,se ve,se ve",r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("AL DÍA SIGUIENTE");
  o=await abrir(b,base,"2026-12-02",{semilla:usada({"pv-t3-set-escritas":JSON.stringify(dias("2026-07-30","2026-12-02")),"pv-t3-set-abrio":JSON.stringify(dias("2026-07-30","2026-12-02"))})});pg=o.pg;
  r=await foto(pg);
  chequear("el 2/12 el cuaderno tiene dos hojas (la 93 y la 94), sin escena",!r.toca&&!r.escena&&r.fechas===2&&r.hoja==="2026-12-02"&&r.folio==="· 94 ·"&&r.tizones===5&&r.meses==="DIC",r);
  chequear("la hoja del 2 lleva su ventanita y nada más: sin juego y sin precinto (decía «sellado», pero no hay carta que tapar)",r.puerta&&!r.juego&&!r.precinto&&!r.tarjeta,r);
  x=await pg.evaluate(async()=>{document.querySelector(".t3-cuaderno-flecha-antes").click();await new Promise(r=>setTimeout(r,1000));const h=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible");return {f:h.getAttribute("data-fecha"),tarjeta:!!h.querySelector(".t3x-quema-tarjeta"),folio:h.querySelector("[data-folio]").textContent.trim()};});
  chequear("para atrás está la del 1/12, con la foto del video",x.f==="2026-12-01"&&x.tarjeta&&x.folio==="· 93 ·",x);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("DICIEMBRE, APAGADO");
  o=await abrir(b,base,"2026-12-26",{});pg=o.pg;
  x=await pg.evaluate(()=>{const D=CONFIG.dias,dic=Object.keys(D).filter(f=>/^2026-12-/.test(f)).sort();
    return {dias:dic.length,conEvento:dic.filter(f=>D[f].evento),conJuego:dic.filter(f=>D[f].actividad),conCarta:dic.filter(f=>String(D[f].mensaje||"").trim()),
      guardados:dic.filter(f=>D[f].eventoApagado||D[f].actividadApagada).length,enero:D["2027-01-01"]&&D["2027-01-01"].evento,
      hojas:T3.fechas("2026-12-31").filter(f=>f>="2026-12-01"),hoy:T3.hoy,enCuaderno:Array.from(new Set(Array.from(document.querySelectorAll(".t3-cuaderno-pestana[data-mes]")).map(b=>b.textContent.trim()))).join()};});
  chequear("ningún día de diciembre tiene carta, evento ni juego (quedaron guardados, apagados), y el 1 de enero conserva el suyo",x.dias===31&&!x.conEvento.length&&!x.conJuego.length&&!x.conCarta.length&&x.guardados===31&&x.enero==="tomo2",x);
  chequear("las hojas de diciembre son las de las ventanitas: del 1 al 24",x.hojas.length===24&&x.hojas[0]==="2026-12-01"&&x.hojas[23]==="2026-12-24",x.hojas);
  r=await foto(pg);
  chequear("el 26 la hoja del día existe igual (en blanco) y es la última",r.hoja==="2026-12-26"&&!r.puerta&&!r.juego&&r.fechas===24&&r.folio==="· 117 ·",r);
  x=await pg.evaluate(async()=>{await T3.cuaderno.abrir("tcg");await new Promise(r=>setTimeout(r,1200));const h=document.querySelector(".t3-cuaderno-especial-host");return h?h.innerText.replace(/\s+/g," "):"";});
  chequear("MafiaTCG ya no promete un sobre por ganar el juego del día",/Un sobre por día\./.test(x)&&!/juego del día/.test(x)&&!/juego de hoy/.test(x),x.slice(0,400));
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();
  const A=require("../scripts/aviso.cjs");
  x=["2026-11-30","2026-12-01","2026-12-16","2026-12-24","2026-12-25","2026-12-31","2027-01-01","2027-01-02"].map(f=>{const h=A.leerHoja(f),d=A.decidir(f,h.dia,h.estreno);return f+":"+(d.body||"("+d.saltar+")");});
  chequear("el aviso diario: del 1 al 24 habla de la ventanita; del 25 al 31, del sobre; el 1/1, del evento; y afuera de eso no avisa",
    /^2026-11-30:\(/.test(x[0])&&/ventanita/i.test(x[1])&&/ventanita/i.test(x[2])&&/ventanita/i.test(x[3])&&/sobre/i.test(x[4])&&/sobre/i.test(x[5])&&/^2027-01-01:[^(]/.test(x[6])&&!/sobre|ventanita/i.test(x[6])&&/^2027-01-02:\(/.test(x[7]),x);

  console.log("CON «REDUCIR MOVIMIENTO»");
  o=await abrir(b,base,"2026-12-01",{quema:true,abrir:false,contexto:{reducedMotion:"reduce"},semilla:usada()});pg=o.pg;
  r=await foto(pg);
  chequear("la escena se arma sin fuego: no hay réplicas ni Ponyta por entrar",r.toca&&r.escena&&r.escena.sinFuego&&!r.replicas&&!r.dijeSola,r);
  await correrElastico(pg);
  await pg.waitForSelector(".t3x-quema-video",{timeout:8000});await pg.waitForTimeout(500);
  r=await foto(pg);
  chequear("al correr la tapa el cuaderno aparece ya quemado y va derecho al video, sin animación",r.hecha&&r.fechas===1&&r.tizones===5&&!r.velo&&r.video&&r.folio==="· 93 ·",r);
  await tocar(pg,".t3x-quema-cerrar");await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video"),null,{timeout:6000});await pg.waitForTimeout(1200);
  r=await foto(pg);
  chequear("y al cerrarlo queda la hoja del día, entera, con la foto del video",r.escritas&&r.enEspera===0&&r.tarjeta&&r.puerta&&r.nuevas==="se ve,se ve,se ve"&&!r.frena,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("SI LA PRIMERA VEZ ES OTRO DÍA");
  o=await abrir(b,base,"2026-12-05",{quema:true,abrir:false,semilla:usada()});pg=o.pg;
  r=await foto(pg);
  chequear("el 5/12 sin haber entrado antes: la escena está armada igual",r.toca&&r.escena&&r.escena.capas===5&&r.fechas===97,r);
  await correrElastico(pg);
  await pg.waitForFunction(()=>document.getElementById("t3").classList.contains("t3-cuaderno-abierto"),null,{timeout:8000});
  await cuadro(pg,7);
  await pg.waitForSelector(".t3x-quema-video",{timeout:8000});await pg.waitForTimeout(400);
  await tocar(pg,".t3x-quema-cerrar");await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video"),null,{timeout:6000});await pg.waitForTimeout(2600);
  r=await foto(pg);
  chequear("se quema ese día: quedan las hojas del 1 al 5 y el video queda pegado en la del 5",r.guardado.f==="2026-12-05"&&r.fechas===5&&r.primera==="2026-12-01"&&r.hoja==="2026-12-05"&&r.folio==="· 97 ·"&&r.tarjeta&&r.tizones===5,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("UN CELULAR NUEVO EN DICIEMBRE");
  /* sin nada guardado (cambió de celular, o Mati viajó «de cero» en la máquina): primero el paquete de la inauguración
     y después el cuaderno, que se quema igual */
  o=await abrir(b,base,"2026-12-03",{quema:true,abrir:false,espera:300});pg=o.pg;
  await pg.evaluate(()=>{localStorage.clear();});
  await pg.reload({waitUntil:"load"});
  await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-evento .t3-inauguracion-boton"),null,{timeout:15000});await pg.waitForTimeout(1200);
  x=await pg.evaluate(()=>({toca:T3.quema.toca(),escena:!!T3.quema._prueba.escena(),hojas:!!document.querySelector(".t3-cuaderno-hoja")}));
  chequear("arranca por el paquete: el cuaderno todavía no está y la escena tampoco",x.toca&&!x.escena&&!x.hojas,x);
  for(let i=0;i<40;i++){   /* se rompe el papel con el botón, hasta que el paquete se va */
    if(!await pg.evaluate(()=>{const bt=document.querySelector(".t3-cuaderno-evento .t3-inauguracion-boton");if(bt)bt.click();return !!bt;}))break;
    await pg.waitForTimeout(700);
  }
  await pg.waitForFunction(()=>document.querySelector(".t3-cuaderno-hoja")&&T3.quema._prueba.escena(),null,{timeout:15000});
  r=await foto(pg);
  chequear("al abrirlo aparece el cuaderno, ya abierto, con la escena armada",!r.cerrado&&r.toca&&r.antes&&r.escena&&r.escena.capas===5&&r.fechas===95,r);
  await cuadro(pg,7);
  await pg.waitForSelector(".t3x-quema-video",{timeout:8000});await pg.waitForTimeout(400);
  await tocar(pg,".t3x-quema-cerrar");await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video"),null,{timeout:6000});await pg.waitForTimeout(2600);
  r=await foto(pg);
  chequear("se quema igual: quedan las hojas del 1 al 3 y la de hoy se presenta con su ventanita y la foto del video",r.hecha&&r.fechas===3&&r.tizones===5&&r.hoja==="2026-12-03"&&r.folio==="· 95 ·"&&r.tarjeta&&r.puerta&&r.escritas&&r.enEspera===0&&!r.antes,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("SI SE CIERRA LA APP A MITAD DEL FUEGO");
  o=await abrir(b,base,"2026-12-01",{quema:true,abrir:false,contexto:{viewport:{width:375,height:667}},semilla:usada({"pv-t3-set-abrio":JSON.stringify(dias("2026-07-30","2026-12-01"))})});pg=o.pg;
  r=await foto(pg);
  chequear("al volver, el cuaderno ya está abierto y la escena arranca sola desde el principio",!r.cerrado&&r.toca&&r.escena&&r.replicas&&!r.escritas&&r.enEspera>0,r);
  await pg.waitForSelector(".t3x-quema",{timeout:8000});
  await pg.waitForSelector(".t3x-quema-video",{timeout:40000});await pg.waitForTimeout(900);
  r=await foto(pg);x=await video(pg);
  chequear("corre a su tiempo, sin reloj de prueba, y termina en el video",r.hecha&&r.escena.terminada&&r.escena.t>=6&&r.fechas===1&&r.tizones===5&&r.video,r);
  chequear("en una pantalla chica (375×667) el video también entra entero, con su botón",x.marco[0]>=0&&x.marco[2]<=x.ancho&&x.marco[1]>=0&&x.boton[1]<=x.alto&&x.marco[3]<=x.boton[0],x);
  await pg.screenshot({path:S+"j-video-chica.jpg"});
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("SI EL VIDEO NO CARGA");
  o=await abrir(b,base,"2026-12-03",{});pg=o.pg;
  await pg.route("**/videos/1-dic.mp4",rt=>rt.abort());
  await pg.evaluate(()=>T3.cuaderno.irA("2026-12-01"));await pg.waitForTimeout(1200);
  await tocar(pg,".t3x-quema-tarjeta");await pg.waitForSelector(".t3x-quema-video",{timeout:6000});
  await tocar(pg,".t3x-quema-play");
  await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video .t3x-quema-error").hidden,null,{timeout:20000}).catch(()=>{});
  x=await video(pg);
  chequear("sin el archivo, avisa («No pude cargar el video») y se puede cerrar",x.error&&!x.anda,x);
  await tocar(pg,".t3x-quema-cerrar");await pg.waitForFunction(()=>!document.querySelector(".t3x-quema-video"),null,{timeout:6000});
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  await b.close();srv.close();
  process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
