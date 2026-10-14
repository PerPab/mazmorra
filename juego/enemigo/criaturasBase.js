(function crearCriaturasBase() {
  const Enemigo = window.juego?.Enemigo;
  if (typeof Enemigo !== "function") {
    throw new Error("No se cargó la clase Enemigo para definir las criaturas.");
  }

  window.juego.criaturasBase = [
    new Enemigo({
      id: "rata-rabiosa-cueva",
      nombre: "Rata rabiosa de cueva",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/rata_1.png",
      nivel: 1,
      vidaMaxima: 20,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 3,
      resistenciaBase: 1,
      agilidad: 9,
      bonificacionCritico: 0.12,
      maldito: false,
      descripcion: "Una rata pequeña y feroz, débil al recibir golpes pero muy rápida para esquivarlos.",
    }),
    new Enemigo({
      id: "arana-mediana-venenosa",
      nombre: "Araña mediana venenosa",
      tipo: "criatura",
      imagen: "recursos/imagen/criaturas/spider_r.png",
      nivel: 1,
      vidaMaxima: 20,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 2,
      resistenciaBase: 1,
      agilidad: 9,
      bonificacionCritico: 0.10,
      maldito: true,
      efectoGolpe: {
        tipo: "veneno",
        probabilidad: 0.15,
        danioPorTurno: 3,
        duracion: 3,
      },
      descripcion: "Una araña aterradora de tamaño mediano, ligeramente venenosa.",
    }),
  ];
})();
