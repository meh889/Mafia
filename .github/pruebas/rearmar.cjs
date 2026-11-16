/* Rearma las capturas que el laboratorio vuelca en su registro.
   El laboratorio corre en GitHub y no deja bajar archivos desde cualquier lado,
   así que escribe cada captura como renglones "###IMG nombre nº base64".

   Uso:  gh run view <id> -R meh889/Mafia --log | node .github/pruebas/rearmar.cjs <carpeta> */
const fs = require("fs"), path = require("path");
const destino = process.argv[2];
if (!destino) { console.error("Falta la carpeta de destino."); process.exit(2); }

const partes = new Map();
let resto = "";
function renglon(l) {
  const m = /###IMG (\S+) (\d+) (\S+)/.exec(l);
  if (!m) return;
  if (!partes.has(m[1])) partes.set(m[1], []);
  partes.get(m[1])[+m[2]] = m[3];
}
process.stdin.setEncoding("utf8");
process.stdin.on("data", t => {
  const ls = (resto + t).split("\n");
  resto = ls.pop();
  ls.forEach(renglon);
});
process.stdin.on("end", () => {
  renglon(resto);
  for (const [nombre, trozos] of partes) {
    /* el nombre viene del registro: no se lo deja salir de la carpeta */
    const limpio = nombre.split(/[\\/]+/).filter(p => p && p !== "." && p !== "..").join("/");
    const archivo = path.join(destino, limpio);
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, Buffer.from(trozos.join(""), "base64"));
  }
  console.log(partes.size + " capturas en " + destino);
});
