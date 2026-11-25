/* DIAGNÓSTICO (solo en la rama de prueba): el ataque explosivo de Perro de Mierda en este motor, con todo lo que pasa. */
const {servir,abrir,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const lista=await (async()=>{const x=await abrir(b,base,"2026-12-01");const l=await x.pg.evaluate(()=>T3.tcg.CARTAS.map(c=>c.id));await x.ctx.close();return l;})();
  const conPerro=["perro"].concat(lista.filter(id=>id!=="perro").slice(0,9)),sinPerro=lista.filter(id=>id!=="perro").slice(9,19);
  const VARIANTES=[["normal",""],["sin-temblor",".ar-capa.ar-tiembla>.ar{animation:none!important}"],["sin-acercar",".ar-campo{transition:none!important}.ar-campo.ar-acerca{transform:none!important}"],
    ["sin-resplandor",".ar-resplandor{display:none!important}"],["sin-franjas",".ar-franjas{display:none!important}"]];
  for(const rapido of [.5,1]){
  for(const [nombre,css] of VARIANTES){
    const o=await abrir(b,base,"2026-12-05",{semilla:{"pv-t3-set-escritas":'["2026-12-05"]',"pv-t3-set-abrio":'["2026-12-05"]',"pv-t3-vio-indice":"true"}});
    const pg=o.pg;const consola=[];
    pg.on("console",m=>{consola.push(m.type()+": "+m.text().slice(0,300));});
    console.log("\n=== "+nombre+" · rapido "+rapido+" · reducir movimiento: "+await pg.evaluate(()=>T3.util.reducido())+" · "+(await pg.evaluate(()=>navigator.userAgent)).slice(-60));
    if(css)await pg.addStyleTag({content:css});
    const sem=await pg.evaluate(o=>{const P={};T3.tcg.CARTAS.forEach(c=>{P[c.id]=c;});let s=0;for(let k=1;k<=600&&!s;k++){const E=MafiaDuelo.nuevo({cartas:P,tipos:MafiaCarta.TIPOS,mazos:[o.mio,o.suyo],semilla:k,empieza:1});if(E.jug[0].activa&&E.jug[0].activa.id==="perro")s=k;}return s;},{mio:conPerro,suyo:sinPerro});
    await pg.evaluate(o=>{const P=T3.tcg._prueba.opciones;Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,o);window.__son=[];P.alSonar=function(n){window.__son.push(n+"@"+Math.round(performance.now()));};},{semilla:sem,empieza:1,rapido:rapido,mazo:conPerro,mazoRival:sinPerro});
    await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(700);
    await pg.evaluate(()=>{document.querySelector('[data-taller="tcg-duelo"]').scrollIntoView({block:"center"});});await pg.waitForTimeout(200);
    await pg.click('[data-taller="tcg-duelo"]');
    await pg.waitForFunction(()=>document.querySelector('.ar[data-ocupada="0"]'),null,{timeout:60000});
    console.log("  al frente:",await pg.evaluate(()=>{const f=document.querySelector(".ar-ficha.ar-mia.ar-activa");return f&&f.getAttribute("aria-label");}),"· puede atacar:",await pg.locator('[data-ar="atacar"][data-i="0"]:not(.ar-no)').count());
    await pg.evaluate(()=>{
      window.__fps=[];let n=0,t0=performance.now();const f=()=>{n++;const t=performance.now();if(t-t0>=250){window.__fps.push(Math.round(n*1000/(t-t0)));n=0;t0=t;}requestAnimationFrame(f);};requestAnimationFrame(f);
      window.__tl=[];let ult="";const T0=performance.now();window.__T0=T0;
      window.__w=setInterval(()=>{const q=s=>document.querySelector(s);const s=[document.querySelectorAll(".ar-fx .ar-boom").length,q(".ar-franjas")?"F":"-",q(".ar-capa.ar-tiembla")?"T":"-",q(".ar-resplandor")?"R":"-",q(".ar-campo.ar-acerca")?"A":"-",q(".ar-impacto")?"I":"-",q(".ar-golpe")?"G":"-",q(".ar-dano.ar-cero")?"0":"-",q(".ar-cinta")?"C":"-",q('.ar[data-ocupada="0"]')?"libre":"ocup"].join("");if(s!==ult){ult=s;window.__tl.push(Math.round(performance.now()-T0)+":"+s);}},6);
      window.__errores=[];window.addEventListener("error",e=>window.__errores.push(String(e.message)));window.addEventListener("unhandledrejection",e=>window.__errores.push("rechazo: "+String(e.reason&&e.reason.message||e.reason)));
    });
    const t0=Date.now();
    let clicOk="sí";
    try{await pg.locator('[data-ar="atacar"][data-i="0"]').click({timeout:5000});}catch(e){clicOk="NO: "+String(e.message).slice(0,200);}
    console.log("  clic en el ataque:",clicOk,"("+(Date.now()-t0)+" ms)");
    for(const ms of [500,900,1300,2000]){await pg.waitForTimeout(Math.max(0,ms*Math.max(rapido,.5)-(Date.now()-t0)));try{await pg.screenshot({path:S+"diag-"+nombre+"-"+rapido+"-"+ms+".jpg",timeout:8000});}catch(e){console.log("  captura",ms,"falló:",String(e.message).slice(0,120));}}
    await pg.waitForTimeout(Math.max(0,7000-(Date.now()-t0)));
    let r=null;
    try{r=await pg.evaluate(()=>({tl:window.__tl,fps:window.__fps,son:window.__son,log:T3.x.clipLog.slice(),err:window.__errores,T0:Math.round(window.__T0)}));}catch(e){console.log("  la página no responde:",String(e.message).slice(0,200));}
    if(r){console.log("  línea de tiempo (ms:explosiones+marcas):",r.tl.join("  "));console.log("  cuadros por segundo (cada 250 ms):",r.fps.join(" "));console.log("  sonidos:",r.son.join(" "));console.log("  audios:",r.log.join(" "),"· errores en la página:",JSON.stringify(r.err));}
    console.log("  consola:",consola.length?consola.slice(-12).join(" | "):"(nada)","· errores:",JSON.stringify(o.errores));
    await o.ctx.close();
  }}
  await b.close();srv.close();
})().catch(e=>{console.error(e);process.exit(1);});
