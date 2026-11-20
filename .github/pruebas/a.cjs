/* Laboratorio · actualización sola, respaldo, taller y sonido de victoria */
const {servir,abrir,chequear,resumen,estado,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const T0=Date.UTC(2026,10,16,15,0,0);

  console.log("ACTUALIZACIÓN");
  estado.lmDoc=T0;estado.lmHead=T0;
  let {ctx,pg,errores}=await abrir(b,base,"2026-11-16");
  let navs=0;pg.on("framenavigated",f=>{if(f===pg.mainFrame())navs++;});
  let i=await pg.evaluate(()=>({info:T3.actualizar.info(),g:T3.leer("version-vista",0),doc:T3.actualizar._prueba.docMs()}));
  chequear("al arrancar pregunta y queda al día",i.info.estado==="al-dia"&&i.g===T0,i);
  chequear("reconoce que lo cargado es lo publicado",i.info.fresco===true,i.info);
  // versión nueva publicada
  estado.lmDoc=T0+60000;estado.lmHead=T0+60000;
  await pg.evaluate(()=>{T3.actualizar.chequear(true);});
  await pg.waitForTimeout(3600);
  i=await pg.evaluate(()=>({url:location.href,info:T3.actualizar.info(),g:T3.leer("version-vista",0),hoy:T3.hoy,cuaderno:!!document.querySelector(".t3-cuaderno-hoja")}));
  chequear("con versión nueva recarga una sola vez",navs===1,navs);
  chequear("la URL lleva el sello de versión y conserva la fecha",/[?&]v=\d+/.test(i.url)&&/fecha=2026-11-16/.test(i.url),i.url);
  chequear("después queda al día y el cuaderno sigue",i.info.estado==="al-dia"&&i.g===T0+60000&&i.cuaderno,i);
  // el servidor dice que hay algo más nuevo pero sigue entregando lo viejo (caché tercero): no debe quedar en bucle
  estado.lmHead=T0+180000;navs=0;
  await pg.evaluate(()=>{T3.actualizar.chequear(true);});
  await pg.waitForTimeout(4200);
  await pg.evaluate(()=>{T3.actualizar.chequear(true);});
  await pg.waitForTimeout(2500);
  chequear("si el servidor entrega lo viejo, recarga una vez y no entra en bucle",navs===1,navs);
  // con un juego abierto no corta: espera al cierre
  estado.lmDoc=T0+400000;estado.lmHead=T0+400000;navs=0;
  await pg.evaluate(()=>{T3.cuaderno.jugar({tipo:"trivia",pregunta:"¿?",opciones:["a","b"],respuesta:1,acierto:"ok",error:"no"});});
  await pg.waitForTimeout(900);
  await pg.evaluate(()=>{T3.actualizar.chequear(true);});
  await pg.waitForTimeout(1800);
  i=await pg.evaluate(()=>({pend:T3.actualizar.pendiente(),suelta:!!document.querySelector(".t3-cuaderno-suelta")}));
  chequear("con un juego abierto no recarga y deja la versión pendiente",navs===0&&i.pend===T0+400000&&i.suelta,{navs,i});
  await pg.evaluate(()=>T3.cuaderno.cerrarSuelta());
  await pg.waitForTimeout(3200);
  i=await pg.evaluate(()=>({info:T3.actualizar.info(),url:location.href}));
  chequear("al cerrar el juego entra la versión nueva",navs===1&&i.info.estado==="al-dia"&&i.info.servidor===T0+400000&&i.url.includes("v="+Math.round((T0+400000)/1000)),{navs,i});
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("RESPALDO");
  estado.lmDoc=T0;estado.lmHead=T0;
  ({ctx,pg,errores}=await abrir(b,base,"2026-11-16",{semilla:{"pv-t3-set-ganados":'["2026-10-05","2026-10-06"]',"pv-t3-stats":'{"ganados":2}',"pv-stk-2026-08-01":"⭐","otra-app":"no tocar"}}));
  let r=await pg.evaluate(async()=>{
    const codigo=await T3.respaldo.exportar();const o=await T3.respaldo.leer(codigo);const res=T3.respaldo.resumen(o);
    const antes=T3.respaldo.claves().length;
    T3.guardar("set-ganados",["2026-11-01"]);localStorage.setItem("pv-nueva","x");
    const n=await T3.respaldo.restaurar(o);
    const tras={ganados:T3.conjunto("ganados"),nueva:localStorage.getItem("pv-nueva"),otra:localStorage.getItem("otra-app"),stk:localStorage.getItem("pv-stk-2026-08-01")};
    const des=!!T3.respaldo.hayDeshacer();
    await T3.respaldo.deshacer();
    const vuelta={ganados:T3.conjunto("ganados"),nueva:localStorage.getItem("pv-nueva")};
    let malo="";try{await T3.respaldo.leer("MAFIA1:esto no es");}catch(e){malo=e.message;}
    let ajeno="";try{await T3.respaldo.leer("hola");}catch(e){ajeno=e.message;}
    /* los avisos y la versión vista son de cada celular */
    const eran={a:localStorage.getItem("pv-t3-avisos"),v:localStorage.getItem("pv-t3-version-vista")};
    T3.guardar("avisos",{activo:true,codigo:"MAFIAPUSH1:este-celular"});T3.guardar("version-vista",123);
    const o2=await T3.respaldo.leer(await T3.respaldo.exportar());
    const viaja=Object.keys(o2.datos).filter(k=>/avisos|version-vista/.test(k));
    o2.datos["pv-t3-avisos"]=JSON.stringify({activo:true,codigo:"MAFIAPUSH1:otro-celular"});
    await T3.respaldo.restaurar(o2);
    const propio={avisos:T3.leer("avisos",null),version:T3.leer("version-vista",null),ganados:T3.conjunto("ganados")};
    [["pv-t3-avisos",eran.a],["pv-t3-version-vista",eran.v]].forEach(([k,v])=>{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);});
    return {prefijo:codigo.slice(0,7),largo:codigo.length,res,antes,n,tras,des,vuelta,malo,ajeno,viaja,propio};
  });
  chequear("el respaldo se comprime y se puede volver a leer",r.prefijo==="MAFIA1:"&&r.res.ganados===2,r);
  chequear("restaurar pisa lo que había y no toca claves ajenas",r.tras.ganados.length===2&&r.tras.nueva===null&&r.tras.otra==="no tocar"&&r.tras.stk==="⭐",r.tras);
  chequear("deshacer devuelve lo que había antes",r.des&&r.vuelta.ganados.join()==="2026-11-01"&&r.vuelta.nueva==="x",r.vuelta);
  chequear("rechaza códigos rotos o ajenos",!!r.malo&&r.ajeno==="formato",[r.malo,r.ajeno]);
  chequear("lo que es de este celular (avisos, versión vista) no viaja ni se pisa",r.viaja.length===0&&r.propio.avisos&&r.propio.avisos.codigo==="MAFIAPUSH1:este-celular"&&r.propio.version===123&&r.propio.ganados.join()==="2026-11-01",{viaja:r.viaja,propio:r.propio});

  console.log("TALLER");
  await pg.evaluate(()=>T3.maquina.abrir());
  await pg.waitForTimeout(900);
  let t=await pg.evaluate(()=>{const x=document.querySelector(".t3x-taller");if(!x)return null;x.scrollIntoView({block:"center"});return {txt:x.innerText,botones:Array.from(x.querySelectorAll("[data-taller]")).map(b=>b.getAttribute("data-taller"))};});
  chequear("el taller aparece en la máquina del tiempo",!!t&&/TALLER/.test(t.txt)&&t.botones.includes("guardar")&&t.botones.includes("restaurar"),t);
  await pg.waitForTimeout(600);
  await pg.screenshot({path:S+"taller.jpg"});
  const codigo=await pg.evaluate(()=>T3.respaldo.exportar());
  await pg.click('[data-taller="restaurar"]');
  await pg.fill(".t3x-taller-txt",codigo);
  await pg.click('[data-taller="revisar"]');
  await pg.waitForTimeout(500);
  t=await pg.evaluate(()=>{const x=document.querySelector(".t3x-taller-ok");x.scrollIntoView({block:"center"});return x.innerText;});
  chequear("al revisar muestra qué trae el respaldo",/juegos? ganados?/.test(t)&&/restaurar y pisar/.test(t),t);
  await pg.waitForTimeout(300);
  await pg.screenshot({path:S+"taller-restaurar.jpg"});
  await pg.evaluate(()=>{T3.guardar("set-ganados",["2026-01-01","x","y"]);});
  await pg.click('[data-taller="pisar"]');
  await pg.waitForTimeout(2600);
  t=await pg.evaluate(()=>({g:T3.conjunto("ganados"),cuaderno:!!document.querySelector(".t3-cuaderno-hoja")}));
  chequear("restaurar desde el taller pisa y recarga",t.g.length===1&&t.g[0]==="2026-11-01"&&t.cuaderno,t);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA MÁQUINA DEL TIEMPO");
  {
    /* sin ?fecha=: se entra a la máquina y se viaja como lo hace Mati */
    const c2=await b.newContext({viewport:{width:390,height:844},locale:"es-AR",timezoneId:"America/Argentina/Buenos_Aires",hasTouch:true,isMobile:true});
    await c2.addInitScript(()=>{try{if(!sessionStorage.getItem("__s")){sessionStorage.setItem("__s","1");localStorage.setItem("pv-t3-inaugurado",'"2026-10-01"');localStorage.setItem("pv-t3-set-ganados",'["2026-11-01"]');}}catch(e){}});
    const p=await c2.newPage(),err=[];p.on("pageerror",e=>err.push(String(e&&e.message||e)));
    await p.route("**/*",x=>{const u=x.request().url();return u.startsWith(base)?x.continue():x.abort();});
    const listo=async()=>{await p.waitForFunction(()=>window.T3&&(document.querySelector(".t3-cuaderno-hoja")||document.querySelector(".t3-cuaderno-evento")),null,{timeout:15000});await p.waitForTimeout(1200);};
    const viajar=async(f,cero)=>{await p.evaluate(()=>T3.maquina.abrir());await p.waitForTimeout(400);
      await Promise.all([p.waitForNavigation({waitUntil:"load"}),p.evaluate(([f,cero])=>{const c=T3.maquina._capa();c.sel.limpio=!!cero;c.ponerFecha(f);c.viajar();},[f,cero])]);await listo();};
    const ver=()=>p.evaluate(()=>({hoy:T3.hoy,maquina:!!T3.preview,marca:(T3.leer("prueba-maquina",null)||{}).n||0,ganados:T3.conjunto("ganados").join()}));
    const marcar=n=>p.evaluate(n=>{T3.guardar("prueba-maquina",{n:n});T3.agregar("ganados",T3.hoy);},n);
    await p.goto(base+"/",{waitUntil:"load"});await listo();
    await viajar("2026-12-10");let v=await ver();
    chequear("viajar lleva a ese día, con lo que hay en el celular",v.hoy==="2026-12-10"&&v.maquina&&v.marca===0&&v.ganados==="2026-11-01",v);
    await marcar(1);
    await viajar("2026-12-12");v=await ver();
    chequear("viajando hacia adelante, lo hecho en la máquina sigue",v.hoy==="2026-12-12"&&v.marca===1&&v.ganados==="2026-11-01,2026-12-10",v);
    await viajar("2026-12-12");v=await ver();
    chequear("volver a viajar al mismo día tampoco lo borra",v.marca===1,v);
    t=await p.evaluate(()=>{T3.maquina.abrir();const x=document.querySelector(".t3x-taller");return {botones:Array.from(x.querySelectorAll("[data-taller]")).map(b=>b.getAttribute("data-taller")),nota:(x.querySelector(".t3x-taller-nota")||{}).innerText||"",cartas:(x.querySelector('[data-detalle="cartas"]')||{}).innerText||""};});
    chequear("en la máquina, el taller ofrece el duelo de prueba y todas las cartas, y explica cómo viajar",t.botones.includes("tcg-duelo")&&t.botones.includes("tcg-todas")&&/hacia adelante/.test(t.nota)&&/en este viaje, 0 de \d+/.test(t.cartas),t);
    await p.click('[data-taller="tcg-todas"]');await p.waitForTimeout(300);
    t=await p.evaluate(()=>({tengo:Object.keys(T3.leer("tcg2").cartas).length,total:T3.tcg.CARTAS.length,msj:document.querySelector(".t3x-taller-msj").innerText,sigue:!!document.querySelector('[data-taller="tcg-todas"]')}));
    chequear("«darme todas» llena la carpeta de ese viaje",t.tengo===t.total&&/tenés todas/.test(t.msj)&&!t.sigue,t);
    await p.evaluate(()=>T3.maquina.cerrar(true));
    await viajar("2026-12-11");v=await ver();
    chequear("viajando hacia atrás arranca limpio",v.hoy==="2026-12-11"&&v.marca===0&&v.ganados==="2026-11-01"&&await p.evaluate(()=>T3.leer("tcg2",null)===null),v);
    await marcar(2);
    await viajar("2026-12-13",true);v=await ver();
    chequear("«de cero» arranca limpio y sin lo del celular",v.marca===0&&v.ganados==="",v);
    await marcar(3);
    await viajar("2026-12-14",true);v=await ver();
    chequear("«de cero» hacia adelante también conserva lo hecho",v.marca===3&&v.ganados==="2026-12-13",v);
    await viajar("2026-12-14",true);v=await ver();
    chequear("«de cero» al mismo día vuelve a empezar",v.marca===0&&v.ganados==="",v);
    await marcar(4);
    await Promise.all([p.waitForNavigation({waitUntil:"load"}),p.evaluate(()=>{T3.maquina.volverAHoy();})]);await listo();
    v=await ver();
    t=await p.evaluate(()=>{T3.maquina.abrir();const x=document.querySelector(".t3x-taller");return Array.from(x.querySelectorAll("[data-taller]")).map(b=>b.getAttribute("data-taller"));});
    chequear("al salir de la máquina no queda nada de lo hecho adentro",!v.maquina&&v.marca===0&&v.ganados==="2026-11-01"&&await p.evaluate(()=>T3.leer("tcg2",null)===null),v);
    chequear("fuera de la máquina el taller ofrece el duelo de prueba, pero no regalar cartas",t.includes("tcg-duelo")&&!t.includes("tcg-todas"),t);
    chequear("sin errores de JavaScript",err.length===0,err);
    await c2.close();
  }

  console.log("SONIDO DE VICTORIA");
  estado.pedidos.length=0;
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-01"));
  await pg.mouse.click(200,700);
  await pg.waitForTimeout(900);
  const pidio=estado.pedidos.filter(p=>/win\.wav/.test(p));
  chequear("después del primer toque baja audios/win.wav",pidio.length===1&&/audios\/win\.wav/.test(pidio[0]),pidio);
  await pg.evaluate(()=>{T3.cuaderno.jugar(CONFIG.dias[T3.hoy].actividad);});
  await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{let e="";try{window.celebrar();}catch(x){e=String(x);}return {e,gano:T3.tiene("ganados",T3.hoy),sello:!!document.querySelector(".t3-cuaderno-suelta .t3-cuaderno-gano, .t3-cuaderno-suelta.t3-cuaderno-gano")};});
  chequear("ganar un juego anota la victoria sin romper nada",!r.e&&r.gano&&r.sello,r);
  chequear("no vuelve a pedir win.wav por la ruta vieja",estado.pedidos.filter(p=>/win\.wav/.test(p)).length===1,estado.pedidos.filter(p=>/wav/.test(p)));
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
