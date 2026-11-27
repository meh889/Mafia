/* Laboratorio · las ventanitas del adviento que le dejan algo a Ponyta o terminan en la vida real (repaso con Mati
   del 26/11/2026): los regalos para Ponyta (el casco del 6 y los guantes del 18), el Lego que se arma (7) y queda en su
   solapa hasta el 31/12, la carta de cumple (16) con sus fuegos artificiales y los globos, el sobre de MafiaTCG (17),
   las dos citas a elección (8 y 20) y la frase en alemán (23). Todo tocando la pantalla. */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
const CARTA="Hola Hermosa, feliz cumpleaños, te amo!!! Espero que te esté gustando Mafiapp, lo armé con mucho cariño.";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const dia=n=>"2026-12-"+String(n).padStart(2,"0");
  const semilla=(fecha,abiertas,mas)=>Object.assign({"pv-t3-set-adviento":JSON.stringify(abiertas.map(dia)),"pv-t3-adviento-popup":"true",
    "pv-t3-set-escritas":JSON.stringify([fecha]),"pv-t3-set-abrio":JSON.stringify([fecha]),"pv-t3-vio-indice":"true","pv-t3-set-eventos-vistos":JSON.stringify([fecha])},mas||{});
  const rango=(a,z,menos)=>{const l=[];for(let i=a;i<=z;i++)if(!(menos||[]).includes(i))l.push(i);return l;};
  const alAdviento=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("adviento"));await pg.waitForTimeout(1500);};
  const abrirVentana=async(pg,n)=>{await pg.evaluate(n=>{const v=document.querySelector('.t3-adviento-v[data-n="'+n+'"]');if(v)v.scrollIntoView({block:"center"});},n);
    await pg.waitForTimeout(300);await pg.click('.t3-adviento-v[data-n="'+n+'"]',{force:true});await pg.waitForSelector(".t3-adviento-velo",{timeout:12000});await pg.waitForTimeout(1100);};
  const guardar=async pg=>{await pg.evaluate(()=>{const g=document.querySelector(".t3-adviento-velo .t3-adviento-guardar");if(g)g.click();});
    await pg.waitForFunction(()=>!document.querySelector(".t3-adviento-velo"),null,{timeout:8000});await pg.waitForTimeout(200);};
  const renglon=pg=>pg.evaluate(()=>((document.querySelector(".t3-adviento-velo .t3-adviento-pista")||{}).textContent||"").replace(/\s+/g," ").trim());
  const aPonyta=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("ponyta"));await pg.waitForTimeout(1700);};
  const aTienda=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("pedidos"));await pg.waitForTimeout(1300);};
  const lista=await (async()=>{const x=await abrir(b,base,"2026-12-01");const l=await x.pg.evaluate(()=>T3.tcg.CARTAS.map(c=>c.id));await x.ctx.close();return l;})();
  const tcg=(ids,mp)=>{const cartas={};ids.forEach(id=>{cartas[id]={n:1,f:"2026-12-02"};});
    return JSON.stringify({inicio:"2026-12-01",entrega:"2026-12-17",sobres:0,bonos:[],abiertos:6,sinNueva:0,sinFull:0,motivo:"diario",cartas:cartas,mp:mp||0,jugados:4,ganados:3,torpeza:.3});};
  let ctx,pg,errores,r;

  console.log("EL CASCO DEL 6");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-06",{semilla:semilla("2026-12-06",rango(1,5))}));
  await aTienda(pg);
  r=await pg.evaluate(()=>({casco:!!document.querySelector('.t3x-cosa[data-id="casco"]'),guantes:!!document.querySelector('.t3x-cosa[data-id="guantes"]'),tiene:T3.ropa.tiene("casco"),
    prenda:T3.ropa.PRENDAS.casco&&{de:T3.ropa.PRENDAS.casco.de,lugar:T3.ropa.PRENDAS.casco.lugar,precio:T3.ropa.PRENDAS.casco.precio||0}}));
  chequear("antes de abrir la ventanita, el casco y los guantes no están en la tienda: no se venden",!r.casco&&!r.guantes&&!r.tiene&&!!r.prenda&&r.prenda.de==="adviento"&&r.prenda.lugar==="cabeza"&&r.prenda.precio===0,r);
  await alAdviento(pg);await abrirVentana(pg,6);await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),p=v.querySelector(".t3x-pase"),img=p&&p.querySelector(".t3x-pase-foto image, .t3x-pase-foto img");
    return {pase:p?p.innerText.replace(/\s+/g," ").trim():"",foto:img?(img.getAttribute("href")||img.getAttribute("xlink:href")||img.getAttribute("src")||""):"",pony:!!(p&&p.querySelector(".t3x-pase-foto svg")),
      L:T3.leer("tienda",null),lleva:T3.ropa.lleva("casco"),ver:!!v.querySelector('[data-reg="ver"]'),stat:T3.stats()["regalo-casco"]||0,entra:v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1}});
  chequear("la ventanita 6 es un pase de boxes de la última carrera del año, con Ponyta de piloto",/PASE DE BOXES/i.test(r.pase)&&/ÚLTIMA CARRERA DEL AÑO/i.test(r.pase)&&/dom 6 dic/i.test(r.pase)&&/Ponyta/.test(r.pase)&&/PILOTO/i.test(r.pase)&&r.pony&&r.entra,r);
  chequear("el casco es la foto que mandó Mati, tal cual (no un dibujo)",/casco\.webp$/.test(r.foto),r.foto);
  chequear("al abrirla el casco pasa a ser de Ponyta, gratis, y se lo pone",!!r.L&&r.L.cosas.casco==="2026-12-06"&&r.L.puesto.cabeza==="casco"&&r.lleva&&r.ver&&r.stat===1,r);
  chequear("y lo cuenta",await renglon(pg)==="Es para Ponyta. Ya se lo puso: no ve nada.",await renglon(pg));
  await pg.waitForTimeout(1800);
  await pg.screenshot({path:S+"i-casco.jpg"});
  await pg.click('[data-reg="ver"]');await pg.waitForSelector(".t3-ponyta-pag",{timeout:10000});await pg.waitForTimeout(1500);
  r=await pg.evaluate(()=>({velo:!!document.querySelector(".t3-adviento-velo"),casco:!!document.querySelector(".t3-ponyta-postura .t3x-prenda-casco"),gorro:!!document.querySelector(".t3-ponyta-postura .t3x-gorro"),
    dije:!!document.querySelector(".t3-ponyta-dije .t3x-prenda-casco")}));
  chequear("«ir a verla» lleva a su solapa: ahí lo tiene puesto (en lugar del gorro de Navidad), y también en el señalador",!r.velo&&r.casco&&!r.gorro&&r.dije,r);
  await pg.screenshot({path:S+"i-casco-solapa.jpg"});
  await alAdviento(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="6"] .t3x-mini-casco img');return m?m.getAttribute("src"):"";});
  chequear("en el calendario, la ventanita 6 muestra el casco",/casco\.webp$/.test(r),r);
  await abrirVentana(pg,6);
  r=await pg.evaluate(()=>({L:T3.leer("tienda",null),stat:T3.stats()["regalo-casco"]||0,regalos:T3.stats()["tienda-regalos"]||0}));
  chequear("si vuelve a abrirla no se lo regala de nuevo, y dice que lo lleva puesto",r.stat===1&&r.regalos===1&&await renglon(pg)==="Lo tiene puesto. No ve nada.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  await aTienda(pg);
  r=await pg.evaluate(()=>{const c=document.querySelector('.t3x-cosa[data-id="casco"]');return c?{txt:c.innerText.replace(/\s+/g," ").trim(),mia:c.classList.contains("t3x-cosa-mia"),puesta:c.classList.contains("t3x-cosa-puesta"),precio:!!c.querySelector(".t3x-cosa-precio")}:null;});
  chequear("ahora sí está en la vidriera, como suyo y sin precio",!!r&&r.mia&&r.puesta&&!r.precio&&/Casco de carrera/.test(r.txt)&&/lo tiene puesto/i.test(r.txt),r);
  await pg.evaluate(()=>{const c=document.querySelector('.t3x-cosa[data-id="casco"]');c.scrollIntoView({block:"center"});});await pg.waitForTimeout(200);
  await pg.click('.t3x-cosa[data-id="casco"]',{force:true});await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>({lleva:T3.ropa.lleva("casco"),tiene:T3.ropa.tiene("casco"),mp:T3.tcg.puntos(),gorro:T3.viaje.conGorro()}));
  chequear("desde la tienda se lo saca (queda en el ropero, y vuelve el gorro de Navidad)",!r.lleva&&r.tiene&&r.gorro,r);
  await alAdviento(pg);await abrirVentana(pg,6);
  chequear("y la ventanita dice dónde quedó",await renglon(pg)==="Lo guardó en su ropero. Se lo ponés desde la tienda.",await renglon(pg));
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LOS GUANTES DEL 18");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-18",{semilla:semilla("2026-12-18",rango(1,17),{"pv-t3-tienda":'{"cosas":{"casco":"2026-12-06","bufanda":"2026-12-10"},"puesto":{"cabeza":"casco","cuello":"bufanda"},"n":0,"log":[]}'})}));
  await alAdviento(pg);await abrirVentana(pg,18);await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),a=v.querySelector(".t3x-afiche");
    return {afiche:a?a.innerText.replace(/\s+/g," ").trim():"",guantes:!!(a&&a.querySelector(".t3x-afiche-foto .t3x-prenda-guantes")),L:T3.leer("tienda",null),entra:v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1}});
  chequear("la ventanita 18 es el afiche de la pelea, con Ponyta y los guantes colgados",/viernes 18 de diciembre/i.test(r.afiche)&&/BOXEO/i.test(r.afiche)&&/EN EL RINCÓN ROJO/i.test(r.afiche)&&/PONYTA/i.test(r.afiche)&&/INVICTA/i.test(r.afiche)&&r.guantes&&r.entra,r);
  chequear("los guantes pasan a ser suyos y se los cuelga del cuello (la bufanda que tenía queda en el ropero); el casco sigue puesto",r.L.cosas.guantes==="2026-12-18"&&r.L.puesto.cuello==="guantes"&&r.L.puesto.cabeza==="casco"&&!!r.L.cosas.bufanda,r.L);
  chequear("y lo cuenta",await renglon(pg)==="Son para Ponyta. Ya se los colgó.",await renglon(pg));
  await pg.waitForTimeout(1500);
  await pg.screenshot({path:S+"i-guantes.jpg"});
  await guardar(pg);
  await aPonyta(pg);
  r=await pg.evaluate(()=>({guantes:!!document.querySelector(".t3-ponyta-postura .t3x-prenda-guantes"),casco:!!document.querySelector(".t3-ponyta-postura .t3x-prenda-casco"),bufanda:!!document.querySelector(".t3-ponyta-postura .t3x-prenda-bufanda")}));
  chequear("en su solapa lleva el casco y los guantes",r.guantes&&r.casco&&!r.bufanda,r);
  await pg.screenshot({path:S+"i-guantes-solapa.jpg"});
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL LEGO DEL 7");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-07",{semilla:semilla("2026-12-07",rango(1,6))}));
  await alAdviento(pg);await abrirVentana(pg,7);
  const lego=()=>pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),a=T3.leer("lego-arbolito",null);return {a:a,
    bandeja:Array.from(v.querySelectorAll('[data-lego="color"]')).map(x=>x.getAttribute("data-c")+":"+x.textContent.trim()+(x.getAttribute("aria-pressed")==="true"?"*":"")).join(" "),
    puestas:v.querySelectorAll(".t3x-lego-base .t3x-lego-ladrillo").length,mal:v.querySelectorAll(".t3x-lego-base .t3x-lego-mal").length,listo:!!v.querySelector(".t3x-lego-listo"),ver:!!v.querySelector('[data-lego="ver"]'),
    arriba:v.querySelector(".t3x-lego-base").getBoundingClientRect().top};});
  const celda=async i=>{await pg.click('.t3x-lego-celda[data-i="'+i+'"]',{force:true});await pg.waitForTimeout(90);};
  const color=async c=>{await pg.click('[data-lego="color"][data-c="'+c+'"]');await pg.waitForTimeout(90);};
  r=await lego();
  const arribaLego=r.arriba;
  chequear("la ventanita 7 es la hoja de instrucciones: el modelo, la base vacía y las piezas justas (1 amarilla, 9 verdes, 1 marrón)",r.a===null&&r.bandeja==="A:1×* V:9× M:1×"&&r.puestas===0&&!r.listo&&!r.ver,r);
  chequear("y explica cómo se arma",await renglon(pg)==="Elegí una pieza y tocá dónde va. Igualito al modelo.",await renglon(pg));
  await pg.screenshot({path:S+"i-lego.jpg"});
  await celda(0);                                   /* la amarilla, en un lugar equivocado */
  r=await lego();
  chequear("tocando una celda pone la pieza elegida, la descuenta y queda anotado",r.puestas===1&&/^A:0× V:9×\* M:1×$/.test(r.bandeja)&&r.a.t==="A........................"&&!r.a.f,r);
  for(const i of [7,11,12,13,15,16,17])await celda(i);
  await guardar(pg);await abrirVentana(pg,7);
  r=await lego();
  const arribaLego2=r.arriba;
  chequear("si cierra a mitad, al volver está como lo dejó",r.puestas===8&&/V:2×/.test(r.bandeja)&&r.a.t==="A......V...VVV.VVV.......",r);
  chequear("y la hoja aparece en el mismo lugar que la primera vez",Math.abs(arribaLego2-arribaLego)<1.5,{primera:arribaLego,segunda:arribaLego2});
  for(const i of [18,19])await celda(i);
  await color("M");await celda(22);
  r=await lego();
  chequear("con todas puestas pero una fuera de lugar no termina: la que está corrida tiembla y lo avisa",r.puestas===11&&r.mal===1&&!r.listo&&!r.a.f&&await renglon(pg)==="Casi. Las que tiemblan están corridas: tocalas para sacarlas.",{r:r,pie:await renglon(pg)});
  chequear("la base no se corrió de lugar mientras armaba",Math.abs(r.arriba-arribaLego2)<1,{antes:arribaLego2,despues:r.arriba});
  await pg.screenshot({path:S+"i-lego-casi.jpg"});
  await celda(0);                                   /* la saca: vuelve a la bandeja, ya elegida */
  r=await lego();
  chequear("tocando una pieza puesta la saca y vuelve a la bandeja",r.puestas===10&&/A:1×\*/.test(r.bandeja),r);
  await celda(2);
  await pg.waitForSelector(".t3-adviento-velo .t3x-lego-listo",{timeout:8000});await pg.waitForTimeout(600);
  r=await lego();
  chequear("al poner la última en su lugar queda armado y anotado, con el día",r.listo&&r.ver&&!!r.a&&r.a.f==="2026-12-07"&&r.a.t==="..A....V...VVV.VVVVV..M..",r);
  chequear("y dice a dónde fue a parar",await renglon(pg)==="Armado. Se lo llevó Ponyta: lo tiene en su solapa.",await renglon(pg));
  await pg.screenshot({path:S+"i-lego-armado.jpg"});
  await pg.click('[data-lego="ver"]');await pg.waitForSelector(".t3-ponyta-pag",{timeout:10000});await pg.waitForTimeout(1500);
  r=await pg.evaluate(()=>{const a=document.querySelector(".t3-ponyta-escena .t3x-arbolito"),e=document.querySelector(".t3-ponyta-escena");if(!a)return {hay:false};const q=a.getBoundingClientRect(),w=e.getBoundingClientRect();
    return {hay:true,piezas:a.querySelectorAll("rect").length,adentro:q.left>=w.left-2&&q.right<=w.right+2&&q.bottom<=w.bottom+2,ancho:Math.round(q.width)};});
  chequear("«ir a verla»: en la solapa de Ponyta está el arbolito, armado y adentro de su escena",r.hay&&r.piezas>=11&&r.adentro&&r.ancho>40,r);
  await pg.click(".t3x-arbolito",{force:true});await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>(document.body.innerText.match(/lo armaste vos, el 7\. no hay que regarlo\./)||[""])[0]);
  chequear("y si lo toca, se acuerda de quién lo armó",r!=="",r);
  await pg.screenshot({path:S+"i-lego-solapa.jpg"});
  /* el 24, el evento de Nochebuena guarda su propio árbol (el que se decora) en "arbolito": no tiene que pisar al de Lego */
  await pg.evaluate(()=>{T3.guardar("arbolito",[{id:"bola-roja",x:.4,y:.5},{id:"estrella-fuego",x:.5,y:.1,shiny:false}]);});
  r=await pg.evaluate(()=>({lego:T3.leer("lego-arbolito",null),otro:T3.leer("arbolito",null),armado:!!T3.ventanitas._ponyta.arbol().f}));
  chequear("el árbol que se decora en Nochebuena y el de Lego se guardan aparte: ninguno pisa al otro",!!r.lego&&r.lego.f==="2026-12-07"&&Array.isArray(r.otro)&&r.otro.length===2&&r.armado,r);
  await alAdviento(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="7"] .t3x-mini-lego');return m?{falta:m.classList.contains("t3x-mini-lego-falta"),piezas:m.querySelectorAll(".t3x-lego-ladrillo").length}:null;});
  chequear("en el calendario, la ventanita 7 muestra el arbolito terminado",!!r&&!r.falta&&r.piezas===11,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  /* quedó con todas las piezas en su lugar pero sin anotar (cerró justo al poner la última): se anota al entrar */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-09",{semilla:semilla("2026-12-09",rango(1,8),{"pv-t3-lego-arbolito":'{"t":"..A....V...VVV.VVVVV..M.."}'})}));
  await alAdviento(pg);await abrirVentana(pg,7);await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>({a:T3.leer("lego-arbolito",null),listo:!!document.querySelector(".t3-adviento-velo .t3x-lego-listo")}));
  chequear("un arbolito que quedó armado pero sin anotar se anota al entrar",r.listo&&!!r.a&&r.a.f==="2026-12-09",r);
  await guardar(pg);
  await ctx.close();
  /* el arbolito está hasta el 31 de diciembre (en g.cjs: el 1 de enero ya no) */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-31",{semilla:semilla("2026-12-31",rango(1,24),{"pv-t3-lego-arbolito":'{"t":"..A....V...VVV.VVVVV..M..","f":"2026-12-07"}'})}));
  await aPonyta(pg);
  chequear("el 31 de diciembre el arbolito sigue en la solapa",await pg.evaluate(()=>!!document.querySelector(".t3-ponyta-escena .t3x-arbolito")));
  await ctx.close();

  console.log("LA CARTA DEL 16");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-16",{semilla:semilla("2026-12-16",rango(1,15))}));
  await aPonyta(pg);
  chequear("el 16, antes de abrir la ventanita, en la solapa de Ponyta no hay globos",await pg.evaluate(()=>!!document.querySelector(".t3-ponyta-pag")&&!document.querySelector(".t3x-globos")));
  await alAdviento(pg);await abrirVentana(pg,16);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {sobre:!!v.querySelector('[data-carta="abrir"]:not([hidden])'),para:(v.querySelector(".t3x-carta-para")||{}).textContent||"",estampilla:(v.querySelector(".t3x-carta-estampilla")||{}).textContent||"",
    hoja:getComputedStyle(v.querySelector(".t3x-carta-hoja")).display,c:T3.leer("carta-cumple",null),fuegos:!!v.querySelector("canvas.t3x-fuegos")}});
  chequear("la ventanita 16 es un sobre cerrado, para ella, con la estampilla del día",r.sobre&&r.para==="Para vos"&&/16\s*dic/i.test(r.estampilla)&&r.hoja==="none"&&!r.fuegos,r);
  chequear("queda anotado el día en que abrió la ventanita (los globos duran ese día)",!!r.c&&r.c.puerta==="2026-12-16"&&!r.c.f,r.c);
  chequear("y la invita a abrirlo",await renglon(pg)==="Es para vos. Abrila.",await renglon(pg));
  await pg.screenshot({path:S+"i-carta-sobre.jpg"});
  await pg.click('[data-carta="abrir"]');
  await pg.waitForSelector(".t3-adviento-velo .t3x-carta-abierta",{timeout:8000});await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),h=v.querySelector(".t3x-carta-hoja"),q=h.getBoundingClientRect();return {texto:(v.querySelector(".t3x-carta-texto")||{}).textContent||"",firma:(v.querySelector(".t3x-carta-firma")||{}).textContent||"",
    sobre:!!v.querySelector('[data-carta="abrir"]:not([hidden])'),c:T3.leer("carta-cumple",null),fuegos:!!v.querySelector("canvas.t3x-fuegos"),quieto:T3.util.reducido(),ver:!!v.querySelector('[data-carta="ver"]'),
    entra:q.left>=0&&q.right<=innerWidth&&v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1,transforma:getComputedStyle(v.querySelector(".t3x-carta-texto")).textTransform}});
  chequear("al abrirlo sale la carta, con el texto de Mati letra por letra",r.texto===CARTA&&r.transforma==="none"&&/Yo/.test(r.firma)&&!r.sobre&&r.entra,r);
  chequear("hay fuegos artificiales y queda anotado que la leyó",(r.fuegos||r.quieto)&&!!r.c&&r.c.f==="2026-12-16"&&r.c.puerta==="2026-12-16"&&r.ver,r);
  chequear("y la manda a ver a Ponyta",await renglon(pg)==="Feliz cumple. Y pasá por lo de Ponyta, que te preparó algo.",await renglon(pg));
  await pg.waitForTimeout(1600);
  await pg.screenshot({path:S+"i-carta.jpg"});
  await pg.evaluate(()=>{const c=document.querySelector(".t3-adviento-velo canvas.t3x-fuegos");if(c)c.setAttribute("data-viejo","1");});
  await pg.click('[data-carta="fuegos"]');await pg.waitForTimeout(300);
  r=await pg.evaluate(()=>({n:document.querySelectorAll(".t3-adviento-velo canvas.t3x-fuegos").length,viejo:!!document.querySelector('.t3-adviento-velo canvas.t3x-fuegos[data-viejo]'),quieto:T3.util.reducido()}));
  chequear("tocando el corazón de la carta hay más fuegos (de a una tanda: no se apilan)",r.quieto||(r.n===1&&!r.viejo),r);
  await pg.click('[data-carta="ver"]');await pg.waitForSelector(".t3-ponyta-pag",{timeout:10000});await pg.waitForTimeout(1800);
  r=await pg.evaluate(()=>{const f=document.querySelector(".t3-ponyta-escena canvas.t3x-globos-fondo"),a=document.querySelector(".t3-ponyta-pag canvas.t3x-globos-arriba");
    let pintado=0;if(f){try{const d=f.getContext("2d").getImageData(0,0,f.width,Math.round(f.height*.4)).data;for(let i=3;i<d.length;i+=4*97)if(d[i]>40)pintado++;}catch(e){pintado=-1;}}
    return {velo:!!document.querySelector(".t3-adviento-velo"),fondo:!!f,arriba:!!a,pintado:pintado,ancho:f?f.width:0,pony:!!document.querySelector(".t3-ponyta-postura"),stat:T3.stats()["globos-cumple"]||0};});
  chequear("«ir a ver a Ponyta»: su solapa está llena de globos, atrás de ella y subiendo por la hoja",!r.velo&&r.fondo&&r.arriba&&r.pintado>200&&r.ancho>200&&r.pony,r);
  await pg.screenshot({path:S+"i-globos.jpg"});
  await alAdviento(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="16"] .t3x-mini-cumple');return m?m.innerText.replace(/\s+/g," ").trim():"";});
  chequear("en el calendario, la ventanita 16 dice «tu carta»",/tu carta/.test(r),r);
  await abrirVentana(pg,16);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {texto:(v.querySelector(".t3x-carta-texto")||{}).textContent||"",sobre:!!v.querySelector('[data-carta="abrir"]:not([hidden])'),hoja:getComputedStyle(v.querySelector(".t3x-carta-hoja")).display}});
  chequear("si vuelve a entrar, la carta ya está abierta",r.texto===CARTA&&!r.sobre&&r.hoja!=="none",r);
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  /* al otro día: sin globos */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-17",{semilla:semilla("2026-12-17",rango(1,16),{"pv-t3-carta-cumple":'{"puerta":"2026-12-16","f":"2026-12-16"}'})}));
  await aPonyta(pg);
  chequear("el 17 ya no hay globos",await pg.evaluate(()=>!!document.querySelector(".t3-ponyta-pag")&&!document.querySelector(".t3x-globos")));
  await alAdviento(pg);await abrirVentana(pg,16);
  chequear("y la ventanita dice de cuándo es la carta",await renglon(pg)==="Tu carta del 16.",await renglon(pg));
  await guardar(pg);
  await ctx.close();
  /* si abre la ventanita tarde, los globos son para el día en que la abre */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-18",{semilla:semilla("2026-12-18",rango(1,15))}));
  await aPonyta(pg);
  const sinAbrir=await pg.evaluate(()=>!document.querySelector(".t3x-globos"));
  await alAdviento(pg);await abrirVentana(pg,16);await guardar(pg);
  await aPonyta(pg);
  r=await pg.evaluate(()=>({globos:!!document.querySelector(".t3-ponyta-escena canvas.t3x-globos-fondo"),c:T3.leer("carta-cumple",null),otroDia:(()=>{const h=T3.hoy;T3.hoy="2026-12-19";const x=T3.ventanitas._ponyta.hayGlobos("2026-12-16");T3.hoy=h;return x;})()}));
  chequear("si abre la ventanita el 18, los globos aparecen ese día (y al otro ya no)",sinAbrir&&r.globos&&r.c.puerta==="2026-12-18"&&r.otroDia===false,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL SOBRE DEL 17");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-17",{semilla:semilla("2026-12-17",rango(1,16),{"pv-t3-tcg2":tcg(lista.slice(0,12),40)})}));
  await alAdviento(pg);await abrirVentana(pg,17);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {sobre:!!v.querySelector(".t3x-regsobre .t3x-sobre-adv"),txt:(v.querySelector(".t3x-regsobre")||{innerText:""}).innerText.replace(/\s+/g," ").trim(),ir:!!v.querySelector('[data-sobre="ir"]'),
    s:T3.leer("sobre-adviento",null),e:T3.leer("tcg2"),punto:!!document.querySelector(".t3-cuaderno-pestana-tcg.t3-cuaderno-con-sobre")}});
  chequear("la ventanita 17 es un sobre de MafiaTCG, del adviento, de una sola carta",r.sobre&&/1 nola/i.test(r.txt)&&/del adviento/i.test(r.txt)&&r.ir,r);
  chequear("al abrirla, el sobre queda esperando en la pestaña del TCG (una vez)",!!r.s&&r.s.dio==="sobre"&&r.s.f==="2026-12-17"&&r.e.nolas===1&&r.e.nolasAdv===1&&r.e.mp===40&&r.punto,r);
  chequear("y promete una que no tiene",await renglon(pg)==="Trae una sola carta. Y es una que no tenés.",await renglon(pg));
  await pg.screenshot({path:S+"i-sobre.jpg"});
  await guardar(pg);await abrirVentana(pg,17);
  r=await pg.evaluate(()=>({e:T3.leer("tcg2"),ir:!!document.querySelector('.t3-adviento-velo [data-sobre="ir"]')}));
  chequear("si vuelve a entrar sin haberlo abierto no le da otro: sigue ofreciendo abrirlo",r.e.nolas===1&&r.e.nolasAdv===1&&r.ir,r.e);
  await pg.click('[data-sobre="ir"]');await pg.waitForSelector(".t3x-tcg-mesa-nola",{timeout:10000});await pg.waitForTimeout(1200);
  r=await pg.evaluate(()=>{const m=document.querySelector(".t3x-tcg-mesa-nola");return {velo:!!document.querySelector(".t3-adviento-velo"),adv:m.classList.contains("t3x-tcg-mesa-adv"),txt:m.innerText.replace(/\s+/g," ").trim()}});
  chequear("«abrirlo en el TCG» la lleva: ahí está, como «un sobre del adviento»",!r.velo&&r.adv&&/Un sobre del adviento/.test(r.txt)&&/nola, seguro/.test(r.txt),r);
  /* (las ventanitas del adviento usan clases t3x-mini-…, como las cartas chicas de la carpeta: que no se pisen) */
  r=await pg.evaluate(()=>{const c=document.querySelector(".t3x-mini .t3x-mini-carta");if(!c)return null;const s=getComputedStyle(c);return {arriba:s.paddingTop,sentido:s.flexDirection,modo:s.display,alto:Math.round(c.getBoundingClientRect().height/c.getBoundingClientRect().width*100)};});
  chequear("las cartas chicas de la carpeta siguen como eran: nada del adviento se les mete",!!r&&r.arriba==="0px"&&r.modo==="block"&&r.alto>=138&&r.alto<=142,r);
  await pg.screenshot({path:S+"i-sobre-tcg.jpg"});
  await pg.click(".t3x-tcg-abrir-nola",{force:true});await pg.waitForTimeout(700);
  await pg.click(".t3x-ap-sobre",{force:true});await pg.waitForTimeout(1700);
  r=await pg.evaluate(()=>({cartas:document.querySelectorAll(".t3x-ap-carta").length,rotulo:document.querySelector(".t3x-ap-rotulo").innerText,rojo:!!document.querySelector(".t3x-ap-sobre.t3x-sobre-adv, .t3x-apertura .t3x-sobre-adv")}));
  chequear("el sobre del adviento trae una sola carta",r.cartas===1&&/sobre del adviento/i.test(r.rotulo),r);
  await pg.click('.t3x-ap-carta[data-i="0"]',{force:true});await pg.waitForTimeout(1500);
  await pg.screenshot({path:S+"i-sobre-nola.jpg"});
  r=await pg.evaluate(()=>({sello:document.querySelector(".t3x-ap-sello").innerText,nola:document.querySelector(".t3x-ap-sello").classList.contains("t3x-ap-nola"),e:T3.leer("tcg2")}));
  chequear("y es una que no tenía: la carpeta pasa de 12 a 13",/nola/i.test(r.sello)&&r.nola&&Object.keys(r.e.cartas).length===13&&r.e.nolas===0&&r.e.nolasAdv===0&&r.e.abiertos===6,r);
  await pg.mouse.click(195,790);await pg.waitForTimeout(800);
  await pg.click(".t3x-ap-listo",{force:true}).catch(()=>{});await pg.waitForTimeout(900);
  await alAdviento(pg);await abrirVentana(pg,17);
  r=await pg.evaluate(()=>({ir:!!document.querySelector('.t3-adviento-velo [data-sobre="ir"]'),abierto:!!document.querySelector(".t3-adviento-velo .t3x-regsobre-abierto"),e:T3.leer("tcg2")}));
  chequear("después, la ventanita dice que ya lo abrió, y no da otro",!r.ir&&r.abierto&&r.e.nolas===0&&await renglon(pg)==="Ya lo abriste. La carta está en tu carpeta.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  /* con la carpeta completa no hay carta para darle: son 250 MafiaPoints */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-17",{semilla:semilla("2026-12-17",rango(1,16),{"pv-t3-tcg2":tcg(lista,40)})}));
  await alAdviento(pg);await abrirVentana(pg,17);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {s:T3.leer("sobre-adviento",null),e:T3.leer("tcg2"),txt:(v.querySelector(".t3x-regsobre")||{innerText:""}).innerText.replace(/\s+/g," ").trim(),ir:!!v.querySelector('[data-sobre="ir"]'),ficha:!!v.querySelector(".t3x-ficha")}});
  chequear("con las 30 cartas ya en la carpeta, el sobre se cambia por 250 MafiaPoints",!!r.s&&r.s.dio==="puntos"&&r.e.mp===290&&!r.e.nolas&&!r.ir&&r.ficha&&/\+250/.test(r.txt)&&/Ya tenés todas las cartas/.test(r.txt)&&await renglon(pg)==="Carpeta completa. No me queda nada para darte.",{r:r,pie:await renglon(pg)});
  await guardar(pg);await abrirVentana(pg,17);
  chequear("y no los da dos veces",await pg.evaluate(()=>T3.tcg.puntos())===290);
  await guardar(pg);
  await ctx.close();
  /* y sin haber entrado nunca al TCG, también anda */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-17",{semilla:semilla("2026-12-17",rango(1,16))}));
  await alAdviento(pg);await abrirVentana(pg,17);
  r=await pg.evaluate(()=>({s:T3.leer("sobre-adviento",null),e:T3.leer("tcg2",null)}));
  chequear("si nunca abrió el TCG, el sobre igual queda esperándola ahí",!!r.s&&r.s.dio==="sobre"&&!!r.e&&r.e.nolas>=1&&r.e.nolasAdv===1,r);
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA CITA DEL 8");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-08",{semilla:semilla("2026-12-08",rango(1,7))}));
  await alAdviento(pg);await abrirVentana(pg,8);
  const menu=()=>pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),c=v.querySelector(".t3x-cita");return {titulo:(c.querySelector(".t3x-cita-titulo")||{}).textContent||"",sub:(c.querySelector(".t3x-cita-sub")||{}).textContent||"",
    ops:Array.from(c.querySelectorAll(".t3x-cita-op")).map(o=>[o.getAttribute("data-id"),(o.querySelector(".t3x-cita-nom")||{}).textContent,(o.querySelector(".t3x-cita-dia")||{}).textContent||"",(o.querySelector(".t3x-cita-mas")||{}).textContent||""].join("|")),
    marcada:Array.from(c.querySelectorAll(".t3x-cita-op.t3x-cita-esta")).map(o=>o.getAttribute("data-id")).join(),botones:Array.from(v.querySelectorAll(".t3x-cita-abajo [data-cita]")).map(x=>x.getAttribute("data-cita")).join(),
    wa:(()=>{const a=v.querySelector('.t3x-cita-abajo a[href]');return a?decodeURIComponent(a.getAttribute("href")):"";})(),sello:(c.querySelector(".t3x-cita-sello")||{}).textContent||"",traba:(c.querySelector(".t3x-cita-traba")||{}).textContent||"",
    guardado:T3.leer("citas",null),arriba:c.getBoundingClientRect().top,entra:c.getBoundingClientRect().right<=innerWidth+2};});
  r=await menu();
  const arribaMenu=r.arriba;
  chequear("la ventanita 8 es un menú con las cuatro citas de Mati, cada una con su día",r.titulo==="Elegí la cita"&&r.sub==="Marcá una. Yo me ocupo del resto."&&
    r.ops.join(" / ")==="A|Vecino|vie 11| / B|FranksGrill|vie 11| / C|Taco Box + Via Flaminia|vie 11| / D|Mega pulga aventurera a algo cool|sáb 12|y sushitos chill en casa el viernes 11"&&r.marcada===""&&r.botones===""&&r.guardado===null&&r.entra,r);
  chequear("y explica qué hacer",await renglon(pg)==="Tocá la que quieras. Después confirmás.",await renglon(pg));
  await pg.screenshot({path:S+"i-cita.jpg"});
  await pg.click('[data-cita="op"][data-id="C"]');await pg.waitForTimeout(700);
  r=await menu();
  chequear("tocando una la marca con birome y ofrece confirmar o elegir otra; todavía no anota nada",r.marcada==="C"&&r.botones==="confirmar,otra"&&r.guardado===null&&/^https:\/\/wa\.me\//.test(r.wa)&&/💌 Cita elegida: la C, Taco Box \+ Via Flaminia \(viernes 11\)\.$/.test(r.wa),r);
  chequear("avisa que al confirmar le llega a él",await renglon(pg)==="¿Segura? Al confirmar me llega por WhatsApp.",await renglon(pg));
  /* los botones aparecen hacia abajo: el menú se queda donde estaba (salvo que no entren en la pantalla: ahí sube lo justo) */
  const fondo=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {guardar:v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom,tope:innerHeight-parseFloat(getComputedStyle(v).paddingBottom)};});
  chequear("el menú no se corrió de lugar al aparecer los botones",Math.abs(r.arriba-arribaMenu)<1||(r.arriba<arribaMenu&&Math.abs(fondo.guardar-fondo.tope)<2),{antes:arribaMenu,despues:r.arriba,fondo:fondo});
  await pg.screenshot({path:S+"i-cita-marcada.jpg"});
  await pg.click('[data-cita="otra"]');await pg.waitForTimeout(300);
  r=await menu();
  chequear("«mejor otra» la desmarca",r.marcada===""&&r.botones===""&&r.guardado===null,r);
  await pg.click('[data-cita="op"][data-id="A"]');await pg.waitForTimeout(300);
  await pg.click('[data-cita="op"][data-id="D"]');await pg.waitForTimeout(700);
  r=await menu();
  chequear("puede cambiar de idea tocando otra: queda marcada una sola, y el mensaje es el de esa",r.marcada==="D"&&/💌 Cita elegida: la D, Mega pulga aventurera a algo cool \(sábado 12\), y sushitos chill en casa el viernes 11\.$/.test(r.wa),r);
  /* el botón es un link a WhatsApp: acá no se sale de la app */
  await pg.evaluate(()=>{document.querySelector('[data-cita="confirmar"]').addEventListener("click",e=>e.preventDefault());});
  await pg.click('[data-cita="confirmar"]');await pg.waitForTimeout(900);
  r=await menu();
  chequear("al confirmar queda elegida y sellada, y ya no se puede cambiar",!!r.guardado&&r.guardado[1].id==="D"&&r.guardado[1].f==="2026-12-08"&&r.titulo==="La cita"&&/ELEGIDA/.test(r.sello)&&r.marcada==="D"&&
    await pg.evaluate(()=>Array.from(document.querySelectorAll(".t3-adviento-velo .t3x-cita-op")).every(o=>o.disabled)),r);
  chequear("deja a mano mandarle el mensaje de nuevo, y dice que del resto se ocupa él",/avisarme de nuevo/.test(await pg.evaluate(()=>document.querySelector(".t3-adviento-velo .t3x-cita-abajo").innerText))&&/la D, Mega pulga/.test(r.wa)&&await renglon(pg)==="Elegiste la D. Del resto me ocupo yo.",{wa:r.wa,pie:await renglon(pg)});
  await pg.waitForTimeout(1200);
  await pg.screenshot({path:S+"i-cita-elegida.jpg"});
  await guardar(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="8"] .t3x-mini-cita');return m?m.innerText.replace(/\s+/g," ").trim():"";});
  chequear("en el calendario, la ventanita 8 muestra la letra elegida",/D/.test(r),r);
  await abrirVentana(pg,8);
  r=await menu();
  chequear("si vuelve a entrar la ve elegida, con las fechas de cuando eligió",r.titulo==="La cita"&&r.marcada==="D"&&/ELEGIDA/.test(r.sello)&&/sáb 12/.test(r.ops[3])&&r.botones==="",r);
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA OTRA CITA, EL 20");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-20",{semilla:semilla("2026-12-20",rango(1,19))}));
  await alAdviento(pg);await abrirVentana(pg,20);
  r=await menu();
  chequear("si el 8 no eligió, la del 20 la manda a elegir primero",r.titulo==="Otra cita"&&r.ops.length===0&&/Primero elegí la cita de la ventanita 8/.test(r.traba)&&r.botones==="primera"&&await renglon(pg)==="Te espera. Primero la otra.",{r:r,pie:await renglon(pg)});
  await pg.click('[data-cita="primera"]');await pg.waitForTimeout(1300);
  r=await pg.evaluate(()=>({velos:document.querySelectorAll(".t3-adviento-velo").length,rot:((document.querySelector(".t3-adviento-velo .t3-adviento-rotulo")||{}).textContent||"")}));
  chequear("y el botón la lleva derecho al menú del 8",r.velos===1&&/VENTANITA 8 /.test(r.rot),r);
  r=await menu();
  chequear("y como el 11 y el 12 ya pasaron, el menú del 8 no promete fechas: «a combinar»",r.ops.every(o=>/\|a combinar\|/.test(o))&&/D\|Mega pulga aventurera a algo cool\|a combinar\|y sushitos chill en casa$/.test(r.ops[3]),r.ops);
  await pg.click('[data-cita="op"][data-id="C"]');await pg.waitForTimeout(500);
  r=await menu();
  chequear("y el mensaje para Mati dice que la fecha es a combinar",/💌 Cita elegida: la C, Taco Box \+ Via Flaminia \(fecha a combinar\)\.$/.test(r.wa),r.wa);
  await pg.evaluate(()=>{document.querySelector('[data-cita="confirmar"]').addEventListener("click",e=>e.preventDefault());});
  await pg.click('[data-cita="confirmar"]');await pg.waitForTimeout(700);
  await guardar(pg);
  await abrirVentana(pg,20);
  r=await menu();
  chequear("elegida la primera, el 20 ofrece las tres que quedaron, todas para el sábado 26 (la D, ya sin los sushitos)",r.titulo==="Otra cita"&&r.sub==="Para el sábado 26. De las que quedaron."&&
    r.ops.join(" / ")==="A|Vecino|sáb 26| / B|FranksGrill|sáb 26| / D|Mega pulga aventurera a algo cool|sáb 26|",r);
  await pg.screenshot({path:S+"i-cita-2.jpg"});
  await pg.click('[data-cita="op"][data-id="A"]');await pg.waitForTimeout(500);
  r=await menu();
  chequear("el mensaje de la segunda dice «otra cita» y el día nuevo",/💌 Otra cita: la A, Vecino \(sábado 26\)\.$/.test(r.wa),r.wa);
  await pg.evaluate(()=>{document.querySelector('[data-cita="confirmar"]').addEventListener("click",e=>e.preventDefault());});
  await pg.click('[data-cita="confirmar"]');await pg.waitForTimeout(800);
  r=await menu();
  chequear("al confirmar quedan anotadas las dos",r.guardado[1].id==="C"&&r.guardado[2].id==="A"&&r.guardado[2].f==="2026-12-20"&&r.titulo==="La otra cita"&&await renglon(pg)==="Elegiste la A. Del resto me ocupo yo.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  r=await pg.evaluate(()=>{const P=T3.ventanitas._citas,o={},hoy=T3.hoy,it=T3.adviento.contenido(20);T3.guardar("citas",{1:{id:"C",f:"2026-12-08"}});
    T3.hoy="2026-12-26";o.elDia=P.vencidas(it);T3.hoy="2026-12-27";o.despues=P.vencidas(it);o.msj=P.mensaje(it,P.opciones(it)[0]);T3.hoy=hoy;T3.guardar("citas",{1:{id:"C",f:"2026-12-08"},2:{id:"A",f:"2026-12-20"}});return o;});
  chequear("la segunda, el mismo 26 todavía tiene fecha; del 27 en adelante, «a combinar»",r.elDia===false&&r.despues===true&&/Otra cita: la A, Vecino \(fecha a combinar\)\./.test(r.msj),r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA FRASE EN ALEMÁN DEL 23");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-23",{semilla:semilla("2026-12-23",rango(1,22))}));
  await alAdviento(pg);await abrirVentana(pg,23);
  const ale=()=>pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),a=v.querySelector(".t3x-ale"),fin=a.querySelector(".t3x-ale-fin");return {corazon:Array.from(a.querySelectorAll(".t3x-ale-glase")).map(x=>x.textContent).join(" "),frase:(a.querySelector(".t3x-ale-frase")||{}).textContent||"",idioma:(a.querySelector(".t3x-ale-frase")||{lang:""}).lang,
    ops:Array.from(a.querySelectorAll(".t3x-ale-op")).map(o=>o.textContent+(o.disabled?" (tachada)":"")),opsVisibles:!a.querySelector(".t3x-ale-opciones").hidden,fin:!fin.hidden,dice:(fin.querySelector(".t3x-ale-dice")||{}).textContent||"",
    suena:(fin.querySelector(".t3x-ale-suena")||{}).textContent||"",oir:!!a.querySelector('[data-ale="oir"]'),g:T3.leer("aleman",null),carta:!!v.querySelector(".mt-carta, .t3x-mini, img"),arriba:a.getBoundingClientRect().top,
    entra:v.querySelector(".t3-adviento-guardar").getBoundingClientRect().bottom<=innerHeight+1};});
  r=await ale();
  const arribaAle=r.arriba;
  chequear("la ventanita 23 es un corazón de Lebkuchen con la frase que pidió Mati, en alemán, y tres traducciones para elegir",/Frohe Weihnachten/.test(r.corazon)&&r.frase==="Hast du zufällig ein kleines Geschenk für heute?"&&r.idioma==="de"&&r.ops.length===3&&r.opsVisibles&&!r.fin&&r.g===null&&r.entra,r);
  chequear("la correcta nunca es la primera, y las otras dos son las que dictó Mati, letra por letra",r.ops[0]!=="¿Por casualidad tenés un regalito para hoy?"&&r.ops.includes("¿Por casualidad tenés un regalito para hoy?")&&r.ops.includes("¿Vecino tendrá un buen plato del día hoy?")&&r.ops.includes("Si todo junto se escribe separado, ¿por qué separado se escribe todo junto?"),r.ops);
  chequear("no muestra ninguna carta ni foto (el regalito es sorpresa)",!r.carta,r);
  chequear("y pregunta",await renglon(pg)==="Está en alemán. ¿Qué dice?",await renglon(pg));
  await pg.screenshot({path:S+"i-aleman.jpg"});
  const mala=r.ops.indexOf("¿Vecino tendrá un buen plato del día hoy?"),otraMala=r.ops.indexOf("Si todo junto se escribe separado, ¿por qué separado se escribe todo junto?"),buena=r.ops.indexOf("¿Por casualidad tenés un regalito para hoy?");
  await pg.click('[data-ale="op"][data-i="'+mala+'"]');await pg.waitForTimeout(600);
  r=await ale();
  chequear("si elige mal, la tacha, cuenta el intento y le contesta que no (en alemán), sin chistes de la app",/\(tachada\)/.test(r.ops[mala])&&!r.fin&&!!r.g&&r.g.intentos===1&&!r.g.f&&await renglon(pg)==="Nein. Probá con otra.",{r:r,pie:await renglon(pg)});
  chequear("el corazón no se corrió de lugar",Math.abs(r.arriba-arribaAle)<1,{antes:arribaAle,despues:r.arriba});
  await pg.click('[data-ale="op"][data-i="'+otraMala+'"]');await pg.waitForTimeout(600);
  r=await ale();
  chequear("con la otra, igual: quedan las dos tachadas y sigue sin resolverse",/\(tachada\)/.test(r.ops[mala])&&/\(tachada\)/.test(r.ops[otraMala])&&!/\(tachada\)/.test(r.ops[buena])&&!r.fin&&r.g.intentos===2&&!r.g.f&&await renglon(pg)==="Nein. Probá con otra.",{r:r,pie:await renglon(pg)});
  await pg.click('[data-ale="op"][data-i="'+buena+'"]');await pg.waitForTimeout(900);
  r=await ale();
  chequear("cuando acierta aparece la traducción y cómo se lee, y queda anotado",r.fin&&!r.opsVisibles&&r.dice==="¿Por casualidad tenés un regalito para hoy?"&&/jast du tsu.FÉ.lij ain KLÁI.nes gue.SHÉNK fiur JÓI.te\?/.test(r.suena)&&!!r.g&&r.g.f==="2026-12-23"&&r.g.intentos===2,r);
  chequear("y ahora se lo tiene que decir a él",/Ahora decímelo\. En alemán\./i.test(await pg.evaluate(()=>document.querySelector(".t3-adviento-velo .t3x-ale-fin").innerText.replace(/\s+/g," ")))&&await renglon(pg)==="Genau. Ahora decímelo así, en alemán.",await renglon(pg));
  await pg.waitForTimeout(900);
  await pg.screenshot({path:S+"i-aleman-fin.jpg"});
  /* el botón para escucharla: con la app en silencio no habla, y lo explica */
  r=await pg.evaluate(()=>{const P=T3.ventanitas._citas,mudo=T3.mudo;let dijo=null;const ss=window.speechSynthesis;const o={hay:!!ss&&"SpeechSynthesisUtterance" in window};
    try{T3.mudo=()=>true;o.enSilencio=P.hablar("Hast du");T3.mudo=()=>false;
      if(ss){const sp=ss.speak;ss.speak=u=>{dijo={lang:u.lang,text:u.text,rate:u.rate};};o.conSonido=P.hablar("Hast du zufällig");ss.speak=sp;}}finally{T3.mudo=mudo;}
    o.dijo=dijo;return o;});
  chequear("«escuchar»: le pide al teléfono que la lea en alemán, despacio; con la app en silencio no habla",r.enSilencio===false&&(!r.hay||(r.conSonido===true&&!!r.dijo&&r.dijo.lang==="de-DE"&&r.dijo.text==="Hast du zufällig"&&r.dijo.rate<1)),r);
  await guardar(pg);
  await abrirVentana(pg,23);
  r=await ale();
  chequear("si vuelve a entrar, ya está resuelta: la traducción y cómo se lee",r.fin&&!r.opsVisibles&&await renglon(pg)==="Ya sabés qué dice. Decímelo en alemán.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
