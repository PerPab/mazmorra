(function crearArmadurasBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir las armaduras.");
  }

  window.juego.armadurasBase = [
    new Item({
      id: "armadura-pesada-antigua",
      categoria: "armadura",
      tipo: "pesada",
      nombre: "Armadura pesada antigua",
      descripcion: "Una antigua armadura de placas, gastada por el tiempo.",
      nivel: 1,
      // Acepta bonificaciones positivas y penalizaciones negativas.
      // Puede incluir resistenciaFisica, resistenciaCordura, fuerza, agilidad y poder.
      bonificaciones: { resistenciaFisica: 2, agilidad: -1, poder: 0 },
      clasesPermitidas: ["caballero"],
      magico: false,
      imagen: "recursos/imagen/armaduras/breastplate.png",
      icono: "🛡️",
    }),
  ];

  window.juego.armadurasBase.push(
    new Item({
        id: "armadura-ligera-antigua",
      categoria: "armadura",
      tipo: "ligera",
      nombre: "Armadura ligera antigua",
      descripcion: "Una antigua armadura ligera, apenas protege algo... pero puede huir más rápido.",
      nivel: 1,
      bonificaciones: { resistenciaFisica: 0, agilidad: 2, poder: 0 },
      clasesPermitidas: ["bruja", "sacerdote","asesino"],
      magico: false,
      imagen: "recursos/imagen/armaduras/heart-armor.png",
      icono: "🛡️",

    }),
  );

  window.juego.armadurasBase.push(
    new Item({
        id: "armadura-media-antigua",
      categoria: "armadura",
      tipo: "media",
      nombre: "Armadura media antigua",
      descripcion: "Una antigua armadura media, ofrece protección moderada y mobilidad.",
      nivel: 1,
      bonificaciones: { resistenciaFisica: 1, agilidad: 1, poder: 0 },
      clasesPermitidas: ["bruja","asesino"],
      magico: false,
      imagen: "recursos/imagen/armaduras/leather-armor.png",
      icono: "🛡️",

    }),
  );

  window.juego.armadurasBase.push(
    new Item({
        id: "capa-arcana-antigua",
      categoria: "armadura",
      tipo: "ropa",
      nombre: "Capa arcana antigua",
      descripcion: "Su tela no va a parar flechas, pero te sientes mas poderoso cuando la vistes.",
      nivel: 1,
      bonificaciones: { resistenciaFisica: 0, agilidad: 0, poder: 2 },
      clasesPermitidas: ["bruja","sacerdote"],
      magico: true,
      imagen: "recursos/imagen/armaduras/robe.png",
      icono: "🛡️",

    }),
  );

})();


 /*window.juego.armadurasBase.push(
    new Item({
  

    }),
  );*/
