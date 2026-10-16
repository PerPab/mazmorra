(function crearEnemigosBase() {
  const Enemigo = window.juego?.Enemigo;
  const items = window.juego?.itemsBase;
  if (typeof Enemigo !== "function" || !Array.isArray(items)) {
    throw new Error("No se cargaron la clase Enemigo o los objetos para definir enemigos.");
  }

  const armaduraMediaAntigua = items.find((item) => item.id === "armadura-media-antigua");
  const espadaLargaOxidada = items.find((item) => item.id === "espada-larga-oxidada");
  const bastonMisticoAgotado = items.find((item) => item.id === "baston-mistico-agotado");
  const espadaJefeBandido = items.find((item) => item.id === "espada-jefe-bandido");
  const hachaCombateNivel1 = items.find((item) => item.id === "hacha-de-combate-nivel-1");
  const espadaLargaNivel2 = items.find((item) => item.id === "espada-larga-oxidada-nivel-2") ?? espadaLargaOxidada;
  const bastonNivel2 = items.find((item) => item.id === "baston-mistico-agotado-nivel-2") ?? bastonMisticoAgotado;
  const punalNivel2 = items.find((item) => item.id === "daga-sin-filo-nivel-2")
    ?? items.find((item) => item.id === "daga-sin-filo");
  const armaduraPesada = items.find((item) => item.id === "armadura-pesada-antigua");
  const armaduraMedia = items.find((item) => item.id === "armadura-media-antigua");
  const armaduraLigera = items.find((item) => item.id === "armadura-ligera-antigua");
  if (!armaduraMediaAntigua || !espadaLargaOxidada || !bastonMisticoAgotado || !espadaJefeBandido || !hachaCombateNivel1
    || !espadaLargaNivel2 || !bastonNivel2 || !punalNivel2 || !armaduraPesada || !armaduraMedia || !armaduraLigera) {
    throw new Error("Falta el equipo requerido para definir a los enemigos humanos.");
  }

  // Valores fijos de prototipo; la generación según nivel se añadirá más adelante.
  window.juego.enemigosBase = [
    new Enemigo({
      id: "humano-armado",
      nombre: "Guardián saqueador de sepulcros",
      tipo: "humano",
      imagen: "recursos/imagen/enemigos/bandido_merodeador_1.png",
      nivel: 1,
      vidaMaxima: 35,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 4,
      resistenciaBase: 5,
      resistenciaMagica: 0,
      agilidad: 2,
      maldito: false,
      equipo: { arma: espadaLargaOxidada, armadura: armaduraMediaAntigua },
      descripcion: "Viste una armadura arrancada de un sepulcro antiguo. Todavía conserva el hedor de la tumba.",
    }),
    new Enemigo({
      id: "brujo-de-las-catacumbas",
      nombre: "Brujo de las catacumbas",
      tipo: "humano",
      imagen: "recursos/imagen/enemigos/mago_enemigo.png",
      nivel: 1,
      vidaMaxima: 25,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 3,
      resistenciaBase: 1,
      resistenciaMagica: 1,
      agilidad: 3,
      maldito: false,
      equipo: { arma: bastonMisticoAgotado, armadura: null },
      descripcion: "Un brujo frágil protegido por su magia, que ataca desde la retaguardia con su bastón.",
    }),
  ];

  window.juego.enemigosBase.push(
    new Enemigo({
      id: "mago-oscuro",
      nombre: "Mago Oscuro",
      tipo: "humano",
      imagen: "recursos/imagen/enemigos/mago_2.png",
      nivel: 2,
      vidaMaxima: 36,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 5,
      resistenciaBase: 2,
      resistenciaMagica: 2,
      agilidad: 4,
      bonificacionCritico: 0.05,
      maldito: false,
      equipo: { arma: bastonNivel2, armadura: null },
      descripcion: "Pupilo descarriado de una antigua escuela de magia. Llegó a la Montaña Negra buscando la sabiduría prohibida del Dios Negro.",
    }),
    new Enemigo({
      id: "mercenario-negro",
      nombre: "Mercenario Negro",
      tipo: "humano",
      imagen: "recursos/imagen/enemigos/bandido_2.png",
      nivel: 2,
      vidaMaxima: 50,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 6,
      resistenciaBase: 5,
      resistenciaMagica: 0,
      agilidad: 2,
      maldito: false,
      equipo: { arma: espadaLargaNivel2, armadura: armaduraPesada },
      descripcion: "Un miserable sin honor ni lealtad. Carroña humana que ahora sirve a los horrores de la Montaña Negra.",
    }),
    new Enemigo({
      id: "asesino-depravado",
      nombre: "Asesino Depravado",
      tipo: "humano",
      imagen: "recursos/imagen/enemigos/asesino_2.png",
      nivel: 2,
      vidaMaxima: 30,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 4,
      resistenciaBase: 1,
      resistenciaMagica: 0,
      agilidad: 9,
      bonificacionCritico: 0.15,
      maldito: false,
      equipo: { arma: punalNivel2, armadura: armaduraLigera },
      descripcion: "Asesino cruel y de baja calaña. Llegó a la Montaña Negra buscando un botín fácil, pero encontró algo mucho peor.",
    }),
  );

  window.juego.enemigosBase.push(new Enemigo({
    id: "jefe-bandido",
    nombre: "Jefe bandido",
    tipo: "humano",
    imagen: "recursos/imagen/enemigos/jefe_bandido_1.png",
    nivel: 2,
    vidaMaxima: 80,
    corduraMaxima: 100,
    poderMaximo: 100,
    ataqueBase: 7,
    resistenciaBase: 6,
    resistenciaMagica: 2,
    agilidad: 5,
    bonificacionCritico: 0.05,
    maldito: false,
    esJefe: true,
    botinGarantizadoIds: [espadaJefeBandido.id, "llave-salida"],
    equipo: { arma: espadaLargaOxidada, armadura: armaduraMediaAntigua },
    descripcion: "El jefe de una banda que tomó estas galerías. Su armadura y su espada muestran las cicatrices de muchos combates.",
  }));

  window.juego.enemigosBase.push(new Enemigo({
    id: "carnicero-guardian",
    nombre: "Carnicero guardián",
    tipo: "humano",
    imagen: "recursos/imagen/enemigos/boss_2.png",
    nivel: 2,
    vidaMaxima: 110,
    corduraMaxima: 100,
    poderMaximo: 100,
    ataqueBase: 9,
    resistenciaBase: 7,
    resistenciaMagica: 3,
    agilidad: 3,
    bonificacionCritico: 0.03,
    maldito: false,
    esJefe: true,
    botinGarantizadoIds: ["llave-salida"],
    equipo: { arma: hachaCombateNivel1, armadura: armaduraMedia },
    descripcion: "Una mole gigante con una mente enloquecida por las pesadillas.",
  }));

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
    "nombre":  "Lunático de la Montaña Negra",
    "descripcion":  "Un desdichado que perdió la cordura hace mucho tiempo. La Montaña Negra lo atrajo a sus profundidades y jamás le permitió marcharse.",
    "nivel":  1,
    "vidaMaxima":  25,
    "corduraMaxima":  100,
    "poderMaximo":  100,
    "ataqueBase":  3,
    "resistenciaBase":  2,
    "agilidad":  4,
    "danioCorduraPorGolpe":  1,
    "danioMoralPorGolpe":  1,
    "bonificacionCritico":  0,
    "maldito":  false,
    "imagen":  "recursos/imagen/enemigos/bandido_andrajoso_1.png"
},
    tipo: "humano",
    equipo: {
      arma: items.find((item) => item.id === "espada-larga-oxidada") ?? null,
      armadura: items.find((item) => item.id === "armadura-media-antigua") ?? null,
    },
  });
  window.juego.enemigosBase.push(enemigo);
  window.juego.poolEncuentros.push(enemigo);
})();


// Enemigo humano agregado desde Opciones > Cargar recurso.
(function () {
  const items = window.juego.itemsBase;
  const enemigo = new window.juego.Enemigo({
    ...{
  "id": "bandido-arquero-andrajoso",
  "nombre": "Arquero de las Galerías Superiores",
  "descripcion": "Antiguos asesinos y ladrones que ahora sirven, sin saberlo, a la voluntad del Dios Negro.",
  "nivel": 1,
  "vidaMaxima": 20,
  "corduraMaxima": 100,
  "poderMaximo": 100,
  "ataqueBase": 4,
  "resistenciaBase": 1,
  "agilidad": 6,
  "danioCorduraPorGolpe": 1,
  "danioMoralPorGolpe": 1,
  "bonificacionCritico": 0.1,
  "maldito": false,
  "imagen": "recursos/imagen/enemigos/arquero_bandido_1.png"
},
    tipo: "humano",
    equipo: {
      arma: items.find((item) => item.id === "arco-corto-recuperado") ?? null,
      armadura: items.find((item) => item.id === "armadura-ligera-antigua") ?? null,
    },
  });
  window.juego.enemigosBase.push(enemigo);
  window.juego.poolEncuentros.push(enemigo);
})();
