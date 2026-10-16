# Diseño del equipo procedural y la progresión de mazmorra

Este documento fija la arquitectura prevista para ampliar el botín sin llenar los catálogos con copias de armas y armaduras. Las reglas de este documento son el diseño objetivo; no todas están activas todavía. El botín actual sigue seleccionando objetos de `itemsBase` y copiándolos para el inventario.

## Objetivos

- Generar equipo a partir de plantillas y propiedades registradas.
- Mantener a mano los objetos de misión, jefes y acontecimientos únicos.
- Poder agregar propiedades nuevas sin reescribir la tabla de botín.
- Hacer que cada ejemplar generado conserve sus estadísticas al guardar y cargar la partida.
- Sincronizar las reglas entre PC y mobile.
- Hacer que la profundidad de la mazmorra mejore el equipo y la amenaza de los encuentros.

## Conceptos separados

Cada ejemplar de equipo tendrá conceptos independientes:

| Concepto | Para qué sirve |
| --- | --- |
| Familia o plantilla | Define categoría, tipo, alcance, coste de PA, clases permitidas e intervalo de estadísticas base. |
| Nivel del objeto | Indica su potencia numérica y sirve para requisitos o filtros de botín. |
| Rango | Limita el presupuesto y la complejidad de sus propiedades: bajo, medio o alto. |
| Rareza | Controla qué tan frecuente es el resultado dentro de su rango. No aumenta automáticamente su potencia. |
| Estado | `optimo`, `usado` o `dañado`; representa desgaste y conserva las reglas actuales de durabilidad. |
| Efectos | Propiedades adicionales con condiciones y parámetros explícitos. |

El rango no reemplaza el nivel del objeto ni el estado de conservación. Un objeto puede ser, por ejemplo, de rango bajo, nivel 3, raro y usado.

## Referencia de progresión

La progresión activa usa rango básico para niveles 1–3, medio para 4–6 y avanzado para 7–9. Los cortes viven en `item/progresionEquipo.js` y no deben repetirse como números fijos en otros generadores.

Para determinar el rango del contenido de una mazmorra se usará su profundidad (`nivel` o `ronda` de Escaramuza), no el nivel individual del héroe. Así el grupo completo y el modo mobile de un solo personaje reciben una progresión coherente. La profundidad determina un nivel de amenaza y, desde este, el rango máximo de equipo disponible.

Historia podrá fijar explícitamente la amenaza y el rango de cada mapa. Escaramuza aplicará la progresión automáticamente al cruzar la salida. El mapa demo puede seguir limitando enemigos y objetos al nivel 1 como entorno de prueba.

## Presupuesto inicial orientativo

Estos valores son propuestas de diseño para probar; no son todavía cifras activas ni balance definitivo. Son mejoras sobre las estadísticas base de la plantilla.

| Mejora | Rango bajo | Rango medio | Rango alto |
| --- | ---: | ---: | ---: |
| Daño físico adicional | +1 | +2 a +3 | +4 a +6 |
| Propiedades secundarias | 0–1 | 1–2 | 2–3 |
| Daño elemental adicional | 0 | +1 a +2 | +2 a +4 |
| Estados alterados | Ninguno | Solo bajo condición, por ejemplo crítico | Condicionales o efectos especiales |
| Regeneración de Poder | Ninguna | +1 por turno | +1 a +3 por turno |

El mismo presupuesto se adaptará a cada categoría: las armaduras invertirán principalmente en protección, resistencias y atributos; los libros, en sus perfiles mágicos y efectos; los objetos especiales usarán únicamente propiedades compatibles. Alcance, coste de PA, ranura y clases permitidas se heredan de la plantilla y no se sortean.

Antes de habilitar estos números hay que compararlos con el daño real del juego. El coste de una mejora depende de cuántos ataques permite hacer por turno: +1 de daño en un arma rápida puede rendir mucho más que +1 en un arma lenta. El generador debe puntuar las propiedades con un presupuesto común y límites por familia.

## Rareza y presupuesto de potencia

La rareza y el rango son ejes distintos. La rareza puede cambiar la probabilidad de obtener una combinación y la presentación del objeto, pero no debe superar el presupuesto de potencia de su rango. Una pieza común de rango alto puede ser fuerte por sus valores base y no tener efectos; una pieza rara puede intercambiar parte del daño por una combinación táctica.

Cada propiedad declarará un coste de presupuesto. El generador elegirá propiedades compatibles mientras quede presupuesto y respetará límites por cantidad, repetición, intensidad y activación. Nunca se permite repetir la misma propiedad en un ejemplar. Los efectos de control y regeneración tendrán costes mayores y límites de frecuencia.

## Catálogo extensible de propiedades

Las propiedades se registrarán como datos separados de las plantillas, en un catálogo futuro como `item/propiedadesEquipo.js`. Cada registro deberá describir:

- `id` estable y nombre visible.
- Categorías, familias y rangos compatibles.
- Peso de aparición y coste de presupuesto.
- Parámetros y límites permitidos.
- Condición de activación: pasiva, golpe conectado, crítico, recibir daño, matar, inicio de turno u otra condición implementada.
- Si es un atributo numérico, daño elemental, estado, drenaje/absorción de Poder o efecto especial.

La resolución de los efectos se mantendrá separada, en un módulo de combate, y usará identificadores de efecto con manejadores registrados. Agregar una propiedad nueva consistirá en declararla, indicar su compatibilidad y conectar su manejador una sola vez. Una propiedad sin manejador implementado no se ofrecerá para generación.

Compatibilidades iniciales sugeridas:

- Espadas y dagas: daño elemental, sangrado o quemadura condicionados a crítico.
- Hachas: bonificación contra blindados y, cuando exista su manejador, aturdimiento limitado.
- Lanzas y picas: alcance o bonificación contra familias de enemigos definidas.
- Armaduras pesadas: resistencia física y, en variantes válidas, mágica.
- Armaduras medias: protección y agilidad.
- Armaduras ligeras: poca protección y posibilidad de bonificar crítico.
- Capas: protección física nula; posibles resistencias mágicas o efectos de Poder.
- Libros: perfiles de ataque, curación y, en rangos futuros, drenaje o absorción.

Estas compatibilidades son filtros de generación, no implican que todos esos efectos estén programados actualmente.

## Forma de los datos generados

Se continuará usando JavaScript y `Item`, de acuerdo con la arquitectura del navegador. El objeto guardado deberá conservar una instantánea de sus valores; no se regenerará desde la plantilla al cargar la partida.

```js
{
  id: "loot-000123",
  plantillaId: "espada-larga",
  categoria: "arma",
  nivel: 5,
  rango: "medio",
  rareza: "raro",
  ataque: 7,
  danioElemental: 1,
  elemento: "fuego",
  clasesPermitidas: ["caballero", "bruja"],
  efectos: [
    {
      id: "quemadura-critica",
      activacion: "critico",
      parametros: { danioPorTurno: 2, duracion: 2 },
    },
  ],
}
```

El ejemplo ilustra el formato deseado, no un objeto ya aceptado por `Item`. Al implementar el formato se actualizarán el constructor, el guardado/carga y la validación. Se incluirá una versión de esquema para poder migrar partidas antiguas. Los IDs serán únicos por ejemplar y los objetos de misión mantendrán sus IDs fijos.

## Plantillas, únicos y botín

- `armasBase.js` y `armadurasBase.js` definirán familias/plantillas y sus datos base.
- El generador creará ejemplares solo cuando un encuentro o cofre produzca una recompensa procedural.
- `objetosUnicosBase.js` (o el catálogo equivalente) contendrá equipo escrito a mano para misiones, jefes y eventos.
- Las recompensas garantizadas por ID seguirán entregando exactamente el objeto definido; no pasarán por el generador.
- Una recompensa procedural se sorteará una sola vez al crear el botín. Se guardarán sus valores y su estado de conservación.
- La selección seguirá respetando las clases permitidas y la categoría de la plantilla.

Módulos previstos, respetando las carpetas existentes:

```text
item/
  armasBase.js             # plantillas y equipo escrito a mano existente
  armadurasBase.js         # plantillas y equipo escrito a mano existente
  propiedadesArmadura.js   # propiedades compatibles y sorteo aplicado al botín de armaduras
  propiedadesAnillo.js     # propiedades pasivas compatibles y sorteo de anillos
  propiedadesEquipo.js     # catálogo extensible de propiedades
  generadorEquipo.js       # selección por plantilla, rango y presupuesto
combate/
  efectosEquipo.js         # manejadores de propiedades activas
```

Los scripts nuevos se cargarán desde `index.html` en ambos proyectos antes de los módulos que los consuman. La versión PC y mobile compartirá el mismo esquema, catálogo de efectos y reglas de presupuesto.

## Progresión de la mazmorra

Al pasar a otro mapa:

1. Se incrementa la profundidad de Escaramuza y se crea un grupo nuevo de enemigos; los POI ya resueltos no vuelven a aparecer en el mapa anterior.
2. La configuración de progresión obtiene el nivel de amenaza, nivel máximo de enemigos, rango máximo de equipo enemigo y rango máximo de botín.
3. Se eligen plantillas enemigas temáticas permitidas para el mapa. Sus copias de combate reciben estadísticas escaladas de forma controlada y equipo del rango permitido; la plantilla de catálogo no se modifica.
4. El botín común usa el rango/nivel de amenaza del encuentro, con presupuesto acorde. Los objetos únicos y de misión garantizados quedan intactos.
5. Los jefes pueden tener equipo/atributos propios y recompensas únicas; la progresión aleatoria no reemplaza sus definiciones.

La configuración por mapa podrá sobreescribir cualquier valor, por ejemplo:

```js
progresion: {
  nivelAmenaza: 2,
  rangoEquipoEnemigoMaximo: "bajo",
  rangoBotinMaximo: "bajo",
  escalaEstadisticasEnemigo: 1,
}
```

Los nombres y la curva exacta se centralizarán en una tabla/configuración, no se deducirán de IDs ni se codificarán en varios módulos. En el modo Historia cada mapa podrá establecer su progresión manualmente.

## Etapas de implementación

1. Definir y centralizar rangos, niveles de referencia, rarezas, compatibilidades y presupuestos.
2. Extender `Item` y guardado/carga para conservar rango, rareza, plantilla y efectos sin alterar los objetos existentes.
3. Crear el catálogo de propiedades y el generador, inicialmente con bonificaciones numéricas de rango bajo.
4. Integrar el generador en cofres y botín normal, manteniendo las recompensas fijas.
5. Aplicar progresión de amenaza, equipamiento enemigo y botín al avanzar de mapa en Escaramuza; permitir valores manuales para Historia.
6. Incorporar una propiedad de rango medio por vez y probarla en combate antes de agregar más.
7. Añadir efectos de rango alto solo cuando exista su manejador en el combate.
8. Replicar y mantener el mismo esquema en PC y mobile.

## Estado actual

- El catálogo de armaduras ya contiene 12 plantillas (cuatro familias en niveles 1, 4 y 7) y un pool de propiedades numéricas compatibles que se sortea al crear una recompensa.
- El catálogo de anillos contiene 24 plantillas (ocho familias en niveles 1, 4 y 7). `item/propiedadesAnillo.js` sortea propiedades pasivas implementadas; PA no aparece como efecto aleatorio. Los efectos de regeneración, absorción y ahorro de costes quedan pendientes de tener manejadores.
- Un personaje equipa un solo objeto especial/anillo. Cambiar bonificaciones máximas conserva los recursos actuales y los limita al nuevo máximo, sin recarga automática.
- El peso de botín por plantilla permite controlar la frecuencia sin duplicar reglas en las tablas; los anillos de movimiento usan `pesoBotin: 0.35`.
- El botín actual elige objetos existentes de `itemsBase`, limitado por el nivel máximo configurado, y crea copias con estado de conservación.
- Escaramuza ya aumenta el tamaño del mapa y la cantidad de encuentros al avanzar; la selección de enemigos y el nivel máximo de botín todavía dependen de la configuración del mapa.
- Las propiedades aleatorias de armas, la generación por presupuesto y el equipo procedural de enemigos siguen pendientes. Las propiedades actuales de armadura se limitan a estadísticas que el combate ya calcula; nuevos efectos se habilitarán al incorporar sus manejadores.
