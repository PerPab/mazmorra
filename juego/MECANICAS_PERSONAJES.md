# Mecánicas de pasivas y bonificaciones grupales

Este documento registra el funcionamiento acordado para las habilidades de los cuatro personajes jugables. Los valores se consideran iniciales y pueden ajustarse después de probar el equilibrio.

## Formación

La formación se lee desde la posición 1 (punta) hasta la posición 4 (retaguardia). Las bonificaciones grupales que aumentan vida o cordura máxima solo benefician a personajes ubicados detrás de quien concede la bonificación. El personaje que la concede no se beneficia a sí mismo, y quienes están delante tampoco. Los valores se asignan por distancia detrás del personaje: primer lugar detrás, +15; segundo, +10; tercero, +5; los lugares posteriores, +0. Los personajes fuera de la formación no reciben estos aumentos.

Al cambiar la formación se recalculan los máximos. La variación del máximo se suma o resta al recurso actual para conservar la misma proporción de recurso disponible, limitado entre cero y el nuevo máximo.

## Moral por victoria en combate

Cuando un enemigo muere, cada aliado vivo que siga participando en el combate recupera 5 puntos de cordura, sin superar su máximo actual. Los aliados caídos o que huyeron no reciben esta recuperación. Si el grupo derrota a varios enemigos, la recuperación se aplica por cada enemigo derrotado.

## Recuperación al cambiar de nivel

Al cerrar el modal de transición, los aliados vivos recuperan toda su vida, cordura y poder. Los aliados caídos permanecen fuera de combate y deben ser revividos con la poción especial.

## Caballero maldito

### Pasiva

Los ataques especiales del Caballero cuestan la mitad del poder habitual, redondeada hacia arriba (`Math.ceil`). Se aplica a todos sus ataques especiales. El Caballero no puede equipar objetos mágicos.

### Bonificación grupal

Mitiga el daño recibido por los aliados que están detrás de él, según su distancia: 15 % al primero, 10 % al segundo y 5 % al tercero. No se aplica al propio Caballero ni a quienes estén delante de él. Esta regla depende de la posición actual en la formación.

## Bruja

### Pasiva

Los ataques especiales de armas mágicas cuestan la mitad del poder habitual, redondeada hacia arriba. El descuento solo se aplica a armas mágicas.

### Bonificación grupal

Aumenta la vida máxima de los aliados que estén detrás de ella: +15 al primero, +10 al segundo y +5 al tercero. No aumenta la vida máxima de la propia Bruja ni la de quienes estén delante de ella. La bonificación cambia al cambiar la formación.

## Sacerdote condenado

### Pasiva

Sus efectos de curación restauran un 10 % adicional de vida. Se aplica a hechizos de armas y a consumibles que curan. No se aplica a armas ofensivas que infligen daño. Los ataques de daño solo pueden dirigirse a enemigos; las curaciones pueden seleccionar aliados como objetivo. Las curaciones de armas pueden fallar.

### Bonificación grupal

Aumenta la cordura máxima de los aliados que estén detrás de él: +15 al primero, +10 al segundo y +5 al tercero. No aumenta la cordura máxima del propio Sacerdote ni la de quienes estén delante de él. La bonificación cambia al cambiar la formación.

Además, si ocupa la retaguardia entre los aliados vivos, reduce en 8 puntos porcentuales la posibilidad de que el grupo sufra una emboscada por cansancio durante la exploración. Esta protección no modifica su probabilidad de crítico.

## Emboscadas por cansancio durante la exploración

Después de cada movimiento a una casilla sin un punto de interés pendiente, se calcula el poder promedio actual de los aliados vivos. Con más del 80 % no hay riesgo por cansancio. Al llegar al 80 % o menos, el registro de novedades avisa que aumenta el riesgo y cada movimiento puede provocar un encuentro aleatorio adicional, independiente de los encuentros distribuidos en el mapa.

La probabilidad comienza en 5 % al 80 % de poder y aumenta linealmente hasta 35 % con 0 % de poder. Si el Sacerdote está en la última posición de la formación viva, su protección resta 8 puntos porcentuales a esa probabilidad, hasta un mínimo de 0 %. Durante una emboscada, los enemigos atacan primero.

Antes de iniciar una emboscada aleatoria, se muestra un modal con el título «¡Emboscada!» y la imagen `recursos/imagen/especiales/emboscada.webp`. El combate comienza cuando el jugador elige «Enfrentar emboscada».

## Asesino

### Pasiva

Tiene `bonificacionCritico: 0.08` (8 %). La bonificación se suma a la probabilidad de conectar un crítico y a la probabilidad de esquivar, además de las probabilidades basadas en agilidad. El mismo campo `bonificacionCritico` existe en los personajes y enemigos; su valor por defecto es 0, salvo excepciones configuradas, como el Asesino y la Rata Rabiosa de Cueva (12 %).

### Bonificación grupal y encuentro

Cuando el Asesino está en la posición 1, su bonificación de crítico se suma a la agilidad del líder al calcular la iniciativa del grupo y se compara con la iniciativa del enemigo que encabeza el grupo enemigo. Si el grupo gana la tirada, puede emboscar: el primer golpe conectado del grupo es crítico garantizado y causa el doble de daño.

Si el grupo gana la tirada de iniciativa con el Asesino al frente, aparece también la opción de intentar huir antes de comenzar el encuentro. La probabilidad de huida inicial acordada es 8 %; estos valores quedan sujetos a pruebas de equilibrio.

## Implementación relacionada

- Definiciones y descripciones de personajes: `personaje/personajesBase.js`.
- Recálculo de vida y cordura máximas por formación: `personaje/personajes.js`.
- Costos especiales, curaciones, iniciativa, emboscada y huida: `combate/combate.js`.
- Riesgo de emboscada por cansancio y protección del Sacerdote: `exploracion/mazmorra.js` y `personaje/personaje.js`.
- Fórmulas de probabilidad de crítico y esquiva: `combate/probabilidades.js`.
- Curación por consumibles y equipo: `personaje/equipo.js`.


<overview>
El usuario está desarrollando un juego de mazmorras en HTML, CSS y JavaScript vanilla, con interfaz retro, gestión de personajes, inventario y combate por turnos. En este tramo se corrigieron interacciones de consumibles y se reemplazaron las propiedades de objetos `maldito` y `sagrado` por `magico`; el trabajo más reciente añade un menú inicial, una galería de personajes y un menú hamburguesa, cuya navegación aún debe verificarse.
</overview>

<history>
1. El usuario pidió mejoras de interfaz: adaptar el tamaño de los iconos de equipo y rediseñar el modal del inventario.
   - Se limitaron las imágenes al tamaño del espacio de equipo.
   - El modal muestra primero los detalles del objeto y ofrece **Equipar/Usar**, **Soltar** y **Cerrar**; la selección de personaje aparece después de elegir Equipar o Usar.
   - Se centraron sus textos, se aumentó su altura y se añadió la imagen del objeto.
   - Los botones quedaron anclados en la zona inferior. Se verificó en navegador el cierre, equipamiento de un anillo y consumo de una poción.

2. El usuario aclaró el uso de consumibles durante combate:
   - Los consumibles comunes, como pociones, deben usarse en el turno activo y aplicarse al personaje en turno.
   - Los grimorios son de un uso, solo los usan Bruja o Sacerdote, pero pueden seleccionar a otro aliado como objetivo.
   - Se modificaron [equipo.js](<C:/Users/pablo/Desktop/workspace js/juego/personaje/equipo.js>) y [combate.js](<C:/Users/pablo/Desktop/workspace js/juego/combate/combate.js>) para conectar el uso al estado de turno. El objeto se consume y la acción avanza el turno. Fuera de combate se mantiene el flujo original del inventario.
   - Se verificaron ambos flujos en el navegador. También se comprobó el bloqueo de un grimorio al turno de un personaje no mágico.

3. El usuario pidió reemplazar en todos los objetos `maldito` y `sagrado` por una propiedad booleana `magico`.
   - [item.js](<C:/Users/pablo/Desktop/workspace js/juego/item/item.js>) valida y guarda `magico`.
   - Los catálogos de armaduras, armas, objetos especiales y consumibles ya no declaran las propiedades antiguas y ahora asignan `magico: false`.
   - Los objetos mágicos solo pueden equiparse/usarse por Bruja o Sacerdote, adicionalmente a `clasesPermitidas`. Se valida que todo objeto tipo grimorio tenga `magico: true`.
   - Se conservó `maldito` para enemigos, porque su efecto de daño de cordura es independiente de la clasificación de objetos. Se comprobó que los objetos base ya no poseen `maldito`/`sagrado` y que el navegador cargue correctamente.
   - Al probar grimorios, se corrigió la lógica para permitir que cualquier aliado vivo sea objetivo durante combate, sin limitar los posibles objetivos mágicos a las clases permitidas de uso.

4. El usuario pidió un menú inicial con **Continuar aventura**, **Partida nueva**, **Elegidos** y **Salir**, más un menú hamburguesa dentro del juego con **Salir al menú principal**; la narración de partida nueva mediante imágenes queda para una etapa futura.
   - Se empezó a implementar la estructura en HTML, estilos de menú y una pantalla de presentación de personajes generada desde los datos del grupo.
   - Se añadió [menu.js](<C:/Users/pablo/Desktop/workspace js/juego/app/menu.js>) para cambiar entre pantallas, mostrar los personajes y controlar el menú hamburguesa.
   - La primera carga en navegador ya muestra la pantalla inicial con **Continuar aventura** deshabilitado, **Partida nueva**, **Elegidos** y **Salir**.
   - Esta última tarea no está terminada: falta probar la navegación completa y corregir cualquier detalle descubierto.

</history>
<work_done>
Archivos actualizados:
- [index.html](<C:/Users/pablo/Desktop/workspace js/juego/index.html>): menús principal y de Elegidos, cabecera del juego, menú hamburguesa y aviso al intentar salir del navegador. El juego quedó envuelto en `#game-view`, oculto inicialmente.
- [styles.css](<C:/Users/pablo/Desktop/workspace js/juego/styles.css>): estilos de menús, galería, barra superior y diálogo de salida; anteriormente también recibió los ajustes del modal de inventario e imágenes.
- [menu.js](<C:/Users/pablo/Desktop/workspace js/juego/app/menu.js>): nuevo controlador de navegación y renderizado de galería.
- [item/item.js](<C:/Users/pablo/Desktop/workspace js/juego/item/item.js>): reemplazo de metadatos antiguos por `magico`, validación booleana y regla para grimorios.
- [item/armadurasBase.js](<C:/Users/pablo/Desktop/workspace js/juego/item/armadurasBase.js>), [item/armasBase.js](<C:/Users/pablo/Desktop/workspace js/juego/item/armasBase.js>), [item/objetosEspecialesBase.js](<C:/Users/pablo/Desktop/workspace js/juego/item/objetosEspecialesBase.js>), [item/consumiblesBase.js](<C:/Users/pablo/Desktop/workspace js/juego/item/consumiblesBase.js>): `magico: false`, sin `maldito`/`sagrado`.
- [personaje/equipo.js](<C:/Users/pablo/Desktop/workspace js/juego/personaje/equipo.js>): reglas de clase mágica, selección de aliados y uso de consumibles.
- [combate/combate.js](<C:/Users/pablo/Desktop/workspace js/juego/combate/combate.js>): validación de quién puede usar consumibles mágicos en combate, además de la lógica de turnos existente.

Verificación:
- Los diagnósticos reportaron cero errores en los archivos editados para la propiedad `magico`.
- Se probaron consumibles comunes y grimorios en navegador, incluidas restricciones por clase y objetivos distintos del usuario.
- Para la última implementación de menús, el diagnóstico no reportó errores en HTML, CSS ni JavaScript y el navegador mostró correctamente el menú inicial.
- Pendiente probar **Elegidos**, **Volver al menú**, **Partida nueva**, hamburguesa/retorno, y la respuesta del botón **Salir**.
- «Continuar aventura» se implementó solo como estado en memoria de esta sesión: se habilita tras elegir Partida nueva y permite volver desde el menú al juego mientras la página siga cargada. No hay guardado persistente entre recargas.
- «Salir» abre un aviso que pide cerrar la pestaña o ventana, ya que el navegador normalmente no permite cerrar una pestaña abierta manualmente desde JavaScript.
</work_done>
<technical_details>
- La app usa scripts clásicos con `defer`; `menu.js` se carga después de la inicialización del combate, por lo que puede leer `window.juego.personajes`.
- Las vistas están ocultas con `hidden`; se añadió la regla CSS global `[hidden] { display: none !important; }` para que reglas de `display:flex/grid` no anulen el atributo.
- La galería se genera con `personaje.imagen`, nombre, clase, descripción, pasiva y habilidad de grupo.
- El guardado real no existe. El menú «Continuar» conserva el estado solo mientras la página permanece activa; recargar reinicia el juego y deja Continuar deshabilitado.
- `maldito` sigue siendo válido en las clases/catálogos de enemigos. No eliminarlo globalmente.
- El entorno no tiene Node.js disponible por terminal, por lo que no se pudo ejecutar `node --check`; se usaron los diagnósticos del editor y pruebas en navegador.
</technical_details>
<important_files>
- [juego/index.html](<C:/Users/pablo/Desktop/workspace js/juego/index.html>)
  - Estructura de pantallas, diálogo de salida y orden de scripts.
  - Revisar sobre todo el wrapper `#game-view`, la cabecera y la ubicación del `<script src="app/menu.js" defer>`.
  - La indentación del contenido del juego puede ser mejorable, aunque no afecta la semántica.

- [juego/app/menu.js](<C:/Users/pablo/Desktop/workspace js/juego/app/menu.js>)
  - Controla las cuatro opciones principales, galería, hamburguesa y regreso al menú.
  - La implementación maneja el bloqueo de retorno al menú si `.encounter-start` está deshabilitado durante combate.

- [juego/styles.css](<C:/Users/pablo/Desktop/workspace js/juego/styles.css>)
  - Incluye estilos de menú inicial, galería, topbar, diálogos y layout original del juego.
  - Verificar la adaptación responsive de la galería y la barra superior.

- [juego/item/item.js](<C:/Users/pablo/Desktop/workspace js/juego/item/item.js>)
  - Modelo común de objetos y validación de propiedad `magico`.

- [juego/personaje/equipo.js](<C:/Users/pablo/Desktop/workspace js/juego/personaje/equipo.js>)
  - Uso/equipamiento del inventario, permisos mágicos y objetivos de consumibles.

- [juego/combate/combate.js](<C:/Users/pablo/Desktop/workspace js/juego/combate/combate.js>)
  - Estado del turno y aplicación de consumibles durante combate.
</important_files>
<next_steps>
1. Probar en navegador:
   - «Elegidos» muestra las cuatro imágenes y datos; «Volver al menú» regresa correctamente.
   - «Partida nueva» abre el juego y habilita «Continuar aventura».
   - El hamburguesa abre/cierra el panel y «Salir al menú principal» conserva el estado en memoria.
   - «Salir» abre su aviso y se puede cerrar.
2. Si el menú deja el juego visible/oculto incorrectamente, revisar `mostrarPantalla()` en [menu.js](<C:/Users/pablo/Desktop/workspace js/juego/app/menu.js>) y reglas `[hidden]` en [styles.css](<C:/Users/pablo/Desktop/workspace js/juego/styles.css>).
3. Considerar ajustar navegación durante combate; actualmente el retorno a menú se bloquea usando el estado `disabled` del botón de encuentro.
4. Más adelante, implementar guardado persistente y la introducción de partida nueva como secuencia de imágenes y texto, tal como mencionó el usuario.
5. El usuario especificó la idea de guardado: guardar automáticamente cada vez que termine un combate, permitir continuar desde el menú incluso después de recargar y eliminar la partida si mueren todos los miembros del grupo. Se propuso `localStorage`; aún no implementarlo hasta que lo solicite.
6. Para una fase futura, el usuario planea agregar trasfondos de personajes y más enemigos/objetos a sus pools. Los encuentros generarán grupos enemigos aleatorios en cantidad, clase y equipamiento, con restricciones de nivel. Al diseñarlo, considerar también límites de equilibrio según el nivel medio/fuerza del grupo para evitar combinaciones aleatorias injustas.
</next_steps>
