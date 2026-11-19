/* Laboratorio · Ponyta se va de vacaciones y vuelve con gorro (T3.viaje) */
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
  chequear("el 1/12 la hoja tiene su dibujo, con gorro, y dice que volvió",r.fecha==="2026-12-01"&&r.dibujo&&r.gorro&&/volví\. traje gorro\./.test(r.frase),r);
  await o.pg.screenshot({path:S+"e-vuelta-hoja.jpg"});
  await o.pg.evaluate(()=>{const p=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible .t3-cuaderno-pony");if(p)p.scrollIntoView({block:"center"});});await o.pg.waitForTimeout(500);
  await o.pg.screenshot({path:S+"e-vuelta-dibujo.jpg"});
  await o.pg.evaluate(()=>{const h=document.querySelector(".t3-cuaderno-hoja.t3-cuaderno-visible");if(h){h.scrollTop=0;}window.scrollTo(0,0);});await o.pg.waitForTimeout(300);
  r=await o.pg.evaluate(()=>({sola:document.querySelector(".t3-ponyta-dije").classList.contains("t3-ponyta-dije-sola")||document.documentElement.classList.contains("t3x-pony-lejos"),gorro:!!document.querySelector(".t3-ponyta-dije .t3x-gorro")}));
  chequear("volvió al señalador, con gorro",!r.sola&&r.gorro,r);
  await solapa(o.pg);await o.pg.waitForTimeout(2600);r=await foto(o.pg);
  chequear("está de nuevo en su solapa, con gorro, y lo dice",!r.ausente&&r.pony&&r.gorro&&r.conGorro&&!r.nota&&!r.apagado&&/volví\. traje gorro\. no me lo saco ni para dormir\./.test(r.globo),r);
  await o.pg.screenshot({path:S+"e-vuelta.jpg"});
  r=await o.pg.evaluate(()=>{const g=document.querySelector(".t3-ponyta-globo").getBoundingClientRect(),h=document.querySelector(".t3-ponyta-postura .t3x-gorro").getBoundingClientRect();return {globoAbajo:Math.round(g.bottom),gorroArriba:Math.round(h.top)};});
  chequear("el globo no pisa el gorro",r.globoAbajo<=r.gorroArriba+1,r);
  await correr(o.pg,"vuelta");r=await foto(o.pg);
  chequear("corre y vuelve como siempre, y suma la herradura",!r.ausente&&r.pony&&r.gorro&&r.dias.includes("2026-12-01")&&r.stats.huellas===3&&r.boton.toUpperCase()==="OTRA VUELTA"&&r.viaje.ida==="2026-11-19",r);
  await o.pg.evaluate(()=>T3.cuaderno.irA("2026-11-15"));await o.pg.waitForTimeout(1800);r=await hoja(o.pg);
  chequear("las hojas de noviembre siguen con su dibujo, sin gorro",r.fecha==="2026-11-15"&&r.dibujo&&!r.gorro,r);
  r=await o.pg.evaluate(()=>[T3.viaje.conGorro("2026-11-30"),T3.viaje.conGorro("2026-12-01"),T3.viaje.conGorro("2027-01-06"),T3.viaje.conGorro("2027-01-07")]);
  chequear("el gorro va del 1/12 a Reyes",r.join()==="false,true,true,false",r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  o=await abrir(b,base,"2026-12-01",{semilla:semilla(["2026-11-18"],1)});
  await solapa(o.pg);await o.pg.waitForTimeout(2600);r=await foto(o.pg);
  chequear("si nunca se fue, el 1/12 igual tiene gorro y dice otra cosa",r.gorro&&/arrancó diciembre\. me puse el gorro\./.test(r.globo)&&r.viaje===null,r);
  await correr(o.pg,"vuelta");r=await foto(o.pg);
  chequear("…y ya no se va",!r.ausente&&r.pony&&r.viaje===null&&!r.nota,r);
  await o.ctx.close();

  o=await abrir(b,base,"2026-12-02",{semilla:Object.assign(semilla(["2026-11-19"],1,"2026-11-19"),{"pv-t3-ponyta-evolucion":'"rapidash"'})});
  await solapa(o.pg);r=await o.pg.evaluate(()=>({gorro:!!document.querySelector(".t3-ponyta-postura .t3x-gorro-rapi .t3x-gorro"),titulo:document.querySelector(".t3-ponyta-titulo").innerText}));
  chequear("si evolucionó, Rapidash también lleva el gorro",r.gorro&&r.titulo==="Rapidash",r);
  chequear("sin errores de JavaScript",o.errores.length===0,o.errores);
  await o.ctx.close();

  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
