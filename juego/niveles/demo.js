(function definirMapaDemo() {
  const juego = window.juego;
  if (!juego) return;

  const mapa = {
    id: "mapa_demo",
    nivel: 1,
    tamano: 8,
    cantidadEnemigos: 2,
    nivelEnemigos: 1,
    cantidadPOI: 1,
    bossId: "",
    usarAlIniciar: true,
    mensajes: {
      pasillo: [
        {
          texto: "Avanzas por un pasillo oscuro. Tus pasos resuenan entre las paredes húmedas.",
          imagen: "recursos/imagen/mapa/1_1.webp",
          alt: "Pasillo oscuro de una caverna",
        },
        {
          texto: "Te internas por un corredor silencioso; el aire frío trae olor a piedra y polvo.",
          imagen: "recursos/imagen/mapa/1_2.webp",
          alt: "Corredor silencioso de piedra",
        },
        {
          texto: "Sigues por un túnel estrecho. La luz apenas alcanza a mostrar el camino.",
          imagen: "recursos/imagen/mapa/1_3.webp",
          alt: "Túnel estrecho apenas iluminado",
        },
      ],
      bifurcacion: [
        {
          texto: "Llegas a una bifurcación. El pasillo continúa en varias direcciones.",
          imagen: "recursos/imagen/mapa/1_4.webp",
          alt: "Bifurcación en la caverna",
        },
      ],
      tramo: [
        {
          texto: "El corredor se estrecha y apenas hay espacio para maniobrar.",
          imagen: "recursos/imagen/mapa/1_5.webp",
          alt: "Tramo estrecho del corredor",
        },
      ],
    },
  };

  juego.mapasBase.push(mapa);
  juego.configuracionPorMapa[mapa.id] = {
    gruposEnemigos: 3,
    tesoros: 1,
    nivelMaximoEnemigo: 1,
    nivelMaximoLoot: 1,
    enemigo: [
      {
        titulo: "Presencias en la oscuridad",
        texto: ({ cantidad, nombre }) => (
          `${cantidad === 1 ? "Un enemigo bloquea" : `Un grupo de ${cantidad} enemigos bloquea`} el pasillo. ${nombre} está al frente.`
        ),
        imagen: "recursos/imagen/mapa/1_9.webp",
        alt: "Presencias acechan en la caverna",
        audio: "recursos/sonidos/pasos.mp3",
      },
    ],
    tesoro: [
      {
        titulo: "Tesoro oculto",
        texto: "Entre las piedras encuentras un objeto olvidado. Puedes guardarlo en el inventario del grupo.",
        imagen: "recursos/imagen/mapa/1_11.webp",
        imagenModal: "recursos/imagen/especiales/tesoro_r.png",
        alt: "Un cofre oculto entre las piedras",
        audio: "recursos/sonidos/inventario.mp3",
        loot: "aleatorio",
        accion: "Recoger tesoro",
      },
    ],
    salida: [
      {
        titulo: "Puerta de salida",
        texto: "Una puerta de rejas cierra el paso. Parece necesitar una llave que todavía no tienes.",
        imagen: "recursos/imagen/mapa/1_12.webp",
        alt: "La puerta cerrada al final de la mazmorra",
        audio: "recursos/sonidos/puerta-cerrada.mp3",
        accion: "Seguir explorando",
      },
    ],
  };

  if (!juego.mapaActivoId) juego.mapaActivoId = mapa.id;
})();
