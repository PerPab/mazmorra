(function inicializarProgresion() {
  const juego = window.juego;
  if (!juego || !Array.isArray(juego.personajes)) {
    throw new Error("No se cargaron los personajes para administrar la experiencia.");
  }

  const AUMENTO_EXPERIENCIA_POR_NIVEL = 50;
  const AUMENTO_VIDA_POR_NIVEL = 10;
  const AUMENTO_PODER_POR_NIVEL = 10;

  // Suma experiencia; cada nivel aumenta las reservas máximas, sin subir atributos.
  function ganarExperiencia(id, cantidad) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new RangeError("La experiencia ganada debe ser un entero mayor que cero.");
    }

    const personaje = juego.personajes.find((entry) => entry.id === id);
    if (!personaje) {
      throw new Error(`No existe un personaje con el identificador "${id}".`);
    }

    const vidaActualAntes = personaje.vida.actual;
    const poderActualAntes = personaje.poder.actual;
    let nivelesGanados = 0;
    personaje.experiencia += cantidad;
    while (personaje.experiencia >= personaje.experienciaNecesaria) {
      personaje.experiencia -= personaje.experienciaNecesaria;
      personaje.nivel += 1;
      personaje.vidaMaximaBase += AUMENTO_VIDA_POR_NIVEL;
      personaje.poderMaximoBase += AUMENTO_PODER_POR_NIVEL;
      personaje.experienciaNecesaria += AUMENTO_EXPERIENCIA_POR_NIVEL;
      nivelesGanados += 1;
    }

    if (nivelesGanados > 0) {
      juego.actualizarRecursosTarjeta(personaje.id);
      personaje.vida.actual = Math.min(vidaActualAntes, personaje.vida.maxima);
      personaje.poder.actual = Math.min(poderActualAntes, personaje.poder.maximo);
      juego.actualizarRecursosTarjeta(personaje.id);
    } else {
      juego.actualizarProgresoTarjeta(personaje);
    }
    return {
      nivel: personaje.nivel,
      nivelesGanados,
      experiencia: personaje.experiencia,
      experienciaNecesaria: personaje.experienciaNecesaria,
      puntosHabilidad: personaje.puntosHabilidad,
      vidaMaxima: personaje.vida.maxima,
      poderMaximo: personaje.poder.maximo,
    };
  }

  juego.ganarExperiencia = ganarExperiencia;
})();
