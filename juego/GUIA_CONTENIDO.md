# Guía para agregar contenido al juego

Esta guía explica cómo registrar personajes, enemigos, criaturas y objetos en los catálogos del juego, y cómo poner objetos en el inventario inicial o equipados en un personaje.

## 1. Antes de empezar

1. Guarda las imágenes dentro de `recursos/imagen/`.
2. Usa una ruta relativa a la carpeta `juego`, por ejemplo `recursos/imagen/bruja.jpeg`.
3. Copia un objeto existente del mismo tipo y cambia sus datos. Conserva las comas y llaves.
4. Cada `id` debe ser único. Se usa para encontrar y asignar el contenido desde otros archivos.
5. Los catálogos se cargan desde `index.html`; si agregas un archivo JavaScript nuevo, también hay que incluirlo allí en el orden correcto.

## 2. Crear un personaje jugable

Edita `personaje/personajesBase.js` y agrega un objeto dentro del array `window.juego.personajesBase`:

```js
{
  id: "explorador",
  nombre: "Explorador",
  clase: "Explorador",
  imagen: "recursos/imagen/explorador.jpeg",
  descripcion: "Un explorador de las ruinas antiguas.",
  pasiva: "Describe aquí su pasiva.",
  habilidadGrupo: "Describe aquí su bonificación grupal.",
  nivel: 1,
  vidaMaxima: 100,
  vidaInicial: 100, // Opcional; si se omite, empieza con vida máxima.
  corduraMaxima: 100,
  poderMaximo: 100,
  resistenciaFisica: 5,
  resistenciaCordura: 5,
  fuerza: 5,
  agilidad: 5,
  danioMoral: 1,
  bonificacionCritico: 0, // Probabilidad: 0.08 equivale a 8 %.
  puntosHabilidad: 0,
}
```

Pasos:

1. Elige un `id` estable y único; evita espacios y usa minúsculas con guiones.
2. Completa nombre, clase, imagen, descripción, pasiva y habilidad de grupo.
3. Define nivel y máximos de vida, cordura y poder.
4. Define resistencias, fuerza y agilidad. Estos atributos deben estar entre 0 y 10.
5. Define `bonificacionCritico` entre 0 y 1. La mayoría de personajes usa 0.
6. Si quieres que aparezca como tarjeta jugable, agrega su tarjeta correspondiente en `index.html` con `data-character-id` igual al `id`.

`personaje/personajes.js` crea los objetos `Personaje` desde este catálogo. Ese archivo también actualiza las tarjetas y contiene la sección de equipo inicial explicada más abajo.

## 3. Crear un enemigo humano

Edita `enemigo/enemigosBase.js` y añade una instancia de `Enemigo` dentro de `window.juego.enemigosBase`:

```js
new Enemigo({
  id: "guardia-ruinas",
  nombre: "Guardia de las ruinas",
  tipo: "humano",
  imagen: "recursos/imagen/enemigo-generico.svg",
  nivel: 1,
  vidaMaxima: 50,
  corduraMaxima: 100,
  poderMaximo: 100,
  ataqueBase: 4,
  resistenciaBase: 3,
  agilidad: 4,
  bonificacionCritico: 0,
  maldito: false,
  equipo: { arma: null, armadura: null },
  descripcion: "Un guardia que protege la entrada.",
}),
```

Pasos:

1. Usa un `id` único y define `tipo: "humano"`.
2. Define imagen, nivel, máximos de recursos, ataque, resistencia y agilidad.
3. `bonificacionCritico` es opcional y por defecto vale 0.
4. `maldito` es opcional y por defecto vale `false`.
5. `equipo` puede incluir `arma` y `armadura` encontradas en `itemsBase`. Sus categorías deben coincidir con el slot.
6. Escribe una descripción.

Para aplicar un efecto de estado al conectar un golpe, puedes configurar `efectoGolpe`. Actualmente admite veneno:

```js
efectoGolpe: {
  tipo: "veneno",
  probabilidad: 0.25, // 25 % por golpe conectado.
  danioPorTurno: 3,
  duracion: 3,
},
```

El daño se aplica al inicio de cada turno del objetivo. La probabilidad se expresa entre 0 y 1.

El archivo actual compone `poolEncuentros` combinando enemigos humanos con las criaturas de `criaturasBase.js`.

## 4. Crear una criatura

Edita `enemigo/criaturasBase.js` y agrega una instancia de `Enemigo` a `window.juego.criaturasBase`. La estructura de atributos es la misma que para un enemigo humano:

```js
new Enemigo({
  id: "murcielago-ciego",
  nombre: "Murciélago ciego",
  tipo: "criatura",
  imagen: "recursos/imagen/enemigo-generico.svg",
  nivel: 1,
  vidaMaxima: 20,
  corduraMaxima: 100,
  poderMaximo: 100,
  ataqueBase: 2,
  resistenciaBase: 1,
  agilidad: 8,
  bonificacionCritico: 0,
  maldito: false,
  descripcion: "Una criatura veloz que habita en cuevas.",
}),
```

Agrega la criatura al array con una coma entre instancias. No hace falta agregarla manualmente al `poolEncuentros`: `enemigosBase.js` incorpora el catálogo de criaturas al pool.

## 5. Crear un arma

Edita `item/armasBase.js` y añade una instancia de `Item` al array `window.juego.armasBase` (o usa `.push(...)` después del array):

```js
new Item({
  id: "lanza-guardia",
  categoria: "arma",
  tipo: "lanza",
  nombre: "Lanza de guardia",
  descripcion: "Una lanza sencilla de asta larga.",
  nivel: 1,
  ataque: 3,
  alcance: 3,
  danioMoral: 0,
  danioAgilidad: 0,
  danioPoder: 0,
  ataquesEspeciales: {
    dirigido: {
      nombre: "Ensartar",
      multiplicadorDanio: 1.5,
      costePoder: 10,
      objetivosMaximos: 1,
    },
    area: {
      nombre: "Barrido de lanza",
      multiplicadorDanio: 0.5,
      costePoder: 15,
      objetivosMaximos: 2,
    },
  },
  clasesPermitidas: ["caballero", "asesino"],
  magico: false,
  imagen: "recursos/imagen/lanza.png",
  icono: "🔱",
}),
```

Campos importantes:

- `ataque`: daño físico base del arma.
- `alcance`: entero entre 1 y 4.
- `danioMoral`, `danioAgilidad`, `danioPoder`: efectos adicionales del arma.
- `ataquesEspeciales`: el juego requiere ambos perfiles: `dirigido` y `area`. `objetivosMaximos` debe ser 1 para dirigido y 2 para área.
- `clasesPermitidas`: clases que pueden equiparla, en minúsculas; `"todas"` significa todas las clases permitidas por las reglas de magia.
- `magico`: usa `true` para armas mágicas. Solo Bruja y Sacerdote pueden usar equipo mágico; la Bruja no puede equipar armas no mágicas.
- `bonificaciones` es opcional y puede modificar `resistenciaFisica`, `resistenciaCordura`, `fuerza`, `agilidad` y `poder`. Acepta valores negativos, por ejemplo `{ agilidad: -1 }`.

Para un ataque especial curativo, define `efecto: "curacion"` y un valor positivo `curacion` en el perfil. El arma debe ser mágica. Conserva los dos perfiles obligatorios; un perfil puede ser de daño y el otro de curación.

## 6. Crear una armadura

Edita `item/armadurasBase.js` y añade una instancia de `Item` al array `window.juego.armadurasBase`:

```js
new Item({
  id: "cota-viajero",
  categoria: "armadura",
  tipo: "media",
  nombre: "Cota del viajero",
  descripcion: "Una cota ligera reforzada en los hombros.",
  nivel: 1,
  bonificaciones: {
    resistenciaFisica: 2,
    agilidad: -1,
    poder: 0,
  },
  clasesPermitidas: ["caballero", "asesino"],
  magico: false,
  imagen: "recursos/imagen/cota.png",
  icono: "🛡️",
}),
```

Las bonificaciones pueden incluir resistencia física, resistencia de cordura, fuerza, agilidad y poder. Si no quieres modificar un atributo, puedes omitirlo. Las penalizaciones se escriben con valores negativos. Para compatibilidad, una armadura también puede definir `proteccion` como protección física, aunque se recomienda expresar los atributos dentro de `bonificaciones`.

Cada objeto también tiene `valor`, su precio base en monedas. Si se omite, se calcula según categoría y nivel: equipo común cuesta 20 por nivel, consumibles 10 por nivel y objetos especiales 25 por nivel. Puedes definirlo manualmente para ajustar la economía.

En las armas, `tipo` agrupa familias como `espada`, `arco`, `baston` o `libro`. Tanto las dagas como las espadas largas usan ahora el tipo `espada`; se conserva el nombre individual de cada objeto.

## 7. Crear un objeto especial

Edita `item/objetosEspecialesBase.js` y agrega un `Item` con `categoria: "especial"`:

```js
new Item({
  id: "amuleto-sereno",
  categoria: "especial",
  tipo: "amuleto",
  nombre: "Amuleto sereno",
  descripcion: "Un amuleto que calma la mente.",
  nivel: 1,
  danioMoral: 0,
  proteccionCordura: 3,
  proteccionMoral: 1,
  bonificaciones: { poder: 2 }, // Opcional.
  clasesPermitidas: ["todas"],
  magico: false,
  imagen: "recursos/imagen/amuleto.png",
  icono: "📿",
}),
```

Un objeto especial debe aportar al menos un punto entre `danioMoral`, `proteccionCordura` y `proteccionMoral`. También puede definir bonificaciones de atributos.

## 8. Crear un consumible

Edita `item/consumiblesBase.js` y agrega un `Item` con `categoria: "consumible"`:

```js
new Item({
  id: "tonico-poder",
  categoria: "consumible",
  tipo: "tonico",
  nombre: "Tónico de poder",
  descripcion: "Restaura parte del poder perdido.",
  nivel: 1,
  bonificacion: { poder: 20 },
  clasesPermitidas: ["todas"],
  magico: false,
  imagen: "recursos/imagen/tonico.png",
  icono: "🧪",
}),
```

`bonificacion` debe contener al menos un recurso positivo entre `vida`, `cordura` y `poder`. Para grimorios, usa `tipo: "grimorio"`, `magico: true` y define las clases permitidas como Bruja o Sacerdote.

Un consumible de efecto de estado puede usar `efectoEstado` en lugar de `bonificacion`. La botella de veneno de prueba prepara el arma convencional equipada para su siguiente impacto exitoso; ese impacto aplica 3 de daño por veneno en cada uno de los próximos 3 turnos del enemigo. Los estados se procesan al comienzo del turno de su objetivo, no se acumulan y una nueva aplicación renueva su duración. Los bastones, libros y otras armas mágicas no aceptan este veneno. El juego incluye una botella en el inventario inicial.

```js
efectoEstado: { tipo: "veneno", danioPorTurno: 3, duracion: 3 },
```

La poción de resurrección es un consumible especial con `revivir: true`. Se elige un aliado caído y vuelve con el 25 % de su vida máxima. El combate automático no consume esta poción; hay que seleccionarla manualmente. El juego incluye una copia en el inventario inicial.

## 9. Catálogo común de objetos

No hace falta registrar el mismo objeto dos veces en `itemsBase.js`. Ese archivo concatena automáticamente:

1. `armadurasBase`
2. `armasBase`
3. `objetosEspecialesBase`
4. `consumiblesBase`

Por eso, después de agregar un objeto al catálogo correspondiente, queda disponible en `juego.itemsBase` para el inventario, los equipos y los enemigos.

## 10. Agregar un objeto al inventario inicial

El inventario compartido tiene 18 espacios y está expuesto como `window.inventarioGrupo`. El equipo inicial se prepara al final de `personaje/equipo.js`. Ahí se agregan actualmente las pociones y el anillo.

Para poner una copia de un objeto del catálogo en el inventario inicial, agrega junto a esas asignaciones:

```js
// INVENTARIO INICIAL: agrega aquí objetos disponibles al comenzar la partida.
const arcoInicial = juego.itemsBase.find((item) => item.id === "arco-corto-recuperado");
if (!arcoInicial) {
  throw new Error("No se encontró el arco corto inicial.");
}
inventario.agregarItem(arcoInicial);
```

`inventario.agregarItem` lo coloca en el primer espacio libre y devuelve el número de ese espacio. El inventario tiene que tener un espacio libre.

## 11. Equipar un objeto directamente a un personaje

Los objetos iniciales equipados se asignan en `personaje/personajes.js`, en el bloque marcado `EQUIPO INICIAL`. Primero se busca el objeto por `id`, luego se valida su categoría y que la clase del personaje esté permitida, y finalmente se asigna al slot.

Ejemplo para que el Asesino empiece con el arco equipado:

```js
const arcoInicialAsesino = juego.itemsBase.find((item) => item.id === "arco-corto-recuperado");
if (arcoInicialAsesino?.categoria !== "arma"
  || !arcoInicialAsesino.clasesPermitidas.includes("asesino")) {
  throw new Error("El arco inicial no puede equiparse al Asesino.");
}

const asesino = personajes.find((personaje) => personaje.id === "asesino");
asesino.equipo.arma = arcoInicialAsesino;
```

Slots disponibles: `arma`, `armadura` y `especial`. Para que el objeto esté equipado desde el inicio, no lo agregues también al inventario salvo que quieras entregar otra copia.

## 12. Entregarlo en inventario para equipar desde la interfaz

Si quieres que el jugador lo equipe durante la partida:

1. Agrégalo al inventario inicial en `personaje/equipo.js`, como en el paso anterior.
2. Abre el inventario del juego y selecciona el objeto.
3. Elige el personaje disponible. La interfaz filtra los personajes según `clasesPermitidas` y las reglas de objetos mágicos.
4. Al confirmar, el objeto pasa del inventario al slot correspondiente (`arma`, `armadura` o `especial`). El objeto que ya estaba en ese slot vuelve al mismo espacio del inventario.

La lógica de equipamiento y validación está en `personaje/equipo.js`, en `equiparDesdeInventario` y `clasePuedeEquipar`.

## 13. Añadir contenido a encuentros

- Los enemigos humanos se registran en `enemigo/enemigosBase.js`.
- Las criaturas se registran en `enemigo/criaturasBase.js`.
- `enemigosBase.js` combina ambas listas para construir `window.juego.poolEncuentros`.
- Los objetos que lleva un enemigo deben buscarse en `juego.itemsBase` y colocarse en `equipo: { arma, armadura }`.

## 14. Lista rápida de revisión

- [ ] El `id` es único y coincide con el que usas para buscar el contenido.
- [ ] La ruta de imagen existe dentro de `recursos/imagen/`.
- [ ] La categoría coincide con el catálogo donde agregaste el objeto.
- [ ] Las clases permitidas están escritas en minúsculas y permiten el uso deseado.
- [ ] Un arma tiene sus perfiles `dirigido` y `area`, con número de objetivos válido.
- [ ] Los valores numéricos cumplen los límites indicados.
- [ ] Si es equipo inicial, elegiste una sola forma: en inventario o equipado directamente.
- [ ] El inventario inicial tiene espacio disponible.

## 15. Sonidos y música

El juego distingue entre **efectos puntuales** (se reproducen una vez) y la **música de fondo** (suena en loop).

### 15.1 Sonido al moverse por el mapa

Cada vez que el grupo avanza una casilla se reproduce `recursos/sonidos/pasos.mp3`. Es un efecto fijo definido en `audio/sonidos.js` (clave `pasos`). Para cambiarlo, reemplaza ese archivo por otro con el mismo nombre.

### 15.2 Sonido de un POI

Un punto de interés puede tener una propiedad `sonido` con la ruta relativa del audio que suena al abrir su aviso. Es opcional: si se omite, no se reproduce nada.

```js
{
  id: "tesoro-antiguo",
  nivel: 1,
  imagen: "recursos/imagen/poi/tesoro-antiguo.png",
  sonido: "recursos/sonidos/abrir-cofre.mp3", // Opcional.
  texto: "Un cofre olvidado entre el polvo.",
  loot: "aleatorio",
  accion: "Recoger tesoro",
}
```

Desde **Opciones > Cargar POI** puedes asignar el audio con el botón “Asignar audio…”, igual que la imagen. El archivo se copia a `recursos/sonidos/` con el `id` del POI.

### 15.3 Música de un mapa

Un mapa puede tener una propiedad `audio` con la ruta de la canción que suena en loop mientras lo exploras. Acepta `null` si no quieres música.

```js
{
  id: "mapa_demo",
  nivel: 1,
  // ...
  audio: "recursos/sonidos/tema-mazmorra.mp3", // O null para no reproducir música.
  mensajes: { /* ... */ },
}
```

Desde **Opciones > Cargar mapa** puedes asignarla con el botón “Asignar audio…”. El campo es opcional y por defecto queda en `null`.

### 15.3.1 Archivos de mapas

Las definiciones están separadas por mapa dentro de `niveles/`: `demo.js` contiene el mapa de prueba, mientras que `nivel_1.js` y `nivel_2.js` quedan como plantillas para los primeros mapas oficiales. Cada archivo registra su mapa en `juego.mapasBase` y su configuración de encuentros, tesoros y salidas en `juego.configuracionPorMapa`, usando el ID del mapa como clave. Los datos reutilizables, como el vendedor, siguen en `datos/puntosInteresBase.js`.

Al agregar otro nivel, incluye su script en `index.html` después de `datos/mapasBase.js` y `datos/mapasCreados.js`, y antes de `app/recurso-editor.js`.

### 15.4 Vendedor y monedas

Las monedas y las raciones son reservas compartidas, separadas de los espacios del inventario. Los cofres dan entre 10 y 25 monedas y entre 2 y 5 raciones además de sus objetos. Cada casilla transitable recorrida consume una ración; sin comida, cada aliado vivo pierde 10 puntos de poder por paso, hasta cero. Al empezar una partida el grupo recibe 10 raciones. Cada enemigo derrotado deja una ración, también en encuentros de emboscada. El enano vende paquetes de 5 raciones por 20 monedas, con tres paquetes disponibles por vendedor. Los objetos tienen un `valor` en monedas: el enano paga al grupo un tercio redondeado hacia arriba, con mínimo de una moneda, y los vende por tres veces ese precio. Los objetos de misión no se pueden vender.

El POI `vendedor-enano` aparece según el nivel mínimo y la cantidad de POI del mapa. Su mercancía se configura mediante IDs existentes en `itemsBase`, por ejemplo:

```js
{
  id: "vendedor-enano",
  nivel: 1,
  tipo: "vendedor",
  imagen: "recursos/imagen/historia/poi_vendor_r.png",
  texto: "¡Te encontraste con un enano dispuesto a comerciar!",
  mercancia: ["pocion-curacion", "botella-veneno", "armadura-media-antigua"],
}
```

Cada producto comienza con tres unidades por vendedor y nivel; el stock comprado permanece agotado si el grupo vuelve al mismo vendedor durante esa partida.

### 15.5 Mensajes de exploración con imágenes

Cada mapa puede asociar una imagen a los mensajes de navegación. En el editor **Cargar mapa**, completa el campo opcional **Mensajes con imagen (JSON)** con listas por categoría. Cada escena usa `texto`, `imagen` y, opcionalmente, `alt`. El siguiente ejemplo es JSON válido para pegar en el editor:

```json
{
  "pasillo": [
    {
      "texto": "Avanzas por un pasillo oscuro.",
      "imagen": "recursos/imagen/mapa/1_1.png",
      "alt": "Pasillo de una caverna"
    }
  ],
  "bifurcacion": [
    {
      "texto": "Llegas a una bifurcación.",
      "imagen": "recursos/imagen/mapa/1_4.png",
      "alt": "Bifurcación en el túnel"
    }
  ],
  "tramo": [
    { "texto": "El corredor se estrecha.", "imagen": "recursos/imagen/mapa/1_5.png" }
  ]
}
```

Las rutas deben apuntar a imágenes existentes dentro del proyecto. En cada movimiento se elige una escena al azar de la categoría correspondiente y se muestra en el panel de encuentro junto al mensaje. Los mapas existentes con listas de textos simples siguen funcionando; una entrada sin `imagen` muestra el mensaje y oculta la ilustración anterior.

### 15.6 Música del menú

El menú usa una única canción fija en `recursos/sonidos/menu.mp3`. En **Opciones** hay un interruptor de **Música** para encenderla o apagarla; la preferencia se guarda en el navegador (`localStorage`, clave `juego.musica`).

- Suena al abrir la aplicación y en la pantalla de personajes.
- Al entrar a explorar el mapa se detiene y pasa a sonar la música del mapa (o silencio si el mapa no tiene `audio`).
- Si el interruptor está apagado, no suena ninguna canción fuera de la mazmorra. La música del mapa, en cambio, depende solo de la propiedad `audio` del mapa.

> Nota: el interruptor de música funciona en cualquier navegador porque solo lee el archivo `menu.mp3` ya presente en `recursos/sonidos/`. En cambio, copiar audios nuevos al proyecto desde el editor (POI y mapa) usa la File System Access API, por lo que requiere un navegador compatible (Chrome o Edge) y elegir la carpeta del proyecto, igual que al guardar imágenes. Los efectos puntuales (`pasos`, `sonido` del POI) también funcionan en cualquier navegador porque solo leen archivos ya presentes en `recursos/sonidos/`.

### 15.7 Progresión de Escaramuza

**Escaramuza** comienza en la ronda 1 con dos encuentros enemigos. Al cruzar la salida, cada ronda agrega dos casillas por lado al tamaño base del mapa y suma al azar uno o dos encuentros permanentes a la ronda anterior. El tamaño tiene un máximo de 61 casillas por lado. Esta progresión solo aplica al modo Escaramuza; el modo Historia podrá definir sus mapas y encuentros manualmente.

## 16. Organización de los archivos JavaScript

Los scripts generales se agrupan por responsabilidad. Si agregas un script nuevo, guarda el archivo en la carpeta correspondiente y registra su ruta en `index.html`, respetando el orden de carga con `defer`.

- `app/`: navegación de pantallas y editor de recursos.
- `audio/`: efectos de sonido y música.
- `datos/`: catálogos reutilizables y registros creados desde Opciones. Los mapas definidos a mano están en `niveles/`.
- `niveles/`: un archivo JavaScript por mapa; `demo.js` es el mapa de prueba y `nivel_1.js`, `nivel_2.js` son plantillas para los mapas oficiales.
- `exploracion/`: movimiento, mapa y generación de puntos de interés.
- `personaje/formacion.js`: reordenamiento de las tarjetas del grupo.

## 17. Estado de armas y armaduras

Cada copia de un arma o armadura guarda su propia `durabilidad`, que determina su eficacia entre 100 % y 50 %. El estado visible se agrupa en `optimo` (100 %), `usado` (95 % a 55 %) y `dañado` (50 %). Si se omite, el equipo comienza en estado óptimo.

- Al terminar un combate, cada arma y armadura que usó el grupo pierde 5 puntos porcentuales de eficacia. El 50 % es el límite inferior.
- El equipo de los enemigos no se deteriora.
- Al generarse una recompensa, cada arma o armadura recibe un estado al azar: 25 % óptimo, 50 % usado y 25 % dañado. La tirada ocurre al crear el botín, aunque el grupo todavía no lo haya recogido.
- La condición reduce el daño de las armas y las resistencias aportadas por las armaduras. No modifica las bonificaciones de atributos ni la curación de armas. Se muestra en el inventario, el equipo y la ficha del personaje.
- Un aliado que haya muerto durante el encuentro no recibe experiencia, aunque luego haya sido resucitado antes de la victoria.
- Desde **Opciones > Cargar recurso**, el campo **Estado inicial** permite elegir la condición de un arma o armadura nueva. Si no necesitas configurarlo, deja **Óptimo**.


problemas a solucionar -------
simule un ataque contra dos merodeadores el primero huyo y el segundo no podía atacar ya que decis que su arma no tenia alcance, cuando en realidad el primero ya no debia contar para el calculo de distancia.

-- al terminar un mapa, salir por la puerta debe aparecer un modal similar a adventure-intro-dialog, indicando que vamos al segundo nivel, este modal se va a reutilizar, al generarlos se completaran con una imagen y un texto narrando la historia, al aceptar con un boton, se cargara el siguiente mapa
-- mejorar el loot de los personajes, para que dropeen menos cosas
-- manejar la logica para las muestes de los jugadores
-- crear un glosario con todos los enemigos listados su imagen y descripcion
-- el modal que se abre al inciar juego debe llegar hasta el maximo de la aplicacion no de la pantalla adventure-intro-dialog

