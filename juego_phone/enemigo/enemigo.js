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
      rango,
      vidaMaxima,
      corduraMaxima = 100,
      poderMaximo = 100,
      ataqueBase,
      resistenciaBase,
      resistenciaMagica = 0,
      agilidad,
      bonificacionCritico = 0,
      maldito = false,
      danioCorduraPorGolpe = 5,
      danioMoralPorGolpe = 1,
      efectoGolpe = null,
      ataques = [],
      esJefe = false,
      botinGarantizadoId = null,
      botinGarantizadoIds = [],
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
        resistenciaMagica,
        agilidad,
        danioCorduraPorGolpe,
        danioMoralPorGolpe,
      })) {
        validarEnteroNoNegativo(nombreCampo, valor);
      }
      const rangoCalculado = window.juego?.obtenerRangoEquipo?.(nivel) ?? "basico";
      const rangoFinal = rango ?? rangoCalculado;
      if (!["basico", "medio", "avanzado"].includes(rangoFinal)) {
        throw new RangeError('rango debe ser "basico", "medio" o "avanzado".');
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
      if (typeof esJefe !== "boolean") {
        throw new TypeError("esJefe debe ser un valor booleano.");
      }
      if (botinGarantizadoId !== null && typeof botinGarantizadoId !== "string") {
        throw new TypeError("botinGarantizadoId debe ser un ID de objeto o null.");
      }
      if (!Array.isArray(botinGarantizadoIds)
        || botinGarantizadoIds.some((idBotin) => typeof idBotin !== "string" || idBotin.trim() === "")) {
        throw new TypeError("botinGarantizadoIds debe ser una lista de IDs de objetos.");
      }
      if (efectoGolpe !== null && (
        !efectoGolpe
        || !["veneno", "paralisis"].includes(efectoGolpe.tipo)
        || !Number.isFinite(efectoGolpe.probabilidad)
        || efectoGolpe.probabilidad < 0 || efectoGolpe.probabilidad > 1
        || !Number.isInteger(efectoGolpe.duracion) || efectoGolpe.duracion < 1
        || (efectoGolpe.tipo === "veneno"
          && (!Number.isInteger(efectoGolpe.danioPorTurno) || efectoGolpe.danioPorTurno < 1))
        || (efectoGolpe.tipo === "paralisis"
          && efectoGolpe.danioPorTurno !== undefined && efectoGolpe.danioPorTurno !== 0)
        || (efectoGolpe.activacion !== undefined && !["golpe-conectado", "critico"].includes(efectoGolpe.activacion))
      )) {
        throw new TypeError("efectoGolpe debe definir veneno o parálisis con probabilidad y duración válidas.");
      }
      if (!Array.isArray(ataques)) {
        throw new TypeError("ataques debe ser una lista de ataques especiales.");
      }
      ataques.forEach((ataque, index) => {
        validarTexto(`ataques[${index}].nombre`, ataque.nombre);
        validarEnteroNoNegativo(`ataques[${index}].alcance`, ataque.alcance);
        if (ataque.alcance < 1 || ataque.alcance > 4) {
          throw new RangeError(`ataques[${index}].alcance debe estar entre 1 y 4.`);
        }
        if (!Number.isFinite(ataque.multiplicadorDanio) || ataque.multiplicadorDanio <= 0) {
          throw new RangeError(`ataques[${index}].multiplicadorDanio debe ser mayor que cero.`);
        }
        if (ataque.costePoder !== undefined) {
          validarEnteroNoNegativo(`ataques[${index}].costePoder`, ataque.costePoder);
        }
      });

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
      this.rango = rangoFinal;
      this.vida = { actual: vidaMaxima, maxima: vidaMaxima };
      this.estabilidadMental = { actual: corduraMaxima, maxima: corduraMaxima };
      this.cordura = this.estabilidadMental;
      this.moral = this.estabilidadMental;
      this.poder = { actual: poderMaximo, maximo: poderMaximo };
      this.ataqueBase = ataqueBase;
      this.resistenciaBase = resistenciaBase;
      this.resistenciaMagica = resistenciaMagica;
      this.agilidadBase = agilidad;
      this.bonificacionCritico = bonificacionCritico;
      this.maldito = maldito;
      this.danioCorduraPorGolpe = danioCorduraPorGolpe;
      this.danioMoralPorGolpe = danioMoralPorGolpe;
      this.efectoGolpe = efectoGolpe ? { ...efectoGolpe } : null;
      this.ataques = ataques.map((ataque) => ({ ...ataque }));
      this.esJefe = esJefe;
      this.botinGarantizadoId = botinGarantizadoId;
      this.botinGarantizadoIds = [...new Set(botinGarantizadoIds.map((idBotin) => idBotin.trim()))];
      this.equipo = { arma, armadura };
      this.descripcion = descripcion.trim();
    }

    get eficienciaCombate() {
      if (this.esJefe) return 1;
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

    get resistenciaMagicaCombate() {
      const bonificacionArmadura = this.equipo.armadura?.bonificaciones?.resistenciaMagica ?? 0;
      return Math.floor((this.resistenciaMagica + bonificacionArmadura) * this.eficienciaCombate);
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
