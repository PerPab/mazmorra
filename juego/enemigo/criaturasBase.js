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
      vidaMaxima: 30,
      corduraMaxima: 100,
      poderMaximo: 100,
      ataqueBase: 3,
      resistenciaBase: 1,
      agilidad: 9,
      bonificacionCritico: 0.12,
      maldito: false,
      descripcion: "Una rata pequeña y feroz, débil al recibir golpes pero muy rápida para esquivarlos.",
    }),
  ];
})();
