#!/usr/bin/env node
/* ============================================================
   PRUEBA DE HUMO DEL CUADERNO
   Abre la app en un navegador de verdad, con la fecha de hoy y
   las de los próximos días, y falla si algo se rompe: un error
   de JavaScript, una hoja que no aparece, un juego o una pestaña
   que se traba, un archivo que falta.

   Uso:   node .github/scripts/probar.cjs [AAAA-MM-DD ...]
   Sin fechas: hoy (hora de Buenos Aires), los 10 días que siguen
   y las fechas marcadas de más abajo.

   Con MOTOR=webkit usa el motor de Safari (el del iPhone).
   Con SITIO=https://… prueba la versión PUBLICADA en vez de la
   del repo: revisa que sea la misma que este commit y abre hoy
   y el día del estreno.
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.resolve(__dirname, "..", "..");
const SITIO = String(process.env.SITIO || "").replace(/\/+$/, "");
const DIAS_ADELANTE = 10;
const MARCADAS = ["2026-12-01", "2026-12-16", "2026-12-24", "2026-12-25", "2026-12-31", "2027-01-01"];
/* La quema del 1/12 (T3.quema): la primera vez que se abre el cuaderno desde ese día, Ponyta lo prende fuego y aparece un
   video. Las fechas de diciembre se prueban con el cuaderno ya quemado (como va a estar casi siempre); la escena se prueba
   aparte, una vez, en probarQuema. */
const DIA_QUEMA = "2026-12-01";
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".mp4": "video/mp4", ".ttf": "font/ttf", ".woff2": "font/woff2" };

const fallas = [];
const avisos = [];
function falla(donde, que) { fallas.push(donde + ": " + que); console.log("  ✗ " + donde + ": " + que); }
function aviso(donde, que) { avisos.push(donde + ": " + que); console.log("  ! " + donde + ": " + que); }

function hoyBA() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p; // AAAA-MM-DD
}
function sumar(f, n) {
  const a = f.split("-").map(Number); const d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + n));
  return d.toISOString().slice(0, 10);
}

/* ---------- 1 · chequeos sin navegador ---------- */
function estaticos() {
  console.log("Archivos");
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  let n = 0;
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) {
    n++;
    try { new vm.Script(m[1], { filename: "index.html · bloque de script " + n }); }
    catch (e) { falla("index.html", "el bloque de script " + n + " no compila: " + e.message); }
  }
  if (n < 3) falla("index.html", "esperaba varios bloques de script y encontré " + n);
  ["manifest.json"].forEach((f) => {
    const p = path.join(RAIZ, f);
    if (!fs.existsSync(p)) return;
    try { JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { falla(f, "no es JSON válido: " + e.message); }
  });
  ["sw.js"].forEach((f) => {
    const p = path.join(RAIZ, f);
    if (!fs.existsSync(p)) return;
    try { new vm.Script(fs.readFileSync(p, "utf8"), { filename: f }); } catch (e) { falla(f, "no compila: " + e.message); }
  });
  /* las fotos de las cartas de MafiaTCG tienen que existir: la grande, la chica (mini/) y el logo del dorso */
  const extras = (/\/\*<<EXTRAS-JS\*\/([\s\S]*?)\/\*EXTRAS-JS>>\*\//.exec(html) || [])[1] || "";
  const fotos = Array.from(new Set(Array.from(extras.matchAll(/\bfoto:"([^"]+\.(?:jpe?g|png|webp))"/g), (x) => x[1])));
  const TCG = path.join(RAIZ, "fotos", "t3", "tcg");
  fotos.forEach((f) => {
    if (!fs.existsSync(path.join(TCG, f))) falla("MafiaTCG", "falta la foto fotos/t3/tcg/" + f);
    if (!fs.existsSync(path.join(TCG, "mini", f))) falla("MafiaTCG", "falta la foto chica fotos/t3/tcg/mini/" + f);
  });
  if (fotos.length && !fs.existsSync(path.join(TCG, "logo.webp"))) falla("MafiaTCG", "falta el logo del dorso: fotos/t3/tcg/logo.webp");
  /* las imágenes de la tienda (lo que manda Mati para la ropa de Ponyta: escudos, logos) también tienen que estar */
  const deTienda = Array.from(new Set(Array.from(extras.matchAll(/\b(?:src|logo):"([^"]+\.(?:jpe?g|png|webp|svg))"/g), (x) => x[1])));
  deTienda.forEach((f) => {
    if (!fs.existsSync(path.join(RAIZ, "fotos", "t3", "tienda", f))) falla("la tienda", "falta la imagen fotos/t3/tienda/" + f);
  });
  /* los audios que mandó Mati (la lista X.CLIPS) tienen que estar en audios/, y la tira de la explosión si algún ataque la usa */
  const clips = (/X\.CLIPS=\{([\s\S]*?)\};/.exec(extras) || [])[1] || "";
  const audios = Array.from(clips.matchAll(/:\s*"([^"]+\.(?:mp3|m4a|wav))"/g), (x) => x[1]);
  audios.forEach((f) => { if (!fs.existsSync(path.join(RAIZ, "audios", f))) falla("audios", "falta el audio audios/" + f); });
  if (/\bX\.CLIPS=/.test(extras) && !audios.length) falla("audios", "no pude leer la lista de audios (X.CLIPS)");
  if (/\bfx:"explosion"/.test(extras) && !fs.existsSync(path.join(TCG, "explosion.webp"))) falla("MafiaTCG", "falta la tira de la explosión: fotos/t3/tcg/explosion.webp");
  /* el video de la quema del 1/12 (el que mandó Mati) y su foto */
  const vq = /var VIDEO=\{src:"([^"]+)",poster:"([^"]+)"/.exec(extras);
  if (vq) [vq[1], vq[2]].forEach((f) => { if (!fs.existsSync(path.join(RAIZ, f))) falla("la quema", "falta " + f); });
  else if (/T3\.quema=\{/.test(extras)) falla("la quema", "no pude leer cuál es el video (VIDEO) en T3.quema");
  /* el aviso diario: que el script lea la hoja sin romperse y use la misma llave que la app */
  const pAviso = path.join(__dirname, "aviso.cjs");
  if (fs.existsSync(pAviso)) {
    try {
      const A = require(pAviso);
      const f = hoyBA(), h = A.leerHoja(f);
      A.decidir(f, h.dia, h.estreno);
      const enApp = (/var PUBLICA="([A-Za-z0-9_-]+)"/.exec(extras) || [])[1];
      if (enApp && enApp !== A.PUBLICA) falla("avisos", "la llave pública de la app y la del script que manda no coinciden");
    } catch (e) { falla("aviso.cjs", e.message); }
  }
  if (!fallas.length) console.log("  ✓ " + n + " bloques de script compilan" + (fotos.length ? " · " + fotos.length + " fotos de cartas en su lugar" : "") + (audios.length ? " · " + audios.length + " audios" : ""));
}

/* ---------- 2 · servidor local ---------- */
function servir() {
  const srv = http.createServer((req, res) => {
    let ruta = decodeURIComponent(req.url.split("?")[0]);
    if (ruta.endsWith("/")) ruta += "index.html";
    const abs = path.join(RAIZ, ruta);
    if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end("no está"); return; }
    const st = fs.statSync(abs);
    const tipo = TIPOS[path.extname(abs).toLowerCase()] || "application/octet-stream";
    /* pedidos por pedazos (Range), como los sirve GitHub Pages: el video de la quema los necesita en Safari */
    const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (rg && req.method === "GET" && (rg[1] || rg[2])) {
      const a = rg[1] === "" ? Math.max(0, st.size - (+rg[2])) : +rg[1], z = rg[1] !== "" && rg[2] !== "" ? Math.min(+rg[2], st.size - 1) : st.size - 1;
      if (a > z || a >= st.size) { res.writeHead(416, { "Content-Range": "bytes */" + st.size }); res.end(); return; }
      res.writeHead(206, { "Content-Type": tipo, "Content-Length": z - a + 1, "Content-Range": "bytes " + a + "-" + z + "/" + st.size, "Accept-Ranges": "bytes", "Last-Modified": st.mtime.toUTCString() });
      fs.createReadStream(abs, { start: a, end: z }).pipe(res); return;
    }
    res.writeHead(200, { "Content-Type": tipo, "Content-Length": st.size, "Accept-Ranges": "bytes", "Last-Modified": st.mtime.toUTCString(), "Cache-Control": "max-age=600" });
    if (req.method === "HEAD") { res.end(); return; }
    fs.createReadStream(abs).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ---------- 3 · una fecha en el navegador ---------- */
async function probarFecha(browser, base, fecha, op) {
  op = op || {};
  const donde = fecha + (op.deCero ? " (primera vez)" : "");
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires", hasTouch: true, isMobile: true });
  const errores = [], faltan = [];
  const quemado = fecha >= DIA_QUEMA ? JSON.stringify({ f: DIA_QUEMA, video: DIA_QUEMA }) : "";
  if (!op.deCero) await ctx.addInitScript((q) => { try { localStorage.setItem("pv-t3-inaugurado", '"2026-10-01"'); if (q) localStorage.setItem("pv-t3-quema", q); } catch (e) {} }, quemado);
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errores.push(String(e && e.message || e)));
  pg.on("console", (m) => { if (m.type() === "error" && /T3 no arrancó/.test(m.text())) errores.push(m.text()); });
  pg.on("response", (r) => { if (r.status() === 404 && r.url().startsWith(base)) faltan.push(r.url().slice(base.length)); });
  await pg.route("**/*", (r) => (r.request().url().startsWith(base) ? r.continue() : r.abort()));
  const antes = fallas.length;
  try {
    await pg.goto(base + "/?fecha=" + fecha, { waitUntil: "load", timeout: 30000 });
    await pg.waitForFunction(() => window.T3 && (document.querySelector(".t3-cuaderno-hoja") || document.querySelector(".t3-cuaderno-evento")), null, { timeout: 15000 });
    const d = await pg.evaluate(() => {
      const dia = (CONFIG.dias || {})[T3.hoy] || null;
      return { hoy: T3.hoy, activo: T3.activo, evento: !!document.querySelector(".t3-cuaderno-evento"),
        juego: dia && dia.actividad ? dia.actividad.tipo : "", idEvento: dia && dia.evento || "", hayDia: !!dia };
    });
    if (d.hoy !== fecha) falla(donde, "la app cree que es " + d.hoy);
    if (!d.activo) falla(donde, "el cuaderno no está activo");
    await pg.waitForTimeout(1500);
    if (!d.evento && !op.deCero) {
      await pg.evaluate((f) => T3.cuaderno.irA(f), fecha);
      await pg.waitForTimeout(900);
      const hoja = await pg.evaluate((f) => !!document.querySelector('.t3-cuaderno-hoja[data-fecha="' + f + '"]'), fecha);
      if (!hoja) falla(donde, "no aparece la hoja del día");
      if (d.juego) {
        await pg.evaluate(() => { T3.cuaderno.jugar(CONFIG.dias[T3.hoy].actividad); });
        await pg.waitForTimeout(1200);
        const roto = await pg.evaluate(() => !!document.querySelector(".t3-cuaderno-suelta-roto") || !document.querySelector(".t3-cuaderno-suelta"));
        if (roto) falla(donde, "el juego «" + d.juego + "» se traba al abrir");
        await pg.evaluate(() => T3.cuaderno.cerrarSuelta());
        await pg.waitForTimeout(800);
      }
      const pest = await pg.evaluate(() => Array.from(document.querySelectorAll("[data-pest]")).map((b) => b.getAttribute("data-pest")).filter((p) => p !== "dobladas"));
      for (const p of pest) {
        await pg.evaluate((n) => T3.cuaderno.abrir(n), p);
        await pg.waitForTimeout(1100);
        const mal = await pg.evaluate(() => {
          const h = document.querySelector(".t3-cuaderno-especial-host");
          return !h ? "no abrió" : h.querySelector(".t3-cuaderno-roto") ? "se trabó" : !h.children.length ? "quedó vacía" : "";
        });
        if (mal) falla(donde, "la pestaña «" + p + "» " + mal);
        await pg.evaluate((f) => T3.cuaderno.irA(f), fecha);
        await pg.waitForTimeout(900);
      }
      d.pestanas = pest;
    }
    errores.forEach((e) => falla(donde, "error de JavaScript: " + e));
    Array.from(new Set(faltan)).forEach((f) => aviso(donde, "pide un archivo que no está: " + f));
    if (fallas.length === antes) console.log("  ✓ " + donde + (d.evento ? " · evento " + (d.idEvento || "de bienvenida") : "") + (d.juego ? " · " + d.juego : "") + (d.pestanas ? " · " + d.pestanas.join(", ") : "") + (d.hayDia ? "" : " · (sin contenido cargado)"));
  } catch (e) {
    errores.forEach((x) => falla(donde, "error de JavaScript: " + x));
    falla(donde, "no cargó: " + String(e && e.message || e).split("\n")[0]);
  }
  await ctx.close();
}

/* ---------- 3b · la quema del 1/12 ---------- */
/* Abre el 1/12 por primera vez, corre la tapa y lleva la escena hasta el final con su reloj de prueba: tiene que haber
   fuego, tiene que aparecer el video y, al cerrarlo, quedar el cuaderno arrancando el 1/12 con la foto del video en la hoja. */
async function probarQuema(browser, base) {
  const donde = "la quema del 1/12";
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires", hasTouch: true, isMobile: true });
  const errores = [];
  await ctx.addInitScript(() => { try { localStorage.setItem("pv-t3-inaugurado", '"2026-10-01"'); } catch (e) {} });
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errores.push(String(e && e.message || e)));
  await pg.route("**/*", (r) => (r.request().url().startsWith(base) ? r.continue() : r.abort()));
  const antes = fallas.length;
  try {
    await pg.goto(base + "/?fecha=" + DIA_QUEMA, { waitUntil: "load", timeout: 30000 });
    await pg.waitForFunction(() => window.T3 && document.querySelector(".t3-cuaderno-hoja"), null, { timeout: 15000 });
    await pg.waitForTimeout(800);
    const a = await pg.evaluate(() => ({ hay: !!T3.quema, toca: !!(T3.quema && T3.quema.toca()), escena: !!(T3.quema && T3.quema._prueba.escena()), hojas: T3.fechas().length }));
    if (!a.hay) falla(donde, "no está T3.quema");
    else if (!a.toca || !a.escena) falla(donde, "el 1/12, la primera vez, la escena no quedó armada");
    else {
      await pg.evaluate(() => {
        const el = document.querySelector(".t3-cuaderno-elastico"), r = el.getBoundingClientRect();
        const o = { bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch", isPrimary: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
        el.dispatchEvent(new PointerEvent("pointerdown", o)); el.dispatchEvent(new PointerEvent("pointerup", o));
      });
      await pg.waitForFunction(() => document.getElementById("t3").classList.contains("t3-cuaderno-abierto"), null, { timeout: 8000 });
      const medio = await pg.evaluate(() => T3.quema._prueba.escena().cuadroEn(3, 0.05));
      if (!(medio.llamas > 0)) falla(donde, "a mitad de la escena no hay fuego");
      await pg.evaluate(() => T3.quema._prueba.escena().cuadroEn(9, 0.05));
      await pg.waitForSelector(".t3x-quema-video", { timeout: 10000 });
      await pg.waitForTimeout(500);
      await pg.evaluate(() => document.querySelector(".t3x-quema-cerrar").click());
      await pg.waitForFunction(() => !document.querySelector(".t3x-quema-video"), null, { timeout: 8000 });
      await pg.waitForTimeout(2500);
      const d = await pg.evaluate(() => ({ primera: T3.fechas()[0], antes: T3.fechas(T3.hoy, true).length, tizones: document.querySelectorAll(".t3x-quema-pestana").length,
        tarjeta: !!document.querySelector(".t3-cuaderno-hoja .t3x-quema-tarjeta"), hoja: !!document.querySelector('.t3-cuaderno-hoja[data-fecha="' + T3.hoy + '"]'), frena: T3.quema.frena() }));
      if (d.primera !== DIA_QUEMA) falla(donde, "después del fuego el cuaderno no arranca el 1/12 (arranca el " + d.primera + ")");
      if (!d.tizones) falla(donde, "no quedaron los tizones de las pestañas");
      if (!d.hoja || !d.tarjeta || d.frena) falla(donde, "al cerrar el video no quedó la hoja del día con la foto del video");
      errores.forEach((e) => falla(donde, "error de JavaScript: " + e));
      if (fallas.length === antes) console.log("  ✓ " + donde + " · " + a.hojas + " hojas antes, " + (a.hojas - d.antes + 1) + " después · " + d.tizones + " tizones · el video aparece y queda en la hoja");
    }
  } catch (e) {
    errores.forEach((x) => falla(donde, "error de JavaScript: " + x));
    falla(donde, "se trabó: " + String(e && e.message || e).split("\n")[0]);
  }
  await ctx.close();
}

/* ---------- 4 · la versión publicada ---------- */
async function publicada() {
  console.log("Publicado · " + SITIO);
  const local = fs.readFileSync(path.join(RAIZ, "index.html"));
  let r, remoto;
  try {
    r = await fetch(SITIO + "/index.html?_=" + Date.now(), { cache: "no-store" });
    remoto = Buffer.from(await r.arrayBuffer());
  } catch (e) { falla("publicado", "no pude bajar la página: " + e.message); return; }
  const lm = r.headers.get("last-modified") || "(sin fecha)";
  if (!r.ok) falla("publicado", "la página responde " + r.status);
  else if (Buffer.compare(local, remoto) !== 0) falla("publicado", "lo que está publicado no es este commit (publicado: " + remoto.length + " bytes, del " + lm + "; repo: " + local.length + " bytes). Puede que todavía se esté publicando.");
  else console.log("  ✓ lo publicado es idéntico a este commit (" + remoto.length + " bytes, del " + lm + ")");
  for (const f of ["manifest.json", "sw.js", "audios/win.wav", "icon.png", "audios/gorro.mp3", "audios/sorpresa.mp3", "audios/explosion.mp3", "fotos/t3/tcg/explosion.webp", "fotos/t3/tienda/casco.webp", "videos/1-dic.mp4", "videos/1-dic.jpg"]) {
    try { const x = await fetch(SITIO + "/" + f + "?_=" + Date.now(), { method: "HEAD", cache: "no-store" }); if (!x.ok) falla("publicado", f + " responde " + x.status); }
    catch (e) { falla("publicado", f + ": " + e.message); }
  }
}

(async () => {
  estaticos();
  let chromium;
  try { chromium = require("playwright")[process.env.MOTOR || "chromium"]; }
  catch (e) { console.log("No encuentro Playwright (npm i playwright)."); process.exit(2); }
  if (SITIO) await publicada();
  const srv = SITIO ? null : await servir();
  const base = SITIO || "http://127.0.0.1:" + srv.address().port;
  const browser = await chromium.launch();
  let fechas = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  if (SITIO && !fechas.length) {
    const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
    const estreno = (/estreno:\s*"(\d{4}-\d{2}-\d{2})"/.exec(html) || [])[1];
    fechas = [hoyBA()].concat(estreno && estreno !== hoyBA() ? [estreno] : []);
    console.log("Navegador · " + fechas.join(", "));
  } else if (!fechas.length) {
    const hoy = hoyBA();
    fechas = [];
    for (let i = 0; i <= DIAS_ADELANTE; i++) fechas.push(sumar(hoy, i));
    MARCADAS.forEach((f) => { if (f >= hoy && fechas.indexOf(f) < 0) fechas.push(f); });
    fechas.sort();
    console.log("Navegador · " + fechas.length + " fechas desde " + hoy);
    await probarFecha(browser, base, hoy, { deCero: true });
  } else console.log("Navegador · " + fechas.join(", "));
  for (const f of fechas) await probarFecha(browser, base, f);
  await probarQuema(browser, base);
  await browser.close(); if (srv) srv.close();
  console.log("");
  if (avisos.length) console.log(avisos.length + " aviso(s) que no frenan nada.");
  if (fallas.length) { console.log("FALLÓ: " + fallas.length + " problema(s)."); process.exit(1); }
  console.log("Todo bien.");
})().catch((e) => { console.error(e); process.exit(1); });
