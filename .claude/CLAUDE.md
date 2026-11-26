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
  de 2026, legible y comentado: `T3.x` (base, con los audios: ver "Los audios"), `T3.actualizar`, `T3.respaldo`, `T3.taller`, `T3.vuelta`
  (contestar cartas, vales), `T3.tienda` (la pestaña verde; el cuaderno la sigue llamando `pedidos`), MafiaTCG
  (`T3.tcg` y cuatro módulos más: ver abajo), `T3.ropa`, `T3.pou` y `T3.herraduras` (ver "La tienda"), `T3.avisos`,
  `T3.viaje` y `T3.ventanitas` (ver "El adviento").
  Lo que es para Sofi (TCG, tienda, contestar, avisos) aparece recién desde `CONFIG.t3.estreno`.
- `T3.viaje` (noviembre 2026): Ponyta se va de vacaciones. Desde `SALE`, la próxima corrida en su solapa es la
  de la ida: deja la herradura del día, no vuelve y queda una nota (los textos están arriba del bloque). Mientras
  no está, tampoco sale en el señalador, en "Ponyta dice" ni en el mapa de Olivos. Vuelve el día `VUELVE`
  (primer día del adviento). **El gorro es la sorpresa de la ventanita 1 del adviento: se lo pone recién cuando
  Sofi la abre** (antes no lo lleva en ningún lado, tampoco la Ponyta que adorna el calendario, y lo que dice ese
  día no lo nombra) y le dura hasta `GORRO_HASTA`. Se guarda en `pv-t3-ponyta-viaje`.
  El módulo minificado de Ponyta solo pregunta: `T3.viaje.toca()`, `.ausente(f)`, `.conGorro(f)`, `.poner(…)`;
  el del adviento avisa con `T3.viaje.seAbrio(n,f)` y `T3.viaje.enSorpresa(velo,…)` (cuando muestra la sorpresa: si es
  la del gorro, suena el audio) y pregunta `T3.viaje.gorroPuesto()`.
- El adviento se despliega con `popup()` (módulo minificado del adviento): la caja cerrada, la tapa (la mitad de
  arriba) gira hasta abrirse y queda el calendario inclinado, que después se aplana. Tiene dos entradas: la pestaña
  y, la primera vez, tocar la ventanita del día en la hoja (a pantalla completa, con el botón de volver arriba).
  Mientras la tapa gira queda parada de frente y llega más alto que ya abierta: el encuadre baja lo justo (`dyS`) y,
  en pantallas chicas, además se aleja (`kS`), para que no se corte contra el borde ni pise el botón (25/11/2026: era
  lo que se veía mal "al iniciar el calendario"; `e.cjs` lo mide en las dos entradas). Para verlo cuadro por cuadro,
  igual en cualquier navegador: `T3.adviento.pagina(host,{popup:true,retraso:0,congelar:ms})`.

## El adviento (rehecho con Mati el 26/11/2026)
- **En el adviento no van fotos, notas de voz ni frases**: las sacó Mati. Quedaron Ponyta (1, 9, 19), los vales, las
  cuentas ("dato": 5, 12, 21) y los Legos (7, 17), más lo que pidió ese día. Qué da cada ventanita está en la lista
  `CONTENIDO_ADVIENTO` (módulo minificado del adviento: esa lista es lo único de ahí que quedó legible, un renglón
  por ventanita con su comentario), y se puede pisar una sola desde `CONFIG.t3.adviento`.
- **El papelito del 4** (`tipo:"papelito"`): un papel pegado con cinta con un texto que dictó él, sobre algo que compró
  y escondió. **No es un vale ni tiene que ver con el cofre.** ⚠ El texto va LETRA POR LETRA: "estoy escondido, Pero si
  LAs pistas CuestionAs capaz algo encontRas". Las mayúsculas son la pista (forman P-LA-C-A-R, donde está el regalo): no
  se corrigen, no se les agregan tildes y nunca llevan `text-transform`. Pidió que la diferencia con las minúsculas sea
  "bien alevosa": cada mayúscula se dibuja aparte. De tres estilos (`sello`, `marcador`, `recortes`) eligió **recortes**:
  letras recortadas de revista. El renglón de abajo queda vacío: no se le agrega texto propio.
- **La búsqueda del tesoro**: las ventanitas 3, 6, 10 y 15 (`tipo:"mapa"`, `orden` 1 a 4) dan un pedazo de un mapa con un
  número cada una; la del 24 (`tipo:"cofre"`) es un cofre con cuatro ruedas. Con la clave se abre y sale un papel que
  dice dónde escondió Mati un regalo de verdad. `CONFIG.t3.tesoro`: `clave` (hoy "2805", por el 28/05) y `escondite`.
  **El escondite todavía no lo pasó**: mientras esté vacío, el papel dice "la última pista me la tenés que pedir a mí".
  (No es el placar: eso es lo del 4.) El vale de "la Nochebuena que quieras" pasó del 24 al 23, y su sobre dice 23.
- **El cupón del 13** (`tipo:"cupon"`, `pct:50`): 50% en UNA compra de la tienda, la que ella quiera, también lo caro
  (lo decidió Mati). No se aplica solo: la hoja de confirmar de `T3.tienda` trae un botón para usarlo y se puede
  arrepentir antes de comprar. Redondea para arriba. Se gasta al comprar: queda con los vales canjeados
  (`pv-t3-adviento-canjes`) y, en qué lo usó, en `pv-t3-cupon-usado`. El cofre abierto se guarda en `pv-t3-tesoro`.
- **La ventanita 8 es provisoria** (una cuenta, "dato" con receta `dias`): había una foto y Mati todavía no dijo qué
  va. Hay que preguntarle. Ideas que ya rechazó para las ventanitas libres: sobre de cartas, MafiaPoints de regalo,
  raspadita, carta a Papá Noel, que Ponyta evolucione, un día con más duelos, prendas de Navidad. Le gustan las cosas con
  vuelta: el cupón, la búsqueda del tesoro, el acertijo del 4. Se le propusieron nueve más y no contestó todavía: carta
  promo, oferta relámpago, cambio de figuritas, un objeto para el duelo, doble o nada, regalito escondido, salida
  sorpresa, tarjeta roja y "¿trato hecho?".
- `T3.ventanitas` (EXTRAS) dibuja los tipos nuevos; el módulo del adviento le pregunta (`es`, `mini`, `objeto`, `pie`,
  `montar`, `adentro`). `.github/pruebas/g.cjs` lo prueba todo tocando la pantalla.
- Los días con evento en la hoja (4, 8, 16, 24, 25, 28 y 31) no sirven para probar el adviento con
  `T3.cuaderno.abrir("adviento")`: mientras dura el evento el cuaderno no está armado. Se prueba desde otro día (el cofre,
  desde el 26) o sembrando el evento como ya visto (`pv-t3-set-eventos-vistos`), como hace `g` con el mismo 24.

## Los audios que manda Mati (25/11/2026)
- Son recortes cortos (memes, efectos, un pedacito de canción) y van **tal cual**: solo se les sacan las etiquetas, sin
  recodificar (`ffmpeg -c copy -map_metadata -1`). Viven en `audios/` con nombre neutro y se anotan en `X.CLIPS`
  (EXTRAS, bloque base). **Una canción entera no va como archivo** (un link a Spotify o YouTube, sí).
- `T3.x.clip(nombre,{vol,alEmpezar,alTerminar})` los toca por el AudioContext que ya destrabó el primer toque
  (`T3.audio()`), así suenan aunque no arranquen justo con un toque. Respetan el mudo de la app y, como todos los
  sonidos de la app, **el botón de silencio del iPhone** (con el iPhone en silencio no se escuchan). `T3.x.clipLog`
  anota lo pedido y lo que sonó: lo miran las pruebas.
- Dónde suena cada uno (lo dictó él):
  - `gorro.mp3` (el "wo men ji"): cuando se abre la ventanita 1 del adviento y aparece Ponyta con el gorro. Mientras
    dura, ella baila y nieva; tocándola suena de nuevo (`T3.viaje.enSorpresa`).
  - `sorpresa.mp3` (One Direction): la primera vez que se abre la solapa de Ponyta con la Sorpresa recién comprada
    (queda anotado en `pv-t3-sorpresa-sono`), y después cada vez que se toca el pasacalle; otro toque la corta
    (`conMusica` en `T3.ropa`; el pasacalle lleva `clip`).
  - `explosion.mp3`: en el duelo, cuando ataca **Perro de Mierda** (su ataque lleva `fx:"explosion"`). La arena
    muestra un edit entero (`fxExplosion` en MafiaArena: franjas de cine, acercamiento, un cuadro a oscuras, fogonazo,
    resplandor naranja, temblor y explosiones por toda la mesa) y termina con un "−0". El momento lo eligió Claude; Mati
    pidió "un momento gracioso". **Sin filtros** (`filter`, `backdrop-filter`): ver "Diferencias de Safari". Con
    "reducir movimiento" es una sola explosión, quieta.
- Las explosiones son una tira de 20 cuadros en fila, `fotos/t3/tcg/explosion.webp`, fabricada con ruido por
  `.github/scripts/explosion.py` (no sale de ningún GIF). Si Mati manda un GIF de verdad, se reemplaza por una tira con
  esa misma forma.
- Para probarlos: en el taller, **"la explosión"** abre un duelo de prueba con el perro al frente y listo para
  atacar (solo en ese duelo las cartas del frente arrancan con una energía); el gorro, viajando al 1/12 y abriendo la ventanita 1; la Sorpresa, con "+1000 puntos" cinco veces.

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
- Reglas del duelo que se fijaron al cerrar los números (26/11/2026; están explicadas arriba de `MafiaDuelo` y, para
  ella, en "Cómo se juega" de la pausa): **las cartas arrancan sin energía** (con una, quien jugaba segundo abría con
  un ataque de dos y ganaba el 57% de los duelos; ahora es 53 a 47 para quien empieza); **una carta que se despierta
  no se puede volver a dormir en el turno siguiente** (queda "desvelada": antes, con "Sueño" se podía dejar al rival
  sin atacar nunca; la arena muestra "no se duerme"); y "cura a una carta de tu banca" cura solo a la banca. Un ataque
  sin daño propio que pega por energía ("Más Nigiris") muestra "20×" en la carta.
- Mati manda cada carta así: formato (normal, que él llama "común", o full art), nombre, foto y nombres de los
  ataques. Tipo, vidas, costos, daño y efectos los decide Claude. **"Perro de Mierda" pega 0: lo pidió él.** Y su
  ataque se muestra con la explosión (`fx:"explosion"`: ver "Los audios").
- Fotos: `fotos/t3/tcg/<foto>` (hasta 900 px de ancho) y la misma, chica, en `fotos/t3/tcg/mini/` (360 px, para
  la carpeta y la mesa del duelo), sin datos EXIF. El repo es público: si en una foto hay un chico con poca ropa
  se sube solo el recorte que muestra la carta (así está la de Joaquito). `logo.webp` es el logo que hizo Mati:
  va tal cual en el dorso, en el sobre y en la pestaña.
- En una full art la foto se tiene que ver lo más entera posible (pedido de Mati). Si los ataques tapan una cara,
  el campo `sube` corre la foto hacia arriba.
- La tipografía de las cartas (Barlow Condensed, licencia libre) está en `fuentes/`, no en Google Fonts.
- El rival se ajusta solo (`torpeza`: si ella gana, la próxima juega mejor; si pierde, peor). Elige qué carta bajar
  por lo que aguanta y lo que pega, y si la del frente está dormida o cansada la cambia por una de la banca que pueda
  pegar ya. A Perro de Mierda lo baja como a una más (es parte del chiste: así la explosión también se ve de su lado).
- **Las 30 cartas están todas (lo dijo Mati el 26/11/2026) y sus números quedaron cerrados ese día**: tipos, vidas,
  costos, daños y efectos. Se midieron con cientos de miles de duelos hasta que el mazo que lleva cada carta gane entre
  el 48 y el 53% de las veces (con mazos de 6; con los de 10 de la app, entre 49 y 52). Perro de Mierda queda en 34%:
  es floja a propósito, y Mati confirmó que sigue sacándole una energía a la rival. `node .github/pruebas/c4.cjs` lo
  vuelve a medir y exige que todas estén entre 45 y 55: hay que correrlo si se toca un número o se suma una carta
  (una carta nueva se ajusta ella, sin mover las otras).
- Seis fotos son chicas (256 px, y Sushito 360): Kirby, Mati Shiny, Siestita, Fantasma, Peque Mikasa y Sushito.
  Quedan así: lo decidió Mati el 26/11 ("las imágenes son chicas, pero las cartas también"). No hay que volver a
  pedirle los originales.

## La tienda, la ropa de Ponyta y el modo Pou (noviembre 2026)
La pestaña verde ("Tienda") es donde se gastan los MafiaPoints. **Nada es gratis** (pedido de Mati). Todo en los EXTRAS:
- `T3.tienda`: el **talonario** (pedidos de la vida real: se canjea, se cobra y se abre WhatsApp con el pedido
  numerado) y la **vidriera de Ponyta**. Antes de gastar siempre aparece una hoja para confirmar. Guarda en
  `pv-t3-tienda` (`cosas`, `puesto`, `n`, `log`). Para cambiar un precio: buscar "PARA CAMBIAR UN PRECIO", o pisarlo en
  `CONFIG.t3.tienda.precios`.
- Precios que dictó Mati: mimos 40, masajitos 100, helado 250, camiseta de Racing 600, modo Pou 1000,
  "Subite a la Franconeta" 2000, "Sorpresa" 5000. El resto los puso Claude (accesorios de 60 a 200, tickets de 20 a
  500). Con 20 puntos por día como máximo, lo caro lleva meses: Mati lo sabe.
- `T3.ropa`: lo que Ponyta lleva puesto (una cosa por lugar: cuerpo, cuello, cara, juguete, cartel, cabeza), en su
  solapa, en el señalador y en el dibujo a lápiz de las hojas. Hay prendas "de pegar encima" (sombreros, anteojos…; pueden
  llevar texto escrito a mano, e ir detrás de ella con `atras`), "del cuerpo" (camisetas: se pintan adentro del dibujo,
  con el corte de `CORTE`; la tela puede ser la foto de una remera), "de la pared" (fotos pegadas con cinta en "Su pared",
  al final de su solapa: conviven varias) y el pasacalle (una tela colgada arriba de su escena, con una imagen). Algo en
  la cabeza reemplaza al gorro de Navidad mientras lo lleve. Rapidash es una imagen: para vestirle el cuerpo, `T3.ropa`
  lee ese mismo archivo SVG y pinta encima. A lápiz no van fotos.
- **Logos, escudos y fotos de famosos no se dibujan ni se buscan en internet: los manda Mati y van tal cual** (solo se
  achican; al auto se le sacó el fondo) en `fotos/t3/tienda/`. Así están el escudo de Racing en la camiseta y todo lo
  de la Franconeta. Mati quiere las cosas "posta", no parecidas: si falta una imagen, se le pide. Con los audios es
  igual: los recortes cortos que manda van tal cual; una canción entera no va como archivo (ver "Los audios").
- **"Subite a la Franconeta"** (2000) es un paquete (`da:[…]` en `ESPECIALES`, prendas con `de:"franconeta"`): el Alpine
  **de juguete** a sus pies (Mati: chico, "no que esté adentro"), la remera del equipo y la foto de Franco en su pared.
  Al comprarlo se pone todo y las piezas aparecen sueltas en la vidriera.
- **"Sorpresa"** (5000) es One Direction, y es secreto (`secreto:true`): hasta que la compra, la tienda no dice qué es
  ni muestra el logo ni sus piezas. Trae el pasacalle con el logo (y con música: ver "Los audios"), el **cartel de
  protesta** que lleva Ponyta ("LARRY ES REAL / aunque lo oculten": lo dictó Mati, es un chiste de ellos dos y va
  literal; con el gorro de Navidad puesto se corre a un costado, `tGorro`, para que el pompón no tape la letra) y el
  póster de los cinco para su pared.
  Hoy no hay nada con `pronto:true` (se ve en la vidriera pero no se puede comprar): queda para lo próximo que se anuncie
  antes de estar listo.
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
  prueba sin tener cartas, "la explosión" —el mismo duelo con Perro de Mierda al frente— y, adentro de la máquina,
  "darme todas", "+1000 puntos" y "+50 herraduras" para probar la tienda y el canje).
- En la máquina nada toca el progreso de verdad: lo que se hace va a una sombra que se tira al salir. Viajando
  **hacia adelante** esa sombra se conserva (como si pasaran los días: así se prueba lo que lleva varios, como
  juntar 10 cartas); hacia atrás, o "de cero" al mismo día, arranca limpio.
- El progreso de Sofi vive solo en su celular: `localStorage` con prefijo `pv-` (el cuaderno usa `pv-t3-`).

## Pruebas largas (el laboratorio)
- `.github/pruebas/*.cjs` son los escenarios de lo sumado en noviembre: `a` actualización, respaldo, taller, máquina
  del tiempo y sonido · `b` contestar, la tienda sin puntos y vales · `c2` cartas, sobres y carpeta del TCG · `c1`
  recorrido del TCG con capturas y una hoja con todas las cartas · `c3` el duelo, jugado tocando la pantalla, el tope
  de 2 por día y la explosión de Perro de Mierda · `c4` reglas del duelo y equilibrio de las cartas (sin navegador) ·
  `d` avisos en la app · `d-envio` el envío (necesita `web-push`) · `e` el viaje de Ponyta, el gorro y su audio, y el despliegue del adviento · `f` la
  tienda con puntos, la ropa de Ponyta, el modo Pou, la música de la Sorpresa y canjear herraduras · `g` el adviento
  nuevo: el papelito del 4, el mapa, el cofre y el cupón (con la compra en la tienda). Los audios se
  prueban por `T3.x.clipLog`: en Chromium tienen que sonar; donde el navegador no sepa leer el mp3, solo no romper. Si se toca ese código, correr el que corresponda: `node .github/pruebas/a.cjs`
  (capturas en `SALIDA=carpeta`).
- WebKit no está instalado en la sesión, solo en GitHub: `gh workflow run laboratorio.yml -R meh889/Mafia
  --ref main` corre todos los escenarios en WebKit y Chromium con las tipografías de verdad (`-f densidad=2`
  para capturas nítidas). Las capturas salen del registro:
  `gh run view <id> -R meh889/Mafia --log | node .github/pruebas/rearmar.cjs <carpeta>`.
- En un duelo de prueba los mazos se barajan al azar aunque haya semilla: para que salga siempre igual hay que fijar
  también `mazo` y `mazoRival` (así lo hace `c3` para ver una victoria; la semilla la busca la misma prueba, jugando
  sin pantalla, para no depender de los números de las cartas). Y las pruebas que dependen de la hora (Ponyta
  duerme de noche) fijan `T3.ahora` y `T3.esDeNoche`, como `f`.
- Diferencias de Safari que ya mordieron: `document.lastModified` viene en UTC (no en hora local), y
  `backface-visibility` falla en el WebKit de Linux del laboratorio (en el iPhone de verdad anda: lo confirmó
  Mati el 19/11). Por las dudas, las cartas se dan vuelta cambiando `visibility` a mitad del giro.
- El WebKit del laboratorio dibuja sin placa de video: con un `filter` sobre un bloque grande o un `backdrop-filter`
  en pantalla se quedó trabado casi 5 segundos (la primera versión de la explosión del duelo los usaba y se le
  sacaron: 25/11/2026; sin ellos, la misma medición da de 15 a 20 cuadros por segundo durante las explosiones y unos
  40 en reposo). En un iPhone de verdad no se pudo medir, así que mejor no usarlos en animaciones. Ojo al medir: en ese
  WebKit cada `screenshot` frena la página unos cientos de milisegundos, así que la fluidez no se juzga mientras se
  sacan capturas.
- Lo que dura poco en pantalla no se espera con `waitForFunction`: si la página se traba un instante, no llega a
  verlo. Se anota desde la página (un `setInterval` que va guardando lo que ve) y se pregunta por lo anotado, como
  hace `c3` con la explosión.
- `MOVIMIENTO=menos` corre un escenario con "reducir movimiento" prendido (ahí el duelo va más rápido, el adviento
  no se despliega y la explosión es una sola). Sirve para `c3`; `e` mide animaciones a mitad de camino y no está
  pensado para correr así.

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
