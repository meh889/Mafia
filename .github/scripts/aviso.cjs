#!/usr/bin/env node
/* ============================================================
   AVISO DIARIO
   Les manda a los celulares suscriptos la notificación de que
   ya está la hoja del día. Lo corre .github/workflows/aviso.yml.

   Lee el index.html para saber qué hay hoy: si la hoja está vacía
   (vacaciones, o un día sin cargar) no manda nada.

   Necesita dos secrets del repo (Settings → Secrets → Actions):
     AVISOS_VAPID_PRIVADA   la llave privada de los avisos
     AVISOS_SUSCRIPCIONES   los códigos MAFIAPUSH1:… que da la app al
                            activar los avisos (uno por renglón)

   Variables para probar:  HOY=AAAA-MM-DD  SECO=1 (no manda, solo muestra)
                           TEXTO="…" (manda ese texto)  PRUEBA=true
   ============================================================ */
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..", "..");
const SITIO = process.env.SITIO || "https://meh889.github.io/Mafia/";
/* la llave pública no es secreta: es la misma que usa la app para suscribirse (T3.avisos) */
const PUBLICA = "BLR0DnA9AUFnDD6jMLV_6ExsXMm4mZ3BsCvYMZGR_Z_w0m8cv66dBHBKYkNLM_Tgo20SZec_q5IxOWMImpDH3UQ";

function hoyBA() {
  if (/^\d{4}-\d{2}-\d{2}$/.test(process.env.HOY || "")) return process.env.HOY;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function diaDelAnio(f) {
  const a = f.split("-").map(Number);
  return Math.round((Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(a[0], 0, 1)) / 864e5);
}
function leerHoja(f) {
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  const estreno = (/estreno:\s*"(\d{4}-\d{2}-\d{2})"/.exec(html) || [])[1] || "2026-12-01";
  const m = new RegExp('^\\s*"' + f + '":\\s*(\\{.*\\})\\s*,?\\s*$', "m").exec(html);
  let dia = null;
  if (m) { try { dia = JSON.parse(m[1]); } catch (e) { dia = { ilegible: true }; } }
  return { estreno, dia };
}
function elegir(lista, n) { return lista[n % lista.length]; }

/* qué decir hoy, o por qué no decir nada */
function decidir(f, dia, estreno) {
  if (f < estreno) return { saltar: "los avisos arrancan el " + estreno };
  if (!dia) return { saltar: "hoy no hay hoja cargada" };
  const carta = String(dia.mensaje || "").trim();
  const juego = dia.actividad && dia.actividad.tipo;
  if (!carta && !juego && !dia.evento && !dia.ilegible) return { saltar: "la hoja de hoy no tiene nada" + (dia.cartel ? " (solo el cartel)" : "") };
  const n = diaDelAnio(f);
  if (dia.evento) return { body: elegir(["Hoy no es una hoja cualquiera.", "Hoy pasa algo en el cuaderno.", "Abrí el cuaderno: hoy hay algo distinto."], n) };
  if (carta && dia.sellado) return { body: elegir(["Hay carta, pero viene con cinta: primero el juego.", "Te escribí. Para leerla hay que ganar primero."], n) };
  if (carta) return { body: elegir(["Te escribí. Está en el cuaderno.", "Hay carta nueva en el cuaderno.", "Ya está la hoja de hoy. Con carta."], n) };
  return { body: elegir(["Ya está la hoja de hoy.", "Hoja nueva en el cuaderno. Y un sobre esperando.", "El juego de hoy ya está. El sobre también.", "Hay hoja nueva en el cuaderno."], n) };
}

/* acepta los códigos MAFIAPUSH1:… (separados por espacios, comas o renglones) */
function suscripciones(crudo) {
  const subs = [];
  String(crudo || "").split(/[\s,;]+/).forEach((t) => {
    const m = /^MAFIAPUSH1:([A-Za-z0-9_-]+)$/.exec(t.trim());
    if (!m) return;
    try {
      const o = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
      if (o && /^https:\/\//.test(o.e || "") && o.p && o.a) subs.push({ endpoint: o.e, keys: { p256dh: o.p, auth: o.a } });
    } catch (e) { /* código roto: se ignora */ }
  });
  return subs;
}
function carga(titulo, cuerpo) {
  /* formato "declarativo": iOS 18.4+ lo muestra solo; en los demás lo muestra sw.js */
  return JSON.stringify({ web_push: 8030, notification: { title: titulo, body: cuerpo, navigate: SITIO, lang: "es-AR", dir: "ltr", silent: false } });
}

async function main() {
  const f = hoyBA();
  const textoLibre = String(process.env.TEXTO || "").trim();
  const prueba = /^(1|true|si|sí)$/i.test(String(process.env.PRUEBA || "").trim());
  const seco = /^(1|true)$/i.test(String(process.env.SECO || "").trim());
  let cuerpo;
  if (textoLibre) cuerpo = textoLibre.slice(0, 180);
  else if (prueba) cuerpo = "Prueba de aviso. Si ves esto, funciona.";
  else {
    const h = leerHoja(f);
    const d = decidir(f, h.dia, h.estreno);
    if (d.saltar) { console.log(f + ": no mando nada — " + d.saltar + "."); return; }
    cuerpo = d.body;
  }
  console.log(f + ": «" + cuerpo + "»");
  if (seco) { console.log("(en seco: no se manda)"); return; }

  const privada = String(process.env.VAPID_PRIVADA || "").trim();
  const subs = suscripciones(process.env.SUSCRIPCIONES);
  if (!privada || !subs.length) {
    console.log("No mando nada: falta " + [!privada ? "el secret AVISOS_VAPID_PRIVADA" : "", !subs.length ? "algún código válido en AVISOS_SUSCRIPCIONES" : ""].filter(Boolean).join(" y ") + ".");
    return;
  }
  const webpush = require("web-push");
  const opciones = { vapidDetails: { subject: SITIO, publicKey: PUBLICA, privateKey: privada }, TTL: 12 * 3600, urgency: "normal", topic: "mafiapp-hoja" };
  let bien = 0;
  for (let i = 0; i < subs.length; i++) {
    const donde = "celular " + (i + 1) + " (" + new URL(subs[i].endpoint).host + ")";
    try {
      const r = await webpush.sendNotification(subs[i], carga("MafiApp", cuerpo), opciones);
      bien++;
      console.log("  ✓ " + donde + ": aceptado (" + r.statusCode + ")");
    } catch (e) {
      const cod = e && e.statusCode;
      const pista = cod === 404 || cod === 410 ? "la suscripción venció: hay que activar los avisos de nuevo en ese celular y cargar el código nuevo"
        : cod === 403 || cod === 401 ? "el servicio rechazó la llave: revisar AVISOS_VAPID_PRIVADA"
        : "sin detalle";
      console.log("  ✗ " + donde + ": " + (cod || (e && e.message) || "error") + " — " + pista + (e && e.body ? " · " + String(e.body).slice(0, 160) : ""));
    }
  }
  if (!bien) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e && e.message || e); process.exit(1); });
module.exports = { decidir, suscripciones, carga, leerHoja, PUBLICA };
