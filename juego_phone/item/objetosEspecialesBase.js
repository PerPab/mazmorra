(function crearObjetosEspecialesBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir los objetos especiales.");
  }

  const rangos = [
    { rango: "basico", nivel: 1, etiqueta: "menor" },
    { rango: "medio", nivel: 4, etiqueta: "" },
    { rango: "avanzado", nivel: 7, etiqueta: "superior" },
  ];
  const familiasAnillos = [
    { id: "cordura", nombre: "cordura", descripcion: "Aumenta la Cordura máxima.", atributo: "cordura", valores: [5, 10, 15], ids: ["anillo-menor-de-cordura", "anillo-de-cordura", "anillo-superior-de-cordura"] },
    { id: "poder", nombre: "poder", descripcion: "Aumenta el Poder máximo.", atributo: "poder", valores: [3, 6, 10], ids: ["anillo-menor-de-poder", "anillo-de-poder", "anillo-superior-de-poder"] },
    { id: "proteccion-fisica", nombre: "protección física", descripcion: "Reduce el daño físico recibido.", atributo: "resistenciaFisica", valores: [1, 1, 2], ids: ["anillo-menor-de-proteccion-fisica", "anillo-de-blindaje", "anillo-superior-de-proteccion-fisica"] },
    { id: "proteccion-magica", nombre: "protección mágica", descripcion: "Reduce el daño mágico recibido.", atributo: "resistenciaMagica", valores: [1, 1, 2], ids: ["anillo-menor-de-proteccion-magica", "anillo-de-blindaje-magico", "anillo-superior-de-proteccion-magica"] },
    { id: "proteccion-mental", nombre: "protección mental", descripcion: "Reduce la pérdida de Cordura y Moral.", atributo: null, valores: [1, 2, 3], ids: ["anillo-menor-de-proteccion-mental", "anillo-de-proteccion-mental", "anillo-superior-de-proteccion-mental"] },
    { id: "agilidad", nombre: "agilidad", descripcion: "Aumenta la Agilidad.", atributo: "agilidad", valores: [1, 1, 2], ids: ["anillo-menor-de-agilidad", "anillo-de-agilidad", "anillo-superior-de-agilidad"] },
    { id: "movimiento", nombre: "movimiento", descripcion: "Aumenta en 1 los PA máximos por turno.", atributo: "puntosAccion", valores: [1, 1, 1], ids: ["anillo-menor-de-movimiento", "anillo-de-movimiento", "anillo-superior-de-movimiento"] },
    { id: "vida", nombre: "vida", descripcion: "Aumenta la Salud máxima.", atributo: "vida", valores: [5, 10, 15], ids: ["anillo-menor-de-vida", "anillo-de-vitalidad", "anillo-superior-de-vida"] },
  ];

  const anillosBase = familiasAnillos.flatMap((familia) => rangos.map((rango, indice) => {
    const valor = familia.valores[indice];
    return new Item({
      id: familia.ids[indice],
      categoria: "especial",
      tipo: "anillo",
      subtipo: familia.id,
      nombre: `Anillo${rango.etiqueta ? ` ${rango.etiqueta}` : ""} de ${familia.nombre}`,
      descripcion: familia.descripcion,
      nivel: rango.nivel,
      pesoBotin: familia.id === "movimiento" ? 0.35 : 1,
      ...(familia.atributo
        ? { bonificaciones: { [familia.atributo]: valor } }
        : { proteccionCordura: valor, proteccionMoral: valor }),
      clasesPermitidas: ["todas"],
      magico: true,
      imagen: "recursos/imagen/especiales/globe-ring.png",
      icono: "⭕",
    });
  }));

  window.juego.objetosEspecialesBase = [
    new Item({
      id: "llave-cofre",
      categoria: "especial",
      tipo: "llave",
      nombre: "Llave de cofre",
      descripcion: "Una llave pequeña y ennegrecida, útil para abrir cofres cerrados de la Montaña Negra.",
      nivel: 1,
      clasesPermitidas: ["todas"],
      magico: false,
      imagen: "recursos/imagen/especiales/key_1.png",
      icono: "🗝️",
      esObjetoMision: true,
    }),
    new Item({
      id: "llave-salida",
      categoria: "especial",
      tipo: "llave",
      nombre: "Llave de la salida",
      descripcion: "Una llave antigua que abre la puerta al final de la mazmorra.",
      nivel: 1,
      clasesPermitidas: ["todas"],
      magico: false,
      imagen: "recursos/imagen/especiales/key_1.png",
      icono: "🗝️",
      esObjetoMision: true,
    }),
    ...anillosBase,
  ];
})();
