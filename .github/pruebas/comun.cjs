/* Utilidades de las pruebas de escenario (el "laboratorio").
   Variables: MOTOR=chromium|webkit · FUENTES=1 (deja bajar las tipografías de Google)
              DPR=1|2 · SALIDA=carpeta para las capturas
              MOVIMIENTO=menos (corre con "reducir movimiento" prendido, como un teléfono que lo tenga puesto: ahí la app
              acelera el duelo, no despliega el adviento y la explosión es una sola. Sirve para c3; los escenarios que
              miden animaciones a mitad de camino, como e, no están pensados para correr así) */
const http=require("http"),fs=require("fs"),path=require("path");
const RAIZ=process.env.RAIZ||path.resolve(__dirname,"..","..");
const externo=u=>!!process.env.FUENTES&&/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u);
function motor(){return require("playwright")[process.env.MOTOR||"chromium"];}
const TIPOS={".html":"text/html; charset=utf-8",".js":"text/javascript",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".woff2":"font/woff2",".svg":"image/svg+xml",".m4a":"audio/mp4",".wav":"audio/wav",".mp3":"audio/mpeg",".mp4":"video/mp4"};
const estado={lmDoc:null,lmHead:null,pedidos:[]};
function servir(){
  const srv=http.createServer((req,res)=>{
    let ruta=decodeURIComponent(req.url.split("?")[0]); if(ruta.endsWith("/"))ruta+="index.html";
    const abs=path.join(RAIZ,ruta);
    estado.pedidos.push(req.method+" "+req.url);
    if(!abs.startsWith(RAIZ)||!fs.existsSync(abs)||fs.statSync(abs).isDirectory()){res.writeHead(404);res.end();return;}
    const st=fs.statSync(abs); let lm=st.mtime;
    if(ruta.endsWith("index.html")){ lm=(req.method==="HEAD"?estado.lmHead:estado.lmDoc)||estado.lmDoc||st.mtime; }
    const tipo=TIPOS[path.extname(abs).toLowerCase()]||"application/octet-stream";
    /* pedidos por pedazos (Range), como los sirve GitHub Pages: un <video> los necesita para saltar adelante, y Safari, para andar */
    const rg=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||"");
    if(rg&&req.method==="GET"&&(rg[1]||rg[2])){
      const a=rg[1]===""?Math.max(0,st.size-(+rg[2])):+rg[1],z=rg[1]!==""&&rg[2]!==""?Math.min(+rg[2],st.size-1):st.size-1;
      if(a>z||a>=st.size){res.writeHead(416,{"Content-Range":"bytes */"+st.size});res.end();return;}
      res.writeHead(206,{"Content-Type":tipo,"Content-Length":z-a+1,"Content-Range":"bytes "+a+"-"+z+"/"+st.size,"Accept-Ranges":"bytes","Last-Modified":new Date(lm).toUTCString()});
      fs.createReadStream(abs,{start:a,end:z}).pipe(res);return;
    }
    res.writeHead(200,{"Content-Type":tipo,"Content-Length":st.size,"Accept-Ranges":"bytes","Last-Modified":new Date(lm).toUTCString()});
    if(req.method==="HEAD"){res.end();return;}
    fs.createReadStream(abs).pipe(res);
  });
  return new Promise(ok=>srv.listen(0,"127.0.0.1",()=>ok(srv)));
}
/* La quema del 1/12 (T3.quema): la primera vez que se abre el cuaderno desde ese día, Ponyta lo prende fuego y aparece el video.
   Para que los escenarios de diciembre no arranquen todos con esa escena, el cuaderno se siembra ya quemado y con el video visto.
   El que quiera verla (j.cjs) pasa op.quema:true. */
const DIA_QUEMA="2026-12-01";
function yaQuemado(fecha,op){return fecha>=DIA_QUEMA&&!(op&&op.quema)?{"pv-t3-quema":JSON.stringify({f:DIA_QUEMA,video:DIA_QUEMA})}:{};}
async function abrir(browser,base,fecha,op){
  op=op||{};
  const ctx=await browser.newContext(Object.assign({viewport:{width:390,height:844},deviceScaleFactor:process.env.DPR?+process.env.DPR:(op.dpr||1),locale:"es-AR",timezoneId:"America/Argentina/Buenos_Aires",hasTouch:true,isMobile:true,permissions:op.permisos||[]},process.env.MOVIMIENTO==="menos"?{reducedMotion:"reduce"}:{},op.contexto||{}));
  await ctx.addInitScript((semilla)=>{try{if(!sessionStorage.getItem("__sembrado")){sessionStorage.setItem("__sembrado","1");localStorage.setItem("pv-t3-inaugurado",'"2026-10-01"');Object.keys(semilla||{}).forEach(k=>localStorage.setItem(k,semilla[k]));}}catch(e){}},Object.assign({},yaQuemado(fecha,op),op.semilla||{}));
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
module.exports={servir,abrir,chequear,resumen,estado,RAIZ,motor,externo,yaQuemado,DIA_QUEMA};
