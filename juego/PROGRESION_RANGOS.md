# Rangos de enemigos y equipo

## Escala general

La progresión usa tres rangos compartidos por enemigos y objetos:

| Rango | Niveles | Aparición prevista |
| --- | ---: | --- |
| Básico | 1–3 | Enemigos de nivel 1–3 y equipo básico |
| Medio | 4–6 | Enemigos de nivel 4–6 y equipo medio |
| Avanzado | 7–9 | Enemigos de nivel 7–9 y equipo avanzado |

El rango del equipo y del enemigo se deriva de su nivel. Se puede especificar `rango` para una excepción intencional. La configuración central está en `item/progresionEquipo.js`.

## Efectos aleatorios de equipo

Probabilidades acordadas para propiedades aleatorias: 5 % en básico, 15 % en medio y 30 % en avanzado. Las armaduras ya usan estas probabilidades al crear botín. Si un objeto avanzado obtiene propiedades, puede recibir dos; los de rango básico y medio reciben una. Las propiedades avanzadas pueden combinarse con alguna de rango inferior, con menor peso.

El catálogo de propiedades y sus compatibilidades por familia se incorporan por etapas. En armaduras están activas las bonificaciones numéricas que ya resuelve el combate. Los efectos que requieran nuevas reglas, como quemadura, veneno o regeneración, no se generan hasta contar con un manejador. Libros de hechizos y libros restaurativos mantienen sus hechizos como sistema propio.

## Escaramuza

La ronda de Escaramuza establece el nivel de amenaza de 1 a 9. Los encuentros normales pueden elegir enemigos hasta ese nivel; si el catálogo todavía no tiene enemigos de ese nivel, se eligen entre los que ya existen. La ronda no aumenta artificialmente las estadísticas de una plantilla. Cada nuevo enemigo debe tener sus estadísticas declaradas en su nivel.

El botín se limita por el nivel medio del encuentro y por `nivelMaximoLoot` del mapa. También respeta `rangoMaximoLoot` cuando el mapa lo define. Las recompensas únicas o garantizadas conservan sus propiedades fijas.

## Estado de implementación

- Implementado: rangos centralizados, nivel a rango, metadatos `rango` para Item y Enemigo, selección de enemigos de Escaramuza limitada por la ronda y filtro de rango en el botín.
- Implementado: 12 plantillas de armadura para niveles 1, 4 y 7; propiedades numéricas compatibles sorteadas en botín con las probabilidades del rango; copia de estadísticas y propiedades al ejemplar generado.
- Pendiente: plantillas completas de armas para niveles 1–9, propiedades procedurales de armas, uso de propiedades aleatorias en equipo enemigo y progresión completa del equipo enemigo.
- La resistencia física y mágica de la armadura participa en el cálculo de daño recibido por jugadores y enemigos. El desgaste del equipo del jugador reduce sus resistencias, pero conserva las demás bonificaciones.

## Armaduras

Cada personaje lleva una sola pieza. Hay cuatro familias, con una plantilla básica, media y avanzada (niveles 1, 4 y 7): cuero ligero, malla media, placas pesadas y capa arcana. Los IDs de las cuatro piezas básicas se conservaron para mantener referencias de equipo ya existentes.

| Familia | Básico | Medio | Avanzado | Ventaja propia |
| --- | --- | --- | --- | --- |
| Ligera | 0 defensa física | +1 | +2 | +1 %, +2 % y +3 % de crítico |
| Media | +1 defensa física | +2 | +3 | Agilidad +1, +1 y +2 |
| Pesada | +2 defensa física | +3 | +4 | Resistencia mágica 0, +1 y +1; Agilidad −1 |
| Capa arcana | 0 defensa física | 0 | 0 | Poder máximo +5, +10 y +15; resistencia mágica 0, +1 y +2 |

La resistencia se resta directamente al daño antes del multiplicador del ataque y el combate impone un mínimo de 1 punto de daño. Por eso las defensas base se mantienen en incrementos pequeños: una diferencia de varios puntos ya puede reducir mucho los golpes comunes. Estos valores son una primera curva para probar con el daño actual, no un balance definitivo. El desgaste reduce las resistencias de armadura; no reduce sus bonificaciones de Agilidad, Poder máximo o crítico.

Al generar una recompensa de armadura, se usa la probabilidad compartida del rango: 5 % básico, 15 % medio y 30 % avanzado. Si se activa, el objeto recibe una propiedad compatible; el rango avanzado puede recibir dos propiedades distintas. El catálogo `item/propiedadesArmadura.js` ofrece bonificaciones numéricas que ya entiende el combate: resistencia física, resistencia mágica, resistencia de Cordura, Agilidad, Poder máximo y crítico. Aún no sortea regeneración, espinas ni resistencias elementales; se incorporarán cuando tengan reglas de combate implementadas.

La variación se sortea una vez al crear el botín. El ejemplar conserva sus bonificaciones, nombre y IDs de propiedad al guardarse. Las plantillas no se modifican. Las armaduras enemigas no reciben propiedades aleatorias todavía.

## Anillos

Cada personaje tiene un único espacio de objeto especial y puede equipar un anillo. Hay ocho familias con plantillas de nivel 1, 4 y 7 (básico, medio y avanzado): Cordura máxima (+5/+10/+15), Poder máximo (+3/+6/+10), protección física (+1/+1/+2), protección mágica (+1/+1/+2), protección mental (+1/+2/+3 a cada pérdida de Cordura y Moral), Agilidad (+1/+1/+2), movimiento (+1 PA en los tres rangos) y Salud máxima (+5/+10/+15). Son cifras iniciales adaptadas a la escala actual: la defensa se resta directamente al daño y la Agilidad también influye en iniciativa, precisión y PA.

Los anillos usan las probabilidades compartidas: 5 % básico, 15 % medio y 30 % avanzado; si se activa, reciben una propiedad adicional en básico/medio o dos propiedades distintas en avanzado. Las propiedades están en `item/propiedadesAnillo.js`, no repiten la familia principal del anillo y no sortean PA. El PA adicional solo aparece como atributo principal de los anillos de movimiento; ese punto se suma después del tope normal de 6 PA.

El botín usa selección ponderada. Los anillos de movimiento tienen peso `0.35`; el resto de objetos usa `1`, para que el +1 PA aparezca con menor frecuencia sin excluirlo del pool.

El catálogo actual solo genera propiedades pasivas implementadas: defensa, protección mental, máximos de Salud/Cordura/Poder, Agilidad, daño físico/mágico y crítico. Regeneración por turno, absorción de Salud/Poder y reducción de costes quedan pendientes de sus manejadores de combate, así que no pueden salir aún como propiedades.

Equipar o quitar un anillo cambia los máximos, pero conserva la cantidad actual del recurso y solo la limita si supera el nuevo máximo. Así, cambiar equipo no cura ni recarga al personaje. Los anillos no se desgastan. Las plantillas son reutilizables; cada recompensa recibe su propia copia con los efectos sorteados.

## Libros de restauración

Los libros restaurativos usan un catálogo separado del pool de efectos de armas. `item/hechizosRestauracion.js` define hechizos de curación, Cordura y protección; la selección se hace sin repetir hechizos dentro de un libro.

- Básico (niveles 1–3): un hechizo aleatorio entre curación menor, Tranquilizar y Protección menor.
- Medio (niveles 4–6): una curación dirigida o grupal y un apoyo distinto.
- Avanzado (niveles 7–9): curación dirigida, curación grupal y un apoyo.
- Valores iniciales: básico cura/restaura 10 o protege 15 %; medio cura 21 individual o 7 por aliado, restaura 20 o protege 25 %; avanzado cura 35 individual o 12 por aliado, restaura 35 o protege 40 % individual / 20 % grupal.
- Los hechizos consumen PA y Poder. Tienen una probabilidad base de fallo del 10 %, además de poder fallar por deterioro mental.
- La pasiva del Sacerdote aumenta un 10 % solo la Salud restaurada.
- La protección reduce daño durante la próxima fase enemiga; una protección mayor reemplaza a una menor y nunca se acumulan.
- Cada libro del botín aleatorio recibe sus hechizos al generarse y conserva esa combinación al recogerlo o comerciarlo. Las recompensas garantizadas mantienen la combinación de su plantilla.
- Los valores están puestos para primeras pruebas y siguen sujetos a balance.
