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
