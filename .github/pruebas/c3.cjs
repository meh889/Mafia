/* Laboratorio · MafiaTCG: el duelo contra el programador, jugado tocando la pantalla como lo haría ella.
   Duelos enteros, MafiaPoints (10 por ganar, 0 por perder), salir y seguir después (también tras recargar), rendirse
   el tope de 2 duelos por día (el duelo se cuenta cuando arranca) y el ataque explosivo de Perro de Mierda. */
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
    otro:!!document.querySelector('[data-tcg="duelo-nuevo"]'),manana:((document.querySelector(".mq-manana")||{}).innerText||"").trim(),puntos:((document.querySelector(".mq-puntos b")||{}).innerText||"").trim(),chico:((document.querySelector(".mq-chico")||{}).innerText||"").trim(),arena:!!document.querySelector(".ar-capa")}));
  /* para las pruebas que necesitan arrancar varios duelos: deja en n los que ya se jugaron hoy y vuelve a pintar la pestaña */
  const jugadosHoy=async(pg,n)=>{await pg.evaluate(n=>{const P=T3.tcg._prueba,e=P.estado();e.dia=T3.hoy;e.diaN=n;P.guardar(e);P.repintar();},n);await pg.waitForTimeout(150);};
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
      nota:await pg.locator(".ar-f-nota").count()?await pg.locator(".ar-f-nota").innerText():"",sub:await pg.locator(".ar-f-sub").innerText(),otro:await pg.locator('.ar-final [data-ar="otro"]').count(),
      son:await pg.evaluate(()=>{const c={};(window.__son||[]).forEach(n=>{c[n]=(c[n]||0)+1;});return c;})};
  }

  console.log("UN DUELO ENTERO");
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla()});
  await alTcg(pg);
  let r=await leer(pg);
  chequear("con 12 cartas el duelo está habilitado y dice que hoy quedan dos",/A DUELO/i.test(r.boton)&&!r.otro&&/hoy te quedan dos duelos/i.test(r.chico)&&/ganaste 1 de 2/i.test(r.chico)&&r.puntos==="40",r);
  chequear("el panel dice lo que vale ganar",/Cada victoria, 10 MafiaPoints/i.test(await pg.locator(".mq-jugar").innerText()));
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
  chequear("salir del duelo vuelve a la carpeta y ofrece seguirlo; el duelo ya gastó uno de los dos del día",!r.arena&&r.duelo&&/SEGUIR EL DUELO/i.test(r.boton)&&r.otro&&r.e.jugados===2&&r.e.diaN===1&&/hoy te queda un duelo/i.test(r.chico),r);
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  let fin=await jugar(pg);
  await pg.screenshot({path:S+"c3-final.jpg"});
  r=await leer(pg);
  console.log("   "+(fin.gano?"ganó":"perdió")+" en "+fin.vueltas+" jugadas · "+fin.ataques+" ataques · +"+fin.total+" MafiaPoints · sonidos "+JSON.stringify(fin.son));
  chequear("el duelo se juega hasta el final",fin.ataques>=3&&fin.energias>=3&&/noque|sin cartas|tiempo/i.test(fin.sub),fin);
  const gano1=fin.gano?10:0;
  chequear("ganar da 10 MafiaPoints y perder no da nada",fin.gano?(fin.cuenta===1&&fin.total===10&&fin.tenes===50&&r.e.mp===50):(fin.cuenta===0&&r.e.mp===40),{fin:fin,mp:r.e.mp});
  chequear("como queda otro duelo hoy, el final ofrece jugarlo",fin.otro===1&&!fin.nota,{otro:fin.otro,nota:fin.nota});
  chequear("anota el duelo y ajusta al rival: si ella gana juega mejor; si pierde, peor",r.e.jugados===3&&r.e.ganados===(fin.gano?2:1)&&(fin.gano?r.e.torpeza<.34:r.e.torpeza>.34)&&r.e.dia==="2026-12-05"&&r.e.diaN===1&&!r.duelo,r.e);
  chequear("suena lo que tiene que sonar",fin.son.ataque>=3&&fin.son.energia>=3&&(fin.son.golpe||0)+(fin.son.debil||0)+(fin.son.golpecito||0)>=3&&fin.son.noqueo>=2&&(fin.son.gana===1)!==(fin.son.pierde===1),fin.son);
  await pg.locator('[data-ar="cerrar"]').click();await pg.waitForTimeout(700);
  r=await leer(pg);
  chequear("al volver, la carpeta muestra los puntos y que queda un duelo",!r.arena&&r.puntos===String(40+gano1)&&/A DUELO/i.test(r.boton)&&/hoy te queda un duelo/i.test(r.chico)&&new RegExp("ganaste "+(fin.gano?2:1)+" de 3","i").test(r.chico),r);

  console.log("SALIR, RECARGAR, SEGUIR Y RENDIRSE");
  const mpAntes=r.e.mp;
  await opciones(pg,{semilla:23,empieza:0,rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  await pg.locator(".ar-energia").click();await pg.locator(".ar.ar-energizando").waitFor();await pg.locator(".ar-ficha.ar-mia.ar-activa").click();await libre(pg);
  const antes=await pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");return {turno:d.turno,activa:d.jug[0].activa.id,en:d.jug[0].activa.en,rival:d.jug[1].activa.id};});
  await pg.reload();await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});await pg.waitForTimeout(1800);
  await alTcg(pg);
  r=await leer(pg);
  chequear("un duelo a medias sobrevive a una recarga de la app; como es el último del día, no ofrece dejarlo por otro",r.duelo&&/SEGUIR EL DUELO/i.test(r.boton)&&!r.otro&&r.e.diaN===2&&/es el último de hoy/i.test(r.chico),r);
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
  await pg.locator('[data-ar="rendirse"]').click();
  chequear("al rendirse avisa que el duelo cuenta igual",/cuenta como uno de los de hoy/i.test(await pg.locator(".ar-menu").innerText()));
  await pg.locator('[data-ar="rendirse-si"]').click();
  await pg.locator(".ar-final").waitFor({timeout:8000});await pg.waitForTimeout(200);
  r=await leer(pg);
  const rend={titulo:await pg.locator(".ar-final h2").innerText(),sub:await pg.locator(".ar-f-sub").innerText(),cuenta:await pg.locator(".ar-cuenta").count(),
    otro:await pg.locator('.ar-final [data-ar="otro"]').count(),nota:await pg.locator(".ar-f-nota").count()?await pg.locator(".ar-f-nota").innerText():""};
  chequear("rendirse: cuenta como duelo perdido, sin puntos, y el duelo del día queda gastado",/perdiste/i.test(rend.titulo)&&/rendiste/i.test(rend.sub)&&rend.cuenta===0&&r.e.mp===mpAntes&&r.e.jugados===4&&r.e.diaN===2&&!r.duelo,{rend:rend,e:r.e});
  chequear("era el último del día: el final lo dice y no ofrece revancha",rend.otro===0&&/último duelo de hoy/i.test(rend.nota)&&/mañana hay más/i.test(rend.nota),rend);
  await pg.screenshot({path:S+"c3-ultimo.jpg"});
  await pg.locator('[data-ar="cerrar"]').click();await pg.waitForTimeout(700);
  r=await leer(pg);
  chequear("con los dos duelos jugados, la carpeta no deja arrancar otro hasta mañana",!r.arena&&!r.boton&&!r.otro&&/por hoy ya está/i.test(r.manana)&&/mañana hay más/i.test(r.manana)&&/dos duelos por día/i.test(r.chico),r);
  await pg.screenshot({path:S+"c3-manana.jpg"});
  chequear("y por adentro tampoco: no se puede gastar un duelo que no queda",await pg.evaluate(()=>{const P=T3.tcg._prueba,e=P.estado();return P.quedanDuelos(e)===0&&P.arrancarDuelo(e)===false&&e.diaN===2;}));

  console.log("REVANCHA, DEJARLO POR OTRO Y UN DUELO GUARDADO QUE YA NO SIRVE");
  // (para estas pruebas se le devuelven duelos del día)
  await jugadosHoy(pg,0);
  await opciones(pg,{semilla:29,empieza:0,rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="rendirse"]').click();await pg.locator('[data-ar="rendirse-si"]').click();
  await pg.locator(".ar-final").waitFor({timeout:8000});await pg.waitForTimeout(200);
  chequear("si queda otro duelo, rendirse ofrece revancha",await pg.locator('.ar-final [data-ar="otro"]').count()===1&&/revancha/i.test(await pg.locator('.ar-final [data-ar="otro"]').innerText()));
  // revancha desde el final
  await opciones(pg,{semilla:31,empieza:0,rapido:.03});
  await pg.locator('[data-ar="otro"]').click();
  await pg.waitForFunction(()=>!document.querySelector(".ar-final")&&document.querySelector('.ar[data-ocupada="0"]'),null,{timeout:20000});
  r=await pg.evaluate(()=>({turno:T3.leer("tcg2-duelo").turno,arenas:document.querySelectorAll(".ar-capa.ar-ver").length,diaN:T3.leer("tcg2").diaN}));
  chequear("«revancha» arranca otro duelo de cero, que gasta el segundo del día",r.turno<=2&&r.arenas===1&&r.diaN===2,r);
  /* para distinguir un duelo nuevo del que estaba a medias: al que está a medias le pongo la energía (la del frente queda con 2) */
  const ponerEnergia=async()=>{if(await pg.locator(".ar.ar-subiendo").count())return;await pg.locator(".ar-energia").click();await pg.locator(".ar.ar-energizando").waitFor();await pg.locator(".ar-ficha.ar-mia.ar-activa").click();await libre(pg);};
  const delFrente=()=>pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");return {turno:d.turno,en:d.jug[0].activa?d.jug[0].activa.en:-1,usada:!!document.querySelector(".ar-energia[disabled]"),raro:JSON.stringify(d).indexOf("una-que-ya-no-existe")>=0};});
  const salir=async()=>{await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="salir"]').click();await pg.waitForTimeout(700);};
  await ponerEnergia();r=await delFrente();
  chequear("(la energía quedó puesta en el duelo a medias)",r.en===2&&r.usada,r);
  await salir();
  chequear("sin duelos para hoy no ofrece dejarlo por otro",!(await leer(pg)).otro);
  // dejarlo y empezar otro
  await jugadosHoy(pg,1);
  await opciones(pg,{semilla:37,empieza:0,rapido:.03});
  await pg.click('[data-tcg="duelo-nuevo"]');await libre(pg);
  r=await delFrente();
  chequear("«dejarlo y empezar otro» descarta el que estaba a medias y gasta otro duelo",r.turno===1&&r.en===1&&!r.usada&&await pg.evaluate(()=>T3.leer("tcg2").diaN===2),r);
  await ponerEnergia();await salir();
  await jugadosHoy(pg,1);
  // un duelo guardado con una carta que ya no existe (se cambió la lista) no rompe nada
  await pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");d.jug[0].mazo.push("una-que-ya-no-existe");T3.guardar("tcg2-duelo",d);});
  await opciones(pg,{semilla:41,empieza:0,rapido:.03});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  r=await delFrente();
  chequear("un duelo guardado con una carta que ya no está se descarta y empieza otro",r.turno===1&&r.en===1&&!r.usada&&!r.raro,r);
  await salir();
  // lo mismo, pero sin duelos para hoy: se descarta y no arranca nada
  await pg.evaluate(()=>{const d=T3.leer("tcg2-duelo");d.jug[0].mazo.push("una-que-ya-no-existe");T3.guardar("tcg2-duelo",d);});
  await pg.click('.mq-boton[data-tcg="duelo"]');await pg.waitForTimeout(600);
  r=await leer(pg);
  chequear("y si no quedan duelos, se descarta y no arranca otro",!r.arena&&!r.duelo&&!r.boton&&/por hoy ya está/i.test(r.manana),r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL ÚLTIMO DUELO DEL DÍA, JUGADO HASTA EL FINAL");
  /* con un rival torpe, los dos mazos fijos y esta semilla, el duelo sale siempre igual y la estrategia de la prueba gana:
     así se ve también la pantalla de la victoria (sin fijar los mazos se barajan al azar y el resultado cambia) */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla({dia:"2026-12-05",diaN:1,mp:90,torpeza:.6})}));
  await alTcg(pg);
  r=await leer(pg);
  chequear("con un duelo ya jugado hoy, la carpeta dice que queda uno",/A DUELO/i.test(r.boton)&&/hoy te queda un duelo/i.test(r.chico),r.chico);
  await opciones(pg,{semilla:5,empieza:0,rapido:.03,mazo:mias.slice(0,10),mazoRival:mias.slice(2,12)});
  await pg.click('.mq-boton[data-tcg="duelo"]');await libre(pg);
  fin=await jugar(pg);
  r=await leer(pg);
  console.log("   "+(fin.gano?"ganó":"perdió")+" en "+fin.vueltas+" jugadas · +"+fin.total+" MafiaPoints");
  chequear("el último duelo del día da sus puntos, lo avisa y no ofrece otro",(fin.gano?(fin.cuenta===1&&fin.total===10&&r.e.mp===100):(fin.cuenta===0&&r.e.mp===90))&&fin.otro===0&&/último duelo de hoy/i.test(fin.nota)&&r.e.jugados===3&&r.e.diaN===2,{fin:fin,e:r.e});
  chequear("esta vez gana: la victoria muestra +10 y cuántos tiene ahora (100)",fin.gano&&fin.total===10&&fin.tenes===100&&await pg.locator(".ar-cuenta > div").count()===1,{gano:fin.gano,total:fin.total,tenes:fin.tenes});
  await pg.screenshot({path:S+"c3-ultimo-final.jpg"});
  await pg.locator('[data-ar="cerrar"]').click();await pg.waitForTimeout(600);
  r=await leer(pg);
  chequear("después, la carpeta queda cerrada hasta mañana",!r.boton&&/por hoy ya está/i.test(r.manana),r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("AL DÍA SIGUIENTE");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-06",{semilla:Object.assign(semilla({dia:"2026-12-05",diaN:2,mp:90}),{"pv-t3-set-escritas":'["2026-12-06"]',"pv-t3-set-abrio":'["2026-12-06"]'})}));
  await alTcg(pg);
  r=await leer(pg);
  chequear("al otro día vuelve a haber dos duelos",/A DUELO/i.test(r.boton)&&/hoy te quedan dos duelos/i.test(r.chico),r.chico);
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

  console.log("EL ATAQUE DE PERRO DE MIERDA (LA EXPLOSIÓN)");
  /* pedido de Mati: cuando ataca Perro de Mierda, un edit entero con explosiones y el sonido que mandó, para terminar pegando 0.
     Se arma un duelo de prueba donde ella tiene al perro al frente y empieza el programador: en su primer turno ya puede atacar. */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:{"pv-t3-set-escritas":'["2026-12-05"]',"pv-t3-set-abrio":'["2026-12-05"]',"pv-t3-vio-indice":"true"}}));
  const conPerro=["perro"].concat(lista.filter(id=>id!=="perro").slice(0,9)),sinPerro=lista.filter(id=>id!=="perro").slice(9,19);
  r=await pg.evaluate(o=>{const P={};T3.tcg.CARTAS.forEach(c=>{P[c.id]=c;});const a=P.perro.ataques[0];
    let s=0;for(let k=1;k<=600&&!s;k++){const E=MafiaDuelo.nuevo({cartas:P,tipos:MafiaCarta.TIPOS,mazos:[o.mio,o.suyo],semilla:k,empieza:1});if(E.jug[0].activa&&E.jug[0].activa.id==="perro")s=k;}
    return {semilla:s,dano:a.dano,fx:a.fx,nombre:P.perro.nombre};},{mio:conPerro,suyo:sinPerro});
  chequear("la carta sigue pegando 0, y su ataque es el explosivo",r.nombre==="Perro de Mierda"&&r.dano===0&&r.fx==="explosion"&&r.semilla>0,r);
  const fsx=require("fs"),px=require("path"),raizRepo=px.resolve(__dirname,"..","..");
  chequear("el sonido y la tira de la explosión están en el repo",fsx.existsSync(px.join(raizRepo,"audios/explosion.mp3"))&&fsx.existsSync(px.join(raizRepo,"fotos/t3/tcg/explosion.webp")));
  await opciones(pg,{semilla:r.semilla,empieza:1,rapido:.5,mazo:conPerro,mazoRival:sinPerro});
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(700);
  await pg.evaluate(()=>{document.querySelector('[data-taller="tcg-duelo"]').scrollIntoView({block:"center"});});await pg.waitForTimeout(200);
  await pg.click('[data-taller="tcg-duelo"]');
  await libre(pg);
  r=await pg.evaluate(()=>{const f=document.querySelector(".ar-ficha.ar-mia.ar-activa"),v=document.querySelector(".ar-ficha.ar-suya.ar-activa .ar-stat b");
    return {frente:f?f.getAttribute("aria-label"):"",ataque:(document.querySelector('[data-ar="atacar"][data-i="0"]')||{}).innerText||"",puede:!!document.querySelector('[data-ar="atacar"][data-i="0"]:not(.ar-no)'),vidas:v?v.textContent:""};});
  chequear("al frente está Perro de Mierda y puede atacar con Hiperactividad",/Perro de Mierda/.test(r.frente)&&/Hiperactividad/i.test(r.ataque)&&r.puede,r);
  const vidasAntes=r.vidas;
  /* con "reducir movimiento" (así corre el WebKit del laboratorio) la app no sacude ni destella: muestra una sola explosión, quieta */
  const menos=await pg.evaluate(()=>T3.util.reducido());
  console.log("   reducir movimiento: "+(menos?"sí (una sola explosión, sin sacudones)":"no (el edit entero)"));
  /* lo del edit dura poco: un ojo en la página anota todo lo que llega a verse */
  const ojo=()=>pg.evaluate(()=>{window.__boom={max:0,franjas:false,tiembla:false,frito:false,acerca:false,impacto:false,cero:""};clearInterval(window.__ojo);
    window.__ojo=setInterval(()=>{const B=window.__boom;B.max=Math.max(B.max,document.querySelectorAll(".ar-fx .ar-boom").length);
      B.franjas=B.franjas||!!document.querySelector(".ar-franjas");B.tiembla=B.tiembla||!!document.querySelector(".ar-capa.ar-tiembla");B.frito=B.frito||!!document.querySelector(".ar.ar-frito");
      B.acerca=B.acerca||!!document.querySelector(".ar-campo.ar-acerca");B.impacto=B.impacto||!!document.querySelector(".ar-impacto");
      const c=document.querySelector(".ar-dano.ar-cero");if(c)B.cero=c.textContent;},8);});
  await ojo();
  await pg.locator('[data-ar="atacar"][data-i="0"]').click();
  await pg.waitForFunction(n=>window.__boom.max>=n,menos?1:3,{timeout:10000});
  await pg.screenshot({path:S+"c3-explosion.jpg"});
  await pg.waitForFunction(()=>!!window.__boom.cero,null,{timeout:10000});
  await pg.screenshot({path:S+"c3-explosion-cero.jpg"});
  await pg.waitForFunction(()=>!document.querySelector(".ar-capa.ar-tiembla,.ar.ar-frito,.ar-campo.ar-acerca"),null,{timeout:10000});
  r=await pg.evaluate(async()=>{clearInterval(window.__ojo);
    const tira=await new Promise(ok=>{const i=new Image();i.onload=()=>ok([i.naturalWidth,i.naturalHeight]);i.onerror=()=>ok(null);i.src=T3.util.asset("tcg/explosion.webp");});
    const v=document.querySelector(".ar-ficha.ar-suya.ar-activa .ar-stat b");
    return {B:window.__boom,cero:window.__boom.cero,vidas:v?v.textContent:"",tira,son:(window.__son||[]).slice(),log:T3.x.clipLog.slice(),
      quedo:!!document.querySelector(".ar-capa.ar-tiembla,.ar.ar-frito,.ar-campo.ar-acerca")};});
  if(menos)chequear("con «reducir movimiento» el ataque se muestra con una explosión sola, sin franjas, sacudones ni destello",r.B.max>=1&&!r.B.franjas&&!r.B.acerca&&!r.B.impacto&&!r.B.tiembla&&!r.B.frito,r.B);
  else chequear("el ataque se muestra con el edit: franjas, acercamiento, impacto, temblor y varias explosiones a la vez",r.B.franjas&&r.B.acerca&&r.B.impacto&&r.B.tiembla&&r.B.frito&&r.B.max>=3,r.B);
  chequear("la tira de la explosión carga (20 cuadros en fila)",!!r.tira&&r.tira[0]===r.tira[1]*20,r.tira);
  chequear("suena la explosión que mandó Mati (la app la pide; en Chromium, además, suena)",r.son.indexOf("clip:explosion")>=0&&r.log.indexOf("pide:explosion")>=0&&((process.env.MOTOR||"chromium")!=="chromium"||r.log.indexOf("suena:explosion")>=0),{son:r.son,log:r.log});
  chequear("y después de todo eso pega 0: aparece el «−0», la rival queda con las mismas vidas y la mesa vuelve a su lugar",r.cero==="−0"&&r.vidas===vidasAntes&&!r.quedo,{cero:r.cero,vidas:r.vidas,antes:vidasAntes,quedo:r.quedo});
  await libre(pg);
  r=await pg.evaluate(()=>({son:(window.__son||[]).slice(),fx:document.querySelectorAll(".ar-fx .ar-boom,.ar-fx .ar-franjas,.ar-fx .ar-impacto,.ar-fx .ar-negativo").length}));
  chequear("el duelo sigue como siempre (la rival pierde una energía) y no queda nada del edit en pantalla",r.son.indexOf("quita")>r.son.indexOf("clip:explosion")&&r.fx===0,r);
  /* con «Sonidos: no» en la pausa, el edit se ve pero el audio no se pide */
  await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="efectos"]').click();await pg.locator('[data-ar="menu-cerrar"]').click();
  r=await pg.evaluate(()=>({antes:T3.x.clipLog.filter(x=>x==="pide:explosion").length}));
  let otra=false;
  for(let k=0;k<40&&!otra;k++){
    await libre(pg);
    if(await pg.locator(".ar-final").count())break;
    if(await pg.locator(".ar.ar-subiendo").count()){await pg.locator(".ar-ficha.ar-mia:not(.ar-activa)").first().click();continue;}
    const esPerro=/Perro de Mierda/.test(await pg.locator(".ar-ficha.ar-mia.ar-activa").getAttribute("aria-label")||"");
    const at=pg.locator('[data-ar="atacar"]:not(.ar-no)');
    if(esPerro&&await at.count()){await ojo();await at.first().click();await pg.waitForFunction(()=>!!window.__boom.cero,null,{timeout:10000});otra=true;break;}
    if(await pg.locator(".ar-energia:not([disabled])").count()){await pg.locator(".ar-energia").click();await pg.locator(".ar.ar-energizando").waitFor();await pg.locator(".ar-ficha.ar-mia.ar-activa").click();continue;}
    await pg.locator(".ar-pasar").click();
  }
  r.despues=await pg.evaluate(()=>T3.x.clipLog.filter(x=>x==="pide:explosion").length);
  chequear("con los sonidos del duelo apagados, la explosión se ve pero no suena",otra&&r.despues===r.antes,{otra:otra,antes:r.antes,despues:r.despues});
  await libre(pg);
  await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="salir"]').click();await pg.waitForTimeout(600);
  /* el atajo del taller: «la explosión» arma solo ese duelo (los mazos al azar, con el perro al frente) */
  await opciones(pg,{rapido:.5});
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(700);
  await pg.evaluate(()=>{document.querySelector('[data-taller="tcg-explosion"]').scrollIntoView({block:"center"});});await pg.waitForTimeout(200);
  await pg.click('[data-taller="tcg-explosion"]');
  await libre(pg);
  r=await pg.evaluate(()=>{const f=document.querySelector(".ar-ficha.ar-mia.ar-activa");
    return {panel:!!document.querySelector(".t3-maquina-capa"),frente:f?f.getAttribute("aria-label"):"",puede:!!document.querySelector('[data-ar="atacar"][data-i="0"]:not(.ar-no)'),turno:(document.querySelector(".ar-turno-n")||{}).innerText||"",guardado:!!T3.leer("tcg2-duelo",null)};});
  chequear("«la explosión», en el taller, abre un duelo de prueba con Perro de Mierda al frente y listo para atacar",!r.panel&&/Perro de Mierda/.test(r.frente)&&r.puede&&!r.guardado,r);
  await ojo();
  await pg.locator('[data-ar="atacar"][data-i="0"]').click();
  await pg.waitForFunction(()=>!!window.__boom.cero,null,{timeout:10000});
  chequear("y ahí también termina en «−0»",await pg.evaluate(()=>window.__boom.cero)==="−0");
  await libre(pg);
  await pg.locator(".ar-pausa").click();await pg.locator('[data-ar="salir"]').click();await pg.waitForTimeout(600);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
