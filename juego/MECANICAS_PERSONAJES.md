# Mecánicas de personajes y bonificaciones grupales

## Formación aliada

Las tarjetas de aliados ya no se reordenan manualmente y su orden visual no modifica combate, alcance, iniciativa ni selección de objetivos. Los enemigos conservan su formación: sus posiciones determinan qué enemigos quedan al alcance de cada ataque.

## Pasivas y bonificaciones grupales

Los bonos grupales no dependen de la ubicación de las tarjetas. Se aplican mientras el personaje que los concede esté vivo y forme parte del grupo:

- **Caballero:** sus ataques especiales cuestan la mitad de Poder, redondeada hacia arriba. Reduce en un 10 % el daño recibido por cada aliado, incluido él mismo.
- **Bruja:** sus ataques especiales ofensivos de armas mágicas cuestan la mitad de Poder, redondeada hacia arriba. Los ataques curativos conservan su coste. Su habilidad especial restaura hasta 50 puntos de vida a cada aliado vivo, una vez por descanso.
- **Sacerdote:** sus curaciones restauran un 10 % adicional y reduce 8 puntos porcentuales el riesgo de emboscada por cansancio. Su habilidad especial restaura hasta 50 puntos de cordura a cada aliado vivo, una vez por descanso.
- **Asesino:** su bonificación de crítico también aumenta la esquiva. Si está vivo y el grupo gana la iniciativa, habilita la opción de huir y garantiza que el primer ataque conectado sea crítico.

Al cambiar quién integra el grupo o al morir/revivir un personaje, se recalculan los máximos. La diferencia se suma o resta al valor actual y se limita al nuevo máximo.

## Moral por victoria en combate

Cuando un enemigo muere, cada aliado vivo que siga participando recupera 5 puntos de cordura, sin superar su máximo. Los aliados caídos o que huyeron no reciben esta recuperación; se aplica por cada enemigo derrotado.

## Recuperación al cambiar de nivel

Al cerrar el modal de transición, los aliados vivos recuperan toda su vida, cordura y poder. Los caídos permanecen fuera de combate hasta que los revivan.

## Progresión

Cada nivel aumenta en 10 la vida máxima y en 10 el Poder máximo, conservando sus valores actuales. Fuerza, agilidad, resistencias y crítico no aumentan automáticamente: sus cambios provienen del equipo. Los PA se calculan a partir de la agilidad efectiva, con un mínimo de 3 y un máximo de 6; el Caballero tiene un mínimo de 4 PA.

## Emboscadas por cansancio

Cada cinco pasos se consume una ración. Si no hay raciones, aumenta la fatiga; con fatiga mayor que cero, cada movimiento puede iniciar un encuentro adicional. La protección del Sacerdote se resta de esa probabilidad, hasta un mínimo de 0 %. Durante una emboscada, los enemigos atacan primero.

## Archivos relacionados

- `personaje/personajesBase.js`: pasivas y valores de los personajes.
- `personaje/personajes.js`: aplicación de bonificaciones grupales.
- `combate/combate.js`: iniciativa, alcance enemigo, cobertura y habilidades de combate.
- `exploracion/mazmorra.js`: consumo de raciones y riesgo de emboscada.
## Habilidades especiales de combate

Cada personaje puede activar su habilidad especial una vez entre descansos. Se elige desde el menú de acciones del personaje, solo durante un combate, y consume todo su turno sin gastar PA. Una vez usada, queda marcada como agotada hasta que el grupo descanse. El combate automático la activa cuando detecta una necesidad suficiente.

- **Caballero — Guardia férrea:** durante la siguiente fase enemiga, el daño recibido por el grupo se reduce un 15 % en total. Reemplaza temporalmente su mitigación grupal pasiva del 10 %; no se acumulan ambos porcentajes.
- **Bruja — Pulso vital:** restaura hasta 50 puntos de vida a cada aliado vivo.
- **Sacerdote — Consuelo sagrado:** restaura hasta 50 puntos de cordura a cada aliado vivo.
- **Asesino — Instinto letal:** cada otro aliado vivo recibe +10 puntos porcentuales de probabilidad de crítico durante su siguiente turno. El Asesino no se beneficia.

El descanso restaura las cargas de todas las habilidades especiales.
