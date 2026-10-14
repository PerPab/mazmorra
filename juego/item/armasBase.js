(function crearArmasBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir las armas.");
  }

  window.juego.armasBase = [
    new Item({
      id: "espada-larga-oxidada",
      categoria: "arma",
      tipo: "espada",
      nombre: "Espada larga oxidada",
      descripcion: "Una espada larga con la hoja cubierta de óxido.",
      nivel: 1,
      ataque: 1,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Estocada precisa",
          multiplicadorDanio: 1.5,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Barrido amplio",
          multiplicadorDanio: 0.5,
          costePoder: 15,
          objetivosMaximos: 2,
        },
      },
      clasesPermitidas: ["caballero", "bruja"],
      magico: false,
      imagen: "recursos/imagen/armas/croc-sword.png",
      icono: "⚔️",
    }),
  ];

  window.juego.armasBase.push(
    new Item({
      id: "arco-corto-recuperado",
      categoria: "arma",
      tipo: "arco",
      nombre: "Arco corto recuperado",
      descripcion: "Un viejo arco que apenas se mantiene entero.",
      nivel: 1,
      ataque: 1,
      alcance: 4,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Disparo apuntado",
          multiplicadorDanio: 1.5,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Lluvia de flechas",
          multiplicadorDanio: 0.5,
          costePoder: 15,
          objetivosMaximos: 2,
        },
      },
      clasesPermitidas: ["asesino"],
      magico: false,
      imagen: "recursos/imagen/armas/high-shot.png",
      icono: "??",
    }),
  );

    window.juego.armasBase.push(
    new Item({
      id: "baston-mistico-agotado",
      categoria: "arma",
      tipo: "baston",
      nombre: "Bastón místico agotado",
      descripcion: "Un bastón místico que ha perdido casi todo su poder mágico.",
      nivel: 1,
      ataque: 1,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Bola de fuego",
          multiplicadorDanio: 1.5,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Golpe de baston",
          multiplicadorDanio: 0.5,
          costePoder: 15,
          objetivosMaximos: 2,
        },
      },
      clasesPermitidas: ["bruja","sacerdote"],
      magico: true,
      imagen: "recursos/imagen/armas/crystal-wand.png",
      icono: "??",
    }),
  );

    window.juego.armasBase.push(
    new Item({
      id: "daga-sin-filo",
      categoria: "arma",
      tipo: "espada",
      nombre: "Daga sin filo",
      descripcion: "Una daga sin filo, utilizada seguramente en algunos robos.",
      nivel: 1,
      ataque: 1,
      alcance: 1,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Puñalada rápida",
          multiplicadorDanio: 2,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Corte de lado",
          multiplicadorDanio: 1,
          costePoder: 15,
          objetivosMaximos: 1,
        },
      },
      clasesPermitidas: ["bruja","asesino"],
      magico: false,
      imagen: "recursos/imagen/armas/stiletto.png",
      icono: "??",
    }),
  );

  window.juego.armasBase.push(
    new Item({
      id: "Libro-restaurativo-basico",
      categoria: "arma",
      tipo: "libro",
      nombre: "Libro de restauración basico",
      descripcion: "Un viejo libro con hechizos de restauración basicos.",
      nivel: 1,
      ataque: 1,
      alcance: 3,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Curación dirigida basica",
          efecto: "curacion",
          curacion: 15,
          costePoder: 20,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Alivio de grupo leve",
          efecto: "curacion",
          curacion: 8,
          costePoder: 25,
          objetivosMaximos: 3,
        },
      },
      clasesPermitidas: ["bruja","sacerdote"],
      magico: true,
      imagen: "recursos/imagen/armas/enlightenment.png",
      icono: "??",
    }),
  );

})();
