# MafiApp — guía para trabajar en este repo

App web romántica de un solo archivo (`index.html`) que Mati le hizo a Sofi. GitHub Pages la publica
desde `main` en https://meh889.github.io/Mafia/ y ella la usa como ícono en la pantalla de inicio de
su iPhone. **Todo lo que entra a `main` le llega a ella en minutos.**

## Cómo se trabaja
- Mati pide cambios cortos en castellano rioplatense ("cargá esta carta para hoy"). Se edita, se prueba
  en un navegador, se hace commit y push directo a `main`, y se le cuenta en pocas líneas, en voseo.
- Los textos que él dicta van literales; solo se corrigen errores de tipeo.
- Git: `user.name Claude`, `user.email noreply@anthropic.com`.
- Antes de pushear: `node .github/scripts/probar.cjs [AAAA-MM-DD …]` (usa Playwright). Sin fechas prueba
  hoy, los 10 días que siguen y las fechas importantes.
- Después de pushear: `gh run list -R meh889/Mafia -L 3` y esperar "Prueba y publicación" en verde
  (corre la misma prueba en Chromium y en WebKit, el motor del iPhone).
  Para revisar lo que quedó publicado: `gh workflow run prueba.yml -R meh889/Mafia --ref main -f vivo=true`.
- Cada push es una publicación, y la app abierta se recarga sola cuando ve una nueva: mejor juntar los
  cambios en un solo push.

## Mapa de `index.html`
- `<head>`: arranque temprano (máquina del tiempo), `CONFIG` (todo el contenido editable) y los estilos.
- `CONFIG.dias["AAAA-MM-DD"]`: una línea por día, con un comentario arriba. Campos: `mensaje` (la carta),
  `sellado` (la carta se destapa al ganar), `actividad:{tipo,…}`, `evento`, `eventoArgs`, `nota`, `ponyta`,
  `foto`, `lugar`, `cartel` (texto = cartel de vacaciones · objeto `{titulo,texto,lista}` = cartel verde).
  Un día sin `actividad` no tiene juego.
- `CONFIG.t3`: la temporada actual, "el cuaderno" (1/10/2026 → 1/1/2027): `pin`, `estreno`, `whatsapp`,
  `pedidos`, `tcg.premio`, datos del cumple del 16/12, etc.
- Scripts del `<body>`: el motor viejo con los juegos (`montarAlgo(a)`) y el cuaderno (`T3.*`: ponyta, mapa,
  adviento, maquina, eventos con `T3.registrarEvento`, cuaderno). Vienen minificados en líneas larguísimas:
  conviene buscar con Python y reemplazar cadenas exactas con `assert h.count(viejo) == 1`.
- Entre `/*<<EXTRAS-JS*/` y `/*EXTRAS-JS>>*/` (y `EXTRAS-CSS` en los estilos) está lo sumado en noviembre
  de 2026, legible y comentado: `T3.x` (base), `T3.actualizar`, `T3.respaldo`, `T3.taller`, `T3.vuelta`
  (contestar cartas, vales), `T3.pedidos`, `T3.tcg` (MafiaTCG: la lista `CARTAS`), `T3.avisos` y `T3.viaje`.
  Lo que es para Sofi (TCG, pedidos, contestar, avisos) aparece recién desde `CONFIG.t3.estreno`.
- `T3.viaje` (noviembre 2026): Ponyta se va de vacaciones. Desde `SALE`, la próxima corrida en su solapa es la
  de la ida: deja la herradura del día, no vuelve y queda una nota (los textos están arriba del bloque). Mientras
  no está, tampoco sale en el señalador, en "Ponyta dice" ni en el mapa de Olivos. Vuelve el día `VUELVE`
  (primer día del adviento) con el gorro de la ventanita 1, hasta `GORRO_HASTA`. Se guarda en `pv-t3-ponyta-viaje`.
  El módulo minificado de Ponyta solo pregunta: `T3.viaje.toca()`, `.ausente(f)`, `.conGorro(f)`, `.poner(…)`.

## Para ver una fecha
- `?fecha=AAAA-MM-DD` en la URL, o la máquina del tiempo (5 toques rápidos en el número de hoja → PIN),
  que además tiene el **taller**: versión publicada, respaldo del progreso y avisos.
- El progreso de Sofi vive solo en su celular: `localStorage` con prefijo `pv-` (el cuaderno usa `pv-t3-`).

## Pruebas largas (el laboratorio)
- `.github/pruebas/*.cjs` son los escenarios de lo sumado en noviembre: `a` actualización, respaldo, taller y
  sonido · `b` contestar, pedidos y vales · `c2` reglas y flujo del TCG · `c1` recorrido del TCG con capturas ·
  `d` avisos en la app · `d-envio` el envío (necesita `web-push`) · `e` el viaje de Ponyta. Si se toca ese código, correr el que
  corresponda: `node .github/pruebas/a.cjs` (capturas en `SALIDA=carpeta`).
- WebKit no está instalado en la sesión, solo en GitHub: `gh workflow run laboratorio.yml -R meh889/Mafia
  --ref main` corre todos los escenarios en WebKit y Chromium con las tipografías de verdad (`-f densidad=2`
  para capturas nítidas). Las capturas salen del registro:
  `gh run view <id> -R meh889/Mafia --log | node .github/pruebas/rearmar.cjs <carpeta>`.
- Ya mordieron dos diferencias de Safari: `document.lastModified` viene en UTC (no en hora local) y
  `backface-visibility` no es confiable (las cartas se dan vuelta cambiando `visibility` a mitad del giro).

## Avisos (notificación diaria)
- `.github/workflows/aviso.yml` corre todos los días 12:17 UTC y ejecuta `.github/scripts/aviso.cjs`,
  que lee la hoja de hoy en `index.html`; si no hay nada cargado no manda.
- Secrets del repo: `AVISOS_VAPID_PRIVADA` (la llave) y `AVISOS_SUSCRIPCIONES` (códigos `MAFIAPUSH1:…`,
  uno por renglón; los da la app al activar los avisos).
- Mandar uno a mano: `gh workflow run aviso.yml -R meh889/Mafia --ref main -f texto="…"` (o `-f prueba=true`).
- "Aviso diario" queda en rojo si a algún celular no le llegó (el registro dice cuál). Con 404/410 esa
  suscripción murió: en ese celular, taller → avisos → **renovar** da un código nuevo para reemplazar en
  `AVISOS_SUSCRIPCIONES` (o se saca ese renglón).
- La llave privada no está en el repo ni se puede leer del secret. Si se pierde: par nuevo con
  `npx web-push generate-vapid-keys`, cambiar `PUBLICA` en `T3.avisos` (index.html) y en `aviso.cjs` (la prueba
  exige que coincidan), cargar el secret y renovar en cada celular.
- El respaldo del taller no lleva `pv-t3-avisos` ni `pv-t3-version-vista`: son de cada celular.
- GitHub apaga los workflows programados si el repo pasa 60 días sin actividad.

## Lo que una sesión de Claude no puede hacer acá
- Cargar secrets ni cambiar la configuración de Pages: lo hace Mati en Settings.
- Borrar ramas remotas (quedó `claude/prueba-permisos`, descartable: la puede borrar Mati).
- Probar en un iPhone de verdad: instalación y avisos se confirman con Mati.

## Publicación
Pages publica desde la rama (`legacy`): la prueba automática avisa pero no frena. Si Mati cambia
Settings → Pages → Source a "GitHub Actions", `prueba.yml` pasa a publicar solo cuando la prueba pasa.
