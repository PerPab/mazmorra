(function definirCalculoProbabilidades() {
  const PROBABILIDAD_BASE_ESQUIVA = 0.05;
  const BONIFICACION_ESQUIVA_POR_AGILIDAD = 0.01;
  const PROBABILIDAD_BASE_CRITICO = 0.02;
  const BONIFICACION_CRITICO_POR_AGILIDAD = 0.018;
  const PROBABILIDAD_MAXIMA_CRITICO = 0.35;

  function redondearProbabilidad(probabilidad) {
    return Math.round(probabilidad * 10000) / 10000;
  }

  function calcularProbabilidadEsquivar(agilidad, bonificacionCritico = 0, maximo = 0.25) {
    return redondearProbabilidad(Math.min(
      maximo,
      Math.max(0, PROBABILIDAD_BASE_ESQUIVA + agilidad * BONIFICACION_ESQUIVA_POR_AGILIDAD + bonificacionCritico),
    ));
  }

  function calcularProbabilidadCritico(agilidad, bonificacionCritico = 0) {
    return redondearProbabilidad(Math.min(
      PROBABILIDAD_MAXIMA_CRITICO,
      Math.max(0, PROBABILIDAD_BASE_CRITICO + agilidad * BONIFICACION_CRITICO_POR_AGILIDAD + bonificacionCritico),
    ));
  }

  function calcularProbabilidadEsquivaPersonaje(agilidad, bonificacionCritico = 0) {
    const PROBABILIDAD_BASE_PERSONAJE = 0.02;
    const BONIFICACION_AGILIDAD_PERSONAJE = 0.005;
    const MAXIMO_PERSONAJE = 0.2;
    return redondearProbabilidad(Math.min(
      MAXIMO_PERSONAJE,
      Math.max(0, PROBABILIDAD_BASE_PERSONAJE + agilidad * BONIFICACION_AGILIDAD_PERSONAJE + bonificacionCritico),
    ));
  }

  window.juego = window.juego ?? {};
  window.juego.calcularProbabilidadEsquivar = calcularProbabilidadEsquivar;
  window.juego.calcularProbabilidadCritico = calcularProbabilidadCritico;
  window.juego.calcularProbabilidadEsquivaPersonaje = calcularProbabilidadEsquivaPersonaje;
})();
