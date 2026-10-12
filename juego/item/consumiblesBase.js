(function crearConsumiblesBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir los consumibles.");
  }

  window.juego.consumiblesBase = [
    new Item({
      id: "pocion-curacion",
      categoria: "consumible",
      tipo: "pocion",
      nombre: "Poción de curación leve",
      descripcion: "Una botella con una pócima de curación.",
      nivel: 1,
      bonificacion: { vida: 10 },
      clasesPermitidas: ["todas"],
      magico: false,
      imagen: "recursos/imagen/consumibles/round-potion.png",
      icono: "🧪",
    }),
  ];

   window.juego.consumiblesBase.push(
    new Item({
      id: "Grimorio-curacion-leve",
      categoria: "consumible",
      tipo: "grimorio",
      nombre: "Grimorio de curación leve",
      descripcion: "Una vieja hoja que contiene un hechizo de curación, de un único uso.",
      nivel: 1,
      bonificacion: { vida: 15 },
      clasesPermitidas: ["sacerdote", "bruja"],
      magico: true,
      imagen: "recursos/imagen/consumibles/tied-scroll.png",
      icono: "🧪",

    }),
  );
})();
