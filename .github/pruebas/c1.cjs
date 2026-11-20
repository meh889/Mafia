/* Laboratorio · MafiaTCG: recorrido del primer día con capturas (sobres, carpeta, lupa) y una hoja con todas las cartas */
const {servir,abrir,chequear,resumen,motor,externo}=require("./comun.cjs");
const S=(process.env.SALIDA||require("os").tmpdir())+"/";
(async()=>{
  const srv=await servir(),base="http://127.0.0.1:"+srv.address().port,b=await motor().launch();
  let {ctx,pg,errores}=await abrir(b,base,"2026-12-01",{dpr:2,semilla:{"pv-t3-set-escritas":'["2026-12-01"]',"pv-t3-set-abrio":'["2026-12-01"]',"pv-t3-vio-indice":"true"}});
  /* azar fijo, para que las capturas sean siempre las mismas */
  await pg.evaluate(()=>{let s=20261201;Math.random=function(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};});
  const total=await pg.evaluate(()=>T3.tcg.CARTAS.length);
  await pg.screenshot({path:S+"c-pestana.jpg",clip:{x:0,y:0,width:390,height:120}});
  await pg.evaluate(()=>T3.cuaderno.abrir("tcg"));await pg.waitForTimeout(1300);
  await pg.evaluate(()=>document.fonts.ready);
  await pg.screenshot({path:S+"c-pagina.jpg"});
  let r=await pg.evaluate(()=>{const tx=s=>(document.querySelector(s)||{}).innerText||"";
    return {hay:tx(".t3x-tcg-hay"),nota:tx(".t3x-tcg-nota"),jugar:tx(".mq-jugar"),tenes:tx(".mq-tenes"),huecos:document.querySelectorAll(".t3x-hueco").length,minis:document.querySelectorAll(".t3x-mini:not(.t3x-hueco)").length,
      logo:(function(i){return !!i&&i.complete&&i.naturalWidth>0;})(document.querySelector(".mq-logo")),letra:document.fonts.check('800 italic 20px "Barlow Condensed"')};});
  chequear("primer día: dos sobres de bienvenida, la notita, la carpeta vacía y el duelo cerrado",/Hay 2 sobres/.test(r.hay)&&/bienvenida/.test(r.hay)&&/Lo prometido/.test(r.nota)&&/te faltan 10/i.test(r.jugar)&&r.huecos===total&&r.minis===0,r);
  chequear("cargan el logo y la tipografía de las cartas",r.logo&&r.letra,r);
  await pg.click(".t3x-tcg-abrir",{force:true});await pg.waitForTimeout(900);
  await pg.screenshot({path:S+"c-sobre.jpg"});
  await pg.click(".t3x-ap-sobre",{force:true});await pg.waitForTimeout(1700);
  await pg.screenshot({path:S+"c-fila.jpg"});
  r=await pg.evaluate(()=>({dorsos:document.querySelectorAll(".t3x-ap-atras .mt-dorso img.mt-logo").length,full:document.querySelectorAll(".t3x-ap-carta.t3x-ap-full").length,
    tapadas:Array.from(document.querySelectorAll(".t3x-ap-frente")).every(f=>getComputedStyle(f).visibility==="hidden")}));
  chequear("las tres cartas salen boca abajo, con el logo en el dorso; la full art del primer sobre es la tercera",r.dorsos===3&&r.full===1&&r.tapadas,r);
  await pg.click('.t3x-ap-carta[data-i="0"]',{force:true});await pg.waitForTimeout(1500);
  await pg.screenshot({path:S+"c-carta1.jpg"});
  r=await pg.evaluate(()=>{const c=document.querySelector('.t3x-ap-carta[data-i="0"]');return {vuelta:c.classList.contains("t3x-vuelta"),frente:getComputedStyle(c.querySelector(".t3x-ap-frente")).visibility,atras:getComputedStyle(c.querySelector(".t3x-ap-atras")).visibility,sello:c.querySelector(".t3x-ap-sello").textContent};});
  chequear("al tocarla se da vuelta y se sella como nueva",r.vuelta&&r.frente==="visible"&&r.atras==="hidden"&&/nola/.test(r.sello),r);
  await pg.mouse.click(195,790);await pg.waitForTimeout(800);
  await pg.click('.t3x-ap-carta[data-i="2"]',{force:true});await pg.waitForTimeout(1600);
  await pg.screenshot({path:S+"c-carta3.jpg"});
  chequear("la full art lo dice al darse vuelta",/full art/i.test(await pg.locator(".t3x-ap-pista").innerText()));
  await pg.mouse.click(195,790);await pg.waitForTimeout(700);
  await pg.click('.t3x-ap-carta[data-i="1"]',{force:true});await pg.waitForTimeout(1400);
  await pg.mouse.click(195,790);await pg.waitForTimeout(900);
  await pg.screenshot({path:S+"c-fin.jpg"});
  await pg.click(".t3x-ap-listo",{force:true});await pg.waitForTimeout(1300);
  await pg.screenshot({path:S+"c-carpeta.jpg"});
  r=await pg.evaluate(()=>({minis:document.querySelectorAll(".t3x-mini:not(.t3x-hueco)").length,full:document.querySelectorAll(".t3x-mini-full").length,recien:document.querySelectorAll(".t3x-recien").length,
    jugar:document.querySelector(".mq-jugar").innerText,si:document.querySelectorAll(".mq-diez i.mq-si").length,
    chicas:Array.from(document.querySelectorAll(".t3x-mini .mt-carta img")).every(i=>/\/tcg\/mini\//.test(i.getAttribute("src")))}));
  chequear("las tres quedan en la carpeta (con la foto chica) y el duelo cuenta cuántas faltan",r.minis===3&&r.full===1&&r.recien===3&&/Tenés 3: te faltan 7/i.test(r.jugar)&&r.si===3&&r.chicas,r);
  // la lupa: una normal y la full art
  await pg.evaluate(()=>{document.querySelector(".t3x-mini:not(.t3x-hueco):not(.t3x-mini-full)").scrollIntoView({block:"center"});});await pg.waitForTimeout(400);
  await pg.click(".t3x-mini:not(.t3x-hueco):not(.t3x-mini-full)",{force:true});await pg.waitForTimeout(900);
  await pg.screenshot({path:S+"c-lupa.jpg"});
  r=await pg.evaluate(()=>{const l=document.querySelector(".t3x-lupa"),c=l&&l.querySelector(".mt-carta"),a=c&&c.getBoundingClientRect();
    return {hay:!!c,normal:!!c&&c.classList.contains("mt-normal"),grande:!!c&&!/\/mini\//.test(c.querySelector("img").getAttribute("src")),entra:!!a&&a.top>=0&&a.bottom<=innerHeight&&a.left>=0&&a.right<=innerWidth,dato:(l.querySelector(".t3x-lupa-dato")||{}).innerText||"",ocupa:!!l&&l.classList.contains("t3x-ocupa")};});
  chequear("la lupa muestra la carta entera, con la foto grande y el día en que tocó",r.hay&&r.normal&&r.grande&&r.entra&&/te tocó el 1 de diciembre/i.test(r.dato)&&r.ocupa,r);
  await pg.click(".t3x-lupa-cerrar",{force:true});await pg.waitForTimeout(500);
  await pg.click(".t3x-mini-full",{force:true});await pg.waitForTimeout(900);
  await pg.screenshot({path:S+"c-lupa-full.jpg"});
  chequear("la full art se ve en la lupa",await pg.evaluate(()=>!!document.querySelector(".t3x-lupa .mt-carta.mt-full")));
  await pg.click(".t3x-lupa-cerrar",{force:true});await pg.waitForTimeout(500);
  chequear("el recorrido del sobre no tira errores de JavaScript",errores.length===0,errores);
  await ctx.close();

  // hoja de contacto con todas las cartas
  const ctx2=await b.newContext({viewport:{width:1500,height:900},deviceScaleFactor:process.env.DPR?+process.env.DPR:1});
  await ctx2.addInitScript(()=>{try{localStorage.setItem("pv-t3-inaugurado",'"2026-10-01"');}catch(e){}});
  const p2=await ctx2.newPage();await p2.route("**/*",r=>{const u=r.request().url();return (u.startsWith(base)||externo(u))?r.continue():r.abort();});
  await p2.goto(base+"/?fecha=2026-12-01");await p2.waitForTimeout(2500);
  await p2.evaluate(()=>{const d=document.createElement("div");d.id="hoja";d.style.cssText="position:absolute;left:0;top:0;width:1500px;z-index:99999;background:#0F1338;padding:14px;display:grid;grid-template-columns:repeat(6,1fr);gap:14px;box-sizing:border-box";
    d.innerHTML=T3.tcg.CARTAS.map(c=>'<div data-id="'+c.id+'">'+T3.tcg._prueba.carta(c)+"</div>").join("")+"<div>"+T3.tcg._prueba.dorso()+"</div>";
    document.body.style.overflow="auto";document.body.style.height="auto";document.documentElement.style.overflow="auto";document.body.appendChild(d);});
  await p2.evaluate(()=>Promise.all([document.fonts.load('800 italic 20px "Barlow Condensed"'),document.fonts.load('700 20px "Barlow Condensed"'),document.fonts.load('600 20px "Barlow Condensed"'),document.fonts.load('700 italic 20px "Barlow Condensed"')]).then(()=>document.fonts.ready));
  await p2.evaluate(()=>Promise.all(Array.from(document.querySelectorAll("#hoja img")).map(i=>i.decode?i.decode().catch(()=>{}):0)));
  await p2.waitForTimeout(800);
  const alto=await p2.evaluate(()=>document.getElementById("hoja").offsetHeight),tiras=Math.ceil(alto/1400);
  for(let i=0;i<tiras;i++){await p2.screenshot({path:S+"c-mazo"+i+".jpg",clip:{x:0,y:i*Math.ceil(alto/tiras),width:1500,height:Math.ceil(alto/tiras)},fullPage:true});}
  /* nada de lo escrito se sale de la carta ni se pisa: la cabecera, cada ataque y el pie */
  const desb=await p2.evaluate(()=>Array.from(document.querySelectorAll("#hoja [data-id]")).map(caja=>{
    const c=caja.querySelector(".mt-carta"),R=e=>e.getBoundingClientRect(),m=R(c.querySelector(".mt-in")),mal=[];
    const adentro=(e,n)=>{if(!e)return;const r=R(e);if(r.width===0&&r.height===0)return;if(r.left<m.left-1||r.right>m.right+1||r.top<m.top-1||r.bottom>m.bottom+1)mal.push(n+" se sale");};
    const cab=c.querySelector(".mt-cab"),pie=c.querySelector(".mt-pie"),ats=Array.from(c.querySelectorAll(".mt-ataque"));
    adentro(cab,"la cabecera");adentro(c.querySelector(".mt-nombre"),"el nombre");adentro(c.querySelector(".mt-cab .mt-sello"),"el sello");adentro(pie,"el pie");
    const nom=c.querySelector(".mt-nombre"),vid=c.querySelector(".mt-vidas");if(nom&&vid&&R(nom).right>R(vid).left+1)mal.push("el nombre pisa las vidas");
    ats.forEach((a,i)=>{adentro(a,"el ataque "+(i+1));const n=a.querySelector(".mt-at-nombre"),d=a.querySelector(".mt-dano"),t=a.querySelector(".mt-at-texto");
      if(n&&d&&d.textContent&&R(n).right>R(d).left+1&&R(n).bottom>R(d).top+1&&R(n).top<R(d).bottom-1)mal.push("el nombre del ataque "+(i+1)+" pisa el daño");
      if(t&&t.scrollHeight>t.clientHeight+1)mal.push("el texto del ataque "+(i+1)+" queda cortado");
      if(i&&R(ats[i-1]).bottom>R(a).top+1)mal.push("los ataques se pisan");});
    if(ats.length&&pie&&R(ats[ats.length-1]).bottom>R(pie).top+1)mal.push("el último ataque pisa el pie");
    if(c.classList.contains("mt-normal")){const arte=c.querySelector(".mt-arte");if(ats.length&&R(arte).bottom>R(ats[0]).top+1)mal.push("los ataques pisan la foto");}
    else if(ats.length&&R(cab).bottom>R(ats[0]).top)mal.push("los ataques llegan a la cabecera");
    const fotos=Array.from(c.querySelectorAll(".mt-arte img"));if(!fotos.length||fotos.some(i=>!i.complete||!i.naturalWidth))mal.push("no cargó la foto");
    return {id:caja.getAttribute("data-id"),mal:mal};}).filter(x=>x.mal.length));
  const letra=await p2.evaluate(()=>document.fonts.check('800 italic 20px "Barlow Condensed"'));
  chequear("en ninguna de las "+total+" cartas lo escrito se sale, se pisa o queda cortado, y todas tienen su foto",letra&&desb.length===0,{letra:letra,desb:desb});
  await b.close();srv.close();process.exit(resumen()?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
