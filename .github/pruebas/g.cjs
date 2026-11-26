/* Laboratorio · el adviento que quedó el 26/11/2026: sin fotos, notas de voz ni frases, y con lo que pidió Mati:
   el papelito del 4 (su texto, letra por letra, con las mayúsculas bien a la vista), la búsqueda del tesoro
   (cuatro pedazos de mapa con un número cada uno y, el 24, un cofre con clave) y el cupón del 13 (50% en una
   compra de la tienda). Todo jugado tocando la pantalla. */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
const TEXTO_DEL_4="estoy escondido, Pero si LAs pistas CuestionAs capaz algo encontRas";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const dia=n=>"2026-12-"+String(n).padStart(2,"0");
  const semilla=(fecha,abiertas,mas)=>Object.assign({"pv-t3-set-adviento":JSON.stringify(abiertas.map(dia)),"pv-t3-adviento-popup":"true",
    "pv-t3-set-escritas":JSON.stringify([fecha]),"pv-t3-set-abrio":JSON.stringify([fecha]),"pv-t3-vio-indice":"true"},mas||{});
  const rango=(a,z,menos)=>{const l=[];for(let i=a;i<=z;i++)if(!(menos||[]).includes(i))l.push(i);return l;};
  const alAdviento=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("adviento"));await pg.waitForTimeout(1500);};
  const tocarVentana=async(pg,n)=>{await pg.evaluate(n=>{const v=document.querySelector('.t3-adviento-v[data-n="'+n+'"]');if(v)v.scrollIntoView({block:"center"});},n);
    await pg.waitForTimeout(300);await pg.click('.t3-adviento-v[data-n="'+n+'"]',{force:true});};
  const abrirVentana=async(pg,n)=>{await tocarVentana(pg,n);await pg.waitForSelector(".t3-adviento-velo",{timeout:10000});await pg.waitForTimeout(1100);};
  const guardar=async pg=>{await pg.evaluate(()=>{const g=document.querySelector(".t3-adviento-velo .t3-adviento-guardar");if(g)g.click();});
    await pg.waitForFunction(()=>!document.querySelector(".t3-adviento-velo"),null,{timeout:8000});await pg.waitForTimeout(200);};
  const renglon=pg=>pg.evaluate(()=>((document.querySelector(".t3-adviento-velo .t3-adviento-pista")||{}).textContent||"").trim());
  const lista=await (async()=>{const x=await abrir(b,base,"2026-12-01");const l=await x.pg.evaluate(()=>T3.tcg.CARTAS.map(c=>c.id));await x.ctx.close();return l;})();
  const tcg=mp=>{const cartas={};lista.slice(0,12).forEach(id=>{cartas[id]={n:1,f:"2026-12-02"};});
    return JSON.stringify({inicio:"2026-12-01",entrega:"2026-12-14",sobres:0,bonos:[],abiertos:6,sinNueva:0,sinFull:0,motivo:"diario",cartas:cartas,mp:mp,jugados:4,ganados:3,torpeza:.3});};

  console.log("QUÉ DA CADA VENTANITA");
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:semilla("2026-12-05",[1,2])});
  let r=await pg.evaluate(()=>{const l=[];for(let n=1;n<=24;n++)l.push(T3.adviento.contenido(n));return {l:l,clave:T3.ventanitas._prueba.clave(),tesoro:T3.config.tesoro};});
  const tipos=r.l.map(x=>x.tipo),clave=r.clave;
  chequear("en el adviento no quedan fotos, notas de voz ni frases (lo pidió Mati)",!tipos.some(t=>["foto","voz","frase"].includes(t)),tipos);
  chequear("los cuatro pedazos del mapa salen el 3, el 6, el 10 y el 15, en orden",tipos.filter(t=>t==="mapa").length===4&&[3,6,10,15].every((n,i)=>r.l[n-1].tipo==="mapa"&&r.l[n-1].orden===i+1),tipos);
  chequear("el 13 da el cupón del 50% y el 24 es el cofre",r.l[12].tipo==="cupon"&&r.l[12].pct===50&&r.l[23].tipo==="cofre"&&tipos.filter(t=>t==="cofre"||t==="cupon").length===2,[r.l[12],r.l[23]]);
  chequear("el vale de «la Nochebuena que quieras» pasó al 23",r.l[22].tipo==="vale"&&r.l[22].especial==="nochebuena"&&/Nochebuena que quieras/.test(r.l[22].que),r.l[22]);
  chequear("el 4 es el papelito, con el texto de Mati letra por letra y las letras recortadas",r.l[3].tipo==="papelito"&&r.l[3].texto===TEXTO_DEL_4&&r.l[3].estilo==="recortes",r.l[3]);
  chequear("la clave del cofre son cuatro números y está en CONFIG.t3.tesoro",/^\d{4}$/.test(clave)&&!!r.tesoro&&String(r.tesoro.clave)===clave,{clave:clave,tesoro:r.tesoro});

  console.log("EL PAPELITO DEL 4");
  await alAdviento(pg);
  await abrirVentana(pg,4);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),p=v.querySelector(".t3x-papelito"),t=v.querySelector(".t3x-papelito-texto"),bs=Array.from(t.querySelectorAll("b"));
    const cs=getComputedStyle(t),caja=p.getBoundingClientRect();
    return {estilo:p.className,texto:t.textContent,dicho:t.getAttribute("aria-label"),mayus:bs.map(x=>x.textContent).join(""),
      transforma:[cs.textTransform].concat(bs.map(x=>getComputedStyle(x).textTransform)).filter(x=>x!=="none"),
      /* alevosas: cada mayúscula es un recorte con su fondo, más grande o de otra familia que el resto */
      recortes:bs.every(x=>{const c=getComputedStyle(x);return c.backgroundColor!=="rgba(0, 0, 0, 0)"&&c.fontFamily!==cs.fontFamily&&c.display==="inline-block";}),
      fondos:new Set(bs.map(x=>getComputedStyle(x).backgroundColor)).size,
      enteras:Array.from(t.querySelectorAll(".t3x-pal")).every(x=>x.getClientRects().length===1),
      entra:caja.left>=0&&caja.right<=innerWidth&&caja.width>240,vale:!!v.querySelector(".t3-adviento-vale"),nota:!!v.querySelector(".t3-adviento-nota")};});
  chequear("la ventanita 4 muestra un papelito (ni un vale ni una nota del cuaderno)",/t3x-papelito-recortes/.test(r.estilo)&&!r.vale&&!r.nota,r);
  chequear("dice el texto de Mati tal cual, también para quien lo escucha",r.texto===TEXTO_DEL_4&&r.dicho===TEXTO_DEL_4,{texto:r.texto,dicho:r.dicho});
  chequear("las mayúsculas, leídas en orden, forman PLACAR",r.mayus==="PLACAR",r.mayus);
  chequear("nada le cambia las mayúsculas ni las minúsculas (sin text-transform)",r.transforma.length===0,r.transforma);
  chequear("cada mayúscula es un recorte bien distinto del resto, y no son todos iguales",r.recortes&&r.fondos>=4,{recortes:r.recortes,fondos:r.fondos});
  chequear("ninguna palabra queda partida entre dos renglones y el papel entra en la pantalla",r.enteras&&r.entra,{enteras:r.enteras,entra:r.entra});
  chequear("el renglón de abajo no agrega nada (el texto es solo el de Mati)",await renglon(pg)==="",await renglon(pg));
  await pg.screenshot({path:S+"g-papelito.jpg"});
  await guardar(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="4"] .t3x-mini-papelito');return m?{mayus:Array.from(m.querySelectorAll("b")).map(x=>x.textContent).join(""),texto:m.querySelector(".t3x-papelito-texto").textContent}:null;});
  chequear("en el calendario, la ventanita abierta muestra el mismo papelito",!!r&&r.mayus==="PLACAR"&&r.texto===TEXTO_DEL_4,r);

  console.log("EL MAPA DEL TESORO");
  await abrirVentana(pg,3);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),m=v.querySelector(".t3x-mapa");
    return {hay:!!m,rot:m?m.querySelector(".t3x-mapa-rot").textContent:"",pie:m?m.querySelector(".t3x-mapa-pie").textContent:"",num:m?Array.from(m.querySelectorAll(".t3x-mapa-num")).map(x=>x.textContent).join(""):"",
      svg:m?m.querySelector("svg").getBoundingClientRect().width:0,pedazos:T3.ventanitas.pedazos()};});
  chequear("la ventanita 3 da el primer pedazo del mapa, con el primer número de la clave",r.hay&&/PEDAZO 1 DE 4/.test(r.rot)&&r.num===clave[0]&&new RegExp("primer número: "+clave[0]).test(r.pie)&&r.svg>120,r);
  chequear("y avisa que hay tres más",await renglon(pg)==="Es un pedazo de un mapa. Hay tres más. Guardalo.",await renglon(pg));
  chequear("los pedazos van en orden y solo ese está abierto",r.pedazos.length===4&&r.pedazos.map(p=>p.n).join()==="3,6,10,15"&&r.pedazos.map(p=>p.num).join("")===clave&&r.pedazos.map(p=>p.abierta?1:0).join("")==="1000",r.pedazos);
  await pg.screenshot({path:S+"g-mapa-1.jpg"});
  await guardar(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="3"] .t3x-mini-mapa');return m?m.textContent.replace(/\s+/g," ").trim():"";});
  chequear("en el calendario, la ventanita 3 deja el número a la vista",new RegExp(clave[0]).test(r)&&/1\.º de 4/.test(r),r);
  await tocarVentana(pg,24);await pg.waitForTimeout(700);
  chequear("el cofre no se puede abrir antes del 24",await pg.evaluate(()=>!document.querySelector(".t3-adviento-velo")&&!T3.tiene("adviento","2026-12-24")));
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  ({ctx,pg,errores}=await abrir(b,base,"2026-12-15",{semilla:semilla("2026-12-15",rango(1,14))}));
  await alAdviento(pg);
  await abrirVentana(pg,15);
  r=await pg.evaluate(()=>{const m=document.querySelector(".t3-adviento-velo .t3x-mapa");return {rot:m?m.querySelector(".t3x-mapa-rot").textContent:"",num:m?Array.from(m.querySelectorAll(".t3x-mapa-num")).map(x=>x.textContent).join(""):""};});
  chequear("el 15 da el cuarto pedazo, con el último número",/PEDAZO 4 DE 4/.test(r.rot)&&r.num===clave[3],r);
  chequear("con los cuatro, avisa que el 24 se va a saber para qué",await renglon(pg)==="Están los cuatro. El 24 vas a saber para qué.",await renglon(pg));
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL COFRE DEL 24");
  /* después del 24 (ese día hay evento en la hoja), con todo abierto menos el 10: le falta un pedazo */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-26",{semilla:semilla("2026-12-26",rango(1,23,[10]))}));
  await alAdviento(pg);
  await abrirVentana(pg,24);await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),t=v.querySelector(".t3x-tesoro"),falta=Array.from(v.querySelectorAll(".t3x-mapa-falta"));
    return {hay:!!t,falta:falta.map(x=>x.textContent.replace(/\s+/g,"")),nums:Array.from(v.querySelectorAll(".t3x-mapa-num")).map(x=>x.textContent).join(""),ruedas:Array.from(v.querySelectorAll(".t3x-rueda b")).map(x=>x.textContent).join(""),
      boton:!!v.querySelector('[data-cofre="abrir"]'),abierto:!!v.querySelector(".t3x-cofre-abierto"),ancho:t?t.getBoundingClientRect().right<=innerWidth:false};});
  chequear("la ventanita 24 es el cofre: arriba el mapa armado, abajo cuatro ruedas en cero y «abrir»",r.hay&&r.ruedas==="0000"&&r.boton&&!r.abierto&&r.ancho,r);
  chequear("al mapa le falta el pedazo de la ventanita que no abrió, y lo dice",r.falta.length===1&&r.falta[0]==="?DIC·10"&&r.nums===clave[0]+clave[1]+clave[3]&&await renglon(pg)==="Te faltan pedazos del mapa: abrí la ventanita del 10.",{falta:r.falta,nums:r.nums,pie:await renglon(pg)});
  await pg.click('[data-cofre="abrir"]');await pg.waitForTimeout(250);
  r=await pg.evaluate(()=>({guardado:T3.leer("tesoro",null),no:!!document.querySelector(".t3x-cofre.t3x-cofre-no"),abierto:!!document.querySelector(".t3-adviento-velo .t3x-cofre-abierto")}));
  chequear("con la clave mal no se abre, y lo dice",r.guardado===null&&r.no&&!r.abierto&&/^No es\./.test(await renglon(pg)),{r:r,pie:await renglon(pg)});
  await pg.screenshot({path:S+"g-cofre-falta.jpg"});
  await guardar(pg);
  await abrirVentana(pg,10);await guardar(pg);
  await abrirVentana(pg,24);await pg.waitForTimeout(300);
  r=await pg.evaluate(()=>({falta:document.querySelectorAll(".t3-adviento-velo .t3x-mapa-falta").length,nums:Array.from(document.querySelectorAll(".t3-adviento-velo .t3x-mapa-num")).map(x=>x.textContent).join("")}));
  chequear("con los cuatro pedazos, el mapa muestra la clave entera, de izquierda a derecha",r.falta===0&&r.nums===clave&&await renglon(pg)==="Cuatro números, en el orden del mapa.",{r:r,pie:await renglon(pg)});
  await pg.click('.t3x-rueda[data-i="0"] [data-cofre="menos"]');
  chequear("las ruedas dan la vuelta (del 0, para abajo, al 9)",await pg.locator('.t3x-rueda[data-i="0"] b').innerText()==="9");
  for(let i=0;i<4;i++){
    let ahora=+(await pg.locator('.t3x-rueda[data-i="'+i+'"] b').innerText());
    for(let k=0;k<12&&ahora!==+clave[i];k++){await pg.click('.t3x-rueda[data-i="'+i+'"] [data-cofre="'+(((+clave[i]-ahora+10)%10)<=5?"mas":"menos")+'"]');ahora=+(await pg.locator('.t3x-rueda[data-i="'+i+'"] b').innerText());}
  }
  chequear("se pone la clave tocando las flechas",(await pg.evaluate(()=>Array.from(document.querySelectorAll(".t3x-rueda b")).map(x=>x.textContent).join("")))===clave);
  await pg.screenshot({path:S+"g-cofre-clave.jpg"});
  await pg.click('[data-cofre="abrir"]');
  await pg.waitForSelector(".t3-adviento-velo .t3x-tesoro-nota",{timeout:8000});await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {guardado:T3.leer("tesoro",null),abierto:!!v.querySelector(".t3x-cofre-svg.t3x-cofre-abierto"),ruedas:v.querySelectorAll(".t3x-rueda").length,
    nota:v.querySelector(".t3x-tesoro-nota").innerText.replace(/\s+/g," ").trim(),stats:T3.stats()["tesoro-abierto"]||0};});
  chequear("con la clave bien se abre, queda guardado y aparece el papel de adentro",!!r.guardado&&r.guardado.abierto==="2026-12-26"&&r.abierto&&r.ruedas===0&&r.stats===1,r);
  chequear("mientras Mati no cargue el escondite, el papel la manda a pedirle la última pista",/La última pista me la tenés que pedir a mí/.test(r.nota)&&await renglon(pg)==="Ahora pedime la última pista.",{nota:r.nota,pie:await renglon(pg)});
  await pg.screenshot({path:S+"g-cofre-abierto.jpg"});
  await guardar(pg);
  chequear("en el calendario, la ventanita 24 queda con el cofre abierto",await pg.evaluate(()=>!!document.querySelector('.t3-adviento-v[data-n="24"] .t3x-mini-cofre .t3x-cofre-abierto')));
  await pg.screenshot({path:S+"g-calendario.jpg"});
  /* con el escondite cargado en CONFIG.t3.tesoro, el papel dice eso */
  await pg.evaluate(()=>{T3.config.tesoro.escondite="En el cajón de las medias.";});
  await abrirVentana(pg,24);await pg.waitForTimeout(300);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),n=v.querySelector(".t3x-tesoro-nota");return {abierto:!!v.querySelector(".t3x-cofre-svg.t3x-cofre-abierto"),ruedas:v.querySelectorAll(".t3x-rueda").length,nota:n?n.innerText.replace(/\s+/g," ").trim():""};});
  chequear("al volver a entrar, el cofre sigue abierto y muestra el papel con el escondite que cargó Mati",r.abierto&&r.ruedas===0&&/En el cajón de las medias\./.test(r.nota)&&await renglon(pg)==="Andá a buscarlo.",{r:r,pie:await renglon(pg)});
  await guardar(pg);
  r=await pg.evaluate(()=>{const P=T3.ventanitas._prueba,o={};T3.config.tesoro.clave="1234";o.otra=P.clave();T3.config.tesoro.clave="12";o.corta=P.clave();T3.config.tesoro.clave="2805";o.vuelve=P.clave();T3.config.tesoro.escondite="";return o;});
  chequear("la clave se cambia desde CONFIG (y si está mal escrita, vale la de reserva)",r.otra==="1234"&&r.corta==="2805"&&r.vuelve==="2805",r);

  console.log("EL VALE DE LA NOCHEBUENA, EL 23");
  await abrirVentana(pg,23);await pg.waitForTimeout(600);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {sobre:(v.querySelector(".t3-adviento-sobre-frente")||{}).textContent||"",vale:(v.querySelector(".t3-adviento-vale-cuerpo")||{}).innerText||"",talon:!!v.querySelector(".t3-adviento-vale-talon")};});
  chequear("el vale de la Nochebuena sale el 23, en su sobre, y el sobre dice 23",/NO ABRIR ANTES DEL 23/.test(r.sobre)&&/Nochebuena/.test(r.vale)&&/0023/.test(r.vale)&&r.talon,r);
  await pg.screenshot({path:S+"g-nochebuena-23.jpg"});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL CUPÓN DEL 13");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-14",{semilla:semilla("2026-12-14",rango(1,12),{"pv-t3-tcg2":tcg(320)})}));
  await pg.evaluate(()=>T3.cuaderno.abrir("pedidos"));await pg.waitForTimeout(1300);
  r=await pg.evaluate(()=>({cupon:T3.ventanitas.cupon(),aviso:!!document.querySelector(".t3x-tie-cupon"),redondeo:[T3.ventanitas.rebajado(45,{pct:50}),T3.ventanitas.rebajado(5000,{pct:50}),T3.ventanitas.rebajado(600)]}));
  chequear("antes de abrir la ventanita 13 no hay cupón, y la tienda no lo nombra",r.cupon===null&&!r.aviso&&r.redondeo[2]===600,r);
  chequear("el descuento redondea para arriba (45 → 23, 5000 → 2500)",r.redondeo[0]===23&&r.redondeo[1]===2500,r.redondeo);
  await alAdviento(pg);
  await abrirVentana(pg,13);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo"),c=v.querySelector(".t3x-cupon");return {hay:!!c,txt:c?c.innerText.replace(/\s+/g," ").trim():"",ir:!!v.querySelector('[data-cupon="tienda"]'),cupon:T3.ventanitas.cupon()};});
  chequear("la ventanita 13 da el cupón: 50% en una compra de la tienda, la que quiera",r.hay&&/50/.test(r.txt)&&/en una compra de la tienda/.test(r.txt)&&/UN SOLO USO/.test(r.txt)&&r.ir&&!!r.cupon&&r.cupon.pct===50&&r.cupon.f==="2026-12-13",r);
  chequear("y explica cómo se usa",await renglon(pg)==="Se usa en la tienda, al comprar. Sirve una sola vez.",await renglon(pg));
  await pg.screenshot({path:S+"g-cupon.jpg"});
  await pg.click('[data-cupon="tienda"]');
  await pg.waitForSelector(".t3x-tie",{timeout:8000});await pg.waitForTimeout(900);
  r=await pg.evaluate(()=>({velo:!!document.querySelector(".t3-adviento-velo"),aviso:((document.querySelector(".t3x-tie-cupon")||{}).innerText||"").replace(/\s+/g," ").trim()}));
  chequear("«ir a la tienda» la lleva, y ahí la tienda le recuerda que tiene el cupón",!r.velo&&/50%/.test(r.aviso)&&/cupón del adviento/.test(r.aviso),r);
  const hoja=()=>pg.evaluate(()=>{const h=document.querySelector(".t3x-compra");if(!h)return null;const a=h.querySelector('a[data-tie="pedir"]');
    return {txt:h.querySelector(".t3x-compra-papel").innerText.replace(/\s+/g," ").trim(),botones:Array.from(h.querySelectorAll("[data-tie]")).map(x=>x.getAttribute("data-tie")),wa:a?decodeURIComponent(a.href):""};});
  const tocar=async sel=>{await pg.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:"center"});},sel);await pg.waitForTimeout(150);await pg.click(sel,{force:true});await pg.waitForTimeout(500);};
  await tocar('[data-tie="cosa"][data-id="racing"]');
  r=await hoja();
  chequear("la hoja de confirmar ofrece el cupón sin ponerlo sola: sin él, la camiseta de Racing (600) no le alcanza",!!r&&/sale 600/i.test(r.txt)&&/te faltan 280/i.test(r.txt)&&/Usar mi cupón: te sale 300/.test(r.txt)&&r.botones.includes("cupon")&&!r.botones.includes("comprar"),r);
  await tocar('.t3x-compra [data-tie="cupon"]');
  r=await hoja();
  chequear("con el cupón puesto sale la mitad y ya la puede comprar",!!r&&/sale 600 300 con el cupón/i.test(r.txt)&&/te quedan 20/i.test(r.txt)&&r.botones.includes("comprar"),r);
  await pg.screenshot({path:S+"g-cupon-hoja.jpg"});
  await tocar('.t3x-compra [data-tie="cupon"]');
  r=await hoja();
  chequear("se puede arrepentir: lo saca y vuelve el precio entero",!!r&&/sale 600 ·/i.test(r.txt)&&!r.botones.includes("comprar")&&await pg.evaluate(()=>!!T3.ventanitas.cupon()),r);
  await tocar('.t3x-compra [data-tie="cupon"]');
  await tocar('.t3x-compra [data-tie="comprar"]');
  r=await pg.evaluate(()=>({mp:T3.tcg.puntos(),cupon:T3.ventanitas.cupon(),usado:T3.ventanitas.cuponUsado(),canjes:T3.leer("adviento-canjes",{}),mia:!!T3.leer("tienda").cosas.racing,
    hoja:document.querySelector(".t3x-compra-papel").innerText.replace(/\s+/g," ").trim(),stats:T3.stats()["cupon-usado"]||0}));
  chequear("al comprar con el cupón paga la mitad (320 − 300 = 20) y la camiseta es suya",r.mp===20&&r.mia&&/pagaste 300 en vez de 600/.test(r.hoja),r);
  chequear("el cupón se gasta: queda anotado en qué y no se puede usar otra vez",r.cupon===null&&!!r.usado&&r.usado.que==="Camiseta de Racing"&&r.usado.antes===600&&r.usado.pago===300&&r.canjes["2026-12-13"]==="2026-12-14"&&r.stats===1,r);
  await tocar('.t3x-compra [data-tie="cerrar"]');
  await tocar('[data-tie="ticket"][data-id="mimos"]');
  r=await hoja();
  chequear("después, la tienda ya no lo ofrece",!!r&&!r.botones.includes("cupon")&&await pg.evaluate(()=>!document.querySelector(".t3x-tie-cupon")),r);
  await tocar('.t3x-compra [data-tie="cerrar"]');
  r=await pg.evaluate(()=>T3.tienda._prueba.comprar(T3.tienda._prueba.cosas().filter(c=>c.id==="boina")[0],true));
  chequear("y por adentro tampoco: no se puede comprar «con cupón» sin tener uno",r===false&&await pg.evaluate(()=>T3.tcg.puntos())===20);
  await alAdviento(pg);
  r=await pg.evaluate(()=>{const m=document.querySelector('.t3-adviento-v[data-n="13"] .t3x-mini-cupon');return m?{usado:m.classList.contains("t3x-mini-usado"),txt:m.textContent.replace(/\s+/g," ").trim()}:null;});
  chequear("en el calendario, la ventanita 13 queda con el cupón usado",!!r&&r.usado&&/USADO/.test(r.txt),r);
  await abrirVentana(pg,13);
  r=await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-velo");return {usado:!!v.querySelector(".t3x-cupon.t3x-cupon-usado"),sello:(v.querySelector(".t3x-cupon-sello")||{}).innerText||"",ir:!!v.querySelector('[data-cupon="tienda"]'),fue:(v.querySelector(".t3x-cupon-fue")||{}).innerText||""};});
  chequear("y al abrirla dice en qué lo gastó",r.usado&&/USADO/.test(r.sello)&&!r.ir&&/Camiseta de Racing/.test(r.fue)&&/300 en vez de 600/.test(r.fue)&&await renglon(pg)==="Ya lo usaste. Igual queda acá.",{r:r,pie:await renglon(pg)});
  await pg.screenshot({path:S+"g-cupon-usado.jpg"});
  await guardar(pg);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  /* también sirve para un pedido del talonario (y el mensaje de WhatsApp lo aclara) */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-14",{semilla:semilla("2026-12-14",rango(1,13),{"pv-t3-tcg2":tcg(30)})}));
  await pg.evaluate(()=>T3.cuaderno.abrir("pedidos"));await pg.waitForTimeout(1300);
  await pg.evaluate(()=>{const e=document.querySelector('[data-tie="ticket"][data-id="mimos"]');if(e)e.scrollIntoView({block:"center"});});await pg.waitForTimeout(150);
  await pg.click('[data-tie="ticket"][data-id="mimos"]',{force:true});await pg.waitForTimeout(500);
  await pg.click('.t3x-compra [data-tie="cupon"]',{force:true});await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>{const h=document.querySelector(".t3x-compra"),a=h.querySelector('a[data-tie="pedir"]');return {txt:h.querySelector(".t3x-compra-papel").innerText.replace(/\s+/g," ").trim(),wa:a?decodeURIComponent(a.href):""};});
  chequear("en el talonario también: «mimos» (40) con el cupón sale 20, y el mensaje para Mati lo dice",/sale 40 20 con el cupón/i.test(r.txt)&&/Pedido Nº 0001: .*\(con mi cupón del adviento\)/.test(r.wa),r);
  r=await pg.evaluate(()=>{const P=T3.tienda._prueba,p=P.tickets().filter(x=>x.id==="mimos")[0],n=P.pedir(p,true),L=P.libro();
    return {n:n,mp:T3.tcg.puntos(),cupon:T3.ventanitas.cupon(),usado:T3.ventanitas.cuponUsado(),log:L.log[L.log.length-1]};});
  chequear("al canjearlo cobra 20, lo anota con el cupón y el cupón se gasta",r.n===1&&r.mp===10&&r.cupon===null&&!!r.usado&&r.usado.pago===20&&r.usado.antes===40&&!!r.log&&r.log.p===20&&r.log.cupon===50,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("EL MISMO 24");
  /* ese día la hoja arranca con el evento de Nochebuena; acá ya lo vio y entra al calendario */
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-24",{semilla:semilla("2026-12-24",rango(1,23),{"pv-t3-set-eventos-vistos":'["2026-12-24"]'})}));
  r=await pg.evaluate(()=>({hoja:!!document.querySelector(".t3-cuaderno-hoja"),evento:!!document.querySelector(".t3-cuaderno-evento")}));
  if(r.hoja&&!r.evento){
    await alAdviento(pg);
    r=await pg.evaluate(()=>{const v=document.querySelector('.t3-adviento-v[data-n="24"]');return {hoy:!!v&&v.classList.contains("t3-adviento-hoy"),abierta:!!v&&v.classList.contains("t3-adviento-abierta"),pie:((document.querySelector(".t3-adviento-pie")||{}).innerText||"").trim()};});
    chequear("el 24 la ventanita grande es la del día y el calendario lo dice",r.hoy&&!r.abierta&&/Hoy la grande/.test(r.pie),r);
    await tocarVentana(pg,24);
    await pg.waitForSelector(".t3-adviento-velo .t3x-tesoro",{timeout:12000});await pg.waitForTimeout(900);
    r=await pg.evaluate(()=>({ruedas:document.querySelectorAll(".t3-adviento-velo .t3x-rueda").length,nums:Array.from(document.querySelectorAll(".t3-adviento-velo .t3x-mapa-num")).map(x=>x.textContent).join(""),abierta:T3.tiene("adviento","2026-12-24")}));
    chequear("al abrirla aparece el cofre, con el mapa entero",r.ruedas===4&&r.nums===clave&&r.abierta,r);
    await pg.screenshot({path:S+"g-el-24.jpg"});
    await guardar(pg);
  }else chequear("el 24, con el evento ya visto, se llega a la hoja",false,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LA VENTANITA DEL DÍA, EN LA HOJA");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-03",{semilla:semilla("2026-12-03",[1,2])}));
  await pg.evaluate(()=>{const v=document.querySelector(".t3-adviento-puerta .t3-adviento-v");if(v)v.scrollIntoView({block:"center"});});await pg.waitForTimeout(600);
  r=await pg.evaluate(()=>({puerta:!!document.querySelector(".t3-adviento-puerta .t3-adviento-v"),mano:(document.querySelector(".t3-adviento-puerta-mano")||{}).innerText||""}));
  chequear("la hoja del 3 trae su ventanita, cerrada",r.puerta&&/la de hoy/.test(r.mano),r);
  await pg.click(".t3-adviento-puerta .t3-adviento-v",{force:true});
  await pg.waitForSelector(".t3-adviento-velo .t3x-mapa",{timeout:10000});await pg.waitForTimeout(900);
  await guardar(pg);await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>({mano:(document.querySelector(".t3-adviento-puerta-mano")||{}).innerText||"",mini:!!document.querySelector(".t3-adviento-puerta .t3x-mini-mapa")}));
  chequear("desde la hoja también se abre, y después dice qué tiene adentro",/adentro: un pedazo de mapa/.test(r.mano)&&r.mini,r);
  await pg.screenshot({path:S+"g-puerta.jpg"});
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
