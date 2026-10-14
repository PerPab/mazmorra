(function registrarMapasCreados() {
  const juego = window.juego;
  if (!juego) return;
  juego.mapasBase = juego.mapasBase ?? [];
})();
