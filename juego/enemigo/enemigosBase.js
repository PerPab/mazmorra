(function crearEnemigosBase() {
  const Enemigo = window.juego?.Enemigo;
  const items = window.juego?.itemsBase;
  if (typeof Enemigo !== "function" || !Array.isArray(items)) {
    throw new Error("No se cargaron la clase Enemigo o los objetos para definir enemigos.");
  }

  const armaduraMediaAntigua = items.find((item) => item.id === "armadura-pesada-antigua");
  const espadaLargaOxidada = items.find((item) => item.id === "espada-larga-oxidada");
  if (!armaduraMediaAntigua || !espadaLargaOxidada) {
    throw new Error("Falta la armadura o la espada requeridas para el enemigo humano.");
  }

  // Valores fijos de prototipo; la generación según nivel se añadirá más adelante.
  window.juego.enemigosBase = [
    new Enemigo({
      id: "humano-armado",
      nombre: "Merodeador armado",
      tipo: "humano",
      imagen: "recursos/imagen/enemigos/bandit_2.png",
      nivel: 1,
      vidaMaxima: 50,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 5,
      resistenciaBase: 2,
      agilidad: 4,
      maldito: false,
      equipo: { arma: espadaLargaOxidada, armadura: armaduraMediaAntigua },
      descripcion: "Un merodeador humano que lucha con una espada oxidada y una armadura pesada.",
    }),
  ];

  const criaturas = window.juego.criaturasBase;
  if (!Array.isArray(criaturas)) {
    throw new Error("No se cargó el catálogo de criaturas para crear el pool de encuentros.");
  }
  window.juego.poolEncuentros = [...window.juego.enemigosBase, ...criaturas];
})();

// Enemigo humano agregado desde Opciones > Cargar recurso.
(function registrarBandidoAndrajoso() {
  const items = window.juego.itemsBase;
  const enemigo = new window.juego.Enemigo({
    ...{
    "id":  "bandido-andrajoso",
    "nombre":  "Bandido andrajoso",
    "descripcion":  "Un bandido vestido con harapos, en sus ojos brilla la locura.",
    "nivel":  1,
    "vidaMaxima":  50,
    "corduraMaxima":  100,
    "poderMaximo":  100,
    "ataqueBase":  4,
    "resistenciaBase":  2,
    "agilidad":  5,
    "danioCorduraPorGolpe":  1,
    "danioMoralPorGolpe":  1,
    "bonificacionCritico":  0,
    "maldito":  false,
    "imagen":  "recursos/imagen/enemigos/bandit_1.png"
},
    tipo: "humano",
    equipo: {
      arma: items.find((item) => item.id === "espada-larga-oxidada") ?? null,
      armadura: items.find((item) => item.id === "armadura-ligera-antigua") ?? null,
    },
  });
  window.juego.enemigosBase.push(enemigo);
  window.juego.poolEncuentros.push(enemigo);
})();
