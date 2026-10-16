# Gu�a para agregar contenido al juego

Esta gu�a explica c�mo registrar personajes, enemigos, criaturas y objetos en los cat�logos del juego, y c�mo poner objetos en el inventario inicial o equipados en un personaje.

## 1. Antes de empezar

La escala vigente de rangos para equipo y enemigos está documentada en [PROGRESION_RANGOS.md](PROGRESION_RANGOS.md).

El diseño del equipo procedural, sus rangos, efectos extensibles y progresión del botín está documentado en [DISEÑO_LOOT_PROCEDURAL.md](DISEÑO_LOOT_PROCEDURAL.md). Describe el objetivo previsto; las partes marcadas como pendientes todavía no cambian el comportamiento del juego.

1. Guarda las im�genes dentro de `recursos/imagen/`.
2. Usa una ruta relativa a la carpeta `juego`, por ejemplo `recursos/imagen/bruja.jpeg`.
3. Copia un objeto existente del mismo tipo y cambia sus datos. Conserva las comas y llaves.
4. Cada `id` debe ser �nico. Se usa para encontrar y asignar el contenido desde otros archivos.
5. Los cat�logos se cargan desde `index.html`; si agregas un archivo JavaScript nuevo, tambi�n hay que incluirlo all� en el orden correcto.

## 2. Crear un personaje jugable

Edita `personaje/personajesBase.js` y agrega un objeto dentro del array `window.juego.personajesBase`:

```js
{
  id: "explorador",
  nombre: "Explorador",
  clase: "Explorador",
  imagen: "recursos/imagen/explorador.jpeg",
  descripcion: "Un explorador de las ruinas antiguas.",
  pasiva: "Describe aqu� su pasiva.",
  habilidadGrupo: "Describe aqu� su bonificaci�n grupal.",
  nivel: 1,
  vidaMaxima: 100,
  vidaInicial: 100, // Opcional; si se omite, empieza con vida m�xima.
  corduraMaxima: 100,
  poderMaximo: 100,
  resistenciaFisica: 5,
  resistenciaCordura: 5,
  resistenciaMagica: 0,
  fuerza: 5,
  agilidad: 5,
  danioMoral: 1,
  bonificacionCritico: 0, // Probabilidad: 0.08 equivale a 8 %.
  puntosHabilidad: 0,
}
```

Pasos:

1. Elige un `id` estable y �nico; evita espacios y usa min�sculas con guiones.
2. Completa nombre, clase, imagen, descripci�n, pasiva y habilidad de grupo.
3. Define nivel y m�ximos de vida, cordura y poder.
4. Define resistencias, fuerza y agilidad. Estos atributos deben estar entre 0 y 10. `resistenciaMagica` puede omitirse y empieza en 0.
5. Define `bonificacionCritico` entre 0 y 1. La mayor�a de personajes usa 0.
6. Si quieres que aparezca como tarjeta jugable, agrega su tarjeta correspondiente en `index.html` con `data-character-id` igual al `id`.

`personaje/personajes.js` crea los objetos `Personaje` desde este cat�logo. Ese archivo tambi�n actualiza las tarjetas y contiene la secci�n de equipo inicial explicada m�s abajo.

## 3. Crear un enemigo humano

Edita `enemigo/enemigosBase.js` y a�ade una instancia de `Enemigo` dentro de `window.juego.enemigosBase`:

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
  resistenciaMagica: 0,
  agilidad: 4,
  bonificacionCritico: 0,
  maldito: false,
  equipo: { arma: null, armadura: null },
  descripcion: "Un guardia que protege la entrada.",
}),
```

Pasos:

1. Usa un `id` �nico y define `tipo: "humano"`.
2. Define imagen, nivel, m�ximos de recursos, ataque, resistencia f�sica (`resistenciaBase`), resistencia m�gica (`resistenciaMagica`) y agilidad. La resistencia m�gica puede omitirse y empieza en 0.
3. `bonificacionCritico` es opcional y por defecto vale 0.
4. `maldito` es opcional y por defecto vale `false`.
5. `equipo` puede incluir `arma` y `armadura` encontradas en `itemsBase`. Sus categor�as deben coincidir con el slot.
6. Escribe una descripci�n.

Para aplicar un efecto de estado al conectar un golpe, puedes configurar `efectoGolpe`. Actualmente admite veneno:

```js
efectoGolpe: {
  tipo: "veneno",
  probabilidad: 0.25, // 25 % por golpe conectado.
  danioPorTurno: 3,
  duracion: 3,
},
```

El da�o se aplica al inicio de cada turno del objetivo. La probabilidad se expresa entre 0 y 1.

El archivo actual compone `poolEncuentros` combinando enemigos humanos con las criaturas de `criaturasBase.js`.

## 4. Crear una criatura

Edita `enemigo/criaturasBase.js` y agrega una instancia de `Enemigo` a `window.juego.criaturasBase`. La estructura de atributos es la misma que para un enemigo humano:

```js
new Enemigo({
  id: "murcielago-ciego",
  nombre: "Murci�lago ciego",
  tipo: "criatura",
  imagen: "recursos/imagen/enemigo-generico.svg",
  nivel: 1,
  vidaMaxima: 20,
  corduraMaxima: 100,
  poderMaximo: 100,
  ataqueBase: 2,
  resistenciaBase: 1,
  resistenciaMagica: 0,
  agilidad: 8,
  bonificacionCritico: 0,
  maldito: false,
  descripcion: "Una criatura veloz que habita en cuevas.",
}),
```

Agrega la criatura al array con una coma entre instancias. No hace falta agregarla manualmente al `poolEncuentros`: `enemigosBase.js` incorpora el cat�logo de criaturas al pool.

## 5. Crear un arma

Edita `item/armasBase.js` y a�ade una instancia de `Item` al array `window.juego.armasBase` (o usa `.push(...)` despu�s del array):

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
  icono: "??",
}),
```

Campos importantes:

- `ataque`: da�o f�sico base del arma.
- `alcance`: entero entre 1 y 4.
- `danioMoral`, `danioAgilidad`, `danioPoder`: efectos adicionales del arma.
- `danioElemental` suma da�o elemental plano al golpe; indica su tipo en `elemento` (por ejemplo, `"fuego"`). `efectoCritico` aplica su estado solo cuando el ataque es cr�tico. Ambos campos pueden omitirse si el arma no los usa.
- `ataquesEspeciales`: el juego requiere ambos perfiles: `dirigido` y `area`. `objetivosMaximos` debe ser 1 para dirigido y 2 para �rea. Cada perfil admite `alcance`; si se omite, usa el alcance del arma.
- `clasesPermitidas`: clases que pueden equiparla, en min�sculas; `"todas"` significa todas las clases permitidas por las reglas de magia. En m�vil, Caballero y Asesino tambi�n pueden equipar armas, armaduras y objetos especiales m�gicos.
- `magico`: usa `true` para armas m�gicas. En m�vil, cualquier personaje puede equipar equipo m�gico, pero los consumibles m�gicos siguen sujetos a sus restricciones de clase.
- `bonificaciones` es opcional y puede modificar `resistenciaFisica`, `resistenciaCordura`, `fuerza`, `agilidad` y `poder`. Acepta valores negativos, por ejemplo `{ agilidad: -1 }`.

Para un ataque especial curativo, define `efecto: "curacion"` y un valor positivo `curacion` en el perfil. El arma debe ser m�gica. Conserva los dos perfiles obligatorios; un perfil puede ser de da�o y el otro de curaci�n.

Los enemigos tambi�n pueden definir una lista `ataques`, cada uno con `nombre`, `alcance` (1 a 4) y `multiplicadorDanio`. Por ejemplo, una criatura puede tener una mordida de alcance 1 y un ataque a distancia de alcance 2. En cada turno el enemigo elige entre los ataques que pueden alcanzar la formaci�n y selecciona un objetivo dentro de ese alcance.

## 6. Crear una armadura

Edita `item/armadurasBase.js` y a�ade una instancia de `Item` al array `window.juego.armadurasBase`:

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
  icono: "???",
}),
```

Las bonificaciones pueden incluir resistencia f�sica, resistencia de cordura, fuerza, agilidad y poder. Si no quieres modificar un atributo, puedes omitirlo. Las penalizaciones se escriben con valores negativos. Para compatibilidad, una armadura tambi�n puede definir `proteccion` como protecci�n f�sica, aunque se recomienda expresar los atributos dentro de `bonificaciones`.

Cada objeto tambi�n tiene `valor`, su precio base en monedas. Si se omite, se calcula seg�n categor�a y nivel: equipo com�n cuesta 20 por nivel, consumibles 10 por nivel y objetos especiales 25 por nivel. Puedes definirlo manualmente para ajustar la econom�a.

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
  icono: "??",
}),
```

Un objeto especial debe aportar al menos un punto entre `danioMoral`, `proteccionCordura` y `proteccionMoral`. Tambi�n puede definir bonificaciones de atributos.

## 8. Crear un consumible

Edita `item/consumiblesBase.js` y agrega un `Item` con `categoria: "consumible"`:

```js
new Item({
  id: "pocion-poder-leve",
  categoria: "consumible",
  tipo: "pocion",
  nombre: "Poción de esencia menor",
  descripcion: "Restaura hasta 10 puntos de poder.",
  nivel: 1,
  bonificacion: { poder: 10 },
  clasesPermitidas: ["todas"],
  magico: false,
  imagen: "recursos/imagen/consumibles/fire-bottle.png",
  icono: "??",
}),
```

`bonificacion` debe contener al menos un recurso positivo entre `vida`, `cordura` y `poder`. Las pociones de recuperación tienen rangos básico (nivel 1), medio (nivel 4) y avanzado (nivel 7). En combate cuestan 2 PA para quien actúa o 3 PA para administrarlas a otro aliado en PC; en mobile cuestan 2 PA. Fuera del combate no consumen PA.

La poci�n de resurrecci�n es un consumible especial con `revivir: true` en el cat�logo compartido, pero no se agrega al inventario ni se puede usar en la versi�n m�vil de un solo personaje.

## 9. Cat�logo com�n de objetos

No hace falta registrar el mismo objeto dos veces en `itemsBase.js`. Ese archivo concatena autom�ticamente:

1. `armadurasBase`
2. `armasBase`
3. `objetosEspecialesBase`
4. `consumiblesBase`

Por eso, despu�s de agregar un objeto al cat�logo correspondiente, queda disponible en `juego.itemsBase` para el inventario, los equipos y los enemigos.

## 10. Agregar un objeto al inventario inicial

El inventario compartido tiene 18 espacios y est� expuesto como `window.inventarioGrupo`. El equipo inicial se prepara al final de `personaje/equipo.js`. Ah� se agregan actualmente las pociones y el anillo.

Para poner una copia de un objeto del cat�logo en el inventario inicial, agrega junto a esas asignaciones:

```js
// INVENTARIO INICIAL: agrega aqu� objetos disponibles al comenzar la partida.
const arcoInicial = juego.itemsBase.find((item) => item.id === "arco-corto-recuperado");
if (!arcoInicial) {
  throw new Error("No se encontr� el arco corto inicial.");
}
inventario.agregarItem(arcoInicial);
```

`inventario.agregarItem` lo coloca en el primer espacio libre y devuelve el n�mero de ese espacio. El inventario tiene que tener un espacio libre.

## 11. Equipar un objeto directamente a un personaje

Los objetos iniciales equipados se asignan en `personaje/personajes.js`, en el bloque marcado `EQUIPO INICIAL`. Primero se busca el objeto por `id`, luego se valida su categor�a y que la clase del personaje est� permitida, y finalmente se asigna al slot.

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

Slots disponibles: `arma`, `armadura` y `especial`. Para que el objeto est� equipado desde el inicio, no lo agregues tambi�n al inventario salvo que quieras entregar otra copia.

## 12. Entregarlo en inventario para equipar desde la interfaz

Si quieres que el jugador lo equipe durante la partida:

1. Agr�galo al inventario inicial en `personaje/equipo.js`, como en el paso anterior.
2. Abre el inventario del juego y selecciona el objeto.
3. Elige el personaje disponible. La interfaz filtra los personajes seg�n `clasesPermitidas` y las reglas de objetos m�gicos.
4. Al confirmar, el objeto pasa del inventario al slot correspondiente (`arma`, `armadura` o `especial`). El objeto que ya estaba en ese slot vuelve al mismo espacio del inventario.

La l�gica de equipamiento y validaci�n est� en `personaje/equipo.js`, en `equiparDesdeInventario` y `clasePuedeEquipar`.

## 13. A�adir contenido a encuentros

- Los enemigos humanos se registran en `enemigo/enemigosBase.js`.
- Las criaturas se registran en `enemigo/criaturasBase.js`.
- `enemigosBase.js` combina ambas listas para construir `window.juego.poolEncuentros`.
- Los objetos que lleva un enemigo deben buscarse en `juego.itemsBase` y colocarse en `equipo: { arma, armadura }`.

## 14. Lista r�pida de revisi�n

- [ ] El `id` es �nico y coincide con el que usas para buscar el contenido.
- [ ] La ruta de imagen existe dentro de `recursos/imagen/`.
- [ ] La categor�a coincide con el cat�logo donde agregaste el objeto.
- [ ] Las clases permitidas est�n escritas en min�sculas y permiten el uso deseado.
- [ ] Un arma tiene sus perfiles `dirigido` y `area`, con n�mero de objetivos v�lido.
- [ ] Los valores num�ricos cumplen los l�mites indicados.
- [ ] Si es equipo inicial, elegiste una sola forma: en inventario o equipado directamente.
- [ ] El inventario inicial tiene espacio disponible.

## 15. Sonidos y m�sica

El juego distingue entre **efectos puntuales** (se reproducen una vez) y la **m�sica de fondo** (suena en loop).

### 15.1 Sonido al moverse por el mapa

Cada vez que el grupo avanza una casilla se reproduce `recursos/sonidos/pasos.mp3`. Es un efecto fijo definido en `audio/sonidos.js` (clave `pasos`). Para cambiarlo, reemplaza ese archivo por otro con el mismo nombre.

### 15.2 Sonido de un POI

Un punto de inter�s puede tener una propiedad `sonido` con la ruta relativa del audio que suena al abrir su aviso. Es opcional: si se omite, no se reproduce nada.

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

Desde **Opciones > Cargar POI** puedes asignar el audio con el bot�n �Asignar audio��, igual que la imagen. El archivo se copia a `recursos/sonidos/` con el `id` del POI.

### 15.3 M�sica de un mapa

Un mapa puede tener una propiedad `audio` con la ruta de la canci�n que suena en loop mientras lo exploras. Acepta `null` si no quieres m�sica.

```js
{
  id: "mapa_demo",
  nivel: 1,
  // ...
  audio: "recursos/sonidos/tema-mazmorra.mp3", // O null para no reproducir m�sica.
  mensajes: { /* ... */ },
}
```

Desde **Opciones > Cargar mapa** puedes asignarla con el bot�n �Asignar audio��. El campo es opcional y por defecto queda en `null`.

### 15.3.1 Archivos de mapas

Las definiciones est�n separadas por mapa dentro de `niveles/`: `demo.js` contiene el mapa de prueba, mientras que `nivel_1.js` y `nivel_2.js` quedan como plantillas para los primeros mapas oficiales. Cada archivo registra su mapa en `juego.mapasBase` y su configuraci�n de encuentros, tesoros y salidas en `juego.configuracionPorMapa`, usando el ID del mapa como clave. Los datos reutilizables, como el vendedor, siguen en `datos/puntosInteresBase.js`.

Al agregar otro nivel, incluye su script en `index.html` despu�s de `datos/mapasBase.js` y `datos/mapasCreados.js`, y antes de `app/recurso-editor.js`.

Un mapa puede definir `enemigosIds` para limitar sus encuentros normales a enemigos tem�ticos y `bossId` para agregar un guardi�n. El guardi�n ocupa la casilla anterior a la puerta, se suma a `cantidadEnemigos` y bloquea la salida hasta ser derrotado. Su `botinGarantizadoId` configura un objeto que siempre aparecer� entre las recompensas. El mapa demo usa al Jefe bandido como prueba.

### 15.3.2 Modos de juego

`modo` en cada mapa puede ser `"escaramuza"`, `"historia"` o `"ambos"`. Escaramuza usa el recorrido roguelike, encuentros enemigos al azar, cofres y trampas; no toma POI narrativos ni vendedores del catálogo general. Su jefe aparece en los niveles pares de la expedición. Historia selecciona mapas marcados con `modo: "historia"`, usa su `layout` manual y coloca los POI desde `poisFijos`; los grupos de enemigos comunes siguen generándose al azar.

Los trazados manuales son filas de `#` (pared) y `.` (suelo). `entrada` y `salida` aceptan `{ row, column }`. Cada POI fijo puede referenciar un POI reusable mediante `poiId` y definir sus coordenadas:

```js
{
  id: "montana-negra-1",
  modo: "historia",
  usarAlIniciar: true,
  nivel: 1,
  layout: ["#######", "#.....#", "#.###.#", "#.....#", "#######"],
  entrada: { row: 1, column: 1 },
  salida: { row: 3, column: 5 },
  cantidadEnemigos: 2,
  nivelEnemigos: 1,
  poisFijos: [
    { poiId: "vendedor-enano", row: 1, column: 4 },
    { row: 3, column: 2, tipo: "historia", titulo: "Huellas en la roca", texto: "Alguien escribió un mensaje en la pared.", imagen: "recursos/imagen/historia/escena.png" },
  ],
}
```

Un POI fijo también puede declarar directamente `tipo`, `titulo`, `texto`, `imagen`, `lootId`, `enemigoId` u `objetoRequeridoId`. Las coordenadas de entrada y salida no se usan para POI.

### 15.4 Vendedor y monedas

Las monedas y las raciones son reservas compartidas, separadas de los espacios del inventario. Los cofres dan entre 10 y 25 monedas y entre 2 y 5 raciones adem�s de sus objetos. Cada cinco casillas transitables recorridas se consume una raci�n. Sin comida, cada bloque de cinco pasos aumenta la fatiga en un punto, hasta 6; cada punto a�ade 5 % a la posibilidad de emboscada, con un m�ximo de 30 %. Consumir una raci�n reduce la fatiga en un punto. La interfaz muestra la fatiga actual. Al empezar una partida el grupo recibe 10 raciones. Cada enemigo derrotado deja una raci�n, tambi�n en encuentros de emboscada. El enano vende paquetes de 5 raciones por 20 monedas, con tres paquetes disponibles por vendedor. Al reunir 10 raciones, el grupo puede descansar desde el panel de comida: consume las 10 y restaura por completo vida, cordura y poder de los miembros vivos; los caídos no se recuperan. El vendedor también ofrece un cofre gratuito compartido entre niveles y visitas, persistido en localStorage. En su puesto, el grupo puede descansar consumiendo 10 raciones para restaurar toda la vida, cordura y poder de sus miembros vivos; los ca�dos no se recuperan. El vendedor tambi�n ofrece un cofre compartido y gratuito, persistido en localStorage, para guardar objetos entre visitas y niveles. Los objetos tienen un `valor` en monedas: el enano paga al grupo un tercio redondeado hacia arriba, con m�nimo de una moneda, y los vende por tres veces ese precio. Los objetos de misi�n no se pueden vender.

### 15.4.1 Reglas de combate m�vil

Al comienzo de cada turno, el personaje recupera 3 puntos de poder. Los PA máximos dependen de su agilidad efectiva: `3 + floor(agilidad / 3)`, con un mínimo de 3 y un máximo de 6. El Caballero tiene un mínimo de 4 PA aunque su armadura reduzca su agilidad. El ataque básico cuesta 2 PA, el dirigido 3 y el de área 4. Cubrirse y usar consumibles cuestan 1 PA; cambiar equipo cuesta 2. El jugador puede encadenar acciones hasta quedarse sin PA o terminar el turno. Si se cubre y termina el turno con PA restantes, los reserva para responder al primer enemigo que le acierte con un ataque básico. El contraataque se consume una vez por ronda. El alcance limita los objetivos por su fila dentro del grupo enemigo.

En esta versi�n, la cordura no provoca huidas ni turnos perdidos controlados al azar. Su valor reduce gradualmente la eficacia de combate mediante las estad�sticas calculadas del personaje. Al terminar un combate, cada personaje superviviente recupera el 20 % de su cordura m�xima, sin superar ese m�ximo; los personajes ca�dos no recuperan cordura.

El POI `vendedor-enano` aparece seg�n el nivel m�nimo y la cantidad de POI del mapa. Su mercanc�a se configura mediante IDs existentes en `itemsBase`, por ejemplo:

```js
{
  id: "vendedor-enano",
  nivel: 1,
  tipo: "vendedor",
  imagen: "recursos/imagen/historia/poi_vendor_r.png",
  texto: "�Te encontraste con un enano dispuesto a comerciar!",
  mercancia: ["pocion-curacion", "pocion-poder-leve", "armadura-media-antigua"],
}
```

Cada producto comienza con tres unidades por vendedor y nivel; el stock comprado permanece agotado si el grupo vuelve al mismo vendedor durante esa partida. El cofre del enano conserva objetos entre niveles y visitas, sin costo.

### 15.5 Mensajes de exploraci�n con im�genes

Cada mapa puede asociar una imagen a los mensajes de navegaci�n. En el editor **Cargar mapa**, completa el campo opcional **Mensajes con imagen (JSON)** con listas por categor�a. Cada escena usa `texto`, `imagen` y, opcionalmente, `alt`. El siguiente ejemplo es JSON v�lido para pegar en el editor:

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
      "texto": "Llegas a una bifurcaci�n.",
      "imagen": "recursos/imagen/mapa/1_4.png",
      "alt": "Bifurcaci�n en el t�nel"
    }
  ],
  "tramo": [
    { "texto": "El corredor se estrecha.", "imagen": "recursos/imagen/mapa/1_5.png" }
  ]
}
```

Las rutas deben apuntar a im�genes existentes dentro del proyecto. En cada movimiento se elige una escena al azar de la categor�a correspondiente y se muestra en el panel de encuentro junto al mensaje. Los mapas existentes con listas de textos simples siguen funcionando; una entrada sin `imagen` muestra el mensaje y oculta la ilustraci�n anterior.

### 15.6 M�sica del men�

El men� usa una �nica canci�n fija en `recursos/sonidos/menu.mp3`. En **Opciones** hay un interruptor de **M�sica** para encenderla o apagarla; la preferencia se guarda en el navegador (`localStorage`, clave `juego.musica`).

- Suena al abrir la aplicaci�n y en la pantalla de personajes.
- Al entrar a explorar el mapa se detiene y pasa a sonar la m�sica del mapa (o silencio si el mapa no tiene `audio`).
- Si el interruptor est� apagado, no suena ninguna canci�n fuera de la mazmorra. La m�sica del mapa, en cambio, depende solo de la propiedad `audio` del mapa.

> Nota: el interruptor de m�sica funciona en cualquier navegador porque solo lee el archivo `menu.mp3` ya presente en `recursos/sonidos/`. En cambio, copiar audios nuevos al proyecto desde el editor (POI y mapa) usa la File System Access API, por lo que requiere un navegador compatible (Chrome o Edge) y elegir la carpeta del proyecto, igual que al guardar im�genes. Los efectos puntuales (`pasos`, `sonido` del POI) tambi�n funcionan en cualquier navegador porque solo leen archivos ya presentes en `recursos/sonidos/`.

### 15.7 Progresi�n de Escaramuza

**Escaramuza** comienza en la ronda 1 con dos encuentros enemigos. Al cruzar la salida, cada ronda agrega dos casillas por lado al tama�o base del mapa y suma al azar uno o dos encuentros permanentes a la ronda anterior. El tama�o tiene un m�ximo de 61 casillas por lado. Esta progresi�n solo aplica al modo Escaramuza; el modo Historia podr� definir sus mapas y encuentros manualmente.

## 16. Organizaci�n de los archivos JavaScript

Los scripts generales se agrupan por responsabilidad. Si agregas un script nuevo, guarda el archivo en la carpeta correspondiente y registra su ruta en `index.html`, respetando el orden de carga con `defer`.

- `app/`: navegaci�n de pantallas y editor de recursos.
- `audio/`: efectos de sonido y m�sica.
- `datos/`: cat�logos reutilizables y registros creados desde Opciones. Los mapas definidos a mano est�n en `niveles/`.
- `niveles/`: un archivo JavaScript por mapa; `demo.js` es el mapa de prueba y `nivel_1.js`, `nivel_2.js` son plantillas para los mapas oficiales.
- `exploracion/`: movimiento, mapa y generaci�n de puntos de inter�s.

## 17. Estado de armas y armaduras

Cada copia de un arma o armadura guarda su propia `durabilidad`, que determina su eficacia entre 100 % y 50 %. El estado visible se agrupa en `optimo` (100 %), `usado` (95 % a 55 %) y `da�ado` (50 %). Si se omite, el equipo comienza en estado �ptimo.

- Al terminar un combate, cada arma y armadura que us� el grupo pierde 5 puntos porcentuales de eficacia. El 50 % es el l�mite inferior.
- El equipo de los enemigos no se deteriora.
- Al generarse una recompensa, cada arma o armadura recibe un estado al azar: 25 % �ptimo, 50 % usado y 25 % da�ado. La tirada ocurre al crear el bot�n, aunque el grupo todav�a no lo haya recogido.
- La condici�n reduce el da�o de las armas y las resistencias aportadas por las armaduras. No modifica las bonificaciones de atributos ni la curaci�n de armas. Se muestra en el inventario, el equipo y la ficha del personaje.
- Un aliado que haya muerto durante el encuentro no recibe experiencia, aunque luego haya sido resucitado antes de la victoria.
- Desde **Opciones > Cargar recurso**, el campo **Estado inicial** permite elegir la condici�n de un arma o armadura nueva. Si no necesitas configurarlo, deja **�ptimo**.


problemas a solucionar -------
simule un ataque contra dos merodeadores el primero huyo y el segundo no pod�a atacar ya que decis que su arma no tenia alcance, cuando en realidad el primero ya no debia contar para el calculo de distancia.

-- al terminar un mapa, salir por la puerta debe aparecer un modal similar a adventure-intro-dialog, indicando que vamos al segundo nivel, este modal se va a reutilizar, al generarlos se completaran con una imagen y un texto narrando la historia, al aceptar con un boton, se cargara el siguiente mapa
-- mejorar el loot de los personajes, para que dropeen menos cosas
-- manejar la logica para las muestes de los jugadores
-- crear un glosario con todos los enemigos listados su imagen y descripcion
-- el modal que se abre al inciar juego debe llegar hasta el maximo de la aplicacion no de la pantalla adventure-intro-dialog



Los enemigos con esJefe: true ignoran da�o moral o de cordura, y su estabilidad mental no reduce sus estad�sticas ni les hace fallar, perder turnos o huir. No tienen moral ni cordura como mec�nica de combate.


Los enemigos con esJefe: true ignoran daño moral o de cordura. Su estabilidad mental no reduce sus estadísticas ni les hace fallar, perder turnos o huir.
