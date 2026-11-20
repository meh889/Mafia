/* Laboratorio · MafiaTCG: el duelo contra el programador, jugado tocando la pantalla como lo haría ella.
   Duelos enteros, MafiaPoints, salir y seguir después (también tras recargar), rendirse y el tope de duelos con puntos. */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const lista=await (async()=>{const x=await abrir(b,base,"2026-12-01");const l=await x.pg.evaluate(()=>T3.tcg.CARTAS.map(c=>c.id));await x.ctx.close();return l;})();
  const mias=lista.slice(0,12);
  const estado=mas=>{const cartas={};mias.forEach(id=>{cartas[id]={n:1,f:"2026-12-02"};});
    return JSON.stringify(Object.assign({inicio:"2026-12-01",entrega:"2026-12-05",sobres:0,bonos:[],abiertos:6,sinNueva:0,sinFull:0,motivo:"diario",cartas:cartas,mp:40,jugados:2,ganados:1,torpeza:.34},mas||{}));};
  const semilla=mas=>({"pv-t3-set-escritas":'["2026-12-05"]',"pv-t3-set-abrio":'["2026-12-05"]',"pv-t3-vio-indice":"true","pv-t3-tcg2":estado(mas)});
  const libre=pg=>pg.waitForFunction(()=>document.querySelector('.ar[data-ocupada="0"]')||document.querySelector(".ar-final"),null,{timeout:60000});
  const alTcg=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1300);};
  const opciones=(pg,o)=>pg.evaluate(o=>{const P=T3.tcg._prueba.opciones;Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,o);window.__son=[];P.alSonar=function(n){window.__son.push(n);};},o);
  const leer=pg=>pg.evaluate(()=>({e:T3.leer("tcg2"),duelo:!!T3.leer("tcg2-duelo",null),boton:((document.querySelector('.mq-boton[data-tcg="duelo"]')||{}).innerText||"").trim(),
    otro:!!document.querySelector('[data-tcg="duelo-nuevo"]'),puntos:((document.querySelector(".mq-puntos b")||{}).innerText||"").trim(),chico:((document.querySelector(".mq-chico")||{}).innerText||"").trim(),arena:!!document.querySelector(".ar-capa")}));
  /* juega hasta el final con una estrategia simple: bajar cartas, poner la energía, pegar con lo más caro que se pueda */
  async function jugar(pg){
    let vueltas=0,ataques=0,energias=0,bajadas=0,subidas=0;
    for(;;){
      await libre(pg);
      if(await pg.locator(".ar-final").count())break;
      if(++vueltas>500)throw new Error("el duelo no termina");
      if(await pg.locator(".ar.ar-subiendo").count()){await pg.locator(".ar-ficha.ar-mia:not(.ar-activa)").first().click();subidas++;await pg.waitForTimeout(30);continue;}
      if(await pg.locator(".ar-hueco.ar-p-yb0, .ar-hueco.ar-p-yb1").count()&&await pg.locator(".ar-naipe").count()){
        await pg.locator(".ar-naipe").first().click();await pg.locator(".ar-lupa.ar-ver").waitFor();
        await pg.locator(".ar-lupa .ar-boton").first().click();bajadas++;await pg.waitForTimeout(30);continue;
      }
      if(await pg.locator(".ar-energia:not([disabled])").count()){
        if(energias++%2===0){await pg.locator(".ar-energia").click();await pg.locator(".ar.ar-energizando").waitFor();await pg.locator(".ar-ficha.ar-mia.ar-activa").click();}
        else{await pg.locator(".ar-ficha.ar-mia.ar-activa").click();await pg.locator(".ar-lupa.ar-ver").waitFor();await pg.locator(".ar-lupa .ar-boton").first().click();}
        await pg.waitForTimeout(30);continue;
      }
      const at=pg.locator(".ar-ataque:not(.ar-no)");
      if(await at.count()){await at.last().click();ataques++;}else await pg.locator(".ar-pasar").click();
      await pg.waitForTimeout(30);
    }
    await pg.waitForTimeout(250);
    return {vueltas,ataques,energias,bajadas,subidas,gano:/ganaste/i.test(await pg.locator(".ar-final h2").innerText()),
      cuenta:await pg.locator(".ar-cuenta").count(),total:await pg.locator(".ar-total b").count()?parseInt((await pg.locator(".ar-total b").innerText()).replace(/\D+/g,""),10):null,
      tenes:await pg.locator(".ar-f-tenes").count()?parseInt((await pg.locator(".ar-f-tenes").innerText()).replace(/\D+/g,""),10):null,
      nota:await pg.locator(".ar-f-nota").count()?await pg.locator(".ar-f-nota").innerText():"",sub:await pg.locator(".ar-f-sub").innerText(),
      son:await pg.evaluate(()=>{const c={};(window.__son||[]).forEach(n=>{c[n]=(c[n]||0)+1;});return c;})};
  }

  console.log("UN DUELO ENTERO");
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla()});
  await alTcg(pg);
  let r=await leer(pg);
  chequear("con 12 cartas el duelo está habilitado",/A DUELO/i.test(r.boton)&&!r.otro&&/suman puntos tres duelos más/i.test(r.chico)&&/ganaste 1 de 2/i.test(r.chico)&&r.puntos==="40",r);
  await opciones(pg,{semilla:11,empieza:0});
  await pg.click('.mq-boton[data-tcg="duelo"]');
  await pg.locator(".ar-banda-duelo").waitFor({timeout:8000});
  await pg.waitForTimeout(500);await pg.screenshot({path:S+"c3-arranque.jpg"});
  await libre(pg);
  r=await pg.evaluate(()=>{const a=document.querySelector(".ar").getBoundingClientRect(),c=document.querySelector(".ar-capa");
    return {mias:document.querySelectorAll(".ar-ficha.ar-mia").length,suyas:document.querySelectorAll(".ar-ficha.ar-suya").length,mano:document.querySelectorAll(".ar-naipe").length,
      dorsos:document.querySelectorAll(".ar-mano-r .mt-dorso img.mt-logo").length,entra:a.left>=-1&&a.top>=-1&&a.right<=innerWidth+1&&a.bottom<=innerHeight+1&&a.width>300,
      ocupa:c.classList.contains("t3x-ocupa"),energia:document.querySelectorAll(".ar-ficha.ar-mia.ar-activa .ar-en .mt-sello").length,
      primero:document.querySelectorAll(".ar-ataque:not(.ar-no)").length,guardado:!!T3.leer("tcg2-duelo",null),audio:typeof T3.audio==="function",
      minis:Array.from(document.querySelectorAll(".ar-campo .mt-carta img")).every(i=>/\/tcg\/mini\//.test(i.getAttribute("src"))),
      propias:Array.from(document.querySelectorAll(".ar-campo .ar-ficha")).length};});
  chequear("la mesa: tres cartas de cada lado, mano, los dorsos con el logo y todo adentro de la pantalla",r.mias===3&&r.suyas===3&&r.mano>=2&&r.dorsos>=2&&r.entra,r);
  chequear("la del frente arranca con una energía y quien empieza no ataca en el primer turno",r.energia===1&&r.primero===0,r);
  chequear("el duelo se guarda solo y, mientras se juega, la app no se recarga por una publicación",r.guardado&&r.ocupa&&r.audio,r);
  chequear("las cartas de la mesa usan las fotos chicas",r.minis,r);
  await pg.screenshot({path:S+"c3-tu-turno.jpg"});
  // la lupa de una carta mía muestra la foto grande y deja ponerle la energía
  await pg.locator(".ar-ficha.ar-mia.ar-activa").click();await pg.locator(".ar-lupa.ar-ver").waitFor();await pg.waitForTimeout(350);
  r=await pg.evaluate(()=>({grande:!/\/mini\//.test(document.querySelector(".ar-lupa .mt-carta img").getAttribute("src")),botones:Array.from(document.querySelectorAll(".ar-lupa .ar-boton")).map(x=>x.innerText.trim())}));
  chequear("la lupa del duelo muestra la carta con la foto grande y ofrece la energía",r.grande&&/energía/i.test(r.botones[0]||""),r);
  await pg.screenshot({path:S+"c3-lupa.jpg"});
  await pg.locator(".ar-lupa-cerrar").click();await pg.waitForFunction(()=>!document.querySelector(".ar-lupa"));
  // de acá en más, rápido
  await pg.evaluate(()=>{T3.tcg._prueba.opciones.rapido=.03;});
  await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="salir"]').click();await pg.waitForTimeout(700);
  r=await leer(pg);
  chequear("salir del duelo vuelve a la carpeta y ofrece seguirlo",!r.arena&&r.duelo&&/SEGUIR EL DUELO/i.test(r.boton)&&r.otro&&r.e.jugados===2,r);
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  let fin=await jugar(pg);
  await pg.screenshot({path:S+"c3-final.jpg"});
  r=await leer(pg);
  console.log("   "+(fin.gano?"ganó":"perdió")+" en "+fin.vueltas+" jugadas · "+fin.ataques+" ataques · +"+fin.total+" MafiaPoints · sonidos "+JSON.stringify(fin.son));
  chequear("el duelo se juega hasta el final",fin.ataques>=3&&fin.energias>=3&&/noque|sin cartas|tiempo/i.test(fin.sub),fin);
  chequear("da MafiaPoints (20 o más si gana, 5 si pierde) y los suma a los que tenía",fin.cuenta===1&&(fin.gano?fin.total>=20:fin.total===5)&&fin.tenes===40+fin.total&&r.e.mp===40+fin.total,{fin:fin,mp:r.e.mp});
  chequear("anota el duelo y ajusta al rival: si ella gana juega mejor; si pierde, peor",r.e.jugados===3&&r.e.ganados===(fin.gano?2:1)&&(fin.gano?r.e.torpeza<.34:r.e.torpeza>.34)&&r.e.dia==="2026-12-05"&&r.e.diaN===1&&!r.duelo,r.e);
  chequear("suena lo que tiene que sonar",fin.son.ataque>=3&&fin.son.energia>=3&&(fin.son.golpe||0)+(fin.son.debil||0)+(fin.son.golpecito||0)>=3&&fin.son.noqueo>=2&&(fin.son.gana===1)!==(fin.son.pierde===1),fin.son);
  await pg.locator('[data-ar="cerrar"]').click();await pg.waitForTimeout(700);
  r=await leer(pg);
  chequear("al volver, la carpeta muestra los puntos nuevos",!r.arena&&r.puntos===String(40+fin.total)&&/A DUELO/i.test(r.boton)&&/dos duelos más/i.test(r.chico)&&new RegExp("ganaste "+(fin.gano?2:1)+" de 3","i").test(r.chico),r);

  console.log("SALIR, RECARGAR, SEGUIR Y RENDIRSE");
  const mpAntes=r.e.mp;
  await opciones(pg,{semilla:23,empieza:0,rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  await pg.locator(".ar-energia").click();await pg.locator(".ar.ar-energizando").waitFor();await pg.locator(".ar-ficha.ar-mia.ar-activa").click();await libre(pg);
  const antes=await pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");return {turno:d.turno,activa:d.jug[0].activa.id,en:d.jug[0].activa.en,rival:d.jug[1].activa.id};});
  await pg.reload();await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});await pg.waitForTimeout(1800);
  await alTcg(pg);
  r=await leer(pg);
  chequear("un duelo a medias sobrevive a una recarga de la app",r.duelo&&/SEGUIR EL DUELO/i.test(r.boton)&&r.otro,r);
  await opciones(pg,{rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  r=await pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");return {turno:d.turno,activa:d.jug[0].activa.id,en:d.jug[0].activa.en,rival:d.jug[1].activa.id,banda:!!document.querySelector(".ar-banda-duelo"),energiaPuesta:!!document.querySelector(".ar-energia[disabled]")};});
  chequear("sigue donde estaba: mismo turno, mismas cartas, la energía ya puesta",r.turno===antes.turno&&r.activa===antes.activa&&r.en===antes.en&&r.en===2&&r.rival===antes.rival&&r.energiaPuesta,[antes,r]);
  await pg.locator(".ar-pausa").click();
  r=await pg.evaluate(()=>({titulo:document.querySelector(".ar-menu h3").innerText,musica:document.querySelector('[data-ar="musica"]').innerText,efectos:document.querySelector('[data-ar="efectos"]').innerText}));
  chequear("la pausa ofrece música y sonidos",/pausa/i.test(r.titulo)&&/música: sí/i.test(r.musica)&&/sonidos: sí/i.test(r.efectos),r);
  await pg.locator('[data-ar="musica"]').click();await pg.waitForTimeout(150);
  r=await pg.evaluate(()=>({musica:document.querySelector('[data-ar="musica"]').innerText,son:T3.leer("tcg2").son}));
  chequear("apagar la música queda guardado",/música: no/i.test(r.musica)&&r.son.musica===false&&r.son.efectos===true,r);
  await pg.screenshot({path:S+"c3-pausa.jpg"});
  await pg.locator('[data-ar="reglas"]').click();
  chequear("las reglas se pueden leer desde la pausa",await pg.locator(".ar-menu ol li").count()>=6);
  await pg.locator('[data-ar="menu-cerrar"]').click();await pg.locator(".ar-pausa").click();
  await pg.locator('[data-ar="rendirse"]').click();await pg.locator('[data-ar="rendirse-si"]').click();
  await pg.locator(".ar-final").waitFor({timeout:8000});await pg.waitForTimeout(200);
  r=await leer(pg);
  const rend={titulo:await pg.locator(".ar-final h2").innerText(),sub:await pg.locator(".ar-f-sub").innerText(),cuenta:await pg.locator(".ar-cuenta").count()};
  chequear("rendirse: cuenta como duelo perdido, sin puntos y sin gastar uno de los del día",/perdiste/i.test(rend.titulo)&&/rendiste/i.test(rend.sub)&&rend.cuenta===0&&r.e.mp===mpAntes&&r.e.jugados===4&&r.e.diaN===1&&!r.duelo,{rend:rend,e:r.e});
  // revancha desde el final
  await opciones(pg,{semilla:31,empieza:0,rapido:.03});
  await pg.locator('[data-ar="otro"]').click();
  await pg.waitForFunction(()=>!document.querySelector(".ar-final")&&document.querySelector('.ar[data-ocupada="0"]'),null,{timeout:20000});
  r=await pg.evaluate(()=>({turno:T3.leer("tcg2-duelo").turno,arenas:document.querySelectorAll(".ar-capa.ar-ver").length}));
  chequear("«revancha» arranca otro duelo de cero",r.turno<=2&&r.arenas===1,r);
  /* para distinguir un duelo nuevo del que estaba a medias: al que está a medias le pongo la energía (la del frente queda con 2) */
  const ponerEnergia=async()=>{if(await pg.locator(".ar.ar-subiendo").count())return;await pg.locator(".ar-energia").click();await pg.locator(".ar.ar-energizando").waitFor();await pg.locator(".ar-ficha.ar-mia.ar-activa").click();await libre(pg);};
  const delFrente=()=>pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");return {turno:d.turno,en:d.jug[0].activa?d.jug[0].activa.en:-1,usada:!!document.querySelector(".ar-energia[disabled]"),raro:JSON.stringify(d).indexOf("una-que-ya-no-existe")>=0};});
  const salir=async()=>{await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="salir"]').click();await pg.waitForTimeout(700);};
  await ponerEnergia();r=await delFrente();
  chequear("(la energía quedó puesta en el duelo a medias)",r.en===2&&r.usada,r);
  await salir();
  // dejarlo y empezar otro
  await opciones(pg,{semilla:37,empieza:0,rapido:.03});
  await pg.click('[data-tcg="duelo-nuevo"]');await libre(pg);
  r=await delFrente();
  chequear("«dejarlo y empezar otro» descarta el que estaba a medias",r.turno===1&&r.en===1&&!r.usada,r);
  await ponerEnergia();await salir();
  // un duelo guardado con una carta que ya no existe (se cambió la lista) no rompe nada
  await pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");d.jug[0].mazo.push("una-que-ya-no-existe");T3.guardar("tcg2-duelo",d);});
  await opciones(pg,{semilla:41,empieza:0,rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  r=await delFrente();
  chequear("un duelo guardado con una carta que ya no está se descarta y empieza otro",r.turno===1&&r.en===1&&!r.usada&&!r.raro,r);
  await salir();
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL TOPE DE DUELOS CON PUNTOS");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla({dia:"2026-12-05",diaN:3,mp:90})}));
  await alTcg(pg);
  r=await leer(pg);
  chequear("con los duelos del día ya jugados, la carpeta avisa que hoy no suman más",/ya sumaste todo/i.test(r.chico)&&/A DUELO/i.test(r.boton),r.chico);
  await opciones(pg,{semilla:7,empieza:1,rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  fin=await jugar(pg);
  r=await leer(pg);
  chequear("ese duelo se juega igual, pero no da puntos y lo dice",fin.cuenta===0&&/mañana hay más/i.test(fin.nota)&&r.e.mp===90&&r.e.jugados===3&&r.e.diaN===3,{fin:fin,e:r.e});
  await pg.screenshot({path:S+"c3-sin-puntos.jpg"});
  await pg.locator('[data-ar="cerrar"]').click();await pg.waitForTimeout(600);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("AL DÍA SIGUIENTE");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-06",{semilla:Object.assign(semilla({dia:"2026-12-05",diaN:3,mp:90}),{"pv-t3-set-escritas":'["2026-12-06"]',"pv-t3-set-abrio":'["2026-12-06"]'})}));
  await alTcg(pg);
  r=await leer(pg);
  chequear("al otro día vuelven a sumar tres duelos",/tres duelos más/i.test(r.chico),r.chico);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL DUELO DE PRUEBA DEL TALLER");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:{"pv-t3-set-escritas":'["2026-12-05"]',"pv-t3-set-abrio":'["2026-12-05"]',"pv-t3-vio-indice":"true"}}));   /* sin ninguna carta */
  await opciones(pg,{semilla:5,empieza:0,rapido:.03});
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(700);
  await pg.evaluate(()=>{document.querySelector('[data-taller="tcg-duelo"]').scrollIntoView({block:"center"});});await pg.waitForTimeout(200);
  await pg.click('[data-taller="tcg-duelo"]');
  await libre(pg);
  r=await pg.evaluate(()=>({panel:!!document.querySelector(".t3-maquina-capa"),mias:document.querySelectorAll(".ar-ficha.ar-mia").length,suyas:document.querySelectorAll(".ar-ficha.ar-suya").length,guardado:!!T3.leer("tcg2-duelo",null),estado:T3.leer("tcg2",null)}));
  chequear("desde el taller se abre un duelo sin tener ninguna carta, y la máquina se cierra",!r.panel&&r.mias===3&&r.suyas===3&&!r.guardado&&r.estado===null,r);
  await pg.locator(".ar-pausa").click();
  chequear("como no se guarda, en la pausa dice «salir» a secas",/^salir$/i.test((await pg.locator('[data-ar="salir"]').innerText()).trim()));
  await pg.locator('[data-ar="menu-cerrar"]').click();
  fin=await jugar(pg);
  r=await pg.evaluate(()=>({estado:T3.leer("tcg2",null),guardado:!!T3.leer("tcg2-duelo",null),stats:T3.stats()["tcg-duelos"]||0}));
  chequear("el duelo de prueba se juega entero, avisa que no suma y no deja nada guardado",fin.ataques>=3&&fin.cuenta===0&&/duelo de prueba/i.test(fin.nota)&&r.estado===null&&!r.guardado&&r.stats===0,{fin:fin,r:r});
  await pg.screenshot({path:S+"c3-prueba-final.jpg"});
  await pg.locator('[data-ar="otro"]').click();
  await pg.waitForFunction(()=>!document.querySelector(".ar-final")&&document.querySelector('.ar[data-ocupada="0"]'),null,{timeout:20000});
  chequear("«otro duelo» arma otro de prueba",await pg.evaluate(()=>document.querySelectorAll(".ar-capa.ar-ver").length===1&&T3.leer("tcg2",null)===null));
  await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="salir"]').click();await pg.waitForTimeout(700);
  chequear("y se sale sin dejar rastro",await pg.evaluate(()=>!document.querySelector(".ar-capa")&&T3.leer("tcg2-duelo",null)===null&&T3.leer("tcg2",null)===null));
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
