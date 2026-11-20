/* Laboratorio · MafiaTCG: las cartas, los sobres y la carpeta (reglas, simulación y flujo completo) */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  console.log("LAS CARTAS");
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-01");
  let r=await pg.evaluate(()=>{
    const C=T3.tcg.CARTAS,TIPOS=MafiaCarta.TIPOS,EF=MafiaDuelo.EFECTOS,out={};
    out.total=C.length;out.ids=new Set(C.map(c=>c.id)).size;
    out.numeradas=C.map(c=>c.num).join()===C.map((c,i)=>String(i+1).padStart(2,"0")).join();
    out.formatos=C.reduce((a,c)=>(a[c.formato]=(a[c.formato]||0)+1,a),{});
    out.malas=C.filter(c=>!c.nombre||!TIPOS[c.tipo]||!(c.vidas>0)||c.vidas%10||!Array.isArray(c.ataques)||c.ataques.length<1||c.ataques.length>2||
      !/\.(jpe?g|png|webp)$/.test(c.foto||"")||(c.formato!=="normal"&&c.formato!=="full")||(c.formato==="full"&&!(c.rel>0))).map(c=>c.id);
    out.ataquesMalos=[];
    C.forEach(c=>c.ataques.forEach(a=>{
      const ef=a.ef||{},claves=Object.keys(ef).concat(ef.moneda?Object.keys(ef.moneda).filter(k=>k!=="mas"):[]);
      if(!a.nombre||!(a.costo>=1&&a.costo<=3)||!(a.dano>=0)||a.dano%10||claves.some(k=>EF.indexOf(k)<0))out.ataquesMalos.push(c.id+"/"+a.nombre);
      try{MafiaDuelo.texto(a);}catch(e){out.ataquesMalos.push(c.id+"/"+a.nombre+" (texto)");}
    }));
    const tipos=Object.keys(TIPOS);
    out.rueda=tipos.every(t=>TIPOS[TIPOS[t].debil]&&TIPOS[t].debil!==t)&&new Set(tipos.map(t=>TIPOS[t].debil)).size===tipos.length;
    const perro=C.find(c=>c.id==="perro");out.perro=perro?perro.ataques.map(a=>a.dano):null;
    out.sinDano=C.filter(c=>c.ataques.every(a=>!a.dano)).map(c=>c.id);
    out.minimo=T3.tcg._prueba.MINIMO;
    return out;
  });
  chequear("hay cartas de sobra para jugar, con ids únicos y numeradas en orden",r.total>=20&&r.ids===r.total&&r.numeradas&&r.formatos.normal>=r.minimo&&r.formatos.full>=3,r);
  chequear("todas tienen nombre, tipo, vidas, foto, formato y uno o dos ataques",r.malas.length===0,r.malas);
  chequear("todos los ataques tienen costo de 1 a 3, daño de a 10 y efectos que el duelo conoce",r.ataquesMalos.length===0,r.ataquesMalos);
  chequear("los tipos forman una rueda: cada uno es débil a otro distinto",r.rueda);
  chequear("«Perro de Mierda» pega 0 (lo pidió Mati) y es la única carta que no lastima",!!r.perro&&r.perro.every(d=>d===0)&&r.sinDano.join()==="perro",[r.perro,r.sinDano]);

  console.log("LOS SOBRES");
  r=await pg.evaluate(()=>{
    const P=T3.tcg._prueba,C=T3.tcg.CARTAS,porId={};C.forEach(c=>porId[c.id]=c);
    const out={};
    // primer día
    let e=P.estado();out.hayAntes=T3.tcg.haySobre();
    P.ponerAlDia(e);out.dia1={sobres:e.sobres,motivo:e.motivo,inicio:e.inicio};
    const t1=P.tirar(e);out.primero={formatos:t1.map(x=>porId[x.id].formato).join(),nuevas:t1.every(x=>x.nueva),sobres:e.sobres,abiertos:e.abiertos};
    // el tercer lugar del sobre, y que no repita adentro
    let full=0,repetido=0,malo=0,N=4000;
    for(let i=0;i<N;i++){
      const x={cartas:{},bonos:[],sobres:1,abiertos:3,sinNueva:0,sinFull:0};const t=P.tirar(x);
      if(new Set(t.map(y=>y.id)).size<3)repetido++;
      if(porId[t[2].id].formato==="full")full++;
      if(porId[t[0].id].formato!=="normal"||porId[t[1].id].formato!=="normal")malo++;
    }
    out.tercero=+(full/N).toFixed(3);out.repetido=repetido;out.malo=malo;
    // sequía: tres sobres sin full art → el que sigue trae una
    let seq=0;for(let i=0;i<300;i++){const x={cartas:{},bonos:[],sobres:1,abiertos:9,sinNueva:0,sinFull:3};const t=P.tirar(x);if(porId[t[2].id].formato==="full"&&x.sinFull===0)seq++;}
    out.sequia=seq;
    // piedad: dos sobres sin nada nuevo → el que sigue trae una que falta (una normal, si le falta alguna)
    const normales=C.filter(c=>c.formato==="normal"),fulls=C.filter(c=>c.formato==="full"),falta=normales[normales.length-1].id;
    const casi={cartas:{},bonos:[],sobres:1,abiertos:9,sinNueva:2,sinFull:0};normales.forEach(c=>{if(c.id!==falta)casi.cartas[c.id]={n:1,f:"2026-12-01"};});
    const tp=P.tirar(JSON.parse(JSON.stringify(casi)),()=>0.5);
    out.piedad={tercera:tp[2].id,falta:falta,nueva:tp[2].nueva};
    const soloFull={cartas:{},bonos:[],sobres:1,abiertos:9,sinNueva:2,sinFull:0};normales.forEach(c=>{soloFull.cartas[c.id]={n:1,f:"2026-12-01"};});
    const tf=P.tirar(JSON.parse(JSON.stringify(soloFull)),()=>0.5);
    out.piedadFull={formato:porId[tf[2].id].formato,nueva:tf[2].nueva};
    const sinPiedad=JSON.parse(JSON.stringify(casi));sinPiedad.sinNueva=0;
    const ts=P.tirar(sinPiedad,()=>0.5);out.sinPiedad={nuevas:ts.filter(y=>y.nueva).length,sinNueva:sinPiedad.sinNueva};
    // repetidas y canje (una carta que ya no existe en la lista no cuenta)
    const ids=C.map(c=>c.id);
    const z={cartas:{},bonos:[],sobres:0,abiertos:5,sinNueva:0,sinFull:0};z.cartas[ids[0]]={n:4,f:"x"};z.cartas[ids[1]]={n:4,f:"x"};z.cartas[ids[2]]={n:1,f:"x"};z.cartas["una-que-ya-no-existe"]={n:5,f:"x"};
    out.repes=P.repes(z);out.tengo=P.tengo(z);out.canje=P.canjear(z);out.trasCanje={sobres:z.sobres,repes:P.repes(z),a:z.cartas[ids[0]].n,b:z.cartas[ids[1]].n};out.canje2=P.canjear(z);
    // días siguientes y tope
    const d={inicio:"2026-12-01",entrega:"2026-12-01",sobres:0,bonos:[],cartas:{},abiertos:2};
    const hoy=T3.hoy;T3.hoy="2026-12-02";P.ponerAlDia(d);out.dia2=d.sobres;T3.hoy="2026-12-09";P.ponerAlDia(d);out.dia9=d.sobres;
    T3.guardar("set-ganados",["2026-11-10","2026-12-03","2026-12-09"]);P.ponerAlDia(d);out.conBonos={sobres:d.sobres,bonos:d.bonos.slice()};P.ponerAlDia(d);out.sinDobleBono=d.sobres;
    T3.hoy=hoy;T3.guardar("set-ganados",[]);
    // el álbum se completa
    const lleno={cartas:{},bonos:[],sobres:1,abiertos:40,sinNueva:0,sinFull:0};C.slice(1).forEach(c=>{lleno.cartas[c.id]={n:1,f:"x"};});
    let k=0;while(P.tengo(lleno)<P.TOTAL&&k++<60){lleno.sobres=1;P.tirar(lleno);}
    out.completo={sobres:k,fecha:lleno.completo};
    return out;
  });
  chequear("el primer día hay 2 sobres de bienvenida",r.hayAntes&&r.dia1.sobres===2&&r.dia1.motivo==="bienvenida",r.dia1);
  chequear("el primer sobre trae dos normales y una full art, todas nuevas",r.primero.formatos==="normal,normal,full"&&r.primero.nuevas&&r.primero.sobres===1&&r.primero.abiertos===1,r.primero);
  chequear("la tercera carta sale full art ~30% de las veces; las otras dos, siempre normales",Math.abs(r.tercero-.30)<.035&&r.malo===0,[r.tercero,r.malo]);
  chequear("nunca repite una carta dentro del mismo sobre",r.repetido===0,r.repetido);
  chequear("tras 3 sobres sin full art, el siguiente trae una",r.sequia===300,r.sequia);
  chequear("tras 2 sobres sin nada nuevo garantiza una que falta (la normal, antes que una full art)",r.piedad.tercera===r.piedad.falta&&r.piedad.nueva&&r.piedadFull.formato==="full"&&r.piedadFull.nueva&&r.sinPiedad.nuevas===0&&r.sinPiedad.sinNueva===1,[r.piedad,r.piedadFull,r.sinPiedad]);
  chequear("6 repetidas se canjean por un sobre",r.repes===6&&r.tengo===3&&r.canje===true&&r.trasCanje.sobres===1&&r.trasCanje.repes===0&&r.trasCanje.a===1&&r.trasCanje.b===1&&r.canje2===false,r);
  chequear("un sobre por día, se juntan hasta 3",r.dia2===1&&r.dia9===3,[r.dia2,r.dia9]);
  chequear("sobre extra por cada juego ganado desde el estreno, una sola vez",r.conBonos.sobres===5&&r.conBonos.bonos.join()==="2026-12-03,2026-12-09"&&r.sinDobleBono===5,r.conBonos);
  chequear("la última carta que falta termina saliendo y el álbum queda completo",r.completo.sobres<=3&&r.completo.fecha==="2026-12-01",r.completo);

  console.log("SIMULACIÓN (un sobre por día + extra por juego 6 de cada 7 días)");
  const sim=await pg.evaluate(()=>{
    const P=T3.tcg._prueba;const res=[];
    for(let k=0;k<400;k++){
      const e={cartas:{},bonos:[],sobres:0,abiertos:0,sinNueva:0,sinFull:0};let dia=0,jugar=0,fin=0,sobres=0;
      while(!fin&&dia<600){dia++;let n=(dia===1?2:1)+(dia%7?1:0);
        while(n-->0){e.sobres=1;P.tirar(e);sobres++;while(P.repes(e)>=6){P.canjear(e);P.tirar(e);sobres++;}
          const t=P.tengo(e);if(!jugar&&t>=P.MINIMO)jugar=dia;if(t>=P.TOTAL){fin=dia;break;}}}
      res.push({jugar,fin,sobres});
    }
    const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(a.length/2)];},p90=a=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(a.length*.9)];};
    return {total:P.TOTAL,diaJugar:med(res.map(x=>x.jugar)),diaJugar90:p90(res.map(x=>x.jugar)),diasFin:med(res.map(x=>x.fin)),diasFin90:p90(res.map(x=>x.fin)),sobresFin:med(res.map(x=>x.sobres)),sinTerminar:res.filter(x=>!x.fin).length};
  });
  console.log("   mediana: puede jugar el día",sim.diaJugar,"(90% antes del día "+sim.diaJugar90+") · álbum de",sim.total,"completo al día",sim.diasFin,"(90% antes del día",sim.diasFin90+") ·",sim.sobresFin,"sobres");
  chequear("llega a las 10 cartas para jugar en los primeros días",sim.diaJugar>=2&&sim.diaJugar<=3&&sim.diaJugar90<=4,sim);
  chequear("el álbum se completa en un plazo razonable (ni en una semana ni en meses)",sim.sinTerminar===0&&sim.diasFin>=sim.total/5&&sim.diasFin<=sim.total*1.5&&sim.diasFin90<=sim.total*2.5,sim);
  await ctx.close();

  console.log("EN LA PÁGINA");
  const ids=await (async()=>{const x=await abrir(b,base,"2026-12-01");const l=await x.pg.evaluate(()=>T3.tcg.CARTAS.map(c=>({id:c.id,f:c.formato})));await x.ctx.close();return l;})();
  const normales=ids.filter(c=>c.f==="normal").map(c=>c.id),total=ids.length;
  const cartas={};normales.slice(0,8).forEach((id,i)=>{cartas[id]={n:i<3?3:1,f:"2026-12-0"+(1+i%2)};});      /* 8 cartas, 6 repetidas */
  cartas["una-que-ya-no-existe"]={n:2,f:"2026-12-01"};
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-03",{dpr:2,semilla:{"pv-t3-set-escritas":'["2026-12-03"]',"pv-t3-set-abrio":'["2026-12-03"]',"pv-t3-vio-indice":"true",
    "pv-t3-tcg2":JSON.stringify({inicio:"2026-12-01",entrega:"2026-12-03",sobres:1,bonos:[],abiertos:4,sinNueva:0,sinFull:1,motivo:"diario",cartas:cartas})}}));
  /* azar fijo, para que la prueba dé siempre lo mismo */
  await pg.evaluate(()=>{let s=20261203;Math.random=function(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};});
  r=await pg.evaluate(()=>({punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre")}));
  chequear("la pestaña marca que hay sobre",r.punto,r);
  await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1300);
  await pg.screenshot({path:S+"c-pagina2.jpg"});
  const leer=()=>pg.evaluate(()=>{const q=s=>document.querySelector(s),tx=s=>(q(s)||{}).innerText||"";
    return {hay:tx(".t3x-tcg-hay"),repes:tx(".t3x-tcg-repes"),tenes:tx(".mq-tenes"),puntos:tx(".mq-puntos"),rotulo:tx(".mq-rotulo"),jugar:tx(".mq-jugar"),
      diez:document.querySelectorAll(".mq-diez i").length,si:document.querySelectorAll(".mq-diez i.mq-si").length,boton:!!q('.mq-boton[data-tcg="duelo"]'),
      minis:document.querySelectorAll(".t3x-mini:not(.t3x-hueco)").length,huecos:document.querySelectorAll(".t3x-hueco").length,e:T3.leer("tcg2")};});
  r=await leer();
  chequear("muestra sobres, repetidas, avance y puntos",/Hay un sobre/.test(r.hay)&&/6 repetidas/.test(r.repes)&&/canjear/.test(r.repes)&&new RegExp("TENÉS 8 DE "+total,"i").test(r.tenes)&&/^\s*M?\s*0\s*MAFIAPOINTS/i.test(r.puntos)&&r.minis===8&&r.huecos===total-8,r);
  chequear("con 8 cartas el duelo está cerrado: dice cuántas faltan y no hay botón",/todavía no/i.test(r.rotulo)&&/necesitás 10 cartas/i.test(r.jugar)&&/te faltan 2/i.test(r.jugar)&&r.diez===10&&r.si===8&&!r.boton,{rotulo:r.rotulo,jugar:r.jugar,diez:r.diez,si:r.si});
  await pg.click('[data-tcg="canjear"]',{force:true});await pg.waitForTimeout(500);
  r=await leer();
  chequear("canjear repetidas suma un sobre y lo guarda",/Hay 2 sobres/.test(r.hay)&&!/canjear/.test(r.repes)&&r.e.sobres===2&&r.e.canjes===1,{hay:r.hay,repes:r.repes});
  // abrir los dos sobres hasta quedarse sin
  for(let k=0;k<2;k++){
    await pg.click(".t3x-tcg-abrir",{force:true});await pg.waitForTimeout(800);
    await pg.click(".t3x-ap-sobre",{force:true});await pg.waitForTimeout(1700);
    for(const i of [0,1,2]){await pg.click('.t3x-ap-carta[data-i="'+i+'"]',{force:true});await pg.waitForTimeout(1300);await pg.mouse.click(195,790);await pg.waitForTimeout(700);}
    if(k===0)await pg.screenshot({path:S+"c-fin2.jpg"});
    await pg.click(".t3x-ap-listo",{force:true});await pg.waitForTimeout(900);
  }
  const avisoDuelo=await pg.evaluate(()=>(document.querySelector(".t3-cuaderno-aviso")||{}).textContent||"");
  await pg.evaluate(()=>document.querySelector(".t3-cuaderno-especial-host").scrollTo(0,0));await pg.waitForTimeout(300);
  await pg.screenshot({path:S+"c-sinsobres.jpg"});
  r=await leer();
  const extra=await pg.evaluate(()=>({stat:T3.stats()["tcg-sobres"],punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre"),capa:!!document.querySelector(".t3x-apertura")}));
  const totalCartas=Object.keys(r.e.cartas).filter(id=>id!=="una-que-ya-no-existe").reduce((a,id)=>a+r.e.cartas[id].n,0);
  chequear("al abrir descuenta sobres, suma cartas y avisa que mañana hay otro",/Mañana hay otro/.test(r.hay)&&/ganá el juego de hoy/.test(r.hay)&&r.e.sobres===0&&r.e.abiertos===6&&totalCartas===14&&extra.stat===2&&!extra.punto&&!extra.capa,{hay:r.hay,sobres:r.e.sobres,abiertos:r.e.abiertos,totalCartas});
  chequear("al llegar a 10 cartas se habilita el duelo y avisa",r.minis>=10&&r.boton&&/contra el programador/i.test(r.rotulo)&&r.diez===0&&/habilitó el duelo/.test(avisoDuelo),{minis:r.minis,boton:r.boton,rotulo:r.rotulo,aviso:avisoDuelo});
  // ganar el juego del día → sobre extra
  await pg.evaluate(()=>T3.cuaderno.irA("2026-12-03"));await pg.waitForTimeout(1000);
  await pg.evaluate(()=>{T3.cuaderno.jugar(CONFIG.dias[T3.hoy].actividad);});await pg.waitForTimeout(900);
  await pg.evaluate(()=>window.celebrar());await pg.waitForTimeout(3200);
  r=await pg.evaluate(()=>({punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre"),aviso:document.querySelector(".t3-cuaderno-aviso").textContent}));
  chequear("ganar el juego del día avisa y marca un sobre extra",r.punto&&/sobre de MafiaTCG/.test(r.aviso),r);
  await pg.evaluate(()=>T3.cuaderno.cerrarSuelta());await pg.waitForTimeout(900);
  await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1300);
  r=await leer();
  chequear("el sobre extra aparece en la carpeta",/Hay un sobre/.test(r.hay)&&/por ganar el juego/.test(r.hay)&&r.e.bonos.join()==="2026-12-03",r.hay);
  await pg.reload();await pg.waitForTimeout(2500);
  r=await pg.evaluate(()=>{const e=T3.leer("tcg2");return {abiertos:e.abiertos,sobres:e.sobres,n:Object.keys(e.cartas).length};});
  chequear("todo queda guardado al recargar",r.abiertos===6&&r.sobres===1&&r.n>=10,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
