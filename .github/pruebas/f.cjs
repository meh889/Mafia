/* Laboratorio · la tienda (pestaña verde), la ropa de Ponyta y el modo Pou.
   Precios, canjear un pedido por WhatsApp, comprar y ponerle cosas a Ponyta, la camiseta con el escudo,
   cuidarla (nigiris, baño, dormir y el paso de las horas), el paquete "Subite a la Franconeta"
   y canjear herraduras (50 por un sobre con una nola o por 250 MafiaPoints). */
const {servir,abrir,chequear,resumen,motor}=require("./comun.cjs");
const fs=require("fs"),path=require("path");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  const lista=await (async()=>{const x=await abrir(b,base,"2026-12-01");const l=await x.pg.evaluate(()=>T3.tcg.CARTAS.map(c=>c.id));await x.ctx.close();return l;})();
  const tcg=mp=>{const cartas={};lista.slice(0,12).forEach(id=>{cartas[id]={n:1,f:"2026-12-02"};});
    return JSON.stringify({inicio:"2026-12-01",entrega:"2026-12-05",sobres:0,bonos:[],abiertos:6,sinNueva:0,sinFull:0,motivo:"diario",cartas:cartas,mp:mp,jugados:4,ganados:3,torpeza:.3});};
  const base5={"pv-t3-set-escritas":'["2026-12-05"]',"pv-t3-set-abrio":'["2026-12-05"]',"pv-t3-vio-indice":"true"};
  const aTienda=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("pedidos"));await pg.waitForTimeout(1300);};
  const tocar=async(pg,sel)=>{await pg.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:"center"});},sel);await pg.waitForTimeout(150);await pg.click(sel,{force:true});await pg.waitForTimeout(550);};
  const hoja=pg=>pg.evaluate(()=>{const h=document.querySelector(".t3x-compra");if(!h)return null;const a=h.querySelector('a[data-tie="pedir"]');
    return {txt:h.querySelector(".t3x-compra-papel").innerText.replace(/\s+/g," ").trim(),botones:Array.from(h.querySelectorAll("[data-tie]")).map(x=>x.getAttribute("data-tie")),wa:a?decodeURIComponent(a.href):"",ocupa:h.classList.contains("t3x-ocupa")};});
  const libro=pg=>pg.evaluate(()=>({L:T3.leer("tienda",null),mp:T3.tcg.puntos(),saldo:(document.querySelector(".t3x-saldo b")||{}).innerText}));
  const cosa=(pg,id)=>pg.evaluate(id=>{const c=document.querySelector('.t3x-cosa[data-id="'+id+'"]');return c?{txt:c.innerText.replace(/\s+/g," ").trim(),mia:c.classList.contains("t3x-cosa-mia"),puesta:c.classList.contains("t3x-cosa-puesta"),pronto:c.classList.contains("t3x-cosa-pronto")}:null;},id);

  console.log("LOS PRECIOS");
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:Object.assign({"pv-t3-tcg2":tcg(300)},base5)});
  let r=await pg.evaluate(()=>{
    const P=T3.tienda._prueba,R=T3.ropa,t=P.tickets(),c=P.cosas(),de=(l,id)=>(l.filter(x=>x.id===id)[0]||{});
    const out={tickets:t.map(x=>x.id+":"+x.p),cosas:c.map(x=>x.id+":"+x.precio)};
    out.mati={mimos:de(t,"mimos").p,masajitos:de(t,"masajitos").p,helado:de(t,"helado").p,racing:de(c,"racing").precio,pou:de(c,"pou").precio,franconeta:de(c,"franconeta").precio,sorpresa:de(c,"sorpresa").precio};
    out.nombres={franconeta:de(c,"franconeta").nombre,sorpresa:de(c,"sorpresa").nombre,pou:de(c,"pou").nombre,racing:de(c,"racing").nombre};
    out.gratis=t.filter(x=>!(x.p>0)).map(x=>x.id).concat(c.filter(x=>!(x.precio>0)).map(x=>x.id));
    out.ordenados=t.every((x,i)=>!i||x.p>=t[i-1].p);out.comodin=t[t.length-1].id;
    out.prendasMalas=R.ORDEN.filter(id=>{const p=R.PRENDAS[id];return !p||!p.nombre||!p.dice||R.LUGARES.concat(["pared"]).indexOf(p.lugar)<0||["f","m","mp"].indexOf(p.gen)<0||(!p.de&&!(p.precio>0))||
      (p.lugar==="cuerpo"?!p.tela:p.lugar==="pared"?!(p.pared&&p.pared.src):!(p.formas||p.fotos));});
    out.sinOrden=Object.keys(R.PRENDAS).filter(id=>R.ORDEN.indexOf(id)<0);
    /* un precio se puede pisar desde CONFIG.t3.tienda.precios */
    const cfg=T3.config.tienda;out.hayConfig=!!cfg&&typeof cfg.precios==="object";
    if(out.hayConfig){cfg.precios.mimos=30;cfg.precios.boina=90;out.pisado=[de(P.tickets(),"mimos").p,de(P.cosas(),"boina").precio];delete cfg.precios.mimos;delete cfg.precios.boina;out.vuelve=de(P.tickets(),"mimos").p;}
    out.config={duelos:T3.tcg.DUELOS_POR_DIA,victoria:T3.tcg.POR_VICTORIA,cfg:T3.config.tcg};
    return out;
  });
  chequear("los precios que dictó Mati: mimos 40, masajitos 100, helado 250, camiseta de Racing 600, modo Pou 1000, Franconeta 2000, Sorpresa 5000",
    r.mati.mimos===40&&r.mati.masajitos===100&&r.mati.helado===250&&r.mati.racing===600&&r.mati.pou===1000&&r.mati.franconeta===2000&&r.mati.sorpresa===5000,r.mati);
  chequear("se llaman como él los nombró",r.nombres.franconeta==="Subite a la Franconeta"&&r.nombres.sorpresa==="Sorpresa"&&r.nombres.pou==="Modo Pou"&&r.nombres.racing==="Camiseta de Racing",r.nombres);
  chequear("nada es gratis: todo lo de la tienda tiene precio",r.gratis.length===0&&r.tickets.length===10&&r.cosas.length>=12,[r.gratis,r.tickets,r.cosas]);
  chequear("el talonario va de menor a mayor y termina en el comodín",r.ordenados&&r.comodin==="comodin",r.tickets);
  chequear("cada prenda tiene nombre, lugar, precio, género y dibujo, y todas están en la vidriera",r.prendasMalas.length===0&&r.sinOrden.length===0,[r.prendasMalas,r.sinOrden]);
  chequear("un precio se puede pisar desde CONFIG.t3.tienda.precios",r.hayConfig&&r.pisado.join()==="30,90"&&r.vuelve===40,r);
  chequear("en CONFIG: dos duelos por día y 10 puntos por victoria",r.config.duelos===2&&r.config.victoria===10&&r.config.cfg.duelosPorDia===2&&r.config.cfg.puntosPorVictoria===10,r.config);

  console.log("EL TALONARIO, CON 300 MAFIAPOINTS");
  await aTienda(pg);
  await pg.screenshot({path:S+"f-tienda.jpg"});
  r=await pg.evaluate(()=>{const t=Array.from(document.querySelectorAll(".t3x-ticket"));return {titulo:document.querySelector(".t3x-tie h2").innerText,saldo:document.querySelector(".t3x-saldo b").innerText,como:document.querySelector(".t3x-tie-como").innerText,
    lejos:t.filter(x=>x.classList.contains("t3x-ticket-lejos")).map(x=>x.getAttribute("data-id")),links:t.filter(x=>x.hasAttribute("href")).length,
    pestana:(document.querySelector('[data-pest="pedidos"]')||{}).innerText,pie:document.querySelector(".t3x-ped-pie").innerText};});
  chequear("la pestaña verde es la tienda y muestra los MafiaPoints",/tienda/i.test(r.pestana)&&/la tienda/i.test(r.titulo)&&r.saldo==="300"&&/10 por victoria, 2 duelos por día/i.test(r.como),r);
  chequear("marca lo que todavía no alcanza (más de 300) y ningún ticket manda nada con un solo toque",r.lejos.join()==="mila,sushi,comodin"&&r.links===0,r);
  await tocar(pg,'.t3x-ticket[data-id="mimos"]');
  r=await hoja(pg);
  await pg.screenshot({path:S+"f-ticket.jpg"});
  chequear("tocar un ticket abre la hoja con la cuenta y el mensaje armado",r&&r.ocupa&&/Pedido Nº 0001/i.test(r.txt)&&/sale 40/i.test(r.txt)&&/tenés 300/i.test(r.txt)&&/te quedan 260/i.test(r.txt)&&/wa\.me\/\?text=🎟️ Pedido Nº 0001: Mimos\.$/.test(r.wa)&&r.botones.join()==="pedir,cerrar",r);
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await libro(pg);
  chequear("«mejor no» no cobra ni anota nada",r.mp===300&&(r.L===null||!r.L.n)&&await pg.evaluate(()=>!document.querySelector(".t3x-compra.t3x-ver")),r);
  await tocar(pg,'.t3x-ticket[data-id="mimos"]');
  const [pop]=await Promise.all([ctx.waitForEvent("page").catch(()=>null),pg.click('.t3x-compra [data-tie="pedir"]',{force:true})]);
  await pg.waitForTimeout(700);if(pop)await pop.close().catch(()=>{});
  r=await hoja(pg);const l1=await libro(pg);
  await pg.screenshot({path:S+"f-pedido.jpg"});
  chequear("canjear abre WhatsApp, cobra 40 y lo anota con su número",!!pop&&l1.mp===260&&l1.L.n===1&&l1.L.log.length===1&&l1.L.log[0].id==="mimos"&&l1.L.log[0].p===40&&l1.L.log[0].f==="2026-12-05"&&l1.saldo==="260",{pop:!!pop,l1});
  chequear("la hoja queda en «pedido hecho» y deja mandarlo de nuevo sin volver a cobrar",/pedido hecho/i.test(r.txt)&&/te quedan 260/i.test(r.txt)&&await pg.evaluate(()=>{const a=document.querySelector(".t3x-compra-otra");return !!a&&/Pedido Nº 0001: Mimos\./.test(decodeURIComponent(a.href))&&!a.hasAttribute("data-tie");}),r);
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await pg.evaluate(()=>({pie:document.querySelector(".t3x-ped-pie").innerText,veces:(document.querySelector('.t3x-ticket[data-id="mimos"] .t3x-ticket-veces')||{}).innerText,stat:T3.stats()["pedido-mimos"],gastado:T3.stats()["tienda-gastado"],
    lejos:Array.from(document.querySelectorAll(".t3x-ticket-lejos")).map(x=>x.getAttribute("data-id"))}));
  chequear("el talonario lo cuenta: cuántos pedidos van y cuál fue el último",/pedidos hechos: 1/.test(r.pie)&&/último: mimos/.test(r.pie)&&r.veces==="×1"&&r.stat===1&&r.gastado===40,r);
  await tocar(pg,'.t3x-ticket[data-id="mila"]');
  r=await hoja(pg);
  chequear("lo que no alcanza dice cuánto falta y no se puede canjear",/te faltan 90 MafiaPoints/i.test(r.txt)&&r.botones.join()==="cerrar"&&!r.wa,r);
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await pg.evaluate(()=>{const antes=T3.tcg.puntos();return {mas:T3.tcg.gastar(99999),queda:T3.tcg.puntos()===antes,pedir:T3.tienda._prueba.pedir({id:"x",t:"X",p:99999}),n:T3.leer("tienda").n};});
  chequear("no se puede gastar más de lo que hay",r.mas===false&&r.queda&&r.pedir===0&&r.n===1,r);
  await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1500);
  r=await pg.evaluate(()=>({puntos:(document.querySelector(".mq-puntos b")||{}).innerText,link:!!document.querySelector('.mq-a-tienda[data-tcg="tienda"]')}));
  chequear("la pestaña del TCG muestra el mismo saldo y lleva a la tienda",r.puntos==="260"&&r.link,r);
  await pg.click(".mq-a-tienda",{force:true});await pg.waitForTimeout(1900);
  chequear("(de vuelta en la tienda)",await pg.evaluate(()=>!!document.querySelector(".t3x-tie")));

  console.log("LA VIDRIERA DE PONYTA");
  await tocar(pg,'.t3x-cosa[data-id="boina"]');
  r=await hoja(pg);
  await pg.screenshot({path:S+"f-cosa.jpg"});
  chequear("una prenda se ve puesta antes de comprarla, con la cuenta",/Boina de París/.test(r.txt)&&/sale 120/i.test(r.txt)&&/te quedan 140/i.test(r.txt)&&r.botones.join()==="comprar,cerrar"&&await pg.evaluate(()=>!!document.querySelector(".t3x-compra-foto .t3x-prenda-boina")),r);
  await tocar(pg,'.t3x-compra [data-tie="comprar"]');
  r=await hoja(pg);let l=await libro(pg);
  await pg.screenshot({path:S+"f-comprada.jpg"});
  chequear("comprarla cobra, la guarda y se la pone",l.mp===140&&l.L.cosas.boina==="2026-12-05"&&l.L.puesto.cabeza==="boina"&&/se la puso/i.test(r.txt)&&r.botones.join()==="ir-ponyta,cerrar",{l,r});
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await cosa(pg,"boina");
  const dije=()=>pg.evaluate(()=>Array.from(document.querySelectorAll(".t3-ponyta-dije .t3x-prenda")).map(x=>(x.getAttribute("class").match(/t3x-prenda-(\w+)/)||[])[1]).filter((x,i,a)=>a.indexOf(x)===i));
  chequear("en la vidriera figura puesta, y la Ponyta del señalador ya la lleva",r.mia&&r.puesta&&/la tiene puesta/i.test(r.txt)&&(await dije()).join()==="boina",[r,await dije()]);
  await tocar(pg,'.t3x-cosa[data-id="boina"]');
  r=await cosa(pg,"boina");l=await libro(pg);
  chequear("tocarla de nuevo se la saca (queda en el ropero) sin cobrar",r.mia&&!r.puesta&&/en el ropero/i.test(r.txt)&&!l.L.puesto.cabeza&&l.mp===140&&(await dije()).length===0,[r,l.L.puesto]);
  await tocar(pg,'.t3x-cosa[data-id="boina"]');
  await tocar(pg,'.t3x-cosa[data-id="bonete"]');await tocar(pg,'.t3x-compra [data-tie="comprar"]');
  r=await hoja(pg);
  chequear("la tienda habla bien de cada prenda («se lo puso», «se la puso»)",/se lo puso/i.test(r.txt)&&/no se lo quiere sacar/i.test(r.txt),r.txt);
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  l=await libro(pg);
  chequear("lleva una cosa por lugar: el bonete reemplaza a la boina, que queda guardada",l.mp===60&&l.L.puesto.cabeza==="bonete"&&!!l.L.cosas.boina&&(await cosa(pg,"boina")).puesta===false&&(await cosa(pg,"bonete")).puesta===true&&(await dije()).join()==="bonete",l);
  await tocar(pg,'.t3x-cosa[data-id="anteojos"]');await tocar(pg,'.t3x-compra [data-tie="comprar"]');await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  l=await libro(pg);
  chequear("y a la vez puede llevar algo en otro lugar (los anteojos)",l.mp===0&&l.L.puesto.cabeza==="bonete"&&l.L.puesto.cara==="anteojos"&&(await dije()).sort().join()==="anteojos,bonete"&&/los tiene puestos/i.test((await cosa(pg,"anteojos")).txt),l);
  await tocar(pg,'.t3x-cosa[data-id="corona"]');
  r=await hoja(pg);
  chequear("sin puntos, una prenda se puede mirar pero no comprar",/te faltan 200 MafiaPoints/i.test(r.txt)&&r.botones.join()==="cerrar",r);
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await pg.evaluate(()=>{const P=T3.tienda._prueba,c=P.cosas().filter(x=>x.id==="corona")[0];return {compra:P.comprar(c),tiene:T3.tienda.tiene("corona"),mp:T3.tcg.puntos()};});
  chequear("y por adentro tampoco se compra sin puntos",r.compra===false&&!r.tiene&&r.mp===0,r);
  await pg.reload();await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});await pg.waitForTimeout(1800);
  l=await libro(pg);
  chequear("todo queda guardado al recargar: puntos, compras, lo que lleva puesto y los pedidos",l.mp===0&&l.L.n===1&&Object.keys(l.L.cosas).sort().join()==="anteojos,boina,bonete"&&l.L.puesto.cabeza==="bonete"&&l.L.puesto.cara==="anteojos"&&(await dije()).sort().join()==="anteojos,bonete",l);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("LO QUE TODAVÍA NO ESTÁ (LA SORPRESA)");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:Object.assign({"pv-t3-tcg2":tcg(9000)},base5)}));
  await aTienda(pg);
  r={f:await cosa(pg,"franconeta"),s:await cosa(pg,"sorpresa")};
  chequear("la Sorpresa está en la vidriera con su precio, marcada «pronto» y sin contar qué es; la Franconeta ya se vende",r.s.pronto&&!r.f.pronto&&/Subite a la Franconeta/.test(r.f.txt)&&/2000/.test(r.f.txt)&&/5000/.test(r.s.txt)&&!/one direction|1d|banda|recital/i.test(r.s.txt),r);
  await tocar(pg,'.t3x-cosa[data-id="sorpresa"]');
  r=await hoja(pg);
  chequear("aunque alcancen los puntos, lo que dice «pronto» no se puede comprar",/todavía no llegó/i.test(r.txt)&&r.botones.join()==="cerrar",r);
  await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await pg.evaluate(()=>{const P=T3.tienda._prueba;return P.cosas().filter(x=>x.pronto).map(c=>P.comprar(c)).concat([T3.tcg.puntos()]);});
  chequear("ni por adentro: no cobra nada",r.join()==="false,9000",r);

  console.log("LA CAMISETA DE RACING");
  await tocar(pg,'.t3x-cosa[data-id="racing"]');
  r=await hoja(pg);
  chequear("la camiseta sale 600",/Camiseta de Racing/.test(r.txt)&&/sale 600/i.test(r.txt)&&r.botones.join()==="comprar,cerrar",r);
  await pg.waitForTimeout(400);await pg.screenshot({path:S+"f-racing.jpg"});
  await tocar(pg,'.t3x-compra [data-tie="comprar"]');await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  l=await libro(pg);
  chequear("comprada y puesta en el cuerpo",l.mp===8400&&l.L.puesto.cuerpo==="racing",l);
  r=await pg.evaluate(async()=>{
    const out={};
    const color=T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false,ropa:["racing"]});
    out.piezas=(color.match(/t3x-prenda-racing/g)||[]).length;out.moldes=(color.match(/<clipPath/g)||[]).length;
    out.escudo=(color.match(/<image [^>]*racing-escudo\.webp/g)||[]).length;
    /* va adentro del cuerpo: después de su relleno y antes de la tinta y de las patas de adelante */
    const iCam=color.indexOf("t3x-prenda-racing"),iTinta=color.indexOf('data-r="tinta"'),iCuerpo=color.indexOf('data-r="cuerpo"');
    out.adentro=iCuerpo>=0&&iCuerpo<iCam&&iCam<iTinta;
    const lapiz=T3.ponyta.svg({linea:true,quieta:true,ropa:["racing"]});
    out.lapiz={piezas:(lapiz.match(/t3x-prenda-linea/g)||[]).length,imagen:/<image/.test(lapiz),color:/#6FBCEB/i.test(lapiz)};
    const sin=T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false,ropa:[]});out.sin=/t3x-prenda/.test(sin);
    /* el escudo es el archivo que mandó Mati, y carga */
    const img=new Image();img.src=T3.util.asset("tienda/racing-escudo.webp");
    out.carga=await new Promise(ok=>{img.onload=()=>ok(img.naturalWidth+"x"+img.naturalHeight);img.onerror=()=>ok("no");});
    /* Rapidash es una imagen: la camiseta se arma leyendo su dibujo */
    const d=document.createElement("div");d.style.cssText="position:fixed;left:0;top:0;width:300px;height:290px;z-index:99999";d.innerHTML=T3.ponyta.svg({quieta:true,forma:"rapidash",shiny:false,ropa:["racing"]});document.body.appendChild(d);
    for(let i=0;i<40;i++){const s=d.querySelector("svg.t3x-ropa-cuerpo");if(s&&!s.hasAttribute("data-falta")&&s.querySelector(".t3x-prenda-racing"))break;await new Promise(r=>setTimeout(r,100));}
    const s=d.querySelector("svg.t3x-ropa-cuerpo");
    out.rapi={hay:!!s,piezas:s?s.querySelectorAll(".t3x-prenda-racing").length:0,encima:s?s.querySelectorAll(":scope > path").length:0,escudo:s?s.querySelectorAll("image").length:0,falta:s?s.hasAttribute("data-falta"):null};
    d.remove();
    return out;
  });
  chequear("en el dibujo va adentro del cuerpo (torso y manga), con el escudo que mandó Mati",r.piezas===2&&r.moldes===4&&r.escudo===1&&r.adentro&&!r.sin,r);
  chequear("el escudo es una imagen del repo y carga",/^\d+x\d+$/.test(r.carga)&&fs.existsSync(path.resolve(__dirname,"..","..","fotos/t3/tienda/racing-escudo.webp")),r.carga);
  chequear("en el dibujo a lápiz van los bastones en línea, sin colores ni imágenes",r.lapiz.piezas===2&&!r.lapiz.imagen&&!r.lapiz.color,r.lapiz);
  chequear("a Rapidash también le calza: la tela, el escudo y sus llamas por encima",r.rapi.hay&&r.rapi.piezas===2&&r.rapi.encima>=6&&r.rapi.escudo===1&&r.rapi.falta===false,r.rapi);

  console.log("LA ROPA Y EL GORRO DE NAVIDAD");
  r=await pg.evaluate(()=>{
    const out={};
    const hay=(h,c)=>h.indexOf(c)>=0;
    T3.guardar("set-adviento",["2026-12-01"]);          /* abrió la ventanita 1: tiene el gorro */
    out.gorro=T3.viaje.conGorro();
    let h=T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false,gorro:out.gorro});
    out.soloGorro=hay(h,"t3x-gorro")&&hay(h,"t3x-prenda-racing")&&!hay(h,"t3x-prenda-boina");
    const t=T3.leer("tienda");t.cosas.boina="2026-12-05";T3.guardar("tienda",t);T3.ropa.poner("boina",true);
    h=T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false,gorro:out.gorro});
    out.conBoina=!/class="[^"]*t3x-gorro[ "]/.test(h)&&hay(h,"t3x-prenda-boina")&&hay(h,"t3x-prenda-racing");
    out.alta=T3.ropa.enLaCabeza();
    T3.ropa.poner("boina",false);
    h=T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false,gorro:out.gorro});
    out.vuelve=hay(h,"t3x-gorro")&&!hay(h,"t3x-prenda-boina");
    /* un dibujo que no pide ropa (el del mapa, los eventos) no la lleva */
    out.sinPedir=/t3x-prenda/.test(T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false}));
    /* lo que no compró no se puede poner */
    out.ajena=T3.ropa.poner("corona",true);out.puesto=T3.ropa.puesto();
    T3.guardar("set-adviento",[]);
    return out;
  });
  chequear("con el gorro de Navidad puesto, la camiseta va igual",r.gorro&&r.soloGorro,r);
  chequear("si le pone algo en la cabeza, el gorro se guarda; si se lo saca, vuelve",r.conBoina&&r.alta&&r.vuelve,r);
  chequear("solo se viste donde va el gorro (solapa, señalador y hojas), y no se puede poner lo que no compró",!r.sinPedir&&r.ajena===false&&!r.puesto.cabeza,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);

  console.log("EL MODO POU");
  /* la hora fija (las tres de la tarde): de noche Ponyta duerme sola y la prueba daría distinto según cuándo corra */
  const reloj=async pg=>{await pg.evaluate(()=>{window.__h=15;T3.esDeNoche=function(){return window.__h>=23.5||window.__h<7;};
    T3.ahora=function(){const p=T3.hoy.split("-");return new Date(+p[0],+p[1]-1,+p[2],Math.floor(window.__h),Math.round((window.__h%1)*60),0,0);};});};
  await reloj(pg);
  const aPonyta=async pg=>{await pg.evaluate(()=>T3.cuaderno.abrir("ponyta"));await pg.waitForTimeout(2300);};
  const pou=pg=>pg.evaluate(()=>{const p=document.querySelector(".t3x-pou"),pag=document.querySelector(".t3-ponyta-pag");
    const v={};Array.from(document.querySelectorAll(".t3x-pou-barra")).forEach(b=>{v[b.getAttribute("data-k")]=+b.getAttribute("data-v");});
    return {panel:!!p,v:v,duerme:!!pag&&pag.classList.contains("t3-ponyta-duerme"),boton:p?p.querySelector('[data-pou="dormir"]').innerText.trim():"",nota:p?p.querySelector(".t3x-pou-nota").innerText:"",
      globo:((document.querySelector(".t3-ponyta-globo-txt")||{}).innerText||"").trim(),e:T3.leer("pou",null),poco:Array.from(document.querySelectorAll(".t3x-pou-poco")).map(b=>b.getAttribute("data-k"))};});
  await aPonyta(pg);
  r=await pou(pg);
  chequear("sin comprarlo, en la solapa de Ponyta no hay nada del modo Pou",!r.panel&&r.e===null&&!T3pou(await pg.evaluate(()=>T3.pou.activo())),r);
  await aTienda(pg);
  await tocar(pg,'.t3x-cosa[data-id="pou"]');
  r=await hoja(pg);
  chequear("el modo Pou sale 1000",/Modo Pou/.test(r.txt)&&/sale 1000/i.test(r.txt)&&/nigiris/i.test(r.txt)&&r.botones.join()==="comprar,cerrar",r);
  await tocar(pg,'.t3x-compra [data-tie="comprar"]');
  r=await hoja(pg);l=await libro(pg);
  chequear("al comprarlo queda para siempre y ofrece ir a verla",l.mp===7400&&l.L.cosas.pou==="2026-12-05"&&/es tuyo/i.test(r.txt)&&r.botones.join()==="ir-ponyta,cerrar",{l,r});
  await pg.click('.t3x-compra [data-tie="ir-ponyta"]',{force:true});await pg.waitForTimeout(3600);
  r=await pou(pg);
  await pg.screenshot({path:S+"f-pou.jpg"});
  chequear("«ir a verla» lleva a su solapa, que ahora tiene las cuatro barras y los tres botones",r.panel&&Object.keys(r.v).join()==="panza,suenio,limpia,mimos"&&r.v.panza===35&&r.v.suenio===80&&r.v.limpia===55&&r.v.mimos===70&&/a dormir/i.test(r.boton)&&!r.duerme&&await pg.evaluate(()=>document.querySelectorAll(".t3x-pou-botones button").length===3&&!!document.querySelector(".t3-ponyta-postura .t3x-prenda-racing")),r);
  await pg.waitForFunction(()=>{const g=document.querySelector(".t3-ponyta-globo");return g&&!g.classList.contains("t3-ponyta-ver");},null,{timeout:30000}).catch(()=>{});
  // comer
  await pg.click('[data-pou="comer"]',{force:true});await pg.waitForTimeout(250);
  const volando=await pg.evaluate(()=>!!document.querySelector(".t3-ponyta-fx .t3x-pou-nigiri svg"));
  await pg.screenshot({path:S+"f-pou-nigiri.jpg"});
  await pg.waitForTimeout(900);
  r=await pou(pg);
  chequear("un nigiri vuela hasta la boca y le llena 20 de panza",volando&&r.v.panza===55&&Math.round(r.e.panza)===55&&await pg.evaluate(()=>T3.stats()["pou-nigiris"]===1),r);
  for(let i=0;i<3;i++){await pg.click('[data-pou="comer"]',{force:true});await pg.waitForTimeout(1000);}
  await pg.waitForFunction(()=>/no puedo más|ruedo/i.test((document.querySelector(".t3-ponyta-globo-txt")||{}).innerText||""),null,{timeout:6000}).catch(()=>{});
  r=await pou(pg);
  chequear("con cuatro nigiris queda llena (la barra no pasa de 100) y lo dice",r.v.panza===100&&r.e.panza<=100&&/no puedo más|ruedo/i.test(r.globo),r);
  await pg.click('[data-pou="comer"]',{force:true});await pg.waitForTimeout(900);
  r=await pou(pg);
  chequear("llena, no come más",r.v.panza===100&&await pg.evaluate(()=>T3.stats()["pou-nigiris"]===4),r);
  // bañar
  await pg.click('[data-pou="banar"]',{force:true});await pg.waitForTimeout(1300);
  const burbujas=await pg.evaluate(()=>({n:document.querySelectorAll(".t3-ponyta-fx .t3x-pou-burbuja").length,mojada:document.querySelector(".t3-ponyta-pag").classList.contains("t3x-pou-banio"),ocupada:document.querySelector(".t3x-pou").classList.contains("t3x-pou-ocupada")}));
  await pg.screenshot({path:S+"f-pou-banio.jpg"});
  await pg.waitForTimeout(2300);
  r=await pou(pg);
  chequear("el baño la llena de burbujas y la deja limpia",burbujas.n>=6&&burbujas.mojada&&burbujas.ocupada&&r.v.limpia===100&&!await pg.evaluate(()=>document.querySelector(".t3-ponyta-pag").classList.contains("t3x-pou-banio"))&&/bubuja|limpita|agua tibia/i.test(r.globo),{burbujas,r});
  // mimos
  await pg.evaluate(()=>{T3.pou.alMimo();});await pg.waitForTimeout(300);await pg.evaluate(()=>{T3.pou.alMimo();});await pg.waitForTimeout(200);
  r=await pou(pg);
  chequear("cada corazón de mimos suma",r.v.mimos===78,r.v);
  // dormir
  await pg.waitForFunction(()=>{const g=document.querySelector(".t3-ponyta-globo");return g&&!g.classList.contains("t3-ponyta-ver");},null,{timeout:30000}).catch(()=>{});
  await pg.click('[data-pou="dormir"]',{force:true});await pg.waitForTimeout(2600);
  r=await pou(pg);
  await pg.screenshot({path:S+"f-pou-duerme.jpg"});
  chequear("mandarla a dormir la duerme aunque sea de día, y queda anotado",r.duerme&&r.e.dormida===true&&/despertarla/i.test(r.boton),r);
  await pg.waitForTimeout(1200);
  chequear("y no se despierta sola porque sea de día",(await pou(pg)).duerme);
  await pg.click('[data-pou="comer"]',{force:true});await pg.waitForTimeout(500);
  r=await pou(pg);
  chequear("dormida no come ni se baña",r.v.panza===100&&/durmiendo/i.test(r.nota)&&r.duerme,r);
  await pg.reload();await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});await pg.waitForTimeout(1500);
  await reloj(pg);await aPonyta(pg);
  r=await pou(pg);
  chequear("si se cierra la app, al volver sigue durmiendo",r.panel&&r.duerme&&r.e.dormida===true&&/despertarla/i.test(r.boton),r);
  await pg.click('[data-pou="dormir"]',{force:true});await pg.waitForTimeout(900);
  r=await pou(pg);
  chequear("«despertarla» la despierta",!r.duerme&&r.e.dormida===false&&/a dormir/i.test(r.boton),r);
  // tocarla también la despierta
  await pg.waitForFunction(()=>{const g=document.querySelector(".t3-ponyta-globo");return g&&!g.classList.contains("t3-ponyta-ver");},null,{timeout:30000}).catch(()=>{});
  await pg.evaluate(()=>{const e=T3.pou._prueba.estado();e.suenio=40;T3.pou._prueba.guardar(e);});
  await pg.click('[data-pou="dormir"]',{force:true});await pg.waitForTimeout(2600);
  const dormida2=(await pou(pg)).duerme;
  const caja=await pg.locator(".t3-ponyta-postura").boundingBox();
  await pg.mouse.move(caja.x+caja.width*.55,caja.y+caja.height*.5);await pg.mouse.down();await pg.waitForTimeout(80);await pg.mouse.up();await pg.waitForTimeout(700);
  r=await pou(pg);
  chequear("si la tocan dormida, se despierta (y el modo Pou se entera)",dormida2&&!r.duerme&&r.e.dormida===false&&/a dormir/i.test(r.boton),{dormida2,r});

  console.log("EL PASO DE LAS HORAS");
  r=await pg.evaluate(()=>{
    const P=T3.pou._prueba,H=3600000,ah=T3.ahora().getTime(),out={};
    const con=(o)=>Object.assign({t:ah,panza:100,suenio:100,limpia:100,mimos:100,dormida:false},o);
    const red=e=>({panza:Math.round(e.panza),suenio:Math.round(e.suenio),limpia:Math.round(e.limpia),mimos:Math.round(e.mimos),dormida:e.dormida});
    let e=con({t:ah-4*H});P.alDia(e);out.cuatro=red(e);                                 /* 11 a 15 hs, despierta */
    e=con({t:ah-4*H,dormida:true,suenio:20});const sola=P.alDia(e);out.siesta=red(e);out.sola=sola;      /* durmió hasta llenarse (3,2 h) y se despertó */
    e=con({t:ah-1*H,dormida:true,suenio:20});out.sigue=[P.alDia(e),red(e)];            /* una hora de siesta: sigue durmiendo */
    e=con({t:ah-24*H});P.alDia(e);out.dia=red(e);                                       /* un día entero sin abrir */
    e=con({t:ah-24*5*H});P.alDia(e);out.cinco=red(e);                                   /* cinco días */
    e=con({t:ah+3*H});P.alDia(e);out.atras=red(e);out.atrasT=e.t===ah;                  /* reloj para atrás (máquina del tiempo): no rompe nada */
    out.noche=[P.horasDeNoche(new Date(2026,11,5,22,0).getTime(),new Date(2026,11,6,9,0).getTime()),P.horasDeNoche(new Date(2026,11,5,10,0).getTime(),new Date(2026,11,5,20,0).getTime())];
    out.peor=[P.peor(con({panza:10,limpia:20})),P.peor(con({})),P.peor(con({mimos:29}))];
    return out;
  });
  chequear("despierta, en cuatro horas baja un poco de todo",r.cuatro.panza===88&&r.cuatro.suenio===80&&r.cuatro.limpia===94&&r.cuatro.mimos===88,r.cuatro);
  chequear("una siesta llena el sueño y se despierta sola; con una hora sola sigue durmiendo",r.sola===true&&r.siesta.suenio>=96&&r.siesta.dormida===false&&r.sigue[0]===false&&r.sigue[1].dormida===true&&r.sigue[1].suenio===45,[r.siesta,r.sigue]);
  chequear("de noche duerme sola: tras un día entero el sueño no se vacía y tiene hambre, sin llegar a cero",Math.abs(r.noche[0]-7.5)<.3&&r.noche[1]===0&&r.dia.suenio>=90&&r.dia.panza>20&&r.dia.panza<50&&r.dia.limpia>50&&r.dia.mimos>30&&r.dia.mimos<60,[r.noche,r.dia]);
  chequear("nunca baja de 0 ni rompe si el reloj va para atrás",r.cinco.panza===0&&r.cinco.limpia===0&&r.cinco.mimos===0&&r.cinco.suenio>=0&&r.atras.panza===100&&r.atrasT,[r.cinco,r.atras]);
  chequear("avisa lo que más le falta, solo si es poco",r.peor.join()==="panza,,mimos",r.peor);
  // con hambre, lo dice ella
  await pg.evaluate(()=>{const P=T3.pou._prueba,e=P.estado();e.panza=8;e.suenio=90;e.limpia=90;e.mimos=90;e.t=T3.ahora().getTime();e.dormida=false;P.guardar(e);});
  await pg.evaluate(()=>T3.cuaderno.irA("2026-12-05"));await pg.waitForTimeout(1200);
  await aPonyta(pg);
  await pg.waitForFunction(()=>/hambre|panza|nigiris/i.test((document.querySelector(".t3-ponyta-globo-txt")||{}).innerText||""),null,{timeout:40000}).catch(()=>{});
  r=await pou(pg);
  await pg.screenshot({path:S+"f-pou-hambre.jpg"});
  chequear("si volvés y tiene hambre, la barra queda marcada y ella lo dice (después de lo del día)",r.poco.join()==="panza"&&/hambre|panza|nigiris/i.test(r.globo),r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("SUBITE A LA FRANCONETA");
  const IMAGENES=["alpine-auto.webp","alpine-remera.webp","alpine-logo.webp","franco.webp"];
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:Object.assign({"pv-t3-tcg2":tcg(2100)},base5)}));
  await reloj(pg);await aTienda(pg);
  r=await pg.evaluate(()=>({sueltas:["f1","alpine","franco"].map(id=>!!document.querySelector('.t3x-cosa[data-id="'+id+'"]')).join(),
    logo:(function(i){return !!i&&/alpine-logo\.webp$/.test(i.getAttribute("src"))&&i.complete&&i.naturalWidth>0;})(document.querySelector('.t3x-cosa[data-id="franconeta"] img.t3x-cosa-logo'))}));
  chequear("antes de comprarla, sus piezas no se venden sueltas, y la tarjeta lleva el logo que mandó Mati",r.sueltas==="false,false,false"&&r.logo,r);
  await tocar(pg,'.t3x-cosa[data-id="franconeta"]');
  r=await hoja(pg);
  chequear("sale 2000",/Subite a la Franconeta/.test(r.txt)&&/sale 2000/i.test(r.txt)&&/te quedan 100/i.test(r.txt)&&r.botones.join()==="comprar,cerrar",r);
  await tocar(pg,'.t3x-compra [data-tie="comprar"]');
  l=await libro(pg);
  chequear("comprarla trae el auto, la remera y la foto, y se pone todo",l.mp===100&&["franconeta","f1","alpine","franco"].every(id=>l.L.cosas[id]==="2026-12-05")&&l.L.puesto.juguete==="f1"&&l.L.puesto.cuerpo==="alpine"&&l.L.puesto["pared-franco"]==="franco",l);
  await pg.click('.t3x-compra [data-tie="ir-ponyta"]',{force:true});await pg.waitForTimeout(3600);
  r=await pg.evaluate(async(IMAGENES)=>{
    const carga=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i.naturalWidth>0);i.onerror=()=>ok(false);i.src=src;});
    const post=document.querySelector(".t3-ponyta-postura"),pared=document.querySelector(".t3x-pared");
    return {auto:!!post.querySelector('image[href$="alpine-auto.webp"]'),remera:post.querySelectorAll('.t3x-prenda-alpine image[href$="alpine-remera.webp"]').length,
      pared:!!pared,foto:pared?pared.querySelectorAll('.t3x-pegada img[src$="franco.webp"]').length:0,pie:pared?pared.querySelector("figcaption").innerText:"",
      cargan:await Promise.all(IMAGENES.map(f=>carga(T3.util.asset("tienda/"+f))))};
  },IMAGENES);
  await pg.screenshot({path:S+"f-franconeta.jpg"});
  chequear("en su solapa: el Alpine de juguete a sus pies, la remera puesta y la foto pegada en su pared",r.auto&&r.remera===2&&r.pared&&r.foto===1&&r.pie==="mi ídolo",r);
  /* el auto es un juguete (pedido de Mati): chico y en el piso, no un auto en el que ella va adentro */
  const tam=await pg.evaluate(()=>{const i=document.querySelector('.t3-ponyta-postura image[href$="alpine-auto.webp"]');return {w:+i.getAttribute("width"),y:+i.getAttribute("y"),h:+i.getAttribute("height")};});
  chequear("el auto es de juguete: mide menos de la mitad que Ponyta y está apoyado en el piso",tam.w<140&&tam.y>240&&tam.y+tam.h<292,tam);
  chequear("las cuatro imágenes que mandó Mati están en el repo y cargan",r.cargan.every(Boolean)&&IMAGENES.every(f=>fs.existsSync(path.resolve(__dirname,"..","..","fotos/t3/tienda/"+f))),r.cargan);
  await pg.evaluate(()=>{const h=document.querySelector(".t3-cuaderno-especial-host");h.scrollTo(0,h.scrollHeight);});await pg.waitForTimeout(400);
  await pg.screenshot({path:S+"f-pared.jpg"});
  await aTienda(pg);
  r={f1:await cosa(pg,"f1"),al:await cosa(pg,"alpine"),fr:await cosa(pg,"franco"),pk:await cosa(pg,"franconeta")};
  chequear("después sus piezas aparecen sueltas en la vidriera, cada una dicha a su manera",r.f1.puesta&&/lo tiene con ella/i.test(r.f1.txt)&&r.al.puesta&&/la tiene puesta/i.test(r.al.txt)&&r.fr.puesta&&/pegada en su hoja/i.test(r.fr.txt)&&r.pk.mia&&/ya es tuyo/i.test(r.pk.txt),r);
  await tocar(pg,'.t3x-cosa[data-id="franco"]');await tocar(pg,'.t3x-cosa[data-id="f1"]');
  l=await libro(pg);
  chequear("guarda el auto y despega la foto sin perder nada",!l.L.puesto.juguete&&!l.L.puesto["pared-franco"]&&l.L.puesto.cuerpo==="alpine"&&!!l.L.cosas.f1&&!!l.L.cosas.franco&&l.mp===100&&/guardada/i.test((await cosa(pg,"franco")).txt),l.L.puesto);
  r=await pg.evaluate(()=>{const h=T3.ponyta.svg({linea:true,quieta:true,ropa:["alpine","f1"]}),c=T3.ponyta.svg({quieta:true,forma:"ponyta",shiny:false,ropa:["alpine","f1"]});
    return {imagen:/<image/.test(h),lineas:(h.match(/t3x-prenda-linea/g)||[]).length,color:(c.match(/<image /g)||[]).length,sinPared:T3.ropa.enLaPared().length};});
  chequear("en el dibujo a lápiz de las hojas no van fotos (solo el corte de la remera); a color, el auto y la remera",!r.imagen&&r.lineas===2&&r.color===3&&r.sinPared===0,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("CANJEAR HERRADURAS");
  /* las herraduras son las marcas que deja Ponyta al correr: una por día */
  const diasDesde=(n)=>{const l=[];for(let d=new Date(2026,9,1);l.length<n;d.setDate(d.getDate()+1))l.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));return l;};
  const conHuellas=(n,mas)=>Object.assign({"pv-t3-tcg2":tcg(30),"pv-t3-set-ponyta-huellas-dias":JSON.stringify(diasDesde(n)),"pv-t3-stats":JSON.stringify({huellas:n})},base5,mas||{});
  const herr=pg=>pg.evaluate(()=>{const d=document.querySelector(".t3x-herr"),b=d&&d.querySelector('[data-herr="abrir"]');
    return {hay:!!d,n:d?d.querySelector(".t3x-herr-n b").innerText:"",boton:b?b.innerText.trim():"",apagado:!!b&&b.getAttribute("aria-disabled")==="true",nota:d?d.querySelector(".t3x-herr-nota").innerText:"",
      marcas:document.querySelectorAll(".t3-ponyta-huellas-svg .t3-ponyta-huella").length,tapas:document.querySelectorAll(".t3-ponyta-huellas-svg .t3x-herr-tapa").length,
      sueltas:T3.herraduras.sueltas(),total:T3.herraduras.total(),L:T3.leer("herraduras",null),mp:T3.tcg.puntos(),nolas:T3.leer("tcg2").nolas||0}});
  const hojaH=pg=>pg.evaluate(()=>{const h=document.querySelector(".t3x-herr-hoja.t3x-ver");return h?{txt:h.querySelector(".t3x-compra-papel").innerText.replace(/\s+/g," ").trim(),
    botones:Array.from(h.querySelectorAll("[data-herr]")).map(x=>x.getAttribute("data-herr")+(x.disabled?"(no)":"")).join()}:null;});
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:conHuellas(53)}));
  await reloj(pg);await aPonyta(pg);
  r=await herr(pg);
  chequear("en su solapa, arriba del rastro, dice cuántas herraduras tiene y ofrece canjear 50",r.hay&&r.n==="53"&&/canjear 50/i.test(r.boton)&&!r.apagado&&/50 = un sobre con una nola, o 250 MafiaPoints/.test(r.nota)&&r.marcas===53&&r.tapas===0&&r.total===53,r);
  chequear("los números están en CONFIG",await pg.evaluate(()=>T3.config.herraduras.cada===50&&T3.config.herraduras.puntos===250&&T3.herraduras.CADA===50&&T3.herraduras.PUNTOS===250));
  await tocar(pg,'[data-herr="abrir"]');
  r=await hojaH(pg);
  await pg.screenshot({path:S+"f-herraduras.jpg"});
  chequear("la hoja deja elegir: un sobre con una nola o 250 MafiaPoints",r&&/50 herraduras/i.test(r.txt)&&/tenés 53/i.test(r.txt)&&r.botones==="nola,puntos,cerrar",r);
  await tocar(pg,'.t3x-herr-hoja [data-herr="cerrar"]');
  r=await herr(pg);
  chequear("«mejor no» no gasta nada",r.n==="53"&&r.L===null&&r.mp===30,r);
  await tocar(pg,'[data-herr="abrir"]');await tocar(pg,'.t3x-herr-hoja [data-herr="puntos"]');
  r=await hojaH(pg);l=await herr(pg);
  chequear("canjear por puntos: suma 250 MafiaPoints y gasta 50 herraduras",/\+250 MafiaPoints/.test(r.txt)&&/ahora tenés 280/i.test(r.txt)&&l.mp===280&&l.L.canjes===1&&l.L.log[0].por==="puntos"&&l.L.log[0].f==="2026-12-05"&&l.sueltas===3&&l.n==="3",{r,l});
  chequear("las marcas no se borran: quedan las 53, y las 50 canjeadas se apagan",l.marcas===53&&l.tapas===50&&l.total===53,l);
  await tocar(pg,'.t3x-herr-hoja [data-herr="cerrar"]');
  r=await herr(pg);
  chequear("con 3 no alcanza: el botón dice cuántas faltan",/faltan 47/i.test(r.boton)&&r.apagado,r);
  await tocar(pg,'[data-herr="abrir"]');
  chequear("y no abre la hoja ni deja canjear por adentro",await hojaH(pg)===null&&await pg.evaluate(()=>T3.herraduras.canjear("puntos")===false&&T3.herraduras.canjear("nola")===false&&T3.tcg.puntos()===280));
  await pg.evaluate(()=>T3.cuaderno.abrir("pedidos"));await pg.waitForTimeout(1300);
  chequear("los puntos canjeados son los mismos de la tienda",await pg.evaluate(()=>document.querySelector(".t3x-saldo b").innerText==="280"));
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  // el sobre de una carta
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:conHuellas(104)}));
  await reloj(pg);await aPonyta(pg);
  r=await herr(pg);
  chequear("con 104 herraduras alcanza para dos canjes",r.n==="104"&&r.marcas===104,r);
  await tocar(pg,'[data-herr="abrir"]');await tocar(pg,'.t3x-herr-hoja [data-herr="nola"]');
  r=await hojaH(pg);l=await herr(pg);
  chequear("canjear por el sobre: queda un sobre de herraduras esperando en el TCG",/hay sobre/i.test(r.txt)&&/una sola carta/i.test(r.txt)&&/nola seguro/i.test(r.txt)&&l.nolas===1&&l.L.canjes===1&&l.L.log[0].por==="nola"&&l.sueltas===54&&l.mp===30,{r,l});
  await pg.click('.t3x-herr-hoja [data-herr="ir-tcg"]',{force:true});await pg.waitForTimeout(2600);
  r=await pg.evaluate(()=>{const m=document.querySelector(".t3x-tcg-mesa-nola");return {mesa:!!m,txt:m?m.innerText.replace(/\s+/g," "):"",sobre:m?m.querySelector(".t3x-sobre-set").innerText:"",punto:document.querySelector(".t3-cuaderno-pestana-tcg").classList.contains("t3-cuaderno-con-sobre"),e:T3.leer("tcg2")};});
  await pg.screenshot({path:S+"f-herr-tcg.jpg"});
  chequear("«ir a abrirlo» lleva al TCG, donde está el sobre de herraduras (una carta, nola segura)",r.mesa&&/sobre de herraduras/i.test(r.txt)&&/nola, seguro/i.test(r.txt)&&/1 nola/i.test(r.sobre)&&r.punto,r);
  const antesN=Object.keys(r.e.cartas).length,antesAb=r.e.abiertos;
  await tocar(pg,".t3x-tcg-abrir-nola");
  await pg.click(".t3x-ap-sobre",{force:true});await pg.waitForTimeout(1700);
  r=await pg.evaluate(()=>({cartas:document.querySelectorAll(".t3x-ap-carta").length,rotulo:document.querySelector(".t3x-ap-rotulo").innerText}));
  chequear("el sobre de herraduras trae una sola carta",r.cartas===1&&/sobre de herraduras/i.test(r.rotulo),r);
  await pg.click('.t3x-ap-carta[data-i="0"]',{force:true});await pg.waitForTimeout(1500);
  await pg.screenshot({path:S+"f-herr-nola.jpg"});
  r=await pg.evaluate(()=>({sello:document.querySelector(".t3x-ap-sello").innerText,nola:document.querySelector(".t3x-ap-sello").classList.contains("t3x-ap-nola")}));
  await pg.mouse.click(195,790);await pg.waitForTimeout(800);
  await pg.click(".t3x-ap-listo",{force:true});await pg.waitForTimeout(900);
  l=await pg.evaluate(()=>{const e=T3.leer("tcg2");return {n:Object.keys(e.cartas).length,nolas:e.nolas,abiertos:e.abiertos,nolasAbiertas:e.nolasAbiertas,mesa:!!document.querySelector(".t3x-tcg-mesa-nola"),recien:document.querySelectorAll(".t3x-recien").length};});
  chequear("y es una nola: suma una carta nueva a la carpeta, y no cuenta como sobre común",/nola/i.test(r.sello)&&r.nola&&l.n===antesN+1&&l.nolas===0&&l.abiertos===antesAb&&l.nolasAbiertas===1&&!l.mesa&&l.recien===1,{r,l});
  r=await pg.evaluate(()=>{
    const P=T3.tcg._prueba,C=T3.tcg.CARTAS,out={malas:0,largos:0,gastaNola:0};
    /* muchos sobres de herraduras, con carpetas al azar: siempre una carta, siempre nueva */
    for(let k=0;k<400;k++){
      const e={cartas:{},bonos:[],sobres:0,nolas:1,abiertos:5,sinNueva:1,sinFull:1};
      C.forEach(c=>{if(Math.random()<.8)e.cartas[c.id]={n:1,f:"x"};});
      const antes=P.tengo(e);if(antes>=P.TOTAL)continue;
      const t=P.tirarNola(e);
      if(t.length!==1)out.largos++;
      if(!t[0].nueva||P.tengo(e)!==antes+1)out.malas++;
      if(e.nolas!==0||e.abiertos!==5)out.gastaNola++;
    }
    /* con una sola carta por conseguir, sale esa */
    const casi={cartas:{},bonos:[],sobres:0,nolas:1,abiertos:9,sinNueva:0,sinFull:0};C.slice(1).forEach(c=>{casi.cartas[c.id]={n:1,f:"x"};});
    const u=P.tirarNola(casi);out.ultima=u[0].id===C[0].id&&u[0].nueva&&casi.completo===T3.hoy;
    return out;
  });
  chequear("un sobre de herraduras siempre trae una carta que no tenía (400 pruebas), hasta la última del álbum",r.malas===0&&r.largos===0&&r.gastaNola===0&&r.ultima,r);
  // con el álbum completo no hay nola posible
  r=await pg.evaluate(()=>{
    const P=T3.tcg._prueba,e=P.estado();T3.tcg.CARTAS.slice(1).forEach(c=>{if(!e.cartas[c.id])e.cartas[c.id]={n:1,f:T3.hoy};});delete e.cartas[T3.tcg.CARTAS[0].id];e.nolas=1;P.guardar(e);
    const out={faltanConUnaPendiente:T3.tcg.faltan(),otra:T3.tcg.darNola(),canje:T3.herraduras.canjear("nola"),canjes:T3.leer("herraduras").canjes};
    e.nolas=0;e.cartas[T3.tcg.CARTAS[0].id]={n:1,f:T3.hoy};P.guardar(e);
    out.faltanCompleto=T3.tcg.faltan();out.nolaCompleto=T3.tcg.darNola();
    return out;
  });
  chequear("si la única que falta ya viene en un sobre sin abrir, o si el álbum está completo, no da otro (ni gasta herraduras)",r.faltanConUnaPendiente===0&&r.otra===false&&r.canje===false&&r.canjes===1&&r.faltanCompleto===0&&r.nolaCompleto===false,r);
  await pg.evaluate(()=>T3.cuaderno.abrir("ponyta"));await pg.waitForTimeout(3200);
  await tocar(pg,'[data-herr="abrir"]');
  r=await hojaH(pg);
  chequear("con el álbum completo la hoja solo ofrece los puntos",r&&/ya tenés todas/i.test(r.txt)&&r.botones==="nola(no),puntos,cerrar",r);
  await tocar(pg,'.t3x-herr-hoja [data-herr="puntos"]');await tocar(pg,'.t3x-herr-hoja [data-herr="cerrar"]');
  l=await herr(pg);
  chequear("segundo canje, por puntos: quedan 4 herraduras y 100 marcas apagadas",l.mp===280&&l.L.canjes===2&&l.sueltas===4&&l.marcas===104&&l.tapas===100,l);
  await pg.reload();await pg.waitForFunction(()=>window.T3&&document.querySelector(".t3-cuaderno-hoja"),null,{timeout:15000});await pg.waitForTimeout(1500);
  chequear("queda guardado al recargar",await pg.evaluate(()=>T3.herraduras.sueltas()===4&&T3.leer("herraduras").canjes===2&&T3.tcg.puntos()===280));
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  // antes del estreno no hay nada que canjear (el TCG todavía no existe para ella)
  ({ctx,pg,errores}=await abrir(b,base,"2026-11-12",{semilla:Object.assign(conHuellas(42),{"pv-t3-set-escritas":'["2026-11-12"]',"pv-t3-set-abrio":'["2026-11-12"]'})}));
  await reloj(pg);await aPonyta(pg);
  r=await pg.evaluate(()=>({pag:!!document.querySelector(".t3-ponyta-pag"),herr:!!document.querySelector(".t3x-herr"),activo:T3.herraduras.activo(),canje:T3.herraduras.canjear("puntos"),marcas:document.querySelectorAll(".t3-ponyta-huellas-svg .t3-ponyta-huella").length}));
  chequear("antes del estreno la solapa no ofrece canjear nada (las marcas están como siempre)",r.pag&&!r.herr&&!r.activo&&r.canje===false&&r.marcas===42,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  console.log("RAPIDASH, Y LOS PUNTOS DE PRUEBA DEL TALLER");
  ({ctx,pg,errores}=await abrir(b,base,"2026-12-05",{semilla:Object.assign({"pv-t3-tcg2":tcg(50),"pv-t3-ponyta-evolucion":'"rapidash"',
    "pv-t3-tienda":JSON.stringify({cosas:{pou:"2026-12-03",racing:"2026-12-03",corona:"2026-12-04"},puesto:{cuerpo:"racing",cabeza:"corona"},n:0,log:[]})},base5)}));
  await reloj(pg);await aPonyta(pg);
  await pg.waitForFunction(()=>{const s=document.querySelector(".t3-ponyta-postura svg.t3x-ropa-cuerpo");return s&&!s.hasAttribute("data-falta");},null,{timeout:8000}).catch(()=>{});
  r=await pg.evaluate(()=>({rapi:document.querySelector(".t3-ponyta-pag").classList.contains("t3-ponyta-es-rapidash"),camiseta:document.querySelectorAll(".t3-ponyta-postura svg.t3x-ropa-cuerpo .t3x-prenda-racing").length,
    corona:!!document.querySelector(".t3-ponyta-postura .t3x-ropa-rapi .t3x-prenda-corona"),panel:!!document.querySelector(".t3x-pou")}));
  await pg.screenshot({path:S+"f-rapidash.jpg"});
  chequear("evolucionada a Rapidash, en su solapa lleva la camiseta y la corona, y también se la cuida",r.rapi&&r.camiseta===2&&r.corona&&r.panel,r);
  await pg.waitForFunction(()=>{const g=document.querySelector(".t3-ponyta-globo");return g&&!g.classList.contains("t3-ponyta-ver");},null,{timeout:30000}).catch(()=>{});
  await pg.click('[data-pou="comer"]',{force:true});await pg.waitForTimeout(1200);
  chequear("y come igual",(await pou(pg)).v.panza===55);
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(700);
  r=await pg.evaluate(()=>Array.from(document.querySelectorAll(".t3x-taller [data-taller]")).map(x=>x.getAttribute("data-taller")));
  chequear("fuera de la máquina del tiempo, el taller no regala puntos ni herraduras",!r.includes("tcg-puntos")&&!r.includes("tcg-herraduras"),r);
  await Promise.all([pg.waitForNavigation({waitUntil:"load"}),pg.evaluate(()=>{const c=T3.maquina._capa();c.sel.limpio=false;c.ponerFecha("2026-12-07");c.viajar();})]);
  await pg.waitForFunction(()=>window.T3&&(document.querySelector(".t3-cuaderno-hoja")||document.querySelector(".t3-cuaderno-evento")),null,{timeout:15000});await pg.waitForTimeout(1500);
  await pg.evaluate(()=>T3.maquina.abrir());await pg.waitForTimeout(700);
  await pg.evaluate(()=>{document.querySelector('[data-taller="tcg-puntos"]').scrollIntoView({block:"center"});});await pg.waitForTimeout(200);
  await pg.click('[data-taller="tcg-puntos"]');await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>({mp:T3.tcg.puntos(),msj:(document.querySelector(".t3x-taller-msj")||{}).innerText,maquina:!!T3.preview}));
  chequear("adentro de la máquina, «+1000 puntos» suma para probar la tienda",r.maquina&&r.mp===1050&&/1000 MafiaPoints/.test(r.msj),r);
  await pg.click('[data-taller="tcg-herraduras"]');await pg.waitForTimeout(400);
  r=await pg.evaluate(()=>({sueltas:T3.herraduras.sueltas(),msj:(document.querySelector(".t3x-taller-msj")||{}).innerText,fila:(document.querySelector('[data-detalle="cartas"]')||{}).innerText}));
  chequear("y «+50 herraduras» da para probar el canje",r.sueltas===50&&/50 herraduras/.test(r.msj)&&/50 herraduras/.test(r.fila),r);
  await pg.evaluate(()=>T3.maquina.cerrar(true));await pg.waitForTimeout(300);
  await pg.evaluate(()=>T3.cuaderno.irA(T3.hoy));await pg.waitForTimeout(1000);
  await aTienda(pg);
  await tocar(pg,'.t3x-cosa[data-id="boina"]');await tocar(pg,'.t3x-compra [data-tie="comprar"]');await tocar(pg,'.t3x-compra [data-tie="cerrar"]');
  r=await pg.evaluate(()=>({mp:T3.tcg.puntos(),boina:T3.tienda.tiene("boina")}));
  chequear("y con esos puntos se compra, adentro de la máquina",r.mp===930&&r.boina,r);
  await Promise.all([pg.waitForNavigation({waitUntil:"load"}),pg.evaluate(()=>{T3.maquina.volverAHoy();})]);
  await pg.waitForFunction(()=>window.T3&&(document.querySelector(".t3-cuaderno-hoja")||document.querySelector(".t3-cuaderno-evento")),null,{timeout:15000});await pg.waitForTimeout(1200);
  r=await pg.evaluate(()=>({maquina:!!T3.preview,mp:T3.tcg.puntos(),boina:T3.tienda.tiene("boina"),pou:T3.tienda.tiene("pou"),panza:Math.round(T3.pou._prueba.estado().panza),herr:T3.herraduras.total()}));
  chequear("al salir de la máquina no queda nada: ni los puntos ni las herraduras regaladas, ni lo comprado",!r.maquina&&r.mp===50&&!r.boina&&r.pou&&r.herr===0,r);
  chequear("sin errores de JavaScript",errores.length===0,errores);
  await ctx.close();
  await b.close();srv.close();process.exit(resumen()?1:0);
  function T3pou(x){return x;}
})().catch(e=>{console.error(e);process.exit(1);});
