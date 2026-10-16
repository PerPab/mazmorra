(function crearCriaturasBase() {
  const Enemigo = window.juego?.Enemigo;
  if (typeof Enemigo !== "function") {
    throw new Error("No se cargó la clase Enemigo para definir las criaturas.");
  }
  const items = window.juego.itemsBase ?? [];
  const armaduraMedia = items.find((item) => item.id === "armadura-media-antigua");
  const espadaNivel2 = items.find((item) => item.id === "espada-larga-oxidada-nivel-2")
    ?? items.find((item) => item.id === "espada-larga-oxidada");
  if (!armaduraMedia || !espadaNivel2) {
    throw new Error("Falta el equipo requerido para definir al Antiguo Soldado de Nhar'Keth.");
  }

  window.juego.criaturasBase = [
    new Enemigo({
      id: "rata-rabiosa-cueva",
      nombre: "Rata Famélica",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/rata_1.png",
      nivel: 1,
      vidaMaxima: 15,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 3,
      resistenciaBase: 1,
      resistenciaMagica: 0,
      agilidad: 9,
      bonificacionCritico: 0.12,
      maldito: false,
      descripcion: "Estas pequeñas criaturas, consumidas por el hambre y la enfermedad, son rápidas, agresivas y sorprendentemente letales.",
    }),
    new Enemigo({
      id: "arana-mediana-venenosa",
      nombre: "Araña Negra Venenosa",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/spider_r.png",
      nivel: 1,
      vidaMaxima: 10,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 2,
      resistenciaBase: 2,
      resistenciaMagica: 0,
      agilidad: 9,
      bonificacionCritico: 0.10,
      maldito: true,
      efectoGolpe: {
        tipo: "veneno",
        probabilidad: 0.15,
        danioPorTurno: 3,
        duracion: 3,
      },
      ataques: [
        { nombre: "Mordida", alcance: 1, multiplicadorDanio: 1 },
        { nombre: "Chorro de veneno", alcance: 2, multiplicadorDanio: 0.75 },
      ],
      descripcion: "Sus decenas de ojos brillan en la oscuridad, observando pacientemente a las criaturas que pronto quedarán atrapadas en sus redes.",
    }),
    new Enemigo({
      id: "revivido-debil",
      nombre: "Revivido Débil",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/zombie_2.png",
      nivel: 2,
      vidaMaxima: 48,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 6,
      resistenciaBase: 6,
      resistenciaMagica: 0,
      agilidad: 1,
      maldito: true,
      danioCorduraPorGolpe: 8,
      ataques: [
        { nombre: "Golpe de puño", alcance: 1, multiplicadorDanio: 1 },
      ],
      descripcion: "El hedor de la carne putrefacta impregna el aire. Algo que debería permanecer muerto se aproxima.",
    }),
    new Enemigo({
      id: "mosca-negra-maligna",
      nombre: "Mosca Negra Maligna",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/insecto_2.png",
      nivel: 2,
      vidaMaxima: 18,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 3,
      resistenciaBase: 1,
      resistenciaMagica: 0,
      agilidad: 12,
      bonificacionCritico: 0.12,
      maldito: false,
      efectoGolpe: {
        tipo: "paralisis",
        probabilidad: 1,
        duracion: 1,
        activacion: "critico",
      },
      ataques: [
        { nombre: "Picadura", alcance: 1, multiplicadorDanio: 1 },
      ],
      descripcion: "Millones de estas inmundas criaturas habitan las entrañas de la montaña. Entre tanta muerte y podredumbre, jamás les falta alimento.",
    }),
    new Enemigo({
      id: "antiguo-soldado-nhar-keth",
      nombre: "Antiguo Soldado de Nhar'Keth",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/esqueleto_2.png",
      nivel: 2,
      vidaMaxima: 45,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 5,
      resistenciaBase: 4,
      resistenciaMagica: 1,
      agilidad: 4,
      bonificacionCritico: 0.05,
      maldito: true,
      danioCorduraPorGolpe: 8,
      equipo: { arma: espadaNivel2, armadura: armaduraMedia },
      descripcion: "Murió hace cientos de años, pero ni siquiera la muerte pudo liberarlo de su amo. Sus huesos todavía obedecen la voluntad del Dios Negro.",
    }),
  ];
})();
