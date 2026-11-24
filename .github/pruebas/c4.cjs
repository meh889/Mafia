/* Laboratorio · MafiaTCG: las reglas del duelo y el equilibrio de las cartas. No usa navegador:
   saca de index.html el motor (MafiaDuelo), los tipos (MafiaCarta) y la lista de cartas, prueba las reglas
   una por una con cartas fijas y después juega miles de duelos con las cartas de verdad.
   Sirve para ajustar vidas, costos y daños: al final imprime cuánto pesa cada carta. */
const fs=require("fs"),path=require("path");
const RAIZ=process.env.RAIZ||path.resolve(__dirname,"..","..");
const html=fs.readFileSync(path.join(RAIZ,"index.html"),"utf8");
const extras=(/\/\*<<EXTRAS-JS\*\/([\s\S]*?)\/\*EXTRAS-JS>>\*\//.exec(html)||[])[1]||"";
function modulo(titulo){
  const FIN='})(typeof window!=="undefined"?window:globalThis);';
  const i=extras.indexOf(titulo);if(i<0)throw new Error("no encuentro en index.html el módulo «"+titulo+"»");
  const j=extras.indexOf(FIN,i);if(j<0)throw new Error("no encuentro el final del módulo «"+titulo+"»");
  return extras.slice(extras.lastIndexOf("/*",i),j+FIN.length);
}
const D=(function(){const m={exports:{}};new Function("module",modulo("MafiaTCG · el duelo (reglas y rival)"))(m);return m.exports;})();
new Function(modulo("MafiaTCG · cómo se dibuja una carta (MafiaCarta)"))();
const REAL=(function(){
  const i=extras.indexOf("var CARTAS=[",extras.indexOf("PARA SUMAR O CAMBIAR CARTAS")),j=extras.indexOf("\n];",i);
  if(i<0||j<0)throw new Error("no encuentro la lista CARTAS en index.html");
  const lista=new Function("return "+extras.slice(i+"var CARTAS=".length,j+2))(),CARTAS={},TIPOS={};
  lista.forEach(c=>{CARTAS[c.id]=c;});
  Object.keys(globalThis.MafiaCarta.TIPOS).forEach(t=>{TIPOS[t]={debil:globalThis.MafiaCarta.TIPOS[t].debil};});
  return {CARTAS,TIPOS};
})();
console.log(Object.keys(REAL.CARTAS).length+" cartas · tipos: "+Object.keys(REAL.TIPOS).map(t=>t+" (débil a "+REAL.TIPOS[t].debil+")").join(", "));
/* cartas fijas para probar las reglas (no cambian aunque se retoquen las de verdad) */
const TIPOS={viaje:{debil:"familia"},mimos:{debil:"viaje"},salida:{debil:"mimos"},olivos:{debil:"salida"},familia:{debil:"olivos"}};
const CARTAS={
  minilu:{nombre:"MINI LU",tipo:"familia",vidas:70,ataques:[{nombre:"Mordisco",costo:1,dano:30},{nombre:"Ternura",costo:2,dano:20,ef:{curaOtra:30}}]},
  pequepsy:{nombre:"PequePsy",tipo:"mimos",vidas:80,ataques:[{nombre:"Concentración",costo:1,dano:0,ef:{fuerza:40}},{nombre:"Crochetazo",costo:2,dano:40}]},
  narusiesta:{nombre:"NaruSiesta",tipo:"olivos",vidas:110,ataques:[{nombre:"Mimir",costo:1,dano:0,ef:{cura:30,duerme:1,cansa:1}}]},
  luacuatica:{nombre:"LU Acuática",tipo:"familia",vidas:60,ataques:[{nombre:"Salpicadura",costo:1,dano:20},{nombre:"Tsunami",costo:3,dano:60,ef:{banca:10}}]},
  apertura:{nombre:"Apertura",tipo:"salida",vidas:70,ataques:[{nombre:"Deuda",costo:1,dano:10,ef:{quita:1}},{nombre:"Masterball",costo:2,dano:30,ef:{moneda:{mas:40}}}]},
  osakesko:{nombre:"Osakesko",tipo:"viaje",vidas:100,ataques:[{nombre:"Reverencia",costo:1,dano:10,ef:{escudo:20}},{nombre:"Arigatou",costo:2,dano:50}]},
  disney:{nombre:"Disney",tipo:"viaje",vidas:110,ataques:[{nombre:"Ochurus",costo:1,dano:10,ef:{cura:20}},{nombre:"Felicidad",costo:3,dano:70,ef:{curaOtra:20}}]},
  bebes:{nombre:"Bebés",tipo:"mimos",vidas:90,ataques:[{nombre:"Vainilla Latte",costo:1,dano:20,ef:{cura:10}},{nombre:"Your Name",costo:2,dano:40,ef:{siHerida:20}}]},
  sushito:{nombre:"Sushito",tipo:"salida",vidas:70,ataques:[{nombre:"Más Nigiris",costo:1,dano:10,ef:{porEnergia:10}},{nombre:"Le falta maracuyá",costo:2,dano:40}]},
  estudiazo:{nombre:"Estudiazo",tipo:"olivos",vidas:80,ataques:[{nombre:"Sueño",costo:1,dano:10,ef:{duerme:1}},{nombre:"Aburrimiento",costo:2,dano:30,ef:{quita:1}}]},
  argentina:{nombre:"Argentina",tipo:"salida",vidas:90,ataques:[{nombre:"Agarro y se la paso a Messi",costo:1,dano:20,ef:{fuerza:20}},{nombre:"Julián se saca la camiseta",costo:3,dano:80,ef:{cansa:1}}]}
};
let ok=0,mal=0;
function t(nombre,cond,extra){if(cond)ok++;else{mal++;console.log("  ✗ "+nombre+(extra?"  → "+extra:""));}}
const ids=Object.keys(CARTAS);
function duelo(sem,op){
  op=op||{};
  return D.nuevo({cartas:CARTAS,tipos:TIPOS,mazos:[op.m0||ids.slice(0,10),op.m1||ids.slice(1,11)],semilla:sem,empieza:op.empieza,energiaInicial:0});
}
/* un estado armado a mano para probar reglas */
function armado(a0,a1,o){
  const E=duelo(7,{empieza:0});E.turno=5;
  const p=(id,en)=>({id,pv:CARTAS[id].vidas,en:en||0,sinAtacar:0,recien:false,dormida:false,fuerza:0,escudo:0});
  E.jug[0].activa=p(a0[0],a0[1]);E.jug[1].activa=p(a1[0],a1[1]);
  E.jug[0].banca=(o&&o.b0||[]).map(x=>p(x,0));E.jug[1].banca=(o&&o.b1||[]).map(x=>p(x,0));
  E.jug[0].mano=[];E.jug[1].mano=[];E.jug[0].mazo=[];E.jug[1].mazo=[];
  return E;
}
const at=(E,i)=>D.jugar(E,{t:"atacar",a:i});

/* ---- reglas ---- */
{ // debilidad: mimos le pega 20 más a salida
  const E=armado(["pequepsy",2],["sushito",0]);
  t("previsto con debilidad",D.previsto(E,0,1).dano===60&&D.previsto(E,0,1).debil===true,JSON.stringify(D.previsto(E,0,1)));
  at(E,1);t("pega 60",E.jug[1].activa.pv===10,E.jug[1].activa&&E.jug[1].activa.pv);
  t("pasa el turno",E.quien===1);
}
{ // sin debilidad
  const E=armado(["pequepsy",2],["osakesko",0]);
  t("previsto sin debilidad",D.previsto(E,0,1).dano===40&&!D.previsto(E,0,1).debil);
}
{ // energía: no alcanza → no se puede
  const E=armado(["pequepsy",1],["osakesko",0]);
  const l=D.acciones(E);t("solo el ataque que alcanza",l.filter(x=>x.t==="atacar").length===1&&l.some(x=>x.t==="atacar"&&x.a===0));
  let tiro=false;try{at(E,1);}catch(e){tiro=true;}t("jugada inválida da error",tiro);
}
{ // fuerza guardada
  const E=armado(["pequepsy",2],["osakesko",0]);
  at(E,0);t("guarda fuerza",E.jug[0].activa.fuerza===40);
  D.jugar(E,{t:"pasar"});
  t("previsto con fuerza",D.previsto(E,0,1).dano===80);
  at(E,1);t("la usa",E.jug[1].activa.pv===20&&E.jug[0].activa.fuerza===0,E.jug[1].activa.pv);
}
{ // dormir: no ataca en su turno, y después se despierta
  const E=armado(["estudiazo",1],["osakesko",2],{b1:["disney"]});
  at(E,0);
  t("queda dormida",E.jug[1].activa.dormida&&E.jug[1].activa.sinAtacar===1);
  t("dormida no ataca",!D.acciones(E).some(x=>x.t==="atacar"));
  t("dormida se puede cambiar",D.acciones(E).some(x=>x.t==="cambiar"));
  const ev=D.jugar(E,{t:"pasar"});
  t("se despierta al terminar su turno",!E.jug[1].activa.dormida&&ev.some(x=>x.e==="despierta"));
  D.jugar(E,{t:"pasar"});
  t("despierta ataca",D.acciones(E).some(x=>x.t==="atacar"));
}
{ // cansa: no ataca en SU próximo turno, pero sí en el siguiente
  const E=armado(["argentina",3],["disney",0]);
  at(E,1);t("cansada",E.jug[0].activa.sinAtacar===1);
  D.jugar(E,{t:"pasar"});
  t("en su próximo turno no ataca",!D.acciones(E).some(x=>x.t==="atacar"));
  D.jugar(E,{t:"pasar"});D.jugar(E,{t:"pasar"});
  t("en el siguiente sí",D.acciones(E).some(x=>x.t==="atacar"));
}
{ // escudo
  const E=armado(["osakesko",2],["bebes",2]);
  at(E,0);t("escudo puesto",E.jug[0].activa.escudo===20);
  t("previsto con escudo",D.previsto(E,1,1).dano===20,D.previsto(E,1,1).dano);   // 40, +0 (no está herida), −20
  at(E,1);t("recibe menos",E.jug[0].activa.pv===80,E.jug[0].activa.pv);
  t("el escudo se va al volver su turno",E.jug[0].activa.escudo===0);
}
{ // noqueo: sube la única de la banca sola; con dos, elige
  let E=armado(["pequepsy",2],["sushito",0],{b1:["disney"]});E.jug[1].activa.pv=30;
  let ev=at(E,1);
  t("noqueo cuenta",E.jug[0].noqueos===1&&ev.some(x=>x.e==="noqueo"));
  t("sube sola la única",E.jug[1].activa&&E.jug[1].activa.id==="disney"&&E.fase==="jugar"&&E.quien===1);
  E=armado(["pequepsy",2],["sushito",0],{b1:["disney","bebes"]});E.jug[1].activa.pv=30;
  at(E,1);
  t("con dos, tiene que elegir",E.fase==="subir"&&E.sube===1&&D.quienDecide(E)===1&&D.acciones(E).length===2);
  D.jugar(E,{t:"subir",b:1});
  t("sube la elegida y sigue el turno del otro",E.jug[1].activa.id==="bebes"&&E.jug[1].banca.length===1&&E.fase==="jugar"&&E.quien===1);
}
{ // un ataque que noquea a la rival y, de rebote, a la propia: suben las dos, primero la que recibió
  const C2=Object.assign({},CARTAS,{kami:{nombre:"Kami",tipo:"salida",vidas:60,ataques:[{nombre:"Todo o nada",costo:1,dano:60,ef:{retroceso:30}}]}});
  const E=armado(["pequepsy",1],["sushito",0],{b0:["disney","bebes"],b1:["osakesko","minilu"]});
  E.cartas=C2;E.jug[0].activa={id:"kami",pv:20,en:1,sinAtacar:0,recien:false,dormida:false,fuerza:0,escudo:0};E.jug[1].activa.pv=50;
  const ev=at(E,0);
  t("doble noqueo: uno para cada uno",E.jug[0].noqueos===1&&E.jug[1].noqueos===1&&ev.filter(x=>x.e==="noqueo").length===2);
  t("primero elige la que recibió",E.fase==="subir"&&E.sube===1&&D.quienDecide(E)===1);
  D.jugar(E,{t:"subir",b:0});
  t("después elige la que atacó",E.fase==="subir"&&E.sube===0&&E.jug[1].activa.id==="osakesko"&&E.quien===0);
  D.jugar(E,{t:"subir",b:1});
  t("y recién ahí pasa el turno",E.fase==="jugar"&&E.quien===1&&E.jug[0].activa.id==="bebes"&&E.jug[0].activa&&E.jug[1].activa);
  // con una sola en la banca de cada lado, suben solas
  const F=armado(["pequepsy",1],["sushito",0],{b0:["disney"],b1:["osakesko"]});
  F.cartas=C2;F.jug[0].activa={id:"kami",pv:20,en:1,sinAtacar:0,recien:false,dormida:false,fuerza:0,escudo:0};F.jug[1].activa.pv=50;
  at(F,0);
  t("doble noqueo con una sola opción: suben solas",F.fase==="jugar"&&F.quien===1&&F.jug[0].activa.id==="disney"&&F.jug[1].activa.id==="osakesko");
  // y si el que atacó se queda sin nada, pierde aunque haya noqueado
  const G=armado(["pequepsy",1],["sushito",0],{b1:["osakesko"]});
  G.cartas=C2;G.jug[0].activa={id:"kami",pv:20,en:1,sinAtacar:0,recien:false,dormida:false,fuerza:0,escudo:0};G.jug[1].activa.pv=50;
  at(G,0);
  t("se noqueó sola y no le queda nada: pierde",G.fase==="fin"&&G.ganador===1&&G.motivo==="sin cartas");
}
{ // sin banca ni mano: pierde
  const E=armado(["pequepsy",2],["sushito",0]);E.jug[1].activa.pv=30;
  const ev=at(E,1);
  t("sin cartas pierde",E.fase==="fin"&&E.ganador===0&&E.motivo==="sin cartas"&&ev[ev.length-1].e==="fin");
  t("terminado no hay jugadas",D.acciones(E).length===0);
}
{ // tercer noqueo gana
  const E=armado(["pequepsy",2],["sushito",0],{b1:["disney","bebes"]});E.jug[1].activa.pv=30;E.jug[0].noqueos=2;
  at(E,1);t("tres noqueos",E.fase==="fin"&&E.ganador===0&&E.motivo==="noqueos");
  const P=D.puntos(E,0);t("ganar da 10 MafiaPoints, sin bonos (lo pidió Mati)",P.total===10&&P.renglones.length===1&&P.renglones[0].t==="Victoria",JSON.stringify(P));
  t("perder no da nada",D.puntos(E,1).total===0&&D.puntos(E,1).renglones.length===0);
  const P2=D.puntos(E,0,{victoria:25,derrota:3,debil:0,corto:0,invicta:0,turnosCorto:0});t("la tabla de puntos se puede cambiar desde afuera",P2.total===25&&D.puntos(E,1,{victoria:25,derrota:3}).total===3,JSON.stringify(P2));
}
{ // daño a la banca y noqueo en la banca
  const E=armado(["luacuatica",3],["disney",0],{b1:["sushito","bebes"]});E.jug[1].banca[0].pv=10;
  const ev=at(E,1);
  t("pega a la banca",E.jug[1].banca.length===1&&E.jug[1].banca[0].id==="bebes"&&E.jug[1].banca[0].pv===80);
  t("noqueo de banca cuenta",E.jug[0].noqueos===1);
}
{ // cambiar cuesta una energía y es una vez por turno
  const E=armado(["pequepsy",2],["sushito",0],{b0:["disney"]});
  D.jugar(E,{t:"cambiar",b:0});
  t("cambia",E.jug[0].activa.id==="disney"&&E.jug[0].banca[0].id==="pequepsy"&&E.jug[0].banca[0].en===1);
  t("una vez por turno",!D.acciones(E).some(x=>x.t==="cambiar"));
}
{ // la energía es una por turno; quien empieza no ataca en el primero
  const E=duelo(3,{empieza:0});
  t("primer turno sin ataque",!D.acciones(E).some(x=>x.t==="atacar"));
  D.jugar(E,{t:"energia",d:"activa"});
  t("una energía por turno",!D.acciones(E).some(x=>x.t==="energia"));
  t("arranca con 3 en mesa y 3 en mano (2 + la que roba)",E.jug[0].banca.length===2&&E.jug[0].mano.length===3&&E.jug[0].mazo.length===4);
}
{ // el texto sale del efecto
  t("texto moneda",D.texto({ef:{moneda:{mas:40}}})==="Tirá una moneda: si sale cara, pega 40 más.",D.texto({ef:{moneda:{mas:40}}}));
  t("texto varios",D.texto({ef:{cura:30,duerme:1,cansa:1}})==="Se cura 30. Duerme a la carta rival. En tu próximo turno no ataca.",D.texto({ef:{cura:30,duerme:1,cansa:1}}));
  t("sin efecto, sin texto",D.texto({dano:20})==="");
}
{ // mismo número de semilla, mismo duelo (se puede guardar y seguir)
  const a=duelo(99),b=duelo(99);let n=0;
  while(a.fase!=="fin"&&n++<400){const x=D.bot(a,.2);D.jugar(a,x);D.jugar(b,D.bot(b,.2));}
  t("determinista",JSON.stringify(a.jug)===JSON.stringify(b.jug)&&a.ganador===b.ganador);
  const c=JSON.parse(JSON.stringify(duelo(5)));c.cartas=CARTAS;   // sobrevive a guardarse como texto
  let m=0;while(c.fase!=="fin"&&m++<400)D.jugar(c,D.bot(c,.2));
  t("guardado y retomado termina",c.fase==="fin");
}

/* ---- miles de duelos con las cartas de verdad: que terminen, cuánto duran, quién gana ---- */
const RC=REAL.CARTAS,RT=REAL.TIPOS,rids=Object.keys(RC);
function serie(n,t0,t1,op){
  const r={g:[0,0],turnos:0,max:0,motivos:{},empezoGano:0,err:0};
  for(let s=1;s<=n;s++){
    let x=(s*2654435761)>>>0;const mz=()=>{const l=rids.slice();for(let i=l.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=x%(i+1);[l[i],l[j]]=[l[j],l[i]];}return l.slice(0,10);};
    let E;
    try{
      E=D.nuevo({cartas:RC,tipos:RT,mazos:[mz(),mz()],semilla:s*13+(op&&op.sal||0)});
      let pasos=0;
      while(E.fase!=="fin"){
        if(++pasos>3000)throw new Error("no termina");
        const q=D.quienDecide(E);
        D.jugar(E,D.bot(E,q===0?t0:t1));
      }
    }catch(e){r.err++;if(r.err<3)console.log("  error en duelo",s,e.message);continue;}
    r.g[E.ganador]++;r.turnos+=E.turno;r.max=Math.max(r.max,E.turno);r.motivos[E.motivo]=(r.motivos[E.motivo]||0)+1;
    if(E.ganador===E.empezo)r.empezoGano++;
  }
  return r;
}
const N=3000;
const base=serie(N,.25,.25);
t("ningún duelo se rompe",base.err===0,base.err);
t("todos terminan antes del tope",!base.motivos.tope||base.motivos.tope<N*.01,JSON.stringify(base.motivos));
console.log(`parejo (.25 vs .25): gana ella ${(base.g[0]/N*100).toFixed(1)}% · turnos ${(base.turnos/N).toFixed(1)} (máx ${base.max}) · gana quien empieza ${(base.empezoGano/N*100).toFixed(1)}% · ${JSON.stringify(base.motivos)}`);
t("parejo da cerca de 50%",Math.abs(base.g[0]/N-.5)<.06);
t("empezar no decide el duelo",Math.abs(base.empezoGano/N-.5)<.12,(base.empezoGano/N).toFixed(3));
t("duelos de largo razonable",base.turnos/N>10&&base.turnos/N<24,(base.turnos/N).toFixed(1));
for(const [a,b] of [[.05,.05],[.05,.25],[.05,.45],[.05,.65],[.25,.05],[.45,.05],[.65,.05],[.9,.05]]){
  const r=serie(N,a,b,{sal:a*100+b*10});
  console.log(`ella ${a} vs él ${b}: gana ella ${(r.g[0]/N*100).toFixed(1)}% · turnos ${(r.turnos/N).toFixed(1)}`+(r.err?` · errores ${r.err}`:""));
  t("sin errores "+a+"/"+b,r.err===0);
}
/* cuánto pesa cada carta: % de duelos que gana el mazo que la lleva (parejo) */
{
  const cuenta={};rids.forEach(i=>cuenta[i]=[0,0]);
  for(let s=1;s<=6000;s++){
    const l=rids.slice();let x=(s*2654435761)>>>0;for(let i=l.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=x%(i+1);[l[i],l[j]]=[l[j],l[i]];}
    const m0=l.slice(0,6),m1=l.slice(6,12);
    const E=D.nuevo({cartas:RC,tipos:RT,mazos:[m0,m1],semilla:s});let p=0;
    while(E.fase!=="fin"&&p++<3000)D.jugar(E,D.bot(E,.15));
    [m0,m1].forEach((m,q)=>m.forEach(id=>{cuenta[id][1]++;if(E.ganador===q)cuenta[id][0]++;}));
  }
  const pesos=rids.map(i=>cuenta[i][0]/cuenta[i][1]*100);
  console.log("peso de cada carta (% de duelos ganados por el mazo que la lleva):");
  console.log("  "+rids.map((i,k)=>RC[i].nombre+" "+pesos[k].toFixed(0)).join(" · "));
  /* "perro" queda afuera de la cuenta: es floja a propósito (su ataque pega 0, pedido de Mati) */
  const serios=pesos.filter((_,k)=>rids[k]!=="perro");
  t("ninguna carta decide sola",Math.max(...serios)<62&&Math.min(...serios)>38,Math.min(...serios).toFixed(0)+"–"+Math.max(...serios).toFixed(0));
}
console.log(`\n${ok} bien, ${mal} mal`);process.exit(mal?1:0);
