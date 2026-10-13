(function definirPuntosInteresBase() {
  const juego = window.juego;
  if (!juego) return;
  juego.puntosInteresBase = juego.puntosInteresBase ?? [];

  // Agrega aquí variantes de texto e imagen para cada tipo de punto de interés.
  // En `loot`, usa "aleatorio" o una lista de IDs definidos en itemsBase.js.
  // En `audio` (opcional) pon la ruta relativa del sonido que suena al abrir el
  // aviso, por ejemplo "recursos/sonidos/cofre.mp3". Si se omite, no suena nada.
  juego.puntosInteresPorNivel = {
    1: {
      gruposEnemigos: 3,
      tesoros: 1,
      nivelMaximoEnemigo: 1,
      nivelMaximoLoot: 1,
      enemigo: [
        {
          titulo: "Presencias en la oscuridad",
          texto:  ({ cantidad, nombre }) => (
            `${cantidad === 1 ? "Un enemigo bloquea" : `Un grupo de ${cantidad} enemigos bloquea`} el pasillo. ${nombre} está al frente.`
          ),
          audio: "recursos/sonidos/pasos.mp3",
        },
      ],
      tesoro: [
        {
          titulo: "Tesoro oculto",
          texto: "Entre las piedras encuentras un objeto olvidado. Puedes guardarlo en el inventario del grupo.",
          imagen: "recursos/imagen/especiales/rupee.png",
          alt: "Un tesoro reluciente",
          audio: "recursos/sonidos/inventario.mp3",
          loot: "aleatorio",
          accion: "Recoger tesoro",
        },
      ],
      salida: [
        {
          titulo: "Puerta de salida",
          texto: "Una puerta de piedra cierra el paso. Parece necesitar una llave que todavía no tienes.",
          imagen: "recursos/imagen/Entrada.png",
          alt: "La puerta de salida de la mazmorra",
          audio: "recursos/sonidos/puerta-cerrada.mp3",
          accion: "Seguir explorando",
        },
      ],
    },
  };
})();
