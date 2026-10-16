(function definirMapaDemo() {
  const juego = window.juego;
  if (!juego) return;

  const mapa = {
    id: "mapa_demo",
    modo: "ambos",
    nivel: 1,
    tamano: 30,
    minHabitaciones: 6,
    maxHabitaciones: 10,
    cantidadEnemigos: 3,
    nivelEnemigos: 1,
    cantidadPOI: 2,
    bossId: "jefe-bandido",
    enemigosIds: ["humano-armado", "bandido-andrajoso", "bandido-arquero-andrajoso"],
    usarAlIniciar: true,
    cuartoPrueba: {
      ancho: 2,
      alto: 2,
      imagenEntrada: "recursos/imagen/mapa/pasillo_puerta_1.webp",
      imagenFondo: "recursos/imagen/mapa/pared.webp",
      imagenSalida: "recursos/imagen/mapa/salida_cuarto_2.webp",
      imagenAnguloDerecho: "recursos/imagen/mapa/pared_angulo_derecho_2.webp",
      imagenAnguloIzquierdo: "recursos/imagen/mapa/pared_angulo_izq_2.webp",
      imagenesCeldas: {
        "0,0": "recursos/imagen/mapa/pared.webp",
        "0,1": "recursos/imagen/mapa/pared_angulo_derecho_2.webp",
        "1,0": "recursos/imagen/mapa/pared_angulo_derecho_2.webp",
        "1,1": "recursos/imagen/mapa/pared_angulo_izq_2.webp",
      },
    },
    mensajes: {
      pasillo: [
        {
          texto: "Avanzas por un pasillo oscuro. Tus pasos resuenan entre las paredes húmedas.",
          imagen: "recursos/imagen/mapa/pasillo_1.webp",
          alt: "Pasillo oscuro de una caverna",
        },
        {
          texto: "Te internas por un corredor silencioso; el aire frío trae olor a piedra y polvo.",
          imagen: "recursos/imagen/mapa/pasillo_2.webp",
          alt: "Corredor silencioso de piedra",
        },
        {
          texto: "Sigues por un túnel estrecho. La luz apenas alcanza a mostrar el camino.",
          imagen: "recursos/imagen/mapa/pasillo_1.webp",
          alt: "Túnel estrecho apenas iluminado",
        },
        {
          texto: "Un cadáver yace junto al muro, cubierto de polvo y marcas oscuras.",
          imagen: "recursos/imagen/mapa/pasillo_3_cadaver.png",
          alt: "Un cadáver abandonado en el pasillo",
        },
        {
          texto: "El agua negra cubre el suelo y oculta lo que yace bajo la superficie.",
          imagen: "recursos/imagen/mapa/pasillo_inundado.png",
          alt: "Pasillo inundado por agua oscura",
        },
        {
          texto: "Hilos de telaraña cruzan el corredor y se pierden en la oscuridad.",
          imagen: "recursos/imagen/mapa/pasillo_telaranias_1.png",
          alt: "Telarañas cubren el corredor de la caverna",
        },
      ],
      bifurcacion: [
        {
          texto: "Llegas a una bifurcación. El pasillo continúa en varias direcciones.",
          imagen: "recursos/imagen/mapa/pasillo_bifurcacion.webp",
          alt: "Pasillo que se divide en la caverna",
        },
        { texto: "El corredor se divide entre columnas de piedra derrumbadas.", imagen: "recursos/imagen/mapa/pasillo_bloqueado_bifurcacion_izq_der.webp", alt: "Corredor bloqueado con pasos a izquierda y derecha" },
        { texto: "Llegas a un cruce parcialmente cubierto por rocas.", imagen: "recursos/imagen/mapa/cruce_parcialmente_bloqueado.webp", alt: "Cruce de pasillos parcialmente bloqueado" },
        { texto: "Un cruce oscuro se abre ante el grupo.", imagen: "recursos/imagen/mapa/cruce_1.webp", alt: "Cruce alternativo de pasillos" },
      ],
      tramo: [
        {
          texto: "El corredor se estrecha y apenas hay espacio para maniobrar.",
          imagen: "recursos/imagen/mapa/pasillo_final.webp",
          alt: "El pasillo termina en una pared de piedra",
        },
        { texto: "El corredor termina bajo un derrumbe de piedra.", imagen: "recursos/imagen/mapa/pasillo_bloqueado_derrumbe.webp", alt: "Final del corredor bloqueado por un derrumbe" },
      ],
    },
  };

  juego.mapasBase.push(mapa);
  juego.configuracionPorMapa[mapa.id] = {
    gruposEnemigos: 3,
    tesoros: 1,
    probabilidadCofreCerrado: 0.45,
    nivelMaximoEnemigo: 1,
    nivelMaximoLoot: 1,
    enemigo: [
      {
        titulo: "Presencias en la oscuridad",
        texto: ({ cantidad, nombre }) => (
          `${cantidad === 1 ? "Un enemigo bloquea" : `Un grupo de ${cantidad} enemigos bloquea`} el pasillo. ${nombre} está al frente.`
        ),
        imagen: "recursos/imagen/mapa/pasillo_3_cadaver.png",
        alt: "Un cadáver abandonado en un pasillo de la Montaña Negra",
        audio: "recursos/sonidos/pasos.mp3",
      },
    ],
    tesoro: [
      {
        titulo: "Tesoro oculto",
        texto: "Entre las piedras encuentras un objeto olvidado. Puedes guardarlo en el inventario del grupo.",
        imagen: "recursos/imagen/mapa/pasillo_tesoro.webp",
        imagenModal: "recursos/imagen/mapa/tesoro_poi.webp",
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
        imagen: "recursos/imagen/mapa/pasillo_puerta_1.webp",
        imagenesPuerta: [
          "recursos/imagen/mapa/pasillo_puerta_1.webp",
          "recursos/imagen/mapa/pasillo_puerta_2.webp",
        ],
        alt: "La puerta cerrada al final de la mazmorra",
        audio: "recursos/sonidos/puerta-cerrada.mp3",
        accion: "Seguir explorando",
      },
    ],
  };

  if (!juego.mapaActivoId) juego.mapaActivoId = mapa.id;
})();
