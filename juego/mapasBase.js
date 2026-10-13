(function definirMapasBase() {
  const juego = window.juego;
  if (!juego) return;

  // Los mapas se consultan por ID. Agrega otra configuración para crear un nivel nuevo.
  juego.mapasBase = [
    {
      id: "mazmorra-inicial",
      nivel: 1,
      tamano: 8,
      cantidadEnemigos: 2,
      nivelEnemigos: 1,
      cantidadPOI: 1,
      bossId: "",
      usarAlIniciar: true,
      mensajes: {
        pasillo: [
          "Avanzas por un pasillo oscuro. Tus pasos resuenan entre las paredes húmedas.",
          "Te internas por un corredor silencioso; el aire frío trae olor a piedra y polvo.",
          "Sigues por un túnel estrecho. La luz apenas alcanza a mostrar el camino.",
        ],
        bifurcacion: [
          "Llegas a una bifurcación. El pasillo continúa en varias direcciones.",
        ],
        tramo: [
          "El corredor se estrecha y apenas hay espacio para maniobrar.",
        ],
      },
    },
  ];
  juego.mapaActivoId = "mazmorra-inicial";
})();
