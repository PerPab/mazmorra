(function definirPropiedadesArmadura() {
  const propiedades = [
    { id: "reforzada", grupo: "defensa-fisica", rango: "basico", familias: ["ligera", "media", "pesada"], peso: 1, bonificaciones: { resistenciaFisica: 1 } },
    { id: "protectora", grupo: "defensa-magica", rango: "basico", familias: ["pesada", "capa-arcana"], peso: 1, bonificaciones: { resistenciaMagica: 1 } },
    { id: "serena", grupo: "resistencia-cordura", rango: "basico", familias: ["ligera", "media", "pesada", "capa-arcana"], peso: 1, bonificaciones: { resistenciaCordura: 1 } },
    { id: "flexible", grupo: "agilidad", rango: "basico", familias: ["ligera", "media"], peso: 1, bonificaciones: { agilidad: 1 } },
    { id: "critica", grupo: "critico", rango: "basico", familias: ["ligera"], peso: 1, bonificaciones: { bonificacionCritico: 0.01 } },
    { id: "imbuida", grupo: "poder", rango: "basico", familias: ["ligera", "capa-arcana"], peso: 1, bonificaciones: { poder: 5 } },
    { id: "fortificada", grupo: "defensa-fisica", rango: "medio", familias: ["ligera", "media", "pesada"], peso: 1, bonificaciones: { resistenciaFisica: 1 } },
    { id: "encantada", grupo: "defensa-magica", rango: "medio", familias: ["pesada", "capa-arcana"], peso: 1, bonificaciones: { resistenciaMagica: 1 } },
    { id: "apaciguadora", grupo: "resistencia-cordura", rango: "medio", familias: ["ligera", "media", "pesada", "capa-arcana"], peso: 1, bonificaciones: { resistenciaCordura: 2 } },
    { id: "liviana", grupo: "agilidad", rango: "medio", familias: ["ligera", "media"], peso: 1, bonificaciones: { agilidad: 1 } },
    { id: "certera", grupo: "critico", rango: "medio", familias: ["ligera"], peso: 1, bonificaciones: { bonificacionCritico: 0.02 } },
    { id: "potenciada", grupo: "poder", rango: "medio", familias: ["ligera", "capa-arcana"], peso: 1, bonificaciones: { poder: 8 } },
    { id: "inquebrantable", grupo: "defensa-fisica", rango: "avanzado", familias: ["ligera", "media", "pesada"], peso: 1, bonificaciones: { resistenciaFisica: 2 } },
    { id: "runica", grupo: "defensa-magica", rango: "avanzado", familias: ["pesada", "capa-arcana"], peso: 1, bonificaciones: { resistenciaMagica: 2 } },
    { id: "serenadora", grupo: "resistencia-cordura", rango: "avanzado", familias: ["ligera", "media", "pesada", "capa-arcana"], peso: 1, bonificaciones: { resistenciaCordura: 3 } },
    { id: "eterea", grupo: "agilidad", rango: "avanzado", familias: ["ligera", "media"], peso: 1, bonificaciones: { agilidad: 2 } },
    { id: "letal", grupo: "critico", rango: "avanzado", familias: ["ligera"], peso: 1, bonificaciones: { bonificacionCritico: 0.03 } },
    { id: "sobrecargada", grupo: "poder", rango: "avanzado", familias: ["ligera", "capa-arcana"], peso: 1, bonificaciones: { poder: 12 } },
  ];
  const ORDEN_RANGOS = ["basico", "medio", "avanzado"];

  function obtenerFamiliaArmadura(item) {
    return item.subtipo ?? item.tipo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function sortearPonderado(candidatos) {
    const pesoTotal = candidatos.reduce((total, propiedad) => total + propiedad.peso, 0);
    let tirada = Math.random() * pesoTotal;
    for (const propiedad of candidatos) {
      tirada -= propiedad.peso;
      if (tirada < 0) return propiedad;
    }
    return candidatos[candidatos.length - 1];
  }

  function generarPropiedadesArmadura(item) {
    if (item?.categoria !== "armadura") return [];
    const rangoItem = item.rango ?? window.juego?.obtenerRangoEquipo?.(item.nivel) ?? "basico";
    const infoRango = window.juego?.obtenerRangoEquipoInfo?.(rangoItem) ?? { probabilidadEfecto: 0, cantidadEfectos: 0 };
    if (Math.random() >= infoRango.probabilidadEfecto) return [];

    const familia = obtenerFamiliaArmadura(item);
    const indiceRango = ORDEN_RANGOS.indexOf(rangoItem);
    const disponibles = propiedades
      .filter((propiedad) => propiedad.familias.includes(familia)
        && ORDEN_RANGOS.indexOf(propiedad.rango) <= indiceRango)
      .map((propiedad) => ({
        ...propiedad,
        peso: propiedad.peso * (propiedad.rango === rangoItem ? 1 : 0.2),
      }));
    const elegidas = [];
    const gruposUsados = new Set();
    const cantidad = Math.min(infoRango.cantidadEfectos, disponibles.length);

    while (elegidas.length < cantidad) {
      const opciones = disponibles.filter((propiedad) => !gruposUsados.has(propiedad.grupo));
      if (opciones.length === 0) break;
      const elegida = sortearPonderado(opciones);
      elegidas.push(elegida);
      gruposUsados.add(elegida.grupo);
    }
    return elegidas;
  }

  window.juego = window.juego ?? {};
  Object.assign(window.juego, { propiedadesArmadura: propiedades, generarPropiedadesArmadura });
})();
