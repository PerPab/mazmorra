(function definirClaseEnemigo() {
  function validarTexto(nombreCampo, valor) {
    if (typeof valor !== "string" || valor.trim() === "") {
      throw new TypeError(`${nombreCampo} debe ser un texto no vacío.`);
    }
  }

  function validarEnteroNoNegativo(nombreCampo, valor) {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new TypeError(`${nombreCampo} debe ser un entero mayor o igual a cero.`);
    }
  }

  class Enemigo {
    constructor({
      id,
      nombre,
      tipo,
      imagen,
      nivel,
      vidaMaxima,
      corduraMaxima = 100,
      poderMaximo = 100,
      ataqueBase,
      resistenciaBase,
      agilidad,
      bonificacionCritico = 0,
      maldito = false,
      danioCorduraPorGolpe = 5,
      danioMoralPorGolpe = 1,
      equipo = {},
      descripcion,
    }) {
      validarTexto("id", id);
      validarTexto("nombre", nombre);
      validarTexto("tipo", tipo);
      validarTexto("imagen", imagen);
      validarTexto("descripcion", descripcion);
      if (!/^(?:data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp);base64,[a-z0-9+/=]+|[^\s]+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?)$/i.test(imagen.trim())) {
        throw new TypeError("imagen debe ser una ruta a un archivo de imagen.");
      }

      for (const [nombreCampo, valor] of Object.entries({
        nivel,
        vidaMaxima,
        corduraMaxima,
        poderMaximo,
        ataqueBase,
        resistenciaBase,
        agilidad,
        danioCorduraPorGolpe,
        danioMoralPorGolpe,
      })) {
        validarEnteroNoNegativo(nombreCampo, valor);
      }

      if (nivel < 1 || vidaMaxima < 1 || corduraMaxima < 1 || poderMaximo < 1) {
        throw new RangeError("El nivel y los máximos de vida, cordura y poder deben ser mayores que cero.");
      }
      if (!Number.isFinite(bonificacionCritico)
        || bonificacionCritico < 0
        || bonificacionCritico > 1) {
        throw new RangeError("bonificacionCritico debe estar entre 0 y 1.");
      }
      if (typeof maldito !== "boolean") {
        throw new TypeError("maldito debe ser un valor booleano.");
      }

      const arma = equipo.arma ?? null;
      const armadura = equipo.armadura ?? null;
      if (arma && arma.categoria !== "arma") {
        throw new TypeError("El espacio de arma solo puede contener un arma.");
      }
      if (armadura && armadura.categoria !== "armadura") {
        throw new TypeError("El espacio de armadura solo puede contener una armadura.");
      }

      this.id = id.trim();
      this.nombre = nombre.trim();
      this.tipo = tipo.trim();
      this.imagen = imagen.trim();
      this.nivel = nivel;
      this.vida = { actual: vidaMaxima, maxima: vidaMaxima };
      this.estabilidadMental = { actual: corduraMaxima, maxima: corduraMaxima };
      this.cordura = this.estabilidadMental;
      this.moral = this.estabilidadMental;
      this.poder = { actual: poderMaximo, maximo: poderMaximo };
      this.ataqueBase = ataqueBase;
      this.resistenciaBase = resistenciaBase;
      this.agilidadBase = agilidad;
      this.bonificacionCritico = bonificacionCritico;
      this.maldito = maldito;
      this.danioCorduraPorGolpe = danioCorduraPorGolpe;
      this.danioMoralPorGolpe = danioMoralPorGolpe;
      this.equipo = { arma, armadura };
      this.descripcion = descripcion.trim();
    }

    get eficienciaCombate() {
      return 0.5 + (this.estabilidadMental.actual / this.estabilidadMental.maxima) * 0.5;
    }

    get agilidad() {
      const bonificacion = Object.values(this.equipo).reduce((total, item) => total + (item?.bonificaciones?.agilidad ?? 0), 0);
      return Math.max(0, Math.floor((this.agilidadBase + bonificacion - (this.agilidadReducidaCombate ?? 0)) * this.eficienciaCombate));
    }

    get probabilidadEsquivar() {
      return window.juego.calcularProbabilidadEsquivar(this.agilidad, this.bonificacionCritico, 0.25);
    }

    get probabilidadCritico() {
      return window.juego.calcularProbabilidadCritico(this.agilidad, this.bonificacionCritico);
    }

    get ataque() {
      return this.ataqueBase + (this.equipo.arma?.ataque ?? 0);
    }

    get resistencia() {
      return Math.floor(
        (this.resistenciaBase + (this.equipo.armadura?.bonificaciones?.resistenciaFisica ?? this.equipo.armadura?.proteccion ?? 0)) * this.eficienciaCombate,
      );
    }

    get resistenciaCorduraCombate() {
      const bonificacion = Object.values(this.equipo).reduce((total, item) => total + (item?.bonificaciones?.resistenciaCordura ?? 0), 0);
      return Math.floor((this.resistenciaBase + bonificacion) * this.eficienciaCombate);
    }

    get poderMaximoCombate() {
      const bonificacion = Object.values(this.equipo).reduce((total, item) => total + (item?.bonificaciones?.poder ?? 0), 0);
      return this.poder.maximo + bonificacion;
    }

    get fuerzaCombate() {
      const bonificacion = Object.values(this.equipo).reduce((total, item) => total + (item?.bonificaciones?.fuerza ?? 0), 0);
      return this.ataqueBase + bonificacion;
    }
  }

  window.juego = window.juego ?? {};
  window.juego.Enemigo = Enemigo;
})();
