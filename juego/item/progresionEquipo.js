(function definirProgresionEquipo() {
  const RANGOS_EQUIPO = Object.freeze([
    Object.freeze({ id: "basico", nivelMinimo: 1, nivelMaximo: 3, probabilidadEfecto: 0.05, cantidadEfectos: 1 }),
    Object.freeze({ id: "medio", nivelMinimo: 4, nivelMaximo: 6, probabilidadEfecto: 0.15, cantidadEfectos: 1 }),
    Object.freeze({ id: "avanzado", nivelMinimo: 7, nivelMaximo: 9, probabilidadEfecto: 0.30, cantidadEfectos: 2 }),
  ]);

  function obtenerRangoEquipo(nivel) {
    const nivelSeguro = Math.max(1, Math.floor(Number(nivel) || 1));
    return RANGOS_EQUIPO.find((rango) => nivelSeguro <= rango.nivelMaximo)?.id ?? "avanzado";
  }

  function obtenerRangoEquipoInfo(rangoId) {
    return RANGOS_EQUIPO.find((rango) => rango.id === rangoId) ?? RANGOS_EQUIPO[0];
  }

  function obtenerNivelAmenazaEscaramuza(ronda) {
    return Math.max(1, Math.min(9, Math.floor(Number(ronda) || 1)));
  }

  window.juego = window.juego ?? {};
  Object.assign(window.juego, {
    rangosEquipo: RANGOS_EQUIPO,
    obtenerRangoEquipo,
    obtenerRangoEquipoInfo,
    obtenerNivelAmenazaEscaramuza,
  });
})();
