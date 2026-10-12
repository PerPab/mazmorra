(function inicializarProgresion() {
  const juego = window.juego;
  if (!juego || !Array.isArray(juego.personajes)) {
    throw new Error("No se cargaron los personajes para administrar la experiencia.");
  }

  const AUMENTO_EXPERIENCIA_POR_NIVEL = 50;

  // Suma experiencia y otorga un nivel y punto de habilidad por cada barra completada.
  function ganarExperiencia(id, cantidad) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new RangeError("La experiencia ganada debe ser un entero mayor que cero.");
    }

    const personaje = juego.personajes.find((entry) => entry.id === id);
    if (!personaje) {
      throw new Error(`No existe un personaje con el identificador "${id}".`);
    }

    personaje.experiencia += cantidad;
    while (personaje.experiencia >= personaje.experienciaNecesaria) {
      personaje.experiencia -= personaje.experienciaNecesaria;
      personaje.nivel += 1;
      personaje.puntosHabilidad += 1;
      personaje.experienciaNecesaria += AUMENTO_EXPERIENCIA_POR_NIVEL;
    }

    juego.actualizarProgresoTarjeta(personaje);
    return {
      nivel: personaje.nivel,
      experiencia: personaje.experiencia,
      experienciaNecesaria: personaje.experienciaNecesaria,
      puntosHabilidad: personaje.puntosHabilidad,
    };
  }

  juego.ganarExperiencia = ganarExperiencia;
})();
