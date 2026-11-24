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
  `tcg` (`premio`, `duelosPorDia`, `puntosPorVictoria`), `tienda` (`precios`: pisa cualquier precio), `herraduras`
  (`cada`, `puntos`), `pedidos` (talonario propio), datos del cumple del 16/12, etc.
- Scripts del `<body>`: el motor viejo con los juegos (`montarAlgo(a)`) y el cuaderno (`T3.*`: ponyta, mapa,
  adviento, maquina, eventos con `T3.registrarEvento`, cuaderno). Vienen minificados en líneas larguísimas:
  conviene buscar con Python y reemplazar cadenas exactas con `assert h.count(viejo) == 1`.
- Entre `/*<<EXTRAS-JS*/` y `/*EXTRAS-JS>>*/` (y `EXTRAS-CSS` en los estilos) está lo sumado en noviembre
  de 2026, legible y comentado: `T3.x` (base), `T3.actualizar`, `T3.respaldo`, `T3.taller`, `T3.vuelta`
  (contestar cartas, vales), `T3.tienda` (la pestaña verde; el cuaderno la sigue llamando `pedidos`), MafiaTCG
  (`T3.tcg` y cuatro módulos más: ver abajo), `T3.ropa`, `T3.pou` y `T3.herraduras` (ver "La tienda"), `T3.avisos` y
  `T3.viaje`.
  Lo que es para Sofi (TCG, tienda, contestar, avisos) aparece recién desde `CONFIG.t3.estreno`.
- `T3.viaje` (noviembre 2026): Ponyta se va de vacaciones. Desde `SALE`, la próxima corrida en su solapa es la
  de la ida: deja la herradura del día, no vuelve y queda una nota (los textos están arriba del bloque). Mientras
  no está, tampoco sale en el señalador, en "Ponyta dice" ni en el mapa de Olivos. Vuelve el día `VUELVE`
  (primer día del adviento). **El gorro es la sorpresa de la ventanita 1 del adviento: se lo pone recién cuando
  Sofi la abre** (antes no lo lleva en ningún lado, tampoco la Ponyta que adorna el calendario, y lo que dice ese
  día no lo nombra) y le dura hasta `GORRO_HASTA`. Se guarda en `pv-t3-ponyta-viaje`.
  El módulo minificado de Ponyta solo pregunta: `T3.viaje.toca()`, `.ausente(f)`, `.conGorro(f)`, `.poner(…)`;
  el del adviento avisa con `T3.viaje.seAbrio(n,f)` y pregunta `T3.viaje.gorroPuesto()`.

## MafiaTCG (las cartas y el duelo)
Rehecho en noviembre de 2026: las cartas son fotos de ellos, de la familia y de los bichos, con vidas y ataques,
y con 10 cartas se juega un duelo contra "el programador". Todo está en los EXTRAS:
- `T3.tcg` es la pestaña: la lista **`CARTAS`** (buscar "PARA SUMAR O CAMBIAR CARTAS": ahí está explicado cada
  campo), los sobres (**dos cartas**: una normal y otra que a veces es full art), la carpeta, la lupa y los
  MafiaPoints. Guarda en `pv-t3-tcg2`, y el duelo a medio jugar en `pv-t3-tcg2-duelo`. Las cartas nuevas van al
  final de la lista (el número de cada una es su lugar) y el `id` no se cambia nunca.
- Reglas que fijó Mati el 24/11/2026: sobres de 2 cartas, **2 duelos por día** y **10 MafiaPoints por victoria, 0 por
  perder** (sin bonos). El duelo se cuenta cuando arranca: rendirse o dejarlo por otro gasta uno igual; retomar uno
  guardado, no. Sin duelos, la carpeta dice "mañana hay más". Los puntos se gastan en la tienda
  (`T3.tcg.puntos()`, `T3.tcg.gastar(n)`).
- `MafiaCarta` dibuja una carta (clases `mt-`), `MafiaDuelo` tiene las reglas, los efectos de los ataques y al
  rival (no toca la pantalla), `MafiaSonido` fabrica los efectos y la música con WebAudio y `MafiaArena` es la
  pantalla del duelo (clases `ar-`). Las clases de la pestaña son `mq-` y `t3x-`: `tq-` ya lo usa un juego viejo.
- Mati manda cada carta así: formato (normal, que él llama "común", o full art), nombre, foto y nombres de los
  ataques. Tipo, vidas, costos, daño y efectos los decide Claude. **"Perro de Mierda" pega 0: lo pidió él.**
- Fotos: `fotos/t3/tcg/<foto>` (hasta 900 px de ancho) y la misma, chica, en `fotos/t3/tcg/mini/` (360 px, para
  la carpeta y la mesa del duelo), sin datos EXIF. El repo es público: si en una foto hay un chico con poca ropa
  se sube solo el recorte que muestra la carta (así está la de Joaquito). `logo.webp` es el logo que hizo Mati:
  va tal cual en el dorso, en el sobre y en la pestaña.
- En una full art la foto se tiene que ver lo más entera posible (pedido de Mati). Si los ataques tapan una cara,
  el campo `sube` corre la foto hacia arriba.
- La tipografía de las cartas (Barlow Condensed, licencia libre) está en `fuentes/`, no en Google Fonts.
- El rival se ajusta solo (`torpeza`: si ella gana, la próxima juega mejor; si pierde, peor).
- Al 20/11/2026 Mati seguía mandando cartas y los números eran provisorios: cuando diga que están todas hay que
  cerrar tipos, vidas, costos y daños. `node .github/pruebas/c4.cjs` juega miles de duelos y dice cuánto pesa
  cada carta.

## La tienda, la ropa de Ponyta y el modo Pou (noviembre 2026)
La pestaña verde ("Tienda") es donde se gastan los MafiaPoints. **Nada es gratis** (pedido de Mati). Todo en los EXTRAS:
- `T3.tienda`: el **talonario** (pedidos de la vida real: se canjea, se cobra y se abre WhatsApp con el pedido
  numerado) y la **vidriera de Ponyta**. Antes de gastar siempre aparece una hoja para confirmar. Guarda en
  `pv-t3-tienda` (`cosas`, `puesto`, `n`, `log`). Para cambiar un precio: buscar "PARA CAMBIAR UN PRECIO", o pisarlo en
  `CONFIG.t3.tienda.precios`.
- Precios que dictó Mati: mimos 40, masajitos 100, helado 250, camiseta de Racing 600, modo Pou 1000,
  "Subite a la Franconeta" 2000, "Sorpresa" 5000. El resto los puso Claude (accesorios de 60 a 200, tickets de 20 a
  500). Con 20 puntos por día como máximo, lo caro lleva meses: Mati lo sabe.
- `T3.ropa`: lo que Ponyta lleva puesto (una cosa por lugar: cuerpo, cuello, cara, juguete, cabeza), en su solapa, en
  el señalador y en el dibujo a lápiz de las hojas. Hay prendas "de pegar encima" (sombreros, anteojos…), "del cuerpo"
  (camisetas: se pintan adentro del dibujo, con el corte de `CORTE`; la tela puede ser la foto de una remera) y "de la
  pared" (fotos pegadas con cinta en "Su pared", al final de su solapa: conviven varias). Algo en la cabeza reemplaza
  al gorro de Navidad mientras lo lleve. Rapidash es una imagen: para vestirle el cuerpo, `T3.ropa` lee ese mismo
  archivo SVG y pinta encima. A lápiz no van fotos.
- **Logos, escudos y fotos de famosos no se dibujan ni se buscan en internet: los manda Mati y van tal cual** (solo se
  achican; al auto se le sacó el fondo) en `fotos/t3/tienda/`. Así están el escudo de Racing en la camiseta y todo lo
  de la Franconeta. Mati quiere las cosas "posta", no parecidas: si falta una imagen, se le pide. Las canciones no van
  como archivo (un link a Spotify o YouTube, sí).
- **"Subite a la Franconeta"** (2000) es un paquete (`da:[…]` en `ESPECIALES`, prendas con `de:"franconeta"`): el Alpine
  **de juguete** a sus pies (Mati: chico, "no que esté adentro"), la remera del equipo y la foto de Franco en su pared.
  Al comprarlo se pone todo y las piezas aparecen sueltas en la vidriera.
- **Pendiente: "Sorpresa"** (5000; One Direction, y en la tienda no dice qué es). Está en la vidriera con `pronto:true`
  (no se puede comprar) hasta que Mati mande las imágenes; se arma igual que la Franconeta.
- `T3.pou`, el **modo Pou** (se compra una vez y queda): en la solapa de Ponyta, cuatro barras (panza, sueño, limpia,
  mimos) que bajan con las horas, y tres botones: nigiri, baño y a dormir. No pasa nada malo si llegan a cero: ella
  avisa. De noche duerme sola. Guarda en `pv-t3-pou`. El módulo minificado de Ponyta le avisa con
  `T3.pou.montar/alDormir/alDespertar/alMimo`.
- `T3.herraduras`, **canjear herraduras** (pedido de Mati, 24/11): las herraduras son las marcas que Ponyta deja en su
  solapa al correr, **una por día** (la primera corrida). Cada 50 se canjean, a elección, por un **sobre de herraduras**
  (una sola carta, sí o sí una nola: `T3.tcg.darNola()`, se abre en la pestaña del TCG) o por 250 MafiaPoints
  (`T3.tcg.sumar()`). Las marcas no se borran: las canjeadas quedan apagadas. Guarda en `pv-t3-herraduras`. Si ya no
  le faltan cartas, solo ofrece los puntos.

## Para ver una fecha
- `?fecha=AAAA-MM-DD` en la URL, o la máquina del tiempo (5 toques rápidos en el número de hoja → PIN),
  que además tiene el **taller**: versión publicada, respaldo del progreso, avisos y las cartas (un duelo de
  prueba sin tener cartas y, adentro de la máquina, "darme todas", "+1000 puntos" y "+50 herraduras" para probar la
  tienda y el canje).
- En la máquina nada toca el progreso de verdad: lo que se hace va a una sombra que se tira al salir. Viajando
  **hacia adelante** esa sombra se conserva (como si pasaran los días: así se prueba lo que lleva varios, como
  juntar 10 cartas); hacia atrás, o "de cero" al mismo día, arranca limpio.
- El progreso de Sofi vive solo en su celular: `localStorage` con prefijo `pv-` (el cuaderno usa `pv-t3-`).

## Pruebas largas (el laboratorio)
- `.github/pruebas/*.cjs` son los escenarios de lo sumado en noviembre: `a` actualización, respaldo, taller, máquina
  del tiempo y sonido · `b` contestar, la tienda sin puntos y vales · `c2` cartas, sobres y carpeta del TCG · `c1`
  recorrido del TCG con capturas y una hoja con todas las cartas · `c3` el duelo, jugado tocando la pantalla, y el tope
  de 2 por día · `c4` reglas del duelo y equilibrio de las cartas (sin navegador) · `d` avisos en la app · `d-envio` el
  envío (necesita `web-push`) · `e` el viaje de Ponyta y el gorro · `f` la tienda con puntos, la ropa de Ponyta, el
  modo Pou y canjear herraduras. Si se toca ese código, correr el que corresponda: `node .github/pruebas/a.cjs`
  (capturas en `SALIDA=carpeta`).
- WebKit no está instalado en la sesión, solo en GitHub: `gh workflow run laboratorio.yml -R meh889/Mafia
  --ref main` corre todos los escenarios en WebKit y Chromium con las tipografías de verdad (`-f densidad=2`
  para capturas nítidas). Las capturas salen del registro:
  `gh run view <id> -R meh889/Mafia --log | node .github/pruebas/rearmar.cjs <carpeta>`.
- En un duelo de prueba los mazos se barajan al azar aunque haya semilla: para que salga siempre igual hay que fijar
  también `mazo` y `mazoRival` (así lo hace `c3` para ver una victoria). Y las pruebas que dependen de la hora (Ponyta
  duerme de noche) fijan `T3.ahora` y `T3.esDeNoche`, como `f`.
- Diferencias de Safari que ya mordieron: `document.lastModified` viene en UTC (no en hora local), y
  `backface-visibility` falla en el WebKit de Linux del laboratorio (en el iPhone de verdad anda: lo confirmó
  Mati el 19/11). Por las dudas, las cartas se dan vuelta cambiando `visibility` a mitad del giro.

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
