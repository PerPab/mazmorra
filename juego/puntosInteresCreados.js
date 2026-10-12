(function registrarPuntosInteresCreados() {
  const juego = window.juego;
  if (!juego) return;
  juego.puntosInteresBase = juego.puntosInteresBase ?? [];
})();
