(function crearItemsBase() {
  const {
    armadurasBase,
    armasBase,
    objetosEspecialesBase,
    consumiblesBase,
  } = window.juego ?? {};
  if (![armadurasBase, armasBase, objetosEspecialesBase, consumiblesBase].every(Array.isArray)) {
    throw new Error("No se cargaron todos los catálogos de objetos.");
  }

  window.juego.itemsBase = [
    ...armadurasBase,
    ...armasBase,
    ...objetosEspecialesBase,
    ...consumiblesBase,
  ];
})();
