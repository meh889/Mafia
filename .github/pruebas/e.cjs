/* Laboratorio · Ponyta se va de vacaciones y vuelve; el gorro se lo pone cuando Sofi abre la ventanita 1 del adviento (T3.viaje),
   y en ese momento suena el audio que mandó Mati */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
const K={viaje:"pv-t3-ponyta-viaje",dias:"pv-t3-set-ponyta-huellas-dias",stats:"pv-t3-stats"};
const semilla=(dias,huellas,ida)=>{const s={};s[K.dias]=JSON.stringify(dias);s[K.stats]=JSON.stringify({huellas:huellas,carreras:huellas});if(ida)s[K.viaje]=JSON.stringify({ida:ida});return s;};
/* lo que se ve y lo que quedó guardado */
const foto=pg=>pg.evaluate(()=>{
  const q=s=>document.querySelector(s),pag=q(".t3-ponyta-pag"),nota=q(".t3x-viaje-nota"),btn=q(".t3-ponyta-correr"),globo=q(".t3-ponyta-globo"),anda=q(".t3-ponyta-anda"),dije=q(".t3-ponyta-dije");
  const visible=e=>!!e&&getComputedStyle(e).display!=="none"&&getComputedStyle(e).visibility!=="hidden"&&e.getBoundingClientRect().width>0;
  const dentro=(a,b)=>{if(!a||!b)return false;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.left>=y.left-2&&x.right<=y.right+2&&x.top>=y.top-2;};
  return {ausente:!!pag&&pag.classList.contains("t3-ponyta-ausente"),conGorro:!!pag&&pag.classList.contains("t3-ponyta-con-gorro"),
    nota:nota?nota.innerText.replace(/\s+/g," ").trim():"",notaEnHoja:dentro(nota,pag),notaSobreBoton:!!nota&&!!btn&&nota.getBoundingClientRect().bottom>btn.getBoundingClientRect().top,
    pony:visible(anda),gorro:!!document.querySelector(".t3-ponyta-postura .t3x-gorro"),globo:globo?globo.innerText.replace(/\s+/g," ").trim():"",globoVisible:!!globo&&globo.classList.contains("t3-ponyta-ver"),
    boton:btn?btn.innerText.trim():"",apagado:!!btn&&btn.disabled,lapiz:(q(".t3-ponyta-presume")||{}).innerText||"",
    dijeSola:!!dije&&dije.classList.contains("t3-ponyta-dije-sola"),dijeGorro:!!document.querySelector(".t3-ponyta-dije .t3x-gorro"),
    viaje:JSON.parse(localStorage.getItem("pv-t3-ponyta-viaje")||"null"),dias:JSON.parse(localStorage.getItem("pv-t3-set-ponyta-huellas-dias")||"[]"),
    stats:JSON.parse(localStorage.getItem("pv-t3-stats")||"{}"),fuegos:!!document.querySelector(".t3-ponyta-fuegos")};
});
const hoja=pg=>pg.evaluate(()=>{const h=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible")||document.querySelector(".t3-cuaderno-hoja"),p=h&&h.querySelector(".t3-cuaderno-pony");return {fecha:h?h.dataset.fecha:"",dibujo:!!p,gorro:!!(p&&p.querySelector(".t3x-gorro-linea")),frase:p?(p.querySelector(".t3-cuaderno-pony-frase")||{innerText:""}).innerText.replace(/\s+/g," ").trim():""};});
const solapa=async pg=>{await pg.click('[data-pest="ponyta"]',{force:true});await pg.waitForTimeout(1500);};
/* la hace correr y espera a que la corrida termine de verdad (en una máquina lenta tarda más):
   "vuelta" = volvió y el botón quedó listo · "ida" = apareció la nota */
const termino={vuelta:()=>{const p=document.querySelector(".t3-ponyta-pag"),t=document.querySelector(".t3-ponyta-correr-txt");return !!p&&!p.classList.contains("t3-ponyta-en-carrera")&&/otra vuelta/i.test(t.textContent);},
  ida:()=>!!document.querySelector(".t3x-viaje-nota"),fuegos:()=>!!document.querySelector(".t3-ponyta-fuegos")};
const correr=async(pg,fin)=>{await pg.click(".t3-ponyta-correr",{force:true});await pg.waitForFunction(termino[fin],null,{timeout:20000});await pg.waitForTimeout(fin==="fuegos"?150:1100);};

(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port;
  const b=await motor().launch();
  let r,o;

  console.log("ANTES DE LA FECHA");
  o=await abrir(b,base,"2026-11-18",{semilla:semilla(["2026-11-16","2026-11-17"],2)});
  await solapa(o.pg);await correr(o.pg,"vuelta");r=await foto(o.pg);
  chequear("el 18/11 corre y vuelve como siempre",!r.ausente&&r.pony&&!r.nota&&r.viaje===null&&r.dias.includes("2026-11-18")&&r.stats.huellas===3&&r.boton.toUpperCase()==="OTRA VUELTA",r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("LA IDA");
  o=await abrir(b,base,"2026-11-19",{semilla:semilla(["2026-11-17","2026-11-18"],2)});
  r=await hoja(o.pg);
  chequear("antes de irse, la hoja del día tiene su dibujo",r.dibujo&&!r.gorro,r);
  await solapa(o.pg);r=await foto(o.pg);
  chequear("la solapa arranca como siempre",!r.ausente&&r.pony&&!r.gorro&&!r.apagado,r);
  await o.pg.click(".t3-ponyta-correr",{force:true});await o.pg.waitForTimeout(1900);
  r=await foto(o.pg);
  chequear("a mitad de la corrida todavía no hay aviso ni nada guardado",!r.nota&&r.viaje===null&&!r.ausente,r);
  await o.pg.waitForFunction(termino.ida,null,{timeout:20000});await o.pg.waitForTimeout(1100);r=await foto(o.pg);
  chequear("sale como siempre y no vuelve: queda la nota con la fecha de vuelta",r.ausente&&!r.pony&&/me fui de vacaciones\./.test(r.nota)&&/vuelvo el 1 de diciembre\./.test(r.nota)&&/— P\./.test(r.nota),r);
  chequear("la nota entra en la hoja y no pisa el botón",r.notaEnHoja&&!r.notaSobreBoton,r);
  chequear("junta la herradura de ese día igual",r.dias.join()==="2026-11-17,2026-11-18,2026-11-19"&&r.stats.huellas===3,{dias:r.dias,stats:r.stats});
  chequear("queda anotado el día en que se fue",!!r.viaje&&r.viaje.ida==="2026-11-19",r.viaje);
  chequear("el botón queda apagado y dice cuándo vuelve",r.apagado&&r.boton.toUpperCase()==="NO ESTÁ"&&/vuelve el 1 de diciembre/.test(r.lapiz)&&!r.globoVisible,r);
  chequear("el señalador queda con el aro solo",r.dijeSola&&await o.pg.evaluate(()=>document.documentElement.classList.contains("t3x-pony-lejos")),r);
  chequear("y se borra del dibujo de la hoja de hoy",await o.pg.evaluate(()=>!document.querySelector(".t3-cuaderno-hoja .t3-cuaderno-pony")));
  const carreras=r.stats.carreras;
  await o.pg.click(".t3-ponyta-correr",{force:true}).catch(()=>{});await o.pg.waitForTimeout(600);r=await foto(o.pg);
  chequear("tocar el botón apagado no hace nada",r.stats.carreras===carreras&&r.ausente,r.stats);
  await o.pg.screenshot({path:S+"e-ida.jpg"});
  await o.pg.reload();await o.pg.waitForTimeout(2600);r=await hoja(o.pg);
  chequear("al volver a abrir, la hoja de ese día sigue sin su dibujo",r.fecha==="2026-11-19"&&!r.dibujo,r);
  await solapa(o.pg);r=await foto(o.pg);
  chequear("al volver a abrir sigue sin estar, con la nota y el señalador solo",r.ausente&&!r.pony&&/vuelvo el 1 de diciembre/.test(r.nota)&&r.apagado&&r.dijeSola,r);
  r=await o.pg.evaluate(async()=>{const d=await T3.respaldo.leer(await T3.respaldo.exportar());return Object.keys(d.datos).includes("pv-t3-ponyta-viaje");});
  chequear("el respaldo se lleva el viaje",r===true,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  o=await abrir(b,base,"2026-11-19",{semilla:semilla(["2026-11-18","2026-11-19"],2)});
  await solapa(o.pg);await correr(o.pg,"ida");r=await foto(o.pg);
  chequear("si hoy ya había corrido, en la otra vuelta también se va (sin sumar herradura)",r.ausente&&!!r.viaje&&r.stats.huellas===2&&r.dias.length===2&&!!r.nota,r);
  await o.ctx.close();

  o=await abrir(b,base,"2026-11-20",{semilla:semilla(["2026-11-13","2026-11-14","2026-11-15","2026-11-16","2026-11-17","2026-11-18"],6)});
  await solapa(o.pg);await correr(o.pg,"fuegos");r=await foto(o.pg);
  chequear("si justo son 7 herraduras, primero van los fuegos",r.fuegos&&r.stats.huellas===7&&!r.nota&&!!r.viaje,r);
  await o.pg.waitForFunction(termino.ida,null,{timeout:20000});await o.pg.waitForTimeout(1100);r=await foto(o.pg);
  chequear("…y después aparece la nota, sin globo",r.ausente&&!!r.nota&&!r.globoVisible,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  o=await abrir(b,base,"2026-11-21",{semilla:semilla(["2026-11-18"],1),contexto:{reducedMotion:"reduce"}});
  await solapa(o.pg);await correr(o.pg,"ida");r=await foto(o.pg);
  chequear("con movimiento reducido también se va y deja la nota",r.ausente&&!r.pony&&!!r.nota&&!!r.viaje&&r.viaje.ida==="2026-11-21"&&r.stats.huellas===2,r);
  await o.ctx.close();

  console.log("MIENTRAS NO ESTÁ");
  o=await abrir(b,base,"2026-11-24",{semilla:semilla(["2026-11-18","2026-11-19"],2,"2026-11-19")});
  r=await hoja(o.pg);
  chequear("la hoja de un día en que no está sale sin su dibujo",r.fecha==="2026-11-24"&&!r.dibujo,r);
  await o.pg.screenshot({path:S+"e-lejos-hoja.jpg"});
  r=await o.pg.evaluate(()=>({sola:document.querySelector(".t3-ponyta-dije").classList.contains("t3-ponyta-dije-sola")&&document.documentElement.classList.contains("t3x-pony-lejos"),v:[T3.viaje.ausente("2026-11-18"),T3.viaje.ausente("2026-11-19"),T3.viaje.ausente("2026-11-30"),T3.viaje.ausente("2026-12-01"),T3.viaje.toca()]}));
  chequear("el señalador sigue solo y las fechas cierran (se fue el 19, vuelve el 1)",r.sola&&r.v.join()==="false,true,true,false,false",r);
  await solapa(o.pg);r=await foto(o.pg);
  chequear("su solapa muestra la nota y nada más",r.ausente&&!r.pony&&!!r.nota&&r.apagado&&!r.globoVisible&&r.notaEnHoja&&!r.notaSobreBoton,r);
  await o.pg.screenshot({path:S+"e-lejos.jpg"});
  await o.pg.evaluate(()=>T3.cuaderno.irA("2026-11-15"));await o.pg.waitForTimeout(1500);r=await hoja(o.pg);
  chequear("las hojas de antes de irse siguen con su dibujo",r.fecha==="2026-11-15"&&r.dibujo&&!r.gorro,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("LA VUELTA");
  o=await abrir(b,base,"2026-12-01",{semilla:semilla(["2026-11-18","2026-11-19"],2,"2026-11-19")});
  r=await hoja(o.pg);
  chequear("el 1/12 la hoja tiene su dibujo, todavía sin gorro, y dice que volvió sin contar la sorpresa",r.fecha==="2026-12-01"&&r.dibujo&&!r.gorro&&/volví\. traje algo de las vacaciones\. está en la ventanita 1\./.test(r.frase)&&!/gorro/i.test(r.frase),r);
  await o.pg.screenshot({path:S+"e-vuelta-hoja.jpg"});
  await o.pg.evaluate(()=>{const p=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible .t3-cuaderno-pony");if(p)p.scrollIntoView({block:"center"});});await o.pg.waitForTimeout(500);
  await o.pg.screenshot({path:S+"e-vuelta-dibujo.jpg"});
  await o.pg.evaluate(()=>{const h=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible");if(h){h.scrollTop=0;}window.scrollTo(0,0);});await o.pg.waitForTimeout(300);
  r=await o.pg.evaluate(()=>({sola:document.querySelector(".t3-ponyta-dije").classList.contains("t3-ponyta-dije-sola")||document.documentElement.classList.contains("t3x-pony-lejos"),gorro:!!document.querySelector(".t3-ponyta-dije .t3x-gorro")}));
  chequear("volvió al señalador, sin gorro todavía",!r.sola&&!r.gorro,r);
  r=await o.pg.evaluate(()=>[T3.viaje.gorroPuesto(),T3.viaje.conGorro("2026-12-01"),T3.viaje.conGorro("2026-12-20")]);
  chequear("antes de abrir la ventanita 1 no hay gorro ningún día",r.join()==="false,false,false",r);
  await solapa(o.pg);await o.pg.waitForTimeout(2600);r=await foto(o.pg);
  chequear("en su solapa tampoco lo lleva, y no lo nombra",!r.ausente&&r.pony&&!r.gorro&&!r.conGorro&&!r.nota&&/traje algo de las vacaciones/.test(r.globo)&&!/gorro/i.test(r.globo),r);
  // el calendario: la Ponyta que lo adorna tampoco tiene gorro hasta que se abre la ventanita 1
  /* mientras se despliega, se va mirando hasta dónde llega la mitad de arriba (la tapa) cuando gira */
  const mirarTapa=(pg,contra)=>pg.evaluate(contra=>{window.__tapa={min:1e9,n:0,fin:false};const paso=()=>{const T=window.__tapa;if(T.fin)return;
    const c=document.querySelector(".t3-adviento-popeando .t3-adviento-cara"),h=document.querySelector(contra);
    if(c&&h){const d=c.getBoundingClientRect().top-(contra.indexOf("cerrar")>=0?h.getBoundingClientRect().bottom:h.getBoundingClientRect().top);T.n++;if(d<T.min)T.min=d;}
    requestAnimationFrame(paso);};requestAnimationFrame(paso);},contra);
  const tapa=pg=>pg.evaluate(()=>{const T=window.__tapa;T.fin=true;const p=document.querySelector(".t3-adviento-pag"),e=p&&p._pop&&p._pop.encuadre;
    return {min:Math.round(T.min),n:T.n,enc:e?{dyO:Math.round(e.dyO),dyS:Math.round(e.dyS),kS:e.kS}:null};});
  await mirarTapa(o.pg,".t3-cuaderno-especial-host");
  await o.pg.click('[data-pest="adviento"]',{force:true});
  await o.pg.waitForTimeout(1300);
  r=await o.pg.evaluate(()=>{const p=document.querySelector(".t3-adviento-pag"),pie=document.querySelector(".t3-adviento-pie");return {popeando:!!p&&p.classList.contains("t3-adviento-popeando"),pie:pie?+getComputedStyle(pie).opacity:-1};});
  chequear("mientras la caja del calendario está cerrada, el renglón del pie no asoma",!r.popeando||r.pie<.05,r);
  await o.pg.waitForFunction(()=>{const p=document.querySelector(".t3-adviento-pag");return !!p&&p.classList.contains("t3-adviento-listo");},null,{timeout:15000});
  r=await tapa(o.pg);
  /* con "reducir movimiento" (así corre el WebKit del laboratorio) el calendario no se despliega: aparece ya abierto */
  const menos=await o.pg.evaluate(()=>T3.util.reducido());
  if(menos)chequear("con «reducir movimiento» el calendario aparece abierto, sin desplegarse",r.n===0&&!r.enc,r);
  else chequear("mientras la tapa del calendario gira no se corta contra el borde de arriba de la hoja (el encuadre baja lo justo)",r.n>20&&r.min>=-1&&!!r.enc&&r.enc.dyS>=r.enc.dyO,r);
  await o.pg.waitForTimeout(300);
  await o.pg.screenshot({path:S+"e-adviento-antes.jpg"});
  r=await o.pg.evaluate(()=>{const c=document.querySelector(".t3-adviento-pop-centro"),pie=document.querySelector(".t3-adviento-pie");return {pony:!!c&&!!c.querySelector("svg"),gorro:!!c&&!!c.querySelector(".t3-adviento-gorro"),pie:+getComputedStyle(pie).opacity,dije:!!document.querySelector(".t3-ponyta-dije .t3x-gorro")};});
  chequear("la Ponyta del calendario está, pero sin gorro (y el pie ya se ve)",r.pony&&!r.gorro&&r.pie>.95&&!r.dije,r);
  await o.pg.evaluate(()=>{document.querySelector('.t3-adviento-v[data-n="1"]').scrollIntoView({block:"center"});});await o.pg.waitForTimeout(400);
  await o.pg.click('.t3-adviento-v[data-n="1"]',{force:true});
  await o.pg.waitForFunction(()=>!!document.querySelector(".t3-adviento-velo .t3-adviento-gorro"),null,{timeout:10000});
  await o.pg.waitForTimeout(2200);
  await o.pg.screenshot({path:S+"e-adviento-ventanita1.jpg"});
  /* el audio que mandó Mati (el "wo men ji"): suena cuando aparece con el gorro puesto */
  r=await o.pg.evaluate(()=>({log:T3.x.clipLog.slice(),nieve:document.querySelectorAll(".t3-adviento-velo.t3x-con-nieve .t3x-nieve i").length,suena:!!document.querySelector(".t3-adviento-velo.t3x-gorro-suena")}));
  const sonoGorro=r.log.indexOf("suena:gorro")>=0;      /* el WebKit del laboratorio puede no saber leer el mp3 */
  chequear("cuando aparece con el gorro, la app pide el audio del gorro (una vez) y prepara la nieve",require("fs").existsSync(require("path").resolve(__dirname,"..","..","audios/gorro.mp3"))&&r.log.filter(x=>x==="pide:gorro").length===1&&r.nieve>=10,r);
  chequear("en Chromium suena de verdad y, mientras dura, Ponyta baila",(process.env.MOTOR||"chromium")!=="chromium"||(sonoGorro&&r.suena),r);
  chequear("donde no suena, tampoco baila ni rompe nada",sonoGorro||!r.suena,r);
  r=await o.pg.evaluate(()=>({sorpresa:(document.querySelector(".t3-adviento-velo")||{}).innerText||"",calendario:!!document.querySelector(".t3-adviento-pop-centro .t3-adviento-gorro"),dije:!!document.querySelector(".t3-ponyta-dije .t3x-gorro"),puesto:T3.viaje.gorroPuesto()}));
  chequear("al abrir la ventanita 1 sale Ponyta con gorro, y se lo pone en el calendario y en el señalador",/ya se puso el gorro/.test(r.sorpresa)&&r.calendario&&r.dije&&r.puesto,r);
  await o.pg.evaluate(()=>{const b=Array.from(document.querySelectorAll(".t3-adviento-velo button")).find(x=>/guardar/i.test(x.textContent));if(b)b.click();});
  await o.pg.waitForFunction(()=>!document.querySelector(".t3-adviento-velo"),null,{timeout:8000});
  await o.pg.evaluate(()=>{const h=document.querySelector(".t3-cuaderno-especial-host");if(h)h.scrollTop=0;});await o.pg.waitForTimeout(400);
  await o.pg.screenshot({path:S+"e-adviento-despues.jpg"});
  /* abrirla de nuevo la hace sonar otra vez; otra ventanita, no */
  await o.pg.evaluate(()=>{document.querySelector('.t3-adviento-v[data-n="1"]').scrollIntoView({block:"center"});});await o.pg.waitForTimeout(300);
  await o.pg.click('.t3-adviento-v[data-n="1"]',{force:true});
  await o.pg.waitForFunction(()=>!!document.querySelector(".t3-adviento-velo .t3-adviento-gorro"),null,{timeout:10000});await o.pg.waitForTimeout(500);
  r=await o.pg.evaluate(()=>({pide:T3.x.clipLog.filter(x=>x==="pide:gorro").length,corto:T3.x.clipLog.filter(x=>x==="corta:gorro").length,sono:T3.x.clipLog.indexOf("suena:gorro")>=0}));
  chequear("guardar la sorpresa corta el audio, y al volver a abrir la ventanita 1 lo pide de nuevo",r.pide===2&&(!r.sono||r.corto===1),r);
  await o.pg.evaluate(()=>{const b=Array.from(document.querySelectorAll(".t3-adviento-velo button")).find(x=>/guardar/i.test(x.textContent));if(b)b.click();});
  await o.pg.waitForFunction(()=>!document.querySelector(".t3-adviento-velo"),null,{timeout:8000});
  r=await o.pg.evaluate(()=>{const antes=T3.x.clipLog.length;let sin=true;try{T3.viaje.enSorpresa(document.createElement("div"),9,"2026-12-09",{tipo:"ponyta",traje:"bufanda"},[]);}catch(e){sin=false;}return {sin,pidio:T3.x.clipLog.length-antes};});
  chequear("la sorpresa de otra ventanita de Ponyta (la de la bufanda) no hace sonar nada",r.sin&&r.pidio===0,r);
  await o.pg.evaluate(()=>T3.cuaderno.irA("2026-12-01"));await o.pg.waitForTimeout(1500);r=await hoja(o.pg);
  chequear("de vuelta en la hoja, el dibujo ya tiene gorro y lo dice",r.fecha==="2026-12-01"&&r.dibujo&&r.gorro&&/volví\. traje gorro\./.test(r.frase),r);
  await solapa(o.pg);await o.pg.waitForTimeout(2600);r=await foto(o.pg);
  chequear("está en su solapa, con gorro, y lo dice",!r.ausente&&r.pony&&r.gorro&&r.conGorro&&!r.nota&&!r.apagado&&/volví\. traje gorro\. no me lo saco ni para dormir\./.test(r.globo),r);
  await o.pg.screenshot({path:S+"e-vuelta.jpg"});
  r=await o.pg.evaluate(()=>{const g=document.querySelector(".t3-ponyta-globo").getBoundingClientRect(),h=document.querySelector(".t3-ponyta-postura .t3x-gorro").getBoundingClientRect();return {globoAbajo:Math.round(g.bottom),gorroArriba:Math.round(h.top)};});
  chequear("el globo no pisa el gorro",r.globoAbajo<=r.gorroArriba+1,r);
  await correr(o.pg,"vuelta");r=await foto(o.pg);
  chequear("corre y vuelve como siempre, y suma la herradura",!r.ausente&&r.pony&&r.gorro&&r.dias.includes("2026-12-01")&&r.stats.huellas===3&&r.boton.toUpperCase()==="OTRA VUELTA"&&r.viaje.ida==="2026-11-19",r);
  await o.pg.evaluate(()=>T3.cuaderno.irA("2026-11-15"));await o.pg.waitForTimeout(1800);r=await hoja(o.pg);
  chequear("las hojas de noviembre siguen con su dibujo, sin gorro",r.fecha==="2026-11-15"&&r.dibujo&&!r.gorro,r);
  r=await o.pg.evaluate(()=>[T3.viaje.conGorro("2026-11-30"),T3.viaje.conGorro("2026-12-01"),T3.viaje.conGorro("2027-01-06"),T3.viaje.conGorro("2027-01-07")]);
  chequear("una vez abierta la ventanita 1, el gorro va del 1/12 a Reyes",r.join()==="false,true,true,false",r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  o=await abrir(b,base,"2026-12-01",{semilla:semilla(["2026-11-18"],1)});
  await solapa(o.pg);await o.pg.waitForTimeout(2600);r=await foto(o.pg);
  chequear("si nunca se fue, el 1/12 tampoco tiene gorro todavía y manda a la ventanita 1",!r.gorro&&/arrancó diciembre\. en la ventanita 1 hay algo para mí\. abrila\./.test(r.globo)&&r.viaje===null,r);
  await correr(o.pg,"vuelta");r=await foto(o.pg);
  chequear("…y ya no se va",!r.ausente&&r.pony&&r.viaje===null&&!r.nota,r);
  await o.ctx.close();

  o=await abrir(b,base,"2026-12-01",{semilla:Object.assign(semilla(["2026-11-18"],1),{"pv-t3-set-adviento":'["2026-12-01"]'})});
  await solapa(o.pg);await o.pg.waitForTimeout(2600);r=await foto(o.pg);
  chequear("si nunca se fue y ya abrió la ventanita 1, tiene gorro y lo dice",r.gorro&&/arrancó diciembre\. me puse el gorro\./.test(r.globo)&&r.viaje===null,r);
  await o.ctx.close();

  // la ventanita 1 abierta tarde (el 3/12): hasta ese momento, nada; después, gorro
  o=await abrir(b,base,"2026-12-03",{semilla:semilla(["2026-11-19"],1,"2026-11-19")});
  r=await o.pg.evaluate(()=>({dije:!!document.querySelector(".t3-ponyta-dije .t3x-gorro"),con:T3.viaje.conGorro()}));
  chequear("el 3/12, si todavía no abrió la ventanita 1, sigue sin gorro",!r.dije&&!r.con,r);
  await o.pg.evaluate(()=>T3.adviento.abrir("2026-12-01"));await o.pg.waitForTimeout(2300);
  r=await o.pg.evaluate(()=>({dije:!!document.querySelector(".t3-ponyta-dije .t3x-gorro"),con:T3.viaje.conGorro(),sorpresa:!!document.querySelector(".t3-adviento-velo .t3-adviento-gorro")}));
  chequear("…y cuando la abre, se lo pone",r.dije&&r.con&&r.sorpresa,r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  o=await abrir(b,base,"2026-12-02",{semilla:Object.assign(semilla(["2026-11-19"],1,"2026-11-19"),{"pv-t3-ponyta-evolucion":'"rapidash"',"pv-t3-set-adviento":'["2026-12-01"]'})});
  await solapa(o.pg);r=await o.pg.evaluate(()=>({gorro:!!document.querySelector(".t3-ponyta-postura .t3x-gorro-rapi .t3x-gorro"),titulo:document.querySelector(".t3-ponyta-titulo").innerText}));
  chequear("si evolucionó, Rapidash también lleva el gorro",r.gorro&&r.titulo==="Rapidash",r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  console.log("EL CALENDARIO, A PANTALLA COMPLETA (tocando la ventanita de la hoja)");
  o=await abrir(b,base,"2026-12-01",{semilla:{}});
  await o.pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-puerta .t3-adviento-v");if(v)v.scrollIntoView({block:"center"});});await o.pg.waitForTimeout(700);
  r=await o.pg.evaluate(()=>({puerta:!!document.querySelector(".t3-adviento-puerta .t3-adviento-v"),mano:(document.querySelector(".t3-adviento-puerta-mano")||{}).innerText||""}));
  chequear("la hoja del 1/12 tiene la ventanita de hoy para tocar",r.puerta&&/tocala/i.test(r.mano),r);
  await o.pg.evaluate(()=>{window.__tapa={min:1e9,n:0,fin:false};const paso=()=>{const T=window.__tapa;if(T.fin)return;
    const c=document.querySelector(".t3-adviento-escena-fija .t3-adviento-popeando .t3-adviento-cara"),h=document.querySelector(".t3-adviento-escena-fija .t3-adviento-cerrar");
    if(c&&h){const d=c.getBoundingClientRect().top-h.getBoundingClientRect().bottom;T.n++;if(d<T.min)T.min=d;}
    requestAnimationFrame(paso);};requestAnimationFrame(paso);});
  await o.pg.click(".t3-adviento-puerta .t3-adviento-v",{force:true});
  if(await o.pg.evaluate(()=>T3.util.reducido())){
    /* con "reducir movimiento" no hay despliegue a pantalla completa: la ventanita se abre ahí mismo */
    await o.pg.waitForSelector(".t3-adviento-velo",{timeout:8000});
    r=await o.pg.evaluate(()=>{window.__tapa.fin=true;return {fija:!!document.querySelector(".t3-adviento-escena-fija"),velo:!!document.querySelector(".t3-adviento-velo")};});
    chequear("con «reducir movimiento» la ventanita se abre en la hoja, sin el despliegue a pantalla completa",!r.fija&&r.velo,r);
  }else{
    await o.pg.waitForSelector(".t3-adviento-escena-fija",{timeout:8000});
    await o.pg.waitForTimeout(900);await o.pg.screenshot({path:S+"e-adviento-pantalla-gira.jpg"});
    await o.pg.waitForFunction(()=>{const p=document.querySelector(".t3-adviento-escena-fija .t3-adviento-pag");return !!p&&p.classList.contains("t3-adviento-listo");},null,{timeout:15000});
    r=await o.pg.evaluate(()=>{const T=window.__tapa;T.fin=true;return {min:Math.round(T.min),n:T.n};});
    chequear("a pantalla completa, la tapa gira sin pisar el botón de volver ni salirse por arriba",r.n>20&&r.min>=-1,r);
    await o.pg.screenshot({path:S+"e-adviento-pantalla.jpg"});
    await o.pg.click(".t3-adviento-escena-fija .t3-adviento-cerrar",{force:true});
    await o.pg.waitForFunction(()=>!document.querySelector(".t3-adviento-escena-fija"),null,{timeout:8000});
    chequear("y se vuelve al cuaderno",await o.pg.evaluate(()=>!document.querySelector(".t3-adviento-escena-fija")&&!!document.querySelector(".t3-cuaderno-hoja")));
  }
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
