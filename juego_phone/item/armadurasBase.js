(function crearArmadurasBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir las armaduras.");
  }

  const atributosVacios = () => ({
    resistenciaFisica: 0,
    resistenciaCordura: 0,
    resistenciaMagica: 0,
    fuerza: 0,
    agilidad: 0,
    poder: 0,
    vida: 0,
    danioFisico: 0,
    danioMagico: 0,
    bonificacionCritico: 0,
  });

  const definiciones = [
    {
      id: "armadura-ligera-antigua", subtipo: "ligera", tipo: "ligera",
      nombre: "Jubón de cuero desgastado", nivel: 1,
      descripcion: "Un jubón flexible, marcado por los años y las galerías de la Montaña Negra.",
      imagen: "recursos/imagen/armaduras/leather-armor.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote", "asesino"],
      bonificaciones: { resistenciaFisica: 0, bonificacionCritico: 0.01 },
    },
    {
      id: "armadura-media-antigua", subtipo: "media", tipo: "media",
      nombre: "Cota de malla oxidada", nivel: 1,
      descripcion: "Una cota de malla corroída que conserva una protección modesta y permite moverse con soltura.",
      imagen: "recursos/imagen/armaduras/mail-shirt.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote", "asesino"],
      bonificaciones: { resistenciaFisica: 1, agilidad: 1 },
    },
    {
      id: "armadura-pesada-antigua", subtipo: "pesada", tipo: "pesada",
      nombre: "Armadura de placas deteriorada", nivel: 1,
      descripcion: "Una armadura de placas gastada. Su peso protege al portador, aunque limita sus movimientos.",
      imagen: "recursos/imagen/armaduras/breastplate.png", icono: "🛡️",
      clasesPermitidas: ["caballero"],
      bonificaciones: { resistenciaFisica: 2, agilidad: -1 },
    },
    {
      id: "capa-arcana-antigua", subtipo: "capa-arcana", tipo: "capa",
      nombre: "Túnica de aprendiz raída", nivel: 1,
      descripcion: "Tela gastada sin protección física; todavía conserva un tenue caudal arcano.",
      imagen: "recursos/imagen/armaduras/robe.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote"], magico: true,
      bonificaciones: { poder: 5 },
    },
    {
      id: "jubon-cuero-reforzado", subtipo: "ligera", tipo: "ligera",
      nombre: "Armadura de cuero reforzado", nivel: 4,
      descripcion: "Cuero curtido y remendado con placas flexibles para proteger sin perder ligereza.",
      imagen: "recursos/imagen/armaduras/leather-armor.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote", "asesino"],
      bonificaciones: { resistenciaFisica: 1, bonificacionCritico: 0.02 },
    },
    {
      id: "cota-malla-reforzada", subtipo: "media", tipo: "media",
      nombre: "Cota de malla reforzada", nivel: 4,
      descripcion: "Anillos de hierro reforzados en las zonas vulnerables. Protege mejor y conserva movilidad.",
      imagen: "recursos/imagen/armaduras/mail-shirt.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote", "asesino"],
      bonificaciones: { resistenciaFisica: 2, agilidad: 1 },
    },
    {
      id: "armadura-placas-restaurada", subtipo: "pesada", tipo: "pesada",
      nombre: "Armadura de placas restaurada", nivel: 4,
      descripcion: "Placas recuperadas de un antiguo bastión y ajustadas para cerrar sus brechas.",
      imagen: "recursos/imagen/armaduras/breastplate.png", icono: "🛡️",
      clasesPermitidas: ["caballero"],
      bonificaciones: { resistenciaFisica: 3, resistenciaMagica: 1, agilidad: -1 },
    },
    {
      id: "tunica-hechicero", subtipo: "capa-arcana", tipo: "capa",
      nombre: "Túnica de hechicero", nivel: 4,
      descripcion: "Una túnica marcada con símbolos que contienen y ordenan el flujo de Poder.",
      imagen: "recursos/imagen/armaduras/robe.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote"], magico: true,
      bonificaciones: { resistenciaMagica: 1, poder: 10 },
    },
    {
      id: "armadura-cuero-endurecido", subtipo: "ligera", tipo: "ligera",
      nombre: "Armadura de cuero endurecido", nivel: 7,
      descripcion: "Cuero tratado hasta volverse firme sin perder la flexibilidad necesaria para esquivar.",
      imagen: "recursos/imagen/armaduras/leather-armor.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote", "asesino"],
      bonificaciones: { resistenciaFisica: 2, bonificacionCritico: 0.03 },
    },
    {
      id: "cota-malla-acero", subtipo: "media", tipo: "media",
      nombre: "Cota de malla de acero", nivel: 7,
      descripcion: "Una malla de acero bien ajustada, resistente sin impedir el movimiento.",
      imagen: "recursos/imagen/armaduras/mail-shirt.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote", "asesino"],
      bonificaciones: { resistenciaFisica: 3, resistenciaMagica: 1, agilidad: 2 },
    },
    {
      id: "armadura-placas-caballero", subtipo: "pesada", tipo: "pesada",
      nombre: "Armadura de placas de caballero", nivel: 7,
      descripcion: "Placas de acero trabajadas para soportar los golpes de las profundidades.",
      imagen: "recursos/imagen/armaduras/breastplate.png", icono: "🛡️",
      clasesPermitidas: ["caballero"],
      bonificaciones: { resistenciaFisica: 4, resistenciaMagica: 1, agilidad: -1 },
    },
    {
      id: "tunica-archimago", subtipo: "capa-arcana", tipo: "capa",
      nombre: "Túnica de archimago", nivel: 7,
      descripcion: "Una capa arcana tejida para soportar grandes corrientes de Poder y desviar hechizos.",
      imagen: "recursos/imagen/armaduras/robe.png", icono: "🛡️",
      clasesPermitidas: ["bruja", "sacerdote"], magico: true,
      bonificaciones: { resistenciaMagica: 2, poder: 15 },
    },
  ];

  window.juego.armadurasBase = definiciones.map((definicion) => new Item({
    ...definicion,
    categoria: "armadura",
    descripcion: definicion.descripcion,
    bonificaciones: { ...atributosVacios(), ...definicion.bonificaciones },
    clasesPermitidas: definicion.clasesPermitidas,
    magico: definicion.magico ?? false,
  }));
})();
