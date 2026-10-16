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
    imagenEscena: "recursos/imagen/mapa/pasillo_enano.webp",
    texto: "¡Te encontraste con un enano dispuesto a comerciar!",
    mercancia: ["pocion-curacion", "pocion-poder-leve", "armadura-media-antigua", "espada-larga-oxidada"],
  }, {
    id: "llave-cofre-entre-los-huesos",
    titulo: "Una llave entre los huesos",
    nivel: 1,
    tipo: "historia",
    imagen: "recursos/imagen/mapa/tesoro_poi.webp",
    imagenEscena: "recursos/imagen/mapa/pasillo_tesoro.webp",
    texto: "Entre los restos de un explorador encuentras una llave ennegrecida. Algún cofre cercano podría abrirse con ella.",
    lootId: "llave-cofre",
    accion: "Recoger la llave",
  }, {
    id: "trampa-placa-presion",
    titulo: "Trampa de presión",
    nivel: 1,
    tipo: "trampa",
    imagen: "recursos/imagen/mapa/pasillo_trampa.webp",
    imagenEscena: "recursos/imagen/mapa/pasillo_trampa.webp",
    imagenModal: "recursos/imagen/mapa/modal_trampa_poi.webp",
    texto: "Detectas una placa de presión oculta entre las piedras. Si fallas al desactivarla, el mecanismo se activará.",
    danio: 30,
    probabilidadDesactivacion: 0.35,
  });
})();
