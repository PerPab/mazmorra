(function crearObjetosEspecialesBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir los objetos especiales.");
  }

  window.juego.objetosEspecialesBase = [
    new Item({
      id: "anillo-de-cordura",
      categoria: "especial",
      tipo: "anillo",
      nombre: "Anillo de cordura",
      descripcion: "Un anillo pulido por el uso, su brillo te calma los nervios... un poco.",
      nivel: 1,
      danioMoral: 0,
      proteccionCordura: 1,
      proteccionMoral: 1,
      clasesPermitidas: ["sacerdote", "bruja"],
      magico: true,
      imagen: "recursos/imagen/especiales/globe-ring.png",
      icono: "⭕",
    }),
  ];
})();
