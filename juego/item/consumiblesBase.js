(function crearConsumiblesBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir los consumibles.");
  }

  window.juego.consumiblesBase = [
    new Item({
      id: "pocion-de-resurreccion",
      categoria: "consumible",
      tipo: "pocion-revivir",
      nombre: "Poción de resurrección",
      descripcion: "Una poción excepcional capaz de devolver la vida a un aliado caído.",
      nivel: 1,
      bonificacion: { vida: 1 },
      clasesPermitidas: ["todas"],
      magico: false,
      imagen: "recursos/imagen/consumibles/heart-bottle.png",
      icono: "+",
      revivir: true,
    }),
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
    new Item({
      id: "botella-veneno",
      categoria: "consumible",
      tipo: "veneno-arma",
      nombre: "Botella de veneno",
      descripcion: "Aplica veneno al arma equipada. Su siguiente impacto exitoso causa 3 puntos de daño de veneno durante 3 turnos del objetivo.",
      nivel: 1,
      efectoEstado: { tipo: "veneno", danioPorTurno: 3, duracion: 3 },
      clasesPermitidas: ["todas"],
      magico: false,
      imagen: "recursos/imagen/consumibles/spiral-bottle.png",
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

