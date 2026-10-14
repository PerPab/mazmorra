(function definirPuntosInteresBase() {
  const juego = window.juego;
  if (!juego) return;
  juego.puntosInteresBase = juego.puntosInteresBase ?? [];

  // POI reutilizables en distintos niveles. El contenido específico de cada
  // mapa (encuentros, cofres y salidas) vive en su archivo dentro de niveles/.
  juego.puntosInteresBase.push({
    id: "vendedor-enano",
    nivel: 1,
    tipo: "vendedor",
    imagen: "recursos/imagen/historia/poi_vendor_r.png",
    texto: "¡Te encontraste con un enano dispuesto a comerciar!",
    mercancia: ["pocion-curacion", "botella-veneno", "armadura-media-antigua", "espada-larga-oxidada"],
  });
})();
