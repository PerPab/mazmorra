(function crearConsumiblesBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir los consumibles.");
  }

  const crearPocion = ({ id, tipo, nombre, descripcion, nivel, bonificacion, imagen }) => new Item({
    id,
    categoria: "consumible",
    tipo,
    nombre,
    descripcion,
    nivel,
    bonificacion,
    clasesPermitidas: ["todas"],
    magico: false,
    imagen,
    icono: "🧪",
  });

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
    crearPocion({
      id: "pocion-curacion", tipo: "pocion", nombre: "Poción de curación menor",
      descripcion: "Restaura hasta 10 puntos de vida.", nivel: 1, bonificacion: { vida: 10 },
      imagen: "recursos/imagen/consumibles/round-potion.png",
    }),
    crearPocion({
      id: "pocion-curacion-media", tipo: "pocion", nombre: "Poción de curación",
      descripcion: "Restaura hasta 20 puntos de vida.", nivel: 4, bonificacion: { vida: 20 },
      imagen: "recursos/imagen/consumibles/round-potion.png",
    }),
    crearPocion({
      id: "pocion-curacion-superior", tipo: "pocion", nombre: "Poción de curación superior",
      descripcion: "Restaura hasta 30 puntos de vida.", nivel: 7, bonificacion: { vida: 30 },
      imagen: "recursos/imagen/consumibles/round-potion.png",
    }),
    crearPocion({
      id: "pocion-poder-leve", tipo: "pocion", nombre: "Poción de esencia menor",
      descripcion: "Restaura hasta 10 puntos de poder.", nivel: 1, bonificacion: { poder: 10 },
      imagen: "recursos/imagen/consumibles/fire-bottle.png",
    }),
    crearPocion({
      id: "pocion-esencia", tipo: "pocion", nombre: "Poción de esencia",
      descripcion: "Restaura hasta 20 puntos de poder.", nivel: 4, bonificacion: { poder: 20 },
      imagen: "recursos/imagen/consumibles/fire-bottle.png",
    }),
    crearPocion({
      id: "pocion-esencia-superior", tipo: "pocion", nombre: "Poción de esencia superior",
      descripcion: "Restaura hasta 30 puntos de poder.", nivel: 7, bonificacion: { poder: 30 },
      imagen: "recursos/imagen/consumibles/fire-bottle.png",
    }),
    crearPocion({
      id: "pocion-cordura-leve", tipo: "pocion", nombre: "Tónico tranquilizante",
      descripcion: "Restaura hasta 10 puntos de cordura.", nivel: 1, bonificacion: { cordura: 10 },
      imagen: "recursos/imagen/consumibles/round-potion.png",
    }),
    crearPocion({
      id: "elixir-serenidad", tipo: "pocion", nombre: "Elixir de serenidad",
      descripcion: "Restaura hasta 20 puntos de cordura.", nivel: 4, bonificacion: { cordura: 20 },
      imagen: "recursos/imagen/consumibles/round-potion.png",
    }),
    crearPocion({
      id: "elixir-lucidez", tipo: "pocion", nombre: "Elixir de lucidez",
      descripcion: "Restaura hasta 30 puntos de cordura.", nivel: 7, bonificacion: { cordura: 30 },
      imagen: "recursos/imagen/consumibles/round-potion.png",
    }),
  ];
})();
