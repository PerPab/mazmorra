(function definirHechizosRestauracion() {
  const catalogo = {
    basico: [
      { id: "curacion-menor", nombre: "Curación menor", efecto: "curacion", curacion: 10, objetivo: "aliado", costePA: 3, costePoder: 12 },
      { id: "tranquilizar", nombre: "Tranquilizar", efecto: "cordura", restauracion: 10, objetivo: "aliado", costePA: 3, costePoder: 12 },
      { id: "proteccion-menor", nombre: "Protección menor", efecto: "proteccion", porcentaje: 0.15, objetivo: "aliado", costePA: 3, costePoder: 14 },
    ],
    medio: [
      { id: "curacion", nombre: "Curación", efecto: "curacion", curacion: 21, objetivo: "aliado", costePA: 3, costePoder: 22 },
      { id: "curacion-grupal-menor", nombre: "Curación grupal menor", efecto: "curacion", curacion: 7, objetivo: "grupo", costePA: 4, costePoder: 30 },
      { id: "tranquilizar-medio", nombre: "Tranquilizar", efecto: "cordura", restauracion: 20, objetivo: "aliado", costePA: 3, costePoder: 22 },
      { id: "proteccion", nombre: "Protección", efecto: "proteccion", porcentaje: 0.25, objetivo: "aliado", costePA: 3, costePoder: 24 },
    ],
    avanzado: [
      { id: "curacion-superior", nombre: "Curación superior", efecto: "curacion", curacion: 35, objetivo: "aliado", costePA: 3, costePoder: 36 },
      { id: "curacion-grupal", nombre: "Curación grupal", efecto: "curacion", curacion: 12, objetivo: "grupo", costePA: 4, costePoder: 48 },
      { id: "serenidad", nombre: "Serenidad", efecto: "cordura", restauracion: 35, objetivo: "aliado", costePA: 3, costePoder: 36 },
      { id: "proteccion-superior", nombre: "Protección superior", efecto: "proteccion", porcentaje: 0.4, objetivo: "aliado", costePA: 3, costePoder: 40 },
      { id: "proteccion-grupal", nombre: "Protección grupal", efecto: "proteccion", porcentaje: 0.2, objetivo: "grupo", costePA: 4, costePoder: 38 },
    ],
  };

  function elegirSinRepetir(lista, cantidad) {
    const disponibles = lista.map((hechizo) => ({ ...hechizo }));
    const elegidos = [];
    while (elegidos.length < cantidad && disponibles.length > 0) {
      elegidos.push(disponibles.splice(Math.floor(Math.random() * disponibles.length), 1)[0]);
    }
    return elegidos;
  }

  function generar(nivel) {
    const rango = window.juego?.obtenerRangoEquipo?.(nivel) ?? (nivel >= 7 ? "avanzado" : nivel >= 4 ? "medio" : "basico");
    if (rango === "basico") return elegirSinRepetir(catalogo.basico, 1);
    if (rango === "medio") {
      return [
        ...elegirSinRepetir(catalogo.medio.filter((hechizo) => hechizo.efecto === "curacion"), 1),
        ...elegirSinRepetir(catalogo.medio.filter((hechizo) => hechizo.efecto !== "curacion"), 1),
      ];
    }
    return [
      ...elegirSinRepetir(catalogo.avanzado.filter((hechizo) => hechizo.efecto === "curacion" && hechizo.objetivo === "aliado"), 1),
      ...elegirSinRepetir(catalogo.avanzado.filter((hechizo) => hechizo.efecto === "curacion" && hechizo.objetivo === "grupo"), 1),
      ...elegirSinRepetir(catalogo.avanzado.filter((hechizo) => hechizo.efecto !== "curacion"), 1),
    ];
  }

  window.juego.hechizosRestauracionBase = catalogo;
  window.juego.generarHechizosRestauracion = generar;
})();
