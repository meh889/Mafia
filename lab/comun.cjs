/* utilidades para las pruebas de escenario */
const http=require("http"),fs=require("fs"),path=require("path");
const RAIZ=process.env.RAIZ||path.resolve(__dirname,"..");
const externo=u=>!!process.env.FUENTES&&/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u);
function motor(){return require("playwright")[process.env.MOTOR||"chromium"];}
const TIPOS={".html":"text/html; charset=utf-8",".js":"text/javascript",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".m4a":"audio/mp4",".wav":"audio/wav",".mp3":"audio/mpeg"};
const estado={lmDoc:null,lmHead:null,pedidos:[]};
function servir(){
  const srv=http.createServer((req,res)=>{
    let ruta=decodeURIComponent(req.url.split("?")[0]); if(ruta.endsWith("/"))ruta+="index.html";
    const abs=path.join(RAIZ,ruta);
    estado.pedidos.push(req.method+" "+req.url);
    if(!abs.startsWith(RAIZ)||!fs.existsSync(abs)||fs.statSync(abs).isDirectory()){res.writeHead(404);res.end();return;}
    const st=fs.statSync(abs); let lm=st.mtime;
    if(ruta.endsWith("index.html")){ lm=(req.method==="HEAD"?estado.lmHead:estado.lmDoc)||estado.lmDoc||st.mtime; }
    res.writeHead(200,{"Content-Type":TIPOS[path.extname(abs).toLowerCase()]||"application/octet-stream","Content-Length":st.size,"Last-Modified":new Date(lm).toUTCString()});
    if(req.method==="HEAD"){res.end();return;}
    fs.createReadStream(abs).pipe(res);
  });
  return new Promise(ok=>srv.listen(0,"127.0.0.1",()=>ok(srv)));
}
async function abrir(browser,base,fecha,op){
  op=op||{};
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:process.env.DPR?+process.env.DPR:(op.dpr||1),locale:"es-AR",timezoneId:"America/Argentina/Buenos_Aires",hasTouch:true,isMobile:true,permissions:op.permisos||[]});
  await ctx.addInitScript((semilla)=>{try{if(!sessionStorage.getItem("__sembrado")){sessionStorage.setItem("__sembrado","1");localStorage.setItem("pv-t3-inaugurado",'"2026-10-01"');Object.keys(semilla||{}).forEach(k=>localStorage.setItem(k,semilla[k]));}}catch(e){}},op.semilla||{});
  const pg=await ctx.newPage(); const errores=[];
  pg.on("pageerror",e=>errores.push(String(e&&e.message||e)));
  pg.on("console",m=>{if(op.verConsola&&m.type()!=="debug")console.log("   [consola]",m.type(),m.text().slice(0,200));});
  await pg.route("**/*",r=>{const u=r.request().url();return (u.startsWith(base)||externo(u))?r.continue():r.abort();});
  await pg.goto(base+"/?fecha="+fecha,{waitUntil:"load"});
  await pg.waitForFunction(()=>window.T3&&(document.querySelector(".t3-cuaderno-hoja")||document.querySelector(".t3-cuaderno-evento")),null,{timeout:15000});
  await pg.waitForTimeout(op.espera==null?1600:op.espera);
  if(op.abrir!==false){await pg.evaluate(f=>T3.cuaderno.irA(f),fecha);await pg.waitForTimeout(900);}
  return {ctx,pg,errores};
}
let ok=0,mal=0;
function chequear(nombre,cond,extra){ if(cond){ok++;console.log("  ✓ "+nombre);}else{mal++;console.log("  ✗ "+nombre+(extra!==undefined?"  → "+JSON.stringify(extra):""));} }
function resumen(){console.log("\n"+ok+" bien, "+mal+" mal");return mal;}
module.exports={servir,abrir,chequear,resumen,estado,RAIZ,motor,externo};
