(function definirPropiedadesAnillo() {
  // Solo se sortean bonificaciones pasivas que el modelo y el combate ya aplican.
  // La recuperación por turno, absorciones y reducción de costes esperan sus propios manejadores.
  const propiedades = [
    { id: "fuerza-fisica", grupo: "danio-fisico", rango: "basico", peso: 1, bonificaciones: { danioFisico: 1 } },
    { id: "resguardo-magico", grupo: "proteccion-magica", rango: "basico", peso: 1, bonificaciones: { resistenciaMagica: 1 } },
    { id: "resguardo-fisico", grupo: "proteccion-fisica", rango: "basico", peso: 1, bonificaciones: { resistenciaFisica: 1 } },
    { id: "sereno", grupo: "proteccion-mental", rango: "basico", peso: 1, proteccionCordura: 1, proteccionMoral: 1 },
    { id: "agil", grupo: "agilidad", rango: "basico", peso: 1, bonificaciones: { agilidad: 1 } },
    { id: "vigoroso", grupo: "vida", rango: "basico", peso: 1, bonificaciones: { vida: 5 } },
    { id: "concentrado", grupo: "cordura", rango: "basico", peso: 1, bonificaciones: { cordura: 5 } },
    { id: "imbuido", grupo: "poder", rango: "basico", peso: 1, bonificaciones: { poder: 3 } },
    { id: "arcano", grupo: "danio-magico", rango: "basico", peso: 1, bonificaciones: { danioMagico: 1 } },
    { id: "critico", grupo: "critico", rango: "basico", peso: 1, bonificaciones: { bonificacionCritico: 0.01 } },

    { id: "fortalecido", grupo: "danio-fisico", rango: "medio", peso: 1, bonificaciones: { danioFisico: 1 } },
    { id: "runico", grupo: "proteccion-magica", rango: "medio", peso: 1, bonificaciones: { resistenciaMagica: 1 } },
    { id: "fortificado", grupo: "proteccion-fisica", rango: "medio", peso: 1, bonificaciones: { resistenciaFisica: 1 } },
    { id: "apaciguador", grupo: "proteccion-mental", rango: "medio", peso: 1, proteccionCordura: 2, proteccionMoral: 2 },
    { id: "liviano", grupo: "agilidad", rango: "medio", peso: 1, bonificaciones: { agilidad: 1 } },
    { id: "vital", grupo: "vida", rango: "medio", peso: 1, bonificaciones: { vida: 8 } },
    { id: "centrado", grupo: "cordura", rango: "medio", peso: 1, bonificaciones: { cordura: 8 } },
    { id: "potenciado", grupo: "poder", rango: "medio", peso: 1, bonificaciones: { poder: 5 } },
    { id: "hechicero", grupo: "danio-magico", rango: "medio", peso: 1, bonificaciones: { danioMagico: 1 } },
    { id: "certero", grupo: "critico", rango: "medio", peso: 1, bonificaciones: { bonificacionCritico: 0.02 } },

    { id: "letal", grupo: "danio-fisico", rango: "avanzado", peso: 1, bonificaciones: { danioFisico: 2 } },
    { id: "arcano-superior", grupo: "proteccion-magica", rango: "avanzado", peso: 1, bonificaciones: { resistenciaMagica: 2 } },
    { id: "inexpugnable", grupo: "proteccion-fisica", rango: "avanzado", peso: 1, bonificaciones: { resistenciaFisica: 2 } },
    { id: "imperturbable", grupo: "proteccion-mental", rango: "avanzado", peso: 1, proteccionCordura: 3, proteccionMoral: 3 },
    { id: "gracil", grupo: "agilidad", rango: "avanzado", peso: 1, bonificaciones: { agilidad: 2 } },
    { id: "robusto", grupo: "vida", rango: "avanzado", peso: 1, bonificaciones: { vida: 12 } },
    { id: "voluntad", grupo: "cordura", rango: "avanzado", peso: 1, bonificaciones: { cordura: 12 } },
    { id: "sobrecargado", grupo: "poder", rango: "avanzado", peso: 1, bonificaciones: { poder: 8 } },
    { id: "mago", grupo: "danio-magico", rango: "avanzado", peso: 1, bonificaciones: { danioMagico: 2 } },
    { id: "mortal", grupo: "critico", rango: "avanzado", peso: 1, bonificaciones: { bonificacionCritico: 0.03 } },
  ];
  const ORDEN_RANGOS = ["basico", "medio", "avanzado"];

  function sortearPonderado(candidatos) {
    const pesoTotal = candidatos.reduce((total, propiedad) => total + propiedad.peso, 0);
    let tirada = Math.random() * pesoTotal;
    for (const propiedad of candidatos) {
      tirada -= propiedad.peso;
      if (tirada < 0) return propiedad;
    }
    return candidatos[candidatos.length - 1];
  }

  function generarPropiedadesAnillo(item) {
    if (item?.categoria !== "especial" || item.tipo !== "anillo") return [];
    const rango = item.rango ?? window.juego?.obtenerRangoEquipo?.(item.nivel) ?? "basico";
    const infoRango = window.juego?.obtenerRangoEquipoInfo?.(rango);
    if (!infoRango || Math.random() >= infoRango.probabilidadEfecto) return [];

    const indiceRango = ORDEN_RANGOS.indexOf(rango);
    const disponibles = propiedades
      .filter((propiedad) => ORDEN_RANGOS.indexOf(propiedad.rango) <= indiceRango
        && propiedad.grupo !== item.subtipo)
      .map((propiedad) => ({
        ...propiedad,
        peso: propiedad.peso * (propiedad.rango === rango ? 1 : 0.2),
      }));
    const elegidas = [];
    const gruposUsados = new Set([item.subtipo]);
    while (elegidas.length < infoRango.cantidadEfectos) {
      const opciones = disponibles.filter((propiedad) => !gruposUsados.has(propiedad.grupo));
      if (opciones.length === 0) break;
      const elegida = sortearPonderado(opciones);
      elegidas.push(elegida);
      gruposUsados.add(elegida.grupo);
    }
    return elegidas;
  }

  window.juego = window.juego ?? {};
  Object.assign(window.juego, { propiedadesAnillo: propiedades, generarPropiedadesAnillo });
})();
