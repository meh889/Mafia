/* Laboratorio · MafiaTCG, reglas, simulación y flujo completo */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  console.log("REGLAS");
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-01");
  let r=await pg.evaluate(()=>{
    const P=T3.tcg._prueba,C=T3.tcg.CARTAS,porId={};C.forEach(c=>porId[c.id]=c);
    const out={};
    out.total=C.length;out.ids=new Set(C.map(c=>c.id)).size;
    out.rarezas=C.reduce((a,c)=>(a[c.r]=(a[c.r]||0)+1,a),{});
    out.secretasAlFinal=C.slice(-2).every(c=>c.r==="s")&&C.slice(0,-2).every(c=>c.r!=="s");
    out.fotos=C.filter(c=>c.foto).length;out.dibSin=C.filter(c=>!c.foto&&c.dib!=="mf"&&!T3.x.DIB[c.dib]).map(c=>c.id);
    // primer día
    let e=P.estado();out.hayAntes=T3.tcg.haySobre();
    P.ponerAlDia(e);out.dia1={sobres:e.sobres,motivo:e.motivo,inicio:e.inicio};
    const t1=P.tirar(e);out.primero={ids:t1.map(x=>x.id),nuevas:t1.every(x=>x.nueva),r:[porId[t1[0].id].r,porId[t1[1].id].r],sobres:e.sobres,abiertos:e.abiertos};
    // distribución de rarezas del tercer lugar y que no repita dentro del sobre
    let cuenta={},repetidoAdentro=0,N=4000;
    for(let i=0;i<N;i++){const x={cartas:{},bonos:[],sobres:1,abiertos:3,sinNueva:0};const t=P.tirar(x);if(new Set(t.map(y=>y.id)).size<3)repetidoAdentro++;const rr=porId[t[2].id].r;cuenta[rr]=(cuenta[rr]||0)+1;if(porId[t[0].id].r!=="c")cuenta.malo=(cuenta.malo||0)+1;}
    out.tercero=Object.fromEntries(Object.entries(cuenta).map(([k,v])=>[k,+(v/N).toFixed(3)]));out.repetidoAdentro=repetidoAdentro;
    // piedad
    const lleno={cartas:{},bonos:[],sobres:1,abiertos:9,sinNueva:3,sinBrillo:0};C.filter(c=>c.r==="c"||c.r==="p").forEach(c=>lleno.cartas[c.id]={n:1,f:"2026-12-01"});
    let piedad=0,rara=0;for(let i=0;i<300;i++){const x=JSON.parse(JSON.stringify(lleno));const t=P.tirar(x,()=>0.3);if(t.some(y=>y.nueva))piedad++;if(porId[t[2].id].r==="r")rara++;}
    out.piedad=piedad;out.piedadRara=rara;
    C.filter(c=>c.r==="r").forEach(c=>lleno.cartas[c.id]={n:1,f:"2026-12-01"});
    let regalo=0;for(let i=0;i<300;i++){const x=JSON.parse(JSON.stringify(lleno));const t=P.tirar(x,()=>0.3);if(t.some(y=>y.nueva))regalo++;}
    out.piedadNoRegalaBrillantes=regalo;
    let seq=0;for(let i=0;i<300;i++){const x={cartas:{},bonos:[],sobres:1,abiertos:20,sinNueva:0,sinBrillo:10};const t=P.tirar(x);if("hs".includes(porId[t[2].id].r)&&x.sinBrillo===0)seq++;}
    out.sequia=seq;
    // repes y canje
    const z={cartas:{a:{n:1},cabina:{n:4,f:"x"},bean:{n:4,f:"x"},tower:{n:1,f:"x"}},bonos:[],sobres:0,abiertos:5,sinNueva:0};
    out.repes=P.repes(z);out.canje=P.canjear(z);out.trasCanje={sobres:z.sobres,repes:P.repes(z),cabina:z.cartas.cabina.n,bean:z.cartas.bean.n};out.canje2=P.canjear(z);
    // días siguientes y tope
    const d={inicio:"2026-12-01",entrega:"2026-12-01",sobres:0,bonos:[],cartas:{},abiertos:2};
    const hoy=T3.hoy;T3.hoy="2026-12-02";P.ponerAlDia(d);out.dia2=d.sobres;T3.hoy="2026-12-09";P.ponerAlDia(d);out.dia9=d.sobres;
    T3.guardar("set-ganados",["2026-11-10","2026-12-03","2026-12-09"]);P.ponerAlDia(d);out.conBonos={sobres:d.sobres,bonos:d.bonos.slice()};P.ponerAlDia(d);out.sinDobleBono=d.sobres;
    T3.hoy=hoy;T3.guardar("set-ganados",[]);
    return out;
  });
  chequear("50 cartas, ids únicos, secretas al final y todos los garabatos existen",r.total===50&&r.ids===50&&r.secretasAlFinal&&r.dibSin.length===0,r);
  chequear("rarezas: 21 comunes, 16 poco comunes, 6 raras, 5 holos, 2 secretas",JSON.stringify(r.rarezas)===JSON.stringify({r:6,c:21,p:16,h:5,s:2}),r.rarezas);
  chequear("el primer día hay 2 sobres de bienvenida",r.hayAntes&&r.dia1.sobres===2&&r.dia1.motivo==="bienvenida",r.dia1);
  chequear("el primer sobre trae «El programador» y dos comunes/poco comunes nuevas",r.primero.ids[2]==="programador"&&r.primero.nuevas&&r.primero.r[0]==="c"&&r.primero.sobres===1&&r.primero.abiertos===1,r.primero);
  chequear("la tercera carta sale ~48% poco común, 35% rara, 13% holo, 4% secreta",Math.abs(r.tercero.p-.48)<.03&&Math.abs(r.tercero.r-.35)<.03&&Math.abs(r.tercero.h-.13)<.03&&Math.abs(r.tercero.s-.04)<.02&&!r.tercero.malo,r.tercero);
  chequear("nunca repite una carta dentro del mismo sobre",r.repetidoAdentro===0,r.repetidoAdentro);
  chequear("tras 3 sobres sin nada nuevo garantiza una que falta, pero nunca regala holos ni secretas",r.piedad===300&&r.piedadRara===300&&r.piedadNoRegalaBrillantes===0,[r.piedad,r.piedadRara,r.piedadNoRegalaBrillantes]);
  chequear("tras 10 sobres sin brillo, el siguiente trae holo o secreta",r.sequia===300,r.sequia);
  chequear("6 repetidas se canjean por un sobre",r.repes===6&&r.canje===true&&r.trasCanje.sobres===1&&r.trasCanje.repes===0&&r.canje2===false,r);
  chequear("un sobre por día, se juntan hasta 3",r.dia2===1&&r.dia9===3,[r.dia2,r.dia9]);
  chequear("sobre extra por cada juego ganado desde el estreno, una sola vez",r.conBonos.sobres===5&&r.conBonos.bonos.join()==="2026-12-03,2026-12-09"&&r.sinDobleBono===5,r.conBonos);

  console.log("SIMULACIÓN (un sobre por día + extra por juego 6 de cada 7 días)");
  const sim=await pg.evaluate(()=>{
    const P=T3.tcg._prueba;const res=[];
    for(let k=0;k<400;k++){
      const e={cartas:{},bonos:[],sobres:0,abiertos:0,sinNueva:0};let dia=0,a40=0,fin=0,sobres=0;
      while(!fin&&dia<400){dia++;let n=(dia===1?2:1)+(dia%7?1:0);
        n+=0;while(n-->0){P.tirar(e);sobres++;while(P.repes(e)>=6){P.canjear(e);e.sobres=0;P.tirar(e);sobres++;}
          const t=P.tengo(e);if(!a40&&t>=40)a40=dia;if(t>=50){fin=dia;break;}}}
      res.push({a40,fin,sobres});
    }
    const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(a.length/2)];},p90=a=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(a.length*.9)];};
    return {dias40:med(res.map(x=>x.a40)),diasFin:med(res.map(x=>x.fin)),diasFin90:p90(res.map(x=>x.fin)),sobresFin:med(res.map(x=>x.sobres)),sinTerminar:res.filter(x=>!x.fin).length};
  });
  console.log("   mediana: 40 cartas al día",sim.dias40,"· álbum completo al día",sim.diasFin,"(90% antes del día",sim.diasFin90+") ·",sim.sobresFin,"sobres");
  chequear("el álbum se completa en un plazo razonable (mediana de 2 a 5 semanas)",sim.sinTerminar===0&&sim.diasFin>=15&&sim.diasFin<=35&&sim.diasFin90<=55,sim);
  await ctx.close();

  console.log("EN LA PÁGINA");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-03",{dpr:2,semilla:{"pv-t3-set-escritas":'["2026-12-03"]',"pv-t3-set-abrio":'["2026-12-03"]',"pv-t3-vio-indice":"true",
    "pv-t3-tcg":JSON.stringify({inicio:"2026-12-01",entrega:"2026-12-03",sobres:1,bonos:[],abiertos:4,sinNueva:0,motivo:"diario",cartas:{programador:{n:1,f:"2026-12-01"},cabina:{n:3,f:"2026-12-01"},bean:{n:3,f:"2026-12-02"},mila:{n:3,f:"2026-12-02"},kioto:{n:1,f:"2026-12-02"},sueter:{n:1,f:"2026-12-02"},ticket:{n:1,f:"2026-12-02"},loro:{n:1,f:"2026-12-02"}}})}}));
  r=await pg.evaluate(()=>({punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre")}));
  chequear("la pestaña marca que hay sobre",r.punto,r);
  await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1300);
  await pg.screenshot({path:S+"c-pagina2.jpg"});
  r=await pg.evaluate(()=>({hay:document.querySelector(".t3x-tcg-hay").innerText,repes:(document.querySelector(".t3x-tcg-repes")||{}).innerText,av:document.querySelector(".t3x-tcg-avance").innerText,minis:document.querySelectorAll(".t3x-mini:not(.t3x-hueco)").length,huecos:document.querySelectorAll(".t3x-hueco").length}));
  chequear("muestra sobres, repetidas y avance",/Hay un sobre/.test(r.hay)&&/6 repetidas/.test(r.repes)&&/canjear/.test(r.repes)&&/^8/.test(r.av)&&r.minis===8&&r.huecos===42,r);
  await pg.click('[data-tcg="canjear"]',{force:true});await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>({hay:document.querySelector(".t3x-tcg-hay").innerText,repes:(document.querySelector(".t3x-tcg-repes")||{}).innerText||"",e:T3.leer("tcg")}));
  chequear("canjear repetidas suma un sobre y lo guarda",/Hay 2 sobres/.test(r.hay)&&!/canjear/.test(r.repes)&&r.e.sobres===2&&r.e.canjes===1,{hay:r.hay,repes:r.repes});
  // abrir los dos sobres hasta quedarse sin
  for(let k=0;k<2;k++){
    await pg.click(".t3x-tcg-abrir",{force:true});await pg.waitForTimeout(800);
    await pg.click(".t3x-ap-sobre",{force:true});await pg.waitForTimeout(1700);
    for(const i of [0,1,2]){await pg.click('.t3x-ap-carta[data-i="'+i+'"]',{force:true});await pg.waitForTimeout(1300);await pg.mouse.click(195,790);await pg.waitForTimeout(700);}
    if(k===0)await pg.screenshot({path:S+"c-fin2.jpg"});
    await pg.click(".t3x-ap-listo",{force:true});await pg.waitForTimeout(900);
  }
  await pg.evaluate(()=>document.querySelector(".t3-cuaderno-especial-host").scrollTo(0,0));await pg.waitForTimeout(300);
  await pg.screenshot({path:S+"c-sinsobres.jpg"});
  r=await pg.evaluate(()=>({hay:document.querySelector(".t3x-tcg-hay").innerText,e:T3.leer("tcg"),stat:T3.stats()["tcg-sobres"],punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre"),capa:!!document.querySelector(".t3x-apertura")}));
  const totalCartas=Object.values(r.e.cartas).reduce((a,c)=>a+c.n,0);
  chequear("al abrir descuenta sobres, suma cartas y avisa que mañana hay otro",/Mañana hay otro/.test(r.hay)&&/ganá el juego de hoy/.test(r.hay)&&r.e.sobres===0&&r.e.abiertos===6&&totalCartas===14&&r.stat===2&&!r.punto&&!r.capa,{hay:r.hay,sobres:r.e.sobres,abiertos:r.e.abiertos,totalCartas});
  // ganar el juego del día → sobre extra
  await pg.evaluate(()=>T3.cuaderno.irA("2026-12-03"));await pg.waitForTimeout(1000);
  await pg.evaluate(()=>{T3.cuaderno.jugar(CONFIG.dias[T3.hoy].actividad);});await pg.waitForTimeout(900);
  await pg.evaluate(()=>window.celebrar());await pg.waitForTimeout(3200);
  r=await pg.evaluate(()=>({punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre"),aviso:document.querySelector(".t3-cuaderno-aviso").textContent}));
  chequear("ganar el juego del día avisa y marca un sobre extra",r.punto&&/sobre de MafiaTCG/.test(r.aviso),r);
  await pg.evaluate(()=>T3.cuaderno.cerrarSuelta());await pg.waitForTimeout(900);
  await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1300);
  r=await pg.evaluate(()=>({hay:document.querySelector(".t3x-tcg-hay").innerText,e:T3.leer("tcg")}));
  chequear("el sobre extra aparece en la carpeta",/Hay un sobre/.test(r.hay)&&/por ganar el juego/.test(r.hay)&&r.e.bonos.join()==="2026-12-03",r.hay);
  await pg.reload();await pg.waitForTimeout(2500);
  r=await pg.evaluate(()=>{const e=T3.leer("tcg");return {abiertos:e.abiertos,sobres:e.sobres,n:Object.keys(e.cartas).length};});
  chequear("todo queda guardado al recargar",r.abiertos===6&&r.sobres===1&&r.n>=8,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
