(function prepararCatalogosDeNiveles() {
  const juego = window.juego;
  if (!juego) return;

  // Cada definición de mapa se carga desde su archivo en niveles/.
  juego.mapasBase = juego.mapasBase ?? [];
  juego.configuracionPorMapa = juego.configuracionPorMapa ?? {};
  juego.puntosInteresPorNivel = juego.puntosInteresPorNivel ?? {};
})();
