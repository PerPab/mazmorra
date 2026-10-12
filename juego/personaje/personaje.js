// Comprueba que los campos de texto requeridos tengan contenido.
function validarTexto(nombreCampo, valor) {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new TypeError(`${nombreCampo} debe ser un texto no vacío.`);
  }
}

// Comprueba que un valor sea un entero no negativo.
function validarEnteroNoNegativo(nombreCampo, valor) {
  if (!Number.isInteger(valor) || valor < 0) {
    throw new TypeError(`${nombreCampo} debe ser un entero mayor o igual a cero.`);
  }
}

class Personaje {
  // Crea un personaje validando sus datos e inicializando sus recursos al máximo.
  constructor({
    id,
    nombre,
    clase,
    imagen,
    descripcion,
    pasiva,
    habilidadGrupo,
    nivel,
    vidaMaxima,
    vidaInicial = vidaMaxima,
    corduraMaxima,
    poderMaximo,
    resistenciaFisica,
    resistenciaCordura,
    fuerza,
    agilidad,
    danioMoral = 1,
    bonificacionCritico = 0,
    puntosHabilidad = 0,
    experiencia = 0,
    experienciaNecesaria = 100,
  }) {
    validarTexto("id", id);
    validarTexto("nombre", nombre);
    validarTexto("clase", clase);
    validarTexto("imagen", imagen);
    if (!/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(imagen.trim())) {
      throw new TypeError("imagen debe ser una ruta a un archivo de imagen.");
    }
    validarTexto("descripcion", descripcion);
    validarTexto("pasiva", pasiva);
    validarTexto("habilidadGrupo", habilidadGrupo);
    validarEnteroNoNegativo("nivel", nivel);

    if (nivel < 1) {
      throw new RangeError("nivel debe ser al menos 1.");
    }

    for (const [nombreCampo, valor] of Object.entries({
      vidaMaxima,
      vidaInicial,
      corduraMaxima,
      poderMaximo,
      resistenciaFisica,
      resistenciaCordura,
      fuerza,
      agilidad,
      danioMoral,
      puntosHabilidad,
      experiencia,
      experienciaNecesaria,
    })) {
      validarEnteroNoNegativo(nombreCampo, valor);
    }
    if (!Number.isFinite(bonificacionCritico) || bonificacionCritico < 0 || bonificacionCritico > 1) {
      throw new RangeError("bonificacionCritico debe estar entre 0 y 1.");
    }

    if (experienciaNecesaria < 1) {
      throw new RangeError("experienciaNecesaria debe ser al menos 1.");
    }

    if (vidaInicial < 0 || vidaInicial > vidaMaxima) {
      throw new RangeError("vidaInicial debe estar entre cero y vidaMaxima.");
    }

    for (const [nombreCampo, valor] of Object.entries({
      vidaMaxima,
      corduraMaxima,
      poderMaximo,
    })) {
      if (valor < 1) {
        throw new RangeError(`${nombreCampo} debe ser al menos 1.`);
      }
    }

    for (const [nombreCampo, valor] of Object.entries({
      resistenciaFisica,
      resistenciaCordura,
      fuerza,
      agilidad,
    })) {
      if (valor > 10) {
        throw new RangeError(`${nombreCampo} debe estar entre 0 y 10.`);
      }
    }

    this.id = id.trim();
    this.nombre = nombre.trim();
    this.clase = clase.trim();
    this.imagen = imagen.trim();
    this.descripcion = descripcion.trim();
    this.pasiva = pasiva.trim();
    this.habilidadGrupo = habilidadGrupo.trim();
    this.nivel = nivel;
    this.vida = { actual: vidaInicial, maxima: vidaMaxima };
    this.vidaMaximaBase = vidaMaxima;
    this.estabilidadMental = { actual: corduraMaxima, maxima: corduraMaxima };
    this.corduraMaximaBase = corduraMaxima;
    this.cordura = this.estabilidadMental;
    this.moral = this.estabilidadMental;
    this.poder = { actual: poderMaximo, maximo: poderMaximo };
    this.poderMaximoBase = poderMaximo;
    this.resistenciaFisica = resistenciaFisica;
    this.resistenciaCordura = resistenciaCordura;
    this.fuerza = fuerza;
    this.agilidad = agilidad;
    this.danioMoral = danioMoral;
    this.bonificacionCritico = bonificacionCritico;
    this.puntosHabilidad = puntosHabilidad;
    this.experiencia = experiencia;
    this.experienciaNecesaria = experienciaNecesaria;
    this.equipo = {
      armadura: null,
      arma: null,
      especial: null,
    };
  }

  get probabilidadEsquivar() {
    return window.juego.calcularProbabilidadEsquivaPersonaje(this.agilidadCombate, this.bonificacionCritico);
  }

  get probabilidadCritico() {
    return window.juego.calcularProbabilidadCritico(this.agilidadCombate, this.bonificacionCritico);
  }

  get eficienciaCombate() {
    return 0.5 + (this.estabilidadMental.actual / this.estabilidadMental.maxima) * 0.5;
  }

  get agilidadCombate() {
    return Math.max(0, Math.floor((this.agilidadEfectiva - (this.agilidadReducidaCombate ?? 0)) * this.eficienciaCombate));
  }

  obtenerBonificacionEquipo(atributo) {
    return Object.values(this.equipo).reduce((total, item) => total + (item?.bonificaciones?.[atributo] ?? 0), 0);
  }

  get resistenciaFisicaCombate() {
    return Math.floor(
      (this.resistenciaFisica + this.obtenerBonificacionEquipo("resistenciaFisica")) * this.eficienciaCombate,
    );
  }

  get resistenciaCorduraCombate() {
    return Math.floor((this.resistenciaCordura + this.obtenerBonificacionEquipo("resistenciaCordura")) * this.eficienciaCombate);
  }

  get agilidadEfectiva() {
    return this.agilidad + this.obtenerBonificacionEquipo("agilidad");
  }

  get fuerzaEfectiva() {
    return this.fuerza + this.obtenerBonificacionEquipo("fuerza");
  }
}

// Expone la clase bajo un espacio de nombres para los scripts clásicos del juego.
window.juego = window.juego ?? {};
window.juego.Personaje = Personaje;
