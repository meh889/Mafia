/* Laboratorio · ida y vuelta: cartel del 1/12, contestar cartas (con una carta puesta a mano: diciembre no trae y las
   viejas se quemaron el 1/12), la tienda el primer día (sin puntos) y vales.
   La tienda con puntos, la ropa de Ponyta y el modo Pou están en f.cjs. */
const {servir,abrir,chequear,resumen,estado,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  console.log("ANTES DEL ESTRENO (30/11)");
  let {ctx,pg,errores}=await abrir(b,base,"2026-11-30",{semilla:{"pv-t3-set-ganados":'["2026-10-26"]'}});
  let r=await pg.evaluate(async()=>{await T3.cuaderno.irA("2026-10-26");await new Promise(r=>setTimeout(r,900));
    return {pest:Array.from(document.querySelectorAll("[data-pest]")).map(x=>x.getAttribute("data-pest")),contestar:!!document.querySelector(".t3x-contestar"),carta:(document.querySelector(".t3-cuaderno-carta")||{}).textContent};});
  chequear("antes del 1/12 no aparece nada nuevo",!r.pest.includes("pedidos")&&!r.pest.includes("tcg")&&!r.contestar&&/joven/.test(r.carta),r);
  await ctx.close();

  console.log("EL 1/12");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-01",{dpr:2,semilla:{"pv-t3-set-ganados":'["2026-10-26"]',"pv-t3-set-escritas":'["2026-12-01"]',"pv-t3-set-abrio":'["2026-12-01"]'}}));
  await pg.waitForTimeout(600);
  await pg.screenshot({path:S+"b-1201.jpg"});
  r=await pg.evaluate(()=>({cartel:(document.querySelector(".t3x-cartel")||{}).innerText,pest:Array.from(document.querySelectorAll("[data-pest]")).map(x=>x.getAttribute("data-pest"))}));
  chequear("el 1/12 está el cartel de vuelta, que anuncia el TCG y la tienda",/Abierto de nuevo/i.test(r.cartel||"")&&/MafiaTCG/.test(r.cartel||"")&&/tienda, en la pestaña verde/i.test(r.cartel||"")&&!/talonario de pedidos/i.test(r.cartel||""),r.cartel);
  chequear("aparece la pestaña de la tienda",r.pest.includes("pedidos")&&/tienda/i.test(await pg.evaluate(()=>document.querySelector('[data-pest="pedidos"]').innerText)),r.pest);
  /* Contestar: desde la quema del 1/12 no quedan cartas viejas, y diciembre no trae. Se prueba con una carta puesta a mano en
     la hoja de hoy: si algún día vuelve a haber carta, tiene que poder contestarse. */
  await pg.evaluate(()=>{CONFIG.dias["2026-12-01"].mensaje="Estás hecho un joven.";T3.cuaderno.refrescar("2026-12-01");});await pg.waitForTimeout(1100);
  await pg.screenshot({path:S+"b-contestar.jpg"});
  r=await pg.evaluate(()=>{const c=document.querySelector(".t3x-contestar");return c?{t:c.innerText.trim(),vis:getComputedStyle(c).opacity,alto:c.getBoundingClientRect().height}:null;});
  chequear("debajo de una carta aparece «contestarle»",r&&r.t==="contestarle"&&r.vis==="1",r);
  await pg.click(".t3x-contestar");await pg.waitForTimeout(1100);
  await pg.screenshot({path:S+"b-hoja.jpg"});
  r=await pg.evaluate(()=>({nom:(document.querySelector(".t3-cuaderno-suelta-nombre")||{}).textContent,cita:(document.querySelector(".t3x-resp-cita")||{}).innerText,gDes:document.querySelector(".t3x-resp-guardar").disabled,mIna:document.querySelector(".t3x-resp-mandar").classList.contains("t3x-inactivo")}));
  chequear("abre la hoja con la cita de la carta y los botones apagados",r.nom==="Contestarle"&&/joven/.test(r.cita)&&r.gDes&&r.mIna,r);
  await pg.fill(".t3x-resp-texto","Viejo pero mío.\nTe amo más yo.");await pg.waitForTimeout(600);
  r=await pg.evaluate(()=>({href:document.querySelector(".t3x-resp-mandar").href,borr:T3.leer("resp-borrador-2026-12-01","")}));
  chequear("al escribir arma el link de WhatsApp y guarda el borrador",/^https:\/\/wa\.me\/\?text=/.test(r.href)&&decodeURIComponent(r.href).includes("Respuesta a tu carta del 1 de diciembre")&&decodeURIComponent(r.href).includes("Te amo más yo.")&&/Viejo/.test(r.borr),r);
  await pg.click(".t3x-resp-guardar");await pg.waitForTimeout(500);
  await pg.screenshot({path:S+"b-guardada.jpg"});
  await pg.click(".t3-cuaderno-suelta-cerrar");await pg.waitForTimeout(2600);
  await pg.screenshot({path:S+"b-pagina.jpg"});
  r=await pg.evaluate(()=>{const h=document.querySelector(".t3-cuaderno-bloque > .t3-cuaderno-hoja.t3-cuaderno-visible");return {txt:h?h.innerText:"",extra:T3.paginasExtra("2026-12-01"),borr:T3.leer("resp-borrador-2026-12-01",null),n:T3.leer("resp-2026-12-01",0),stat:T3.stats().respuestas};});
  chequear("la respuesta queda como hoja del cuaderno y se muestra",r.extra.length===1&&r.extra[0].autor==="Sofi"&&/Te amo más yo/.test(r.txt)&&/escrito por Sofi/i.test(r.txt)&&r.borr===null&&r.n===1&&r.stat===1,{txt:r.txt.slice(0,160),extra:r.extra,n:r.n});
  await pg.evaluate(()=>T3.cuaderno.irA("2026-12-01"));await pg.waitForTimeout(1100);
  r=await pg.evaluate(()=>document.querySelector(".t3x-contestar").innerText.trim());
  chequear("después dice «contestarle otra vez»",r==="contestarle otra vez",r);

  console.log("LA TIENDA, EL PRIMER DÍA (sin MafiaPoints)");
  await pg.evaluate(()=>T3.cuaderno.abrir("pedidos"));await pg.waitForTimeout(1200);
  await pg.screenshot({path:S+"b-tienda.jpg"});
  r=await pg.evaluate(()=>{const t=Array.from(document.querySelectorAll(".t3x-ticket"));return {n:t.length,titulo:document.querySelector(".t3x-tie h2").innerText,saldo:document.querySelector(".t3x-saldo b").innerText,
    links:t.filter(x=>x.hasAttribute("href")).length,lejos:t.filter(x=>x.classList.contains("t3x-ticket-lejos")).length,precios:t.map(x=>+x.querySelector(".t3x-ticket-talon b").textContent),
    pie:document.querySelector(".t3x-ped-pie").innerText,cosas:document.querySelectorAll(".t3x-cosa").length,viejo:localStorage.getItem("pv-t3-pedidos")};});
  chequear("la pestaña verde es la tienda: diez tickets con precio, ninguno gratis y ninguno al alcance sin puntos",r.n===10&&/la tienda/i.test(r.titulo)&&r.saldo==="0"&&r.links===0&&r.lejos===10&&r.precios.every(p=>p>0)&&/todavía no pediste nada/.test(r.pie)&&r.cosas>=12,r);
  await pg.click('.t3x-ticket[data-id="mimos"]');await pg.waitForTimeout(700);
  r=await pg.evaluate(()=>({hoja:!!document.querySelector(".t3x-compra.t3x-ver"),txt:((document.querySelector(".t3x-compra-papel")||{}).innerText||"").replace(/\s+/g," "),canjear:!!document.querySelector('.t3x-compra [data-tie="pedir"]'),wa:document.querySelectorAll('.t3x-compra a[href*="wa.me"]').length,L:T3.leer("tienda",null)}));
  await pg.screenshot({path:S+"b-sin-puntos.jpg"});
  chequear("sin puntos, el ticket dice cuánto falta y no ofrece canjear ni manda nada",r.hoja&&/te faltan 40/i.test(r.txt)&&!r.canjear&&r.wa===0&&(r.L===null||!r.L.n),r);
  await pg.click('.t3x-compra [data-tie="cerrar"]');await pg.waitForTimeout(400);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("VALE DEL ADVIENTO (2/12)");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-02",{dpr:2}));
  await pg.evaluate(()=>T3.adviento.abrir("2026-12-02"));await pg.waitForTimeout(1800);
  r=await pg.evaluate(()=>({talon:!!document.querySelector(".t3-adviento-vale-talon"),link:!!document.querySelector(".t3x-vale-avisar")}));
  chequear("vale sin canjear: todavía no ofrece avisar",r.talon&&!r.link,r);
  const caja=await pg.locator(".t3-adviento-vale-talon").boundingBox();
  await pg.mouse.move(caja.x+caja.width/2,caja.y+caja.height/2);await pg.mouse.down();await pg.waitForTimeout(950);await pg.mouse.up();
  await pg.waitForTimeout(1400);
  await pg.screenshot({path:S+"b-vale.jpg"});
  r=await pg.evaluate(()=>{const a=document.querySelector(".t3x-vale-avisar");return a?{t:a.innerText,href:decodeURIComponent(a.href)}:null;});
  chequear("al canjear aparece «avisarle a Mati» con el vale en el mensaje",r&&/avisarle a Mati/.test(r.t)&&/Canjeo mi vale Nº 0002 del adviento: mimitos\./.test(r.href),r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
