/* Laboratorio · las ventanitas del adviento que se juegan (repaso con Mati del 26/11/2026): la ruleta del 5, los penales
   del 11 y la Generala del 21. Las tres dan MafiaPoints y se juegan una sola vez. Acá se prueban las reglas (sin
   pantalla) y cada una jugada tocando la pantalla, con la suerte arreglada (T3.ventanitas._juegos.conAzar) para que
   salga lo que cada prueba necesita. También: cerrar a mitad de camino, volver a entrar y que nunca se cobre dos veces. */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const dia=n=>"2026-12-"+String(n).padStart(2,"0");
  const semilla=(fecha,abiertas,mas)=>Object.assign({"pv-t3-set-adviento":JSON.stringify(abiertas.map(dia)),"pv-t3-adviento-popup":"true",
    "pv-t3-set-escritas":JSON.stringify([fecha]),"pv-t3-set-abrio":JSON.stringify([fecha]),"pv-t3-vio-indice":"true","pv-t3-set-eventos-vistos":JSON.stringify([fecha])},mas||{});
  const rango=(a,z)=>{const l=[];for(let i=a;i<=z;i++)l.push(i);return l;};
  const alAdviento=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("adviento"));await pg.waitForTimeout(1500);};
  const abrirVentana=async(pg,n)=>{await pg.evaluate(n=>{const v=document.querySelector('.t3-adviento-v[data-n="'+n+'"]');if(v)v.scrollIntoView({block:"center"});},n);
    await pg.waitForTimeout(300);await pg.click('.t3-adviento-v[data-n="'+n+'"]',{force:true});await pg.waitForSelector(".t3-adviento-velo",{timeout:12000});await pg.waitForTimeout(1100);};
  const guardar=async pg=>{await pg.evaluate(()=>{const g=document.querySelector(".t3-adviento-velo .t3-adviento-guardar");if(g)g.click();});
    await pg.waitForFunction(()=>!document.querySelector(".t3-adviento-velo"),null,{timeout:8000});await pg.waitForTimeout(200);};
  const renglon=pg=>pg.evaluate(()=>((document.querySelector(".t3-adviento-velo .t3-adviento-pista")||{}).textContent||"").replace(/\s+/g," ").trim());
  const puntos=pg=>pg.evaluate(()=>T3.tcg.puntos());
  /* la suerte: una lista de números entre 0 y 1 que se van gastando (cuando se acaba, sale el último) */
  const suerte=(pg,lista)=>pg.evaluate(l=>{let i=0;T3.ventanitas._juegos.conAzar(()=>l[Math.min(i++,l.length-1)]);},lista);
  const dado=v=>(v-1)/6+.01;                    /* el número al azar que hace salir ese dado */
  let ctx,pg,errores,r;

  console.log("LA RULETA · las cuentas");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla("2026-12-05",rango(1,4))}));
  r=await pg.evaluate(()=>{const J=T3.ventanitas._juegos,P=J.porciones(T3.adviento.contenido(5)),N=200000,c={};let fuera=0,cortas=0,clavo=0;
    for(let i=0;i<N;i++){const t=J.sortear(P,Math.random());c[t.n]=(c[t.n]||0)+1;}
    for(let i=0;i<30000;i++){const t=J.sortear(P,Math.random()),g=J.frenar(P,t),R=J.giroHasta(g),bajo=((360-R%360)%360+360)%360;
      if(!(bajo>t.de+.5&&bajo<t.a-.5))fuera++;if(R-J.ARRANCA<1800)cortas++;const m=((bajo-7.5)%15+15)%15;if(m<1.2||m>13.8)clavo++;}
    return {gajos:P.map(p=>[p.n,Math.round(p.a-p.de)]),pct:{8:c[8]/N*100,102:c[102]/N*100,3113:c[3113]/N*100},fuera:fuera,cortas:cortas,clavo:clavo,
      bordes:[J.sortear(P,0).n,J.sortear(P,.7999).n,J.sortear(P,.8).n,J.sortear(P,.9899).n,J.sortear(P,.99).n,J.sortear(P,.999999).n],
      arranca:(()=>{const bajo=((360-J.ARRANCA%360)%360+360)%360;return P.filter(p=>bajo>p.de&&bajo<p.a)[0].n;})()};});
  chequear("cada porción mide lo que su chance: 288°, 68° y 4° (el 3.113 es una astilla)",JSON.stringify(r.gajos)==="[[8,288],[102,68],[3113,4]]",r.gajos);
  chequear("en 200.000 tiradas sale lo que pidió Mati: 80% el 8, 19% el 102 y 1% el 3.113",Math.abs(r.pct[8]-80)<.6&&Math.abs(r.pct[102]-19)<.6&&Math.abs(r.pct[3113]-1)<.15,r.pct);
  chequear("los cortes están donde tienen que estar (hasta 0,8 es 8; hasta 0,99 es 102; después, 3.113)",r.bordes.join()==="8,8,102,102,3113,3113",r.bordes);
  chequear("la rueda siempre frena adentro de la porción que salió, después de cinco vueltas o más, y nunca sobre un clavo",r.fuera===0&&r.cortas===0&&r.clavo===0,r);
  chequear("antes de girar, el puntero está sobre el 8",r.arranca===8,r.arranca);

  console.log("LA RULETA · sale el 8");
  await alAdviento(pg);
  await abrirVentana(pg,5);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),q=s=>v.querySelector(s);
    return {boleta:q(".t3x-rul-boleta").innerText.replace(/\s+/g," ").trim(),girar:!!q('[data-rul="girar"]'),rueda:q(".t3x-rul-rueda").getBoundingClientRect().width,guardado:T3.leer("ruleta",null),
      entra:q(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1};});
  chequear("la ventanita 5 es la boleta con la cuenta de Mati y, abajo, la ruleta",/3\.113 días juntos/.test(r.boleta)&&/Estos días se pueden pasar a MafiaPoints\. Pero hay que jugárselos a la ruleta\./.test(r.boleta)&&
    /8 los años 80%/.test(r.boleta)&&/102 los meses 19%/.test(r.boleta)&&/3\.113 los días 1%/.test(r.boleta)&&r.girar&&r.rueda>180&&r.guardado===null,r);
  chequear("entra entera en la pantalla, sin desplazar",r.entra,r);
  chequear("no la apura",await renglon(pg)==="Se gira una sola vez. Cuando te animes.",await renglon(pg));
  await pg.screenshot({path:S+"h-ruleta.jpg"});
  await guardar(pg);
  chequear("si la cierra sin girar, no pasó nada: la espera",await pg.evaluate(()=>T3.leer("ruleta",null)===null)&&await puntos(pg)===0);
  await abrirVentana(pg,5);
  await suerte(pg,[.5]);
  const arribaRuleta=await pg.evaluate(()=>document.querySelector(".t3x-rul-mesa").getBoundingClientRect().top);
  await pg.click('[data-rul="girar"]');
  await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>({guardado:T3.leer("ruleta",null),mp:T3.tcg.puntos(),boton:!!document.querySelector('[data-rul="girar"]')}));
  chequear("al tocar «girar» ya queda anotado y cobrado (si cierra a mitad del giro no pierde nada), y el botón se va",!!r.guardado&&r.guardado.salio===8&&r.guardado.f==="2026-12-05"&&r.mp===8&&!r.boton,r);
  await pg.screenshot({path:S+"h-ruleta-girando.jpg"});
  await pg.waitForSelector(".t3-adviento-velo .t3x-rul-hecha .t3x-ficha",{timeout:15000});await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),g=v.querySelector(".t3x-rul-gira"),m=/rotate\(([-\d.]+)deg\)/.exec(g.style.transform),R=m?+m[1]:NaN,bajo=((360-R%360)%360+360)%360;
    const P=T3.ventanitas._juegos.porciones(T3.adviento.contenido(5)),toca=P.filter(p=>bajo>p.de&&bajo<p.a)[0];
    return {ficha:v.querySelector(".t3x-ficha").innerText.replace(/\s+/g," ").trim(),bajoElPuntero:toca?toca.n:null,mp:T3.tcg.puntos(),arriba:v.querySelector(".t3x-rul-mesa").getBoundingClientRect().top,stats:T3.stats().ruleta||0};});
  chequear("la rueda frena con el 8 bajo el puntero y aparece la ficha con lo ganado",/\+8 MafiaPoints/i.test(r.ficha)&&r.bajoElPuntero===8&&r.mp===8&&r.stats===1,r);
  chequear("y lo dice",await renglon(pg)==="Te tocó el 8: uno por cada año. Ya son tuyos.",await renglon(pg));
  chequear("la ruleta no se corrió de lugar mientras giraba",Math.abs(r.arriba-arribaRuleta)<1,{antes:arribaRuleta,despues:r.arriba});
  await pg.screenshot({path:S+"h-ruleta-8.jpg"});
  await guardar(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="5"] .t3x-mini-rul');return m?m.innerText.replace(/\s+/g," ").trim():"";});
  chequear("en el calendario, la ventanita 5 muestra lo que ganó",/\+8/.test(r),r);
  await abrirVentana(pg,5);
  r=await pg.evaluate(()=>({girar:!!document.querySelector('.t3-adviento-velo [data-rul="girar"]'),ficha:!!document.querySelector(".t3-adviento-velo .t3x-ficha"),mp:T3.tcg.puntos()}));
  chequear("si vuelve a entrar ve cómo terminó: no se puede girar otra vez ni cobra de nuevo",!r.girar&&r.ficha&&r.mp===8&&await renglon(pg)==="Ya giraste. Te tocó el 8: uno por cada año.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA RULETA · sale el 3.113, y cerrar a mitad del giro");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla("2026-12-05",rango(1,4))}));
  await alAdviento(pg);await abrirVentana(pg,5);
  await suerte(pg,[.995]);
  await pg.click('[data-rul="girar"]');
  await pg.waitForSelector(".t3-adviento-velo .t3x-rul-hecha .t3x-ficha",{timeout:15000});await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),g=v.querySelector(".t3x-rul-gira"),m=/rotate\(([-\d.]+)deg\)/.exec(g.style.transform),R=m?+m[1]:NaN,bajo=((360-R%360)%360+360)%360;
    const P=T3.ventanitas._juegos.porciones(T3.adviento.contenido(5)),toca=P.filter(p=>bajo>p.de&&bajo<p.a)[0];
    return {ficha:v.querySelector(".t3x-ficha").innerText.replace(/\s+/g," ").trim(),bajoElPuntero:toca?toca.n:null,mp:T3.tcg.puntos(),fuegos:!!v.querySelector("canvas.t3x-fuegos"),reducido:T3.util.reducido()};});
  chequear("con la suerte del uno en cien: frena en la astilla, da los 3.113 y hay fuegos artificiales",/\+3\.113 MafiaPoints/i.test(r.ficha)&&r.bajoElPuntero===3113&&r.mp===3113&&(r.fuegos||r.reducido),r);
  chequear("y lo festeja",await renglon(pg)==="¡3.113! Uno por cada día. Era una en cien.",await renglon(pg));
  await pg.screenshot({path:S+"h-ruleta-3113.jpg"});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla("2026-12-05",rango(1,4))}));
  await alAdviento(pg);await abrirVentana(pg,5);
  await suerte(pg,[.9]);
  await pg.click('[data-rul="girar"]');await pg.waitForTimeout(900);
  await pg.evaluate(()=>{const g=document.querySelector('[data-rul="girar"]');if(g)g.click();});        /* otro toque, por las dudas */
  await guardar(pg);
  await pg.waitForTimeout(600);
  await abrirVentana(pg,5);
  r=await pg.evaluate(()=>({g:T3.leer("ruleta",null),mp:T3.tcg.puntos(),ficha:((document.querySelector(".t3-adviento-velo .t3x-ficha")||{}).innerText||"").replace(/\s+/g," ").trim(),girar:!!document.querySelector('.t3-adviento-velo [data-rul="girar"]')}));
  chequear("si cierra mientras gira, al volver está el resultado (102) y los puntos se cobraron una sola vez",!!r.g&&r.g.salio===102&&r.mp===102&&/\+102/.test(r.ficha)&&!r.girar,r);
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LOS PENALES");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-11",{semilla:semilla("2026-12-11",rango(1,10))}));
  await alAdviento(pg);await abrirVentana(pg,11);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {zonas:v.querySelectorAll("[data-pen]").length,cartel:(v.querySelector(".t3x-pen-cartel")||{}).textContent||"",tabla:v.querySelectorAll(".t3x-pen-tabla li").length,
    toca:v.querySelectorAll(".t3x-pen-tabla li.t3x-pen-toca").length,entra:v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1}});
  chequear("la ventanita 11 es el arco, con tres lugares para patear, el arquero («el programador») y la planilla de cinco tiros",r.zonas===3&&/EL PROGRAMADOR/.test(r.cartel)&&r.tabla===5&&r.toca===1&&r.entra,r);
  chequear("y dice cuánto vale cada gol",await renglon(pg)==="Cinco penales: cada gol, 10 MafiaPoints. Tocá en el arco dónde patear.",await renglon(pg));
  await pg.screenshot({path:S+"h-penales.jpg"});
  const arribaArco=await pg.evaluate(()=>document.querySelector(".t3x-pen-svg").getBoundingClientRect().top);
  /* el arquero elige: menos de 1/3, a la izquierda; menos de 2/3, al medio; si no, a la derecha */
  const patear=async(lado,arquero)=>{await suerte(pg,[arquero]);await pg.click('[data-pen="'+lado+'"]',{force:true});
    await pg.waitForFunction(()=>{const s=document.querySelector(".t3x-pen-svg");return s&&!s.classList.contains("t3x-pen-pateando");},null,{timeout:8000});await pg.waitForTimeout(120);};
  await suerte(pg,[.1]);
  await pg.click('[data-pen="d"]',{force:true});await pg.waitForTimeout(120);
  await pg.evaluate(()=>{const z=document.querySelector('[data-pen="i"]');z.dispatchEvent(new MouseEvent("click",{bubbles:true}));});        /* un toque de más mientras la pelota viaja */
  await pg.waitForTimeout(650);
  r=await pg.evaluate(()=>({grito:(document.querySelector(".t3x-pen-grito")||{}).textContent||"",quieto:T3.util.reducido(),p:T3.leer("penales",null),mp:T3.tcg.puntos()}));
  chequear("patea a la derecha y el arquero se tira a la izquierda: gol (y el toque de más no cuenta)",(/GOL/.test(r.grito)||r.quieto)&&JSON.stringify(r.p.tiros)==="[1]"&&r.mp===0,r);
  await pg.screenshot({path:S+"h-penales-gol.jpg"});
  await pg.waitForFunction(()=>!document.querySelector(".t3x-pen-svg").classList.contains("t3x-pen-pateando"),null,{timeout:8000});
  chequear("avisa cuál viene",await renglon(pg)==="Va el 2.º. Elegí dónde.",await renglon(pg));
  await patear("i",.1);
  r=await pg.evaluate(()=>({p:T3.leer("penales",null),clases:Array.from(document.querySelectorAll(".t3x-pen-tabla li")).map(x=>x.className.replace("t3x-pen-","")||"-").join(),arriba:document.querySelector(".t3x-pen-svg").getBoundingClientRect().top}));
  chequear("si el arquero adivina el lado, lo ataja, y la planilla lo anota",JSON.stringify(r.p.tiros)==="[1,0]"&&r.clases==="gol,atajo,toca,-,-",r);
  chequear("el arco no se corre de lugar entre tiro y tiro",Math.abs(r.arriba-arribaArco)<1,{antes:arribaArco,despues:r.arriba});
  await guardar(pg);
  await abrirVentana(pg,11);
  r=await pg.evaluate(()=>({p:T3.leer("penales",null),clases:Array.from(document.querySelectorAll(".t3-adviento-velo .t3x-pen-tabla li")).map(x=>x.className.replace("t3x-pen-","")||"-").join()}));
  chequear("si cierra a mitad de la tanda, al volver sigue donde estaba",JSON.stringify(r.p.tiros)==="[1,0]"&&!r.p.f&&r.clases==="gol,atajo,toca,-,-"&&await renglon(pg)==="Va el 3.º. Elegí dónde.",{r:r,pie:await renglon(pg)});
  await patear("c",.9);await patear("c",.5);
  chequear("antes del último tiro todavía no cobró nada",await puntos(pg)===0);
  await suerte(pg,[.5]);
  await pg.click('[data-pen="i"]',{force:true});
  await pg.waitForSelector(".t3-adviento-velo .t3x-pen-fin",{timeout:8000});await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {p:T3.leer("penales",null),mp:T3.tcg.puntos(),ficha:((v.querySelector(".t3x-ficha")||{}).innerText||"").replace(/\s+/g," ").trim(),
    clases:Array.from(v.querySelectorAll(".t3x-pen-tabla li")).map(x=>x.className.replace("t3x-pen-","")||"-").join(),stats:T3.stats().penales||0}});
  chequear("al terminar los cinco cobra 10 por gol (tres goles: 30) y queda anotado",JSON.stringify(r.p.tiros)==="[1,0,1,0,1]"&&r.p.f==="2026-12-11"&&r.mp===30&&/\+30 MafiaPoints/i.test(r.ficha)&&r.clases==="gol,atajo,gol,atajo,gol"&&r.stats===1,r);
  chequear("y dice cómo le fue",await renglon(pg)==="Tres de cinco. Nada mal.",await renglon(pg));
  await pg.screenshot({path:S+"h-penales-fin.jpg"});
  await pg.evaluate(()=>{const z=document.querySelector('[data-pen="d"]');z.dispatchEvent(new MouseEvent("click",{bubbles:true}));});await pg.waitForTimeout(400);
  await guardar(pg);await abrirVentana(pg,11);
  await pg.evaluate(()=>{const z=document.querySelector('.t3-adviento-velo [data-pen="d"]');z.dispatchEvent(new MouseEvent("click",{bubbles:true}));});await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>({p:T3.leer("penales",null),mp:T3.tcg.puntos(),ficha:!!document.querySelector(".t3-adviento-velo .t3x-ficha"),mini:!!document.querySelector('.t3-adviento-v[data-n="11"] .t3x-mini-pen-fin')}));
  chequear("terminada la tanda no se puede patear más ni se cobra de nuevo, ni volviendo a entrar",r.p.tiros.length===5&&r.mp===30&&r.ficha&&r.mini,r);
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  /* la tanda entera atajada, y la perfecta */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-11",{semilla:semilla("2026-12-11",rango(1,10),{"pv-t3-penales":'{"tiros":[0,0,0,0]}'})}));
  await alAdviento(pg);await abrirVentana(pg,11);
  await suerte(pg,[.9]);await pg.click('[data-pen="d"]',{force:true});
  await pg.waitForSelector(".t3-adviento-velo .t3x-pen-fin",{timeout:8000});await pg.waitForTimeout(300);
  r=await pg.evaluate(()=>({mp:T3.tcg.puntos(),ficha:!!document.querySelector(".t3-adviento-velo .t3x-ficha"),p:T3.leer("penales",null)}));
  chequear("si le atajan los cinco no hay puntos ni ficha, pero sí consuelo",r.mp===0&&!r.ficha&&r.p.f==="2026-12-11"&&await renglon(pg)==="Cero de cinco. El programador no lo puede creer. Yo tampoco.",{r:r,pie:await renglon(pg)});
  await ctx.close();
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-11",{semilla:semilla("2026-12-11",rango(1,10),{"pv-t3-penales":'{"tiros":[1,1,1,1]}'})}));
  await alAdviento(pg);await abrirVentana(pg,11);
  await suerte(pg,[.9]);await pg.click('[data-pen="i"]',{force:true});
  await pg.waitForSelector(".t3-adviento-velo .t3x-pen-fin",{timeout:8000});await pg.waitForTimeout(300);
  chequear("con los cinco goles son 50 puntos",await puntos(pg)===50&&await renglon(pg)==="Cinco de cinco. El programador pidió el cambio.",{mp:await puntos(pg),pie:await renglon(pg)});
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA GENERALA · las reglas");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-21",{semilla:semilla("2026-12-21",rango(1,20))}));
  r=await pg.evaluate(()=>{const J=T3.ventanitas._juegos,it=T3.adviento.contenido(21),j=d=>J.juegoDe(d),p=(d,t)=>J.puntosDe(it,d,t);
    return {juegos:[j([1,2,3,4,5]),j([6,2,4,3,5]),j([3,1,6,5,4]),j([1,2,3,4,6]),j([1,2,4,5,6]),j([2,2,3,3,3]),j([4,1,4,4,4]),j([6,6,6,6,6]),j([1,1,2,2,3]),j([5,5,5,2,3]),j([1,2,3,4])],
      puntos:[p([1,2,3,4,5],3).puntos,p([2,2,3,3,3],2).puntos,p([4,1,4,4,4],1).puntos,p([6,6,6,6,6],2).puntos,p([6,6,6,6,6],3).puntos,p([1,1,2,2,3],3).puntos],
      servida:p([3,3,3,3,3],1),noServida:p([3,3,3,3,3],2).juego,
      /* cuántas veces sale cada cosa en la primera tirada (para saber que los dados no están cargados) */
      azar:(()=>{const c={};const N=60000;for(let i=0;i<N;i++){const d=[0,0,0,0,0].map(()=>1+Math.floor(Math.random()*6));const x=J.juegoDe(d)||"nada";c[x]=(c[x]||0)+1;}Object.keys(c).forEach(k=>c[k]=Math.round(c[k]/N*10000)/100);return c;})()};});
  chequear("reconoce cada juego: la escalera (del 1 al 5, del 2 al 6 y la del 3 al 6 con el as), el full, el póker y la generala",
    r.juegos.join()==="escalera,escalera,escalera,,,full,poker,generala,,,",r.juegos);
  chequear("paga lo que confirmó Mati: escalera 20, full 30, póker 40, generala 50 y nada si no hay juego",r.puntos.join()==="20,30,40,50,50,0",r.puntos);
  chequear("la generala de la primera tirada es servida y paga 100; de la segunda, ya no",r.servida.juego==="servida"&&r.servida.puntos===100&&r.noServida==="generala",r);
  chequear("con dados de verdad, de entrada casi siempre no hay nada (lo esperable: 4,6% escalera, 3,9% full, 1,9% póker)",r.azar.nada>87.5&&r.azar.nada<91.5&&r.azar.escalera>3.9&&r.azar.escalera<5.4&&r.azar.full>3.2&&r.azar.full<4.6&&r.azar.poker>1.4&&r.azar.poker<2.5,r.azar);

  console.log("LA GENERALA · una mano, hasta la generala");
  await alAdviento(pg);await abrirVentana(pg,21);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {anotador:v.querySelector(".t3x-gen-anotador").innerText.replace(/\s+/g," ").trim(),dados:v.querySelectorAll(".t3x-gen-dado").length,apagados:v.querySelectorAll(".t3x-gen-dado:disabled").length,
    botones:Array.from(v.querySelectorAll("[data-gen]")).filter(x=>x.getAttribute("data-gen")!=="dado").map(x=>x.getAttribute("data-gen")).join(),tiro:v.querySelector(".t3x-gen-tiro").textContent,entra:v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1}});
  chequear("la ventanita 21 es el anotador, con lo que paga cada juego, y el paño con cinco dados sin tirar",/Generala/.test(r.anotador)&&/paga en MafiaPoints/i.test(r.anotador)&&/Escalera 20 Full 30 Póker 40 Generala 50 Generala servida 100/.test(r.anotador)&&r.dados===5&&r.apagados===5&&r.botones==="tirar"&&/sin tirar/.test(r.tiro)&&r.entra,r);
  chequear("y explica cómo se juega",await renglon(pg)==="Tres tiradas. Después de cada una, tocá los dados que querés guardar.",await renglon(pg));
  await pg.screenshot({path:S+"h-generala.jpg"});
  const arribaPano=await pg.evaluate(()=>document.querySelector(".t3x-gen-pano").getBoundingClientRect().top);
  const tirar=async(dados)=>{await suerte(pg,dados.map(dado));await pg.click('[data-gen="tirar"]');
    await pg.waitForFunction(()=>{const v=document.querySelector(".t3-adviento-velo");return v&&(v.querySelector(".t3x-gen-fin")||v.querySelector('[data-gen="tirar"]'));},null,{timeout:8000});await pg.waitForTimeout(150);};
  const mesa=()=>pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),g=T3.leer("generala",null);return {g:g,caras:Array.from(v.querySelectorAll(".t3x-gen-dado")).map(x=>x.querySelectorAll("circle").length).join(""),
    aparte:Array.from(v.querySelectorAll(".t3x-gen-dado")).map(x=>x.getAttribute("aria-pressed")==="true"?1:0).join(""),
    botones:Array.from(v.querySelectorAll("[data-gen]")).filter(x=>x.getAttribute("data-gen")!=="dado").map(x=>x.getAttribute("data-gen")+(x.disabled?"(apagado)":"")).join(),
    tiro:v.querySelector(".t3x-gen-tiro").textContent,tiene:(v.querySelector(".t3x-gen-tiene")||{}).textContent||"",anotado:(v.querySelector(".t3x-gen-anotado")||{}).textContent||"",mp:T3.tcg.puntos(),arriba:v.querySelector(".t3x-gen-pano").getBoundingClientRect().top};});
  await tirar([2,2,2,5,6]);
  r=await mesa();
  chequear("la primera tirada: salen los cinco, queda anotada y, sin juego, solo se puede volver a tirar",JSON.stringify(r.g.dados)==="[2,2,2,5,6]"&&r.g.tiradas===1&&!r.g.f&&r.caras==="22256"&&r.botones==="tirar"&&/tirada 1 de 3/.test(r.tiro)&&r.mp===0,r);
  chequear("y le dice qué hacer",await renglon(pg)==="Tocá los que guardás y tirá de nuevo. Quedan 2.",await renglon(pg));
  for(const i of [0,1,2]){await pg.click('.t3x-gen-dado[data-i="'+i+'"]');await pg.waitForTimeout(80);}
  r=await mesa();
  chequear("tocando un dado lo guarda (y queda anotado cuáles guardó)",r.aparte==="11100"&&JSON.stringify(r.g.aparte)==="[1,1,1,0,0]",r);
  await pg.screenshot({path:S+"h-generala-guardo.jpg"});
  await guardar(pg);await abrirVentana(pg,21);
  r=await mesa();
  chequear("si cierra a mitad de la mano, al volver están los dados, los guardados y la tirada por la que iba",r.caras==="22256"&&r.aparte==="11100"&&/tirada 1 de 3/.test(r.tiro)&&r.botones==="tirar",r);
  for(const i of [3,4]){await pg.click('.t3x-gen-dado[data-i="'+i+'"]');await pg.waitForTimeout(80);}
  r=await mesa();
  chequear("si guarda los cinco no hay nada para tirar: el botón se apaga y se lo explica",r.aparte==="11111"&&r.botones==="tirar(apagado)"&&await renglon(pg)==="Guardaste los cinco. Soltá alguno para volver a tirar.",{r:r,pie:await renglon(pg)});
  for(const i of [3,4]){await pg.click('.t3x-gen-dado[data-i="'+i+'"]');await pg.waitForTimeout(80);}
  await tirar([2,2]);
  r=await mesa();
  chequear("la segunda tirada solo tira los que no guardó: con dos 2 más hay generala",JSON.stringify(r.g.dados)==="[2,2,2,2,2]"&&r.g.tiradas===2&&r.caras==="22222"&&/Generala/.test(r.tiene)&&r.botones==="tirar,plantar"&&r.mp===0,r);
  chequear("le deja elegir: plantarse o arriesgar",await renglon(pg)==="Tenés generala. Te plantás o arriesgás: queda una tirada.",await renglon(pg));
  chequear("el paño no se corrió de lugar",Math.abs(r.arriba-arribaPano)<1,{antes:arribaPano,despues:r.arriba});
  await pg.click('[data-gen="plantar"]');
  await pg.waitForSelector(".t3-adviento-velo .t3x-gen-fin",{timeout:8000});await pg.waitForTimeout(400);
  r=await mesa();
  const fuegosGen=await pg.evaluate(()=>!!document.querySelector(".t3-adviento-velo canvas.t3x-fuegos")||T3.util.reducido());
  chequear("al plantarse cobra la generala (50, no era servida), la anota en rojo y hay fuegos artificiales",r.g.f==="2026-12-21"&&r.g.juego==="generala"&&r.g.puntos===50&&r.mp===50&&/Generala/.test(r.anotado)&&!/servida/.test(r.anotado)&&/mano cerrada/.test(r.tiro)&&r.botones===""&&fuegosGen,r);
  chequear("y lo festeja",await renglon(pg)==="¡Generala! Cinco iguales.",await renglon(pg));
  await pg.screenshot({path:S+"h-generala-fin.jpg"});
  await guardar(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="21"] .t3x-mini-gen');return m?m.innerText.replace(/\s+/g," ").trim():"";});
  chequear("en el calendario, la ventanita 21 muestra lo que ganó",/\+50/.test(r),r);
  await abrirVentana(pg,21);
  r=await mesa();
  chequear("al volver a entrar la mano sigue cerrada: no se tira más ni se cobra de nuevo",r.botones===""&&r.mp===50&&r.caras==="22222"&&await renglon(pg)==="¡Generala! Cinco iguales.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA GENERALA · servida, sin nada, y la mano que quedó a medio cerrar");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-21",{semilla:semilla("2026-12-21",rango(1,20))}));
  await alAdviento(pg);await abrirVentana(pg,21);
  await tirar([4,4,4,4,4]);
  r=await mesa();
  chequear("cinco iguales de la primera tirada: la marca como servida",/servida/i.test(r.tiene)&&r.botones==="tirar,plantar"&&await renglon(pg)==="Tenés generala servida. Te plantás o arriesgás: quedan 2.",{r:r,pie:await renglon(pg)});
  await pg.click('[data-gen="plantar"]');await pg.waitForSelector(".t3-adviento-velo .t3x-gen-fin",{timeout:8000});await pg.waitForTimeout(300);
  r=await mesa();
  chequear("la generala servida paga 100",r.g.juego==="servida"&&r.g.puntos===100&&r.mp===100&&await renglon(pg)==="¡Generala servida! De una. No lo puedo creer.",{r:r,pie:await renglon(pg)});
  await ctx.close();
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-21",{semilla:semilla("2026-12-21",rango(1,20))}));
  await alAdviento(pg);await abrirVentana(pg,21);
  await tirar([1,2,3,4,6]);await tirar([1,1,2,3,5]);
  r=await mesa();
  chequear("antes de la última avisa que queda una",r.g.tiradas===2&&await renglon(pg)==="Tocá los que guardás y tirá de nuevo. Queda una.",{r:r,pie:await renglon(pg)});
  await suerte(pg,[2,3,3,5,6].map(dado));await pg.click('[data-gen="tirar"]');
  await pg.waitForSelector(".t3-adviento-velo .t3x-gen-fin",{timeout:8000});await pg.waitForTimeout(300);
  r=await mesa();
  chequear("a la tercera tirada la mano se cierra sola; sin juego no hay puntos",r.g.f==="2026-12-21"&&r.g.juego===""&&r.g.puntos===0&&r.mp===0&&r.botones===""&&await renglon(pg)==="Nada. Pasa en las mejores familias.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="21"] .t3x-mini-gen b');return m?m.textContent:"";});
  chequear("y el calendario muestra el cero",r==="0",r);
  await ctx.close();
  /* cerró la ventanita mientras rodaba la tercera tirada: los dados quedaron anotados, pero la mano sin cerrar */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-21",{semilla:semilla("2026-12-21",rango(1,20),{"pv-t3-generala":'{"dados":[1,1,1,2,2],"aparte":[1,1,1,0,0],"tiradas":3}'})}));
  await alAdviento(pg);await abrirVentana(pg,21);
  r=await mesa();
  chequear("una mano que quedó tirada pero sin cerrar se cierra al entrar, y cobra lo que había (full: 30)",r.g.f==="2026-12-21"&&r.g.juego==="full"&&r.mp===30&&r.botones===""&&/Full/.test(r.anotado)&&await renglon(pg)==="Full. Anotado.",{r:r,pie:await renglon(pg)});
  await guardar(pg);await abrirVentana(pg,21);
  chequear("y no la cobra otra vez",await puntos(pg)===30);
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
