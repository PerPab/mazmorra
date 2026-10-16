(function definirClaseItem() {
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

  function validarEntero(nombreCampo, valor) {
    if (!Number.isInteger(valor)) {
      throw new TypeError(`${nombreCampo} debe ser un entero.`);
    }
  }

  function validarRutaImagen(valor) {
    validarTexto("imagen", valor);
    if (!/^(?:data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp);base64,[a-z0-9+/=]+|[^\s]+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?)$/i.test(valor.trim())) {
      throw new TypeError("imagen debe ser una ruta a un archivo de imagen.");
    }
  }

  const MAXIMO_ALCANCE = 4;
  function validarBonificaciones(bonificaciones) {
    if (typeof bonificaciones !== "object" || bonificaciones === null || Array.isArray(bonificaciones)) {
      throw new TypeError("bonificaciones debe ser un objeto de atributos.");
    }
    const atributos = [
      "resistenciaFisica", "resistenciaCordura", "resistenciaMagica", "fuerza", "agilidad",
      "poder", "vida", "cordura", "puntosAccion", "danioFisico", "danioMagico", "bonificacionCritico",
    ];
    if (Object.keys(bonificaciones).some((key) => !atributos.includes(key))) {
      throw new TypeError("bonificaciones contiene un atributo de equipo desconocido.");
    }
    atributos.forEach((key) => {
      if (bonificaciones[key] === undefined) return;
      if (key === "bonificacionCritico") {
        if (!Number.isFinite(bonificaciones[key]) || bonificaciones[key] < 0 || bonificaciones[key] > 1) {
          throw new RangeError("bonificaciones.bonificacionCritico debe estar entre 0 y 1.");
        }
      } else {
        validarEntero(`bonificaciones.${key}`, bonificaciones[key]);
      }
    });
  }

  function validarBonificacionesContra(bonificacionesContra) {
    if (typeof bonificacionesContra !== "object" || bonificacionesContra === null || Array.isArray(bonificacionesContra)) {
      throw new TypeError("bonificacionesContra debe ser un objeto.");
    }
    const condiciones = ["blindado", "maldito"];
    if (Object.keys(bonificacionesContra).some((condicion) => !condiciones.includes(condicion))) {
      throw new TypeError("bonificacionesContra solo admite blindado y maldito.");
    }
    Object.entries(bonificacionesContra).forEach(([condicion, valor]) => {
      if (!Number.isFinite(valor) || valor < 0 || valor > 1) {
        throw new RangeError(`bonificacionesContra.${condicion} debe estar entre 0 y 1.`);
      }
    });
  }

  function validarEfectoEstado(nombreCampo, efecto) {
    if (!efecto || typeof efecto !== "object" || Array.isArray(efecto)
      || !["veneno", "quemadura", "paralisis"].includes(efecto.tipo)) {
      throw new TypeError(`${nombreCampo} debe ser veneno, quemadura o paralisis.`);
    }
    validarEnteroNoNegativo(`${nombreCampo}.duracion`, efecto.duracion);
    if (efecto.duracion < 1) throw new RangeError(`${nombreCampo}.duracion debe ser al menos 1.`);
    if (["veneno", "quemadura"].includes(efecto.tipo)) {
      validarEnteroNoNegativo(`${nombreCampo}.danioPorTurno`, efecto.danioPorTurno);
      if (efecto.danioPorTurno < 1) {
        throw new RangeError(`${nombreCampo} debe causar al menos 1 punto de daño por turno.`);
      }
    }
  }

  function validarHechizosRestauracion(hechizos) {
    if (!Array.isArray(hechizos)) throw new TypeError("hechizosRestauracion debe ser una lista.");
    hechizos.forEach((hechizo, indice) => {
      if (!hechizo || typeof hechizo !== "object" || Array.isArray(hechizo)) {
        throw new TypeError(`hechizosRestauracion[${indice}] debe ser un objeto.`);
      }
      validarTexto(`hechizosRestauracion[${indice}].id`, hechizo.id);
      validarTexto(`hechizosRestauracion[${indice}].nombre`, hechizo.nombre);
      if (!["curacion", "cordura", "proteccion"].includes(hechizo.efecto)) {
        throw new TypeError(`hechizosRestauracion[${indice}].efecto no es válido.`);
      }
      if (!["aliado", "grupo"].includes(hechizo.objetivo)) {
        throw new TypeError(`hechizosRestauracion[${indice}].objetivo debe ser aliado o grupo.`);
      }
      validarEnteroNoNegativo(`hechizosRestauracion[${indice}].costePA`, hechizo.costePA);
      validarEnteroNoNegativo(`hechizosRestauracion[${indice}].costePoder`, hechizo.costePoder);
      if (hechizo.costePA < 1) throw new RangeError("Un hechizo restaurativo debe costar al menos 1 PA.");
      if (hechizo.efecto === "curacion") validarEnteroNoNegativo("curacion", hechizo.curacion);
      if (hechizo.efecto === "cordura") validarEnteroNoNegativo("restauracion", hechizo.restauracion);
      if (hechizo.efecto === "proteccion"
        && (!Number.isFinite(hechizo.porcentaje) || hechizo.porcentaje <= 0 || hechizo.porcentaje > 1)) {
        throw new RangeError("La protección mágica debe ser un porcentaje entre 0 y 1.");
      }
    });
  }
  const ATAQUES_ESPECIALES_PREDETERMINADOS = {
    dirigido: {
      nombre: "Ataque dirigido",
      efecto: "danio",
      multiplicadorDanio: 1.5,
      costePoder: 10,
      objetivosMaximos: 1,
    },
    area: {
      nombre: "Ataque de área",
      efecto: "danio",
      multiplicadorDanio: 0.5,
      costePoder: 15,
      objetivosMaximos: 2,
    },
  };
  const ESTADOS_EQUIPO = {
    optimo: { etiqueta: "Óptimo", eficacia: 1 },
    usado: { etiqueta: "Usado", eficacia: 0.7 },
    dañado: { etiqueta: "Dañado", eficacia: 0.5 },
  };

  class Item {
    constructor({
      id,
      categoria,
      tipo,
      subtipo,
      nombre,
      descripcion,
      nivel,
      rango,
      plantillaId = null,
      efectos = [],
      valor,
      pesoBotin = 1,
      clasesPermitidas,
      magico = false,
      imagen,
      icono = "✦",
      ataque,
      alcance,
      costePABasico,
      danioMoral,
      danioPoder = 0,
      danioAgilidad = 0,
      danioElemental = 0,
      elemento = null,
      efectoCritico = null,
      proteccion,
      ataquesEspeciales,
      hechizosRestauracion = [],
      proteccionCordura,
      proteccionMoral,
      bonificacion,
      bonificaciones = {},
      bonificacionesContra = {},
      estado,
      durabilidad,
      esObjetoMision = false,
      revivir = false,
    }) {
      validarTexto("id", id);
      validarTexto("categoria", categoria);
      validarTexto("tipo", tipo);
      validarTexto("nombre", nombre);
      validarTexto("descripcion", descripcion);
      validarTexto("icono", icono);
      validarEnteroNoNegativo("nivel", nivel);
      const rangoCalculado = window.juego?.obtenerRangoEquipo?.(nivel) ?? "basico";
      const rangoFinal = rango ?? rangoCalculado;
      if (!["basico", "medio", "avanzado"].includes(rangoFinal)) {
        throw new RangeError('rango debe ser "basico", "medio" o "avanzado".');
      }
      if (plantillaId !== null && (typeof plantillaId !== "string" || plantillaId.trim() === "")) {
        throw new TypeError("plantillaId debe ser un ID de plantilla o null.");
      }
      if (!Array.isArray(efectos)
        || efectos.some((efecto) => typeof efecto !== "string" || efecto.trim() === "")) {
        throw new TypeError("efectos debe ser una lista de IDs de propiedades.");
      }
      if (valor !== undefined) validarEnteroNoNegativo("valor", valor);
      if (!Number.isFinite(pesoBotin) || pesoBotin <= 0) {
        throw new RangeError("pesoBotin debe ser un número mayor que cero.");
      }

      if (nivel < 1) {
        throw new RangeError("nivel debe ser al menos 1.");
      }

      if (!["arma", "armadura", "especial", "consumible"].includes(categoria)) {
        throw new RangeError('categoria debe ser "arma", "armadura", "especial" o "consumible".');
      }
      if (["arma", "armadura"].includes(categoria)) {
        if (estado !== undefined && !Object.hasOwn(ESTADOS_EQUIPO, estado)) {
          throw new RangeError('estado debe ser "optimo", "usado" o "dañado".');
        }
        if (durabilidad !== undefined
          && (!Number.isInteger(durabilidad) || durabilidad < 50 || durabilidad > 100)) {
          throw new RangeError("durabilidad debe ser un entero entre 50 y 100.");
        }
      } else if (durabilidad !== undefined) {
        throw new TypeError("Solo las armas y armaduras pueden tener durabilidad.");
      } else if (estado !== undefined) {
        throw new TypeError("Solo las armas y armaduras pueden tener estado de conservación.");
      }

      const clases = clasesPermitidas ?? [];
      if (!Array.isArray(clases) || (categoria !== "consumible" && clases.length === 0)) {
        throw new TypeError("clasesPermitidas debe contener al menos una clase para armas y armaduras.");
      }
      clases.forEach((clase) => validarTexto("clase permitida", clase));

      if (typeof magico !== "boolean") {
        throw new TypeError("magico debe ser un valor booleano.");
      }
      if (typeof esObjetoMision !== "boolean") {
        throw new TypeError("esObjetoMision debe ser un valor booleano.");
      }
      if (typeof revivir !== "boolean" || (revivir && categoria !== "consumible")) {
        throw new TypeError("revivir solo puede activarse en un consumible.");
      }
      validarBonificacionesContra(bonificacionesContra);
      if (categoria !== "arma" && Object.keys(bonificacionesContra).length > 0) {
        throw new TypeError("Solo las armas pueden tener bonificaciones contra enemigos.");
      }

      validarRutaImagen(imagen);

      if (categoria === "arma") {
        validarHechizosRestauracion(hechizosRestauracion);
        if (hechizosRestauracion.length > 0 && (!magico || tipo.toLowerCase() !== "libro")) {
          throw new TypeError("Solo un libro mágico puede contener hechizos restaurativos.");
        }
        validarBonificaciones(bonificaciones);
        validarEnteroNoNegativo("ataque", ataque);
        validarEnteroNoNegativo("alcance", alcance);
        validarEnteroNoNegativo("costePABasico", costePABasico ?? 2);
        if ((costePABasico ?? 2) < 1) throw new RangeError("costePABasico debe ser al menos 1.");
        validarEnteroNoNegativo("danioMoral", danioMoral);
        validarEnteroNoNegativo("danioPoder", danioPoder);
        validarEnteroNoNegativo("danioAgilidad", danioAgilidad);
        validarEnteroNoNegativo("danioElemental", danioElemental);
        if ((danioElemental > 0 && (typeof elemento !== "string" || !elemento.trim()))
          || (danioElemental === 0 && elemento !== null && elemento !== undefined)) {
          throw new TypeError("elemento debe acompañar a un daño elemental positivo.");
        }
        if (efectoCritico !== null && efectoCritico !== undefined) {
          validarEfectoEstado("efectoCritico", efectoCritico);
        }
        const perfilesAtaque = ataquesEspeciales ?? ATAQUES_ESPECIALES_PREDETERMINADOS;
        for (const tipoAtaque of ["dirigido", "area"]) {
          const perfil = perfilesAtaque[tipoAtaque];
          if (typeof perfil !== "object" || perfil === null) {
            throw new TypeError(`Falta el perfil de ataque "${tipoAtaque}".`);
          }
          validarTexto(`${tipoAtaque}.nombre`, perfil.nombre);
          const efecto = perfil.efecto ?? "danio";
          if (!["danio", "curacion"].includes(efecto)) {
            throw new TypeError(`${tipoAtaque}.efecto debe ser "danio" o "curacion".`);
          }
          if (efecto === "curacion") {
            validarEnteroNoNegativo(`${tipoAtaque}.curacion`, perfil.curacion);
            if (perfil.curacion < 1 || !magico) {
              throw new RangeError("Los ataques de curación deben ser mágicos y restaurar al menos 1 punto.");
            }
          }
          if (efecto === "danio"
            && !Number.isFinite(perfil.danio)
            && (!Number.isFinite(perfil.multiplicadorDanio) || perfil.multiplicadorDanio <= 0)) {
            throw new RangeError(`${tipoAtaque} debe definir danio o un multiplicador de daño válido.`);
          }
          if (perfil.danio !== undefined) {
            validarEnteroNoNegativo(`${tipoAtaque}.danio`, perfil.danio);
            if (perfil.danio < 1) throw new RangeError(`${tipoAtaque}.danio debe ser al menos 1.`);
          }
          validarEnteroNoNegativo(`${tipoAtaque}.danioPoder`, perfil.danioPoder ?? 0);
          validarEnteroNoNegativo(`${tipoAtaque}.absorcionPoder`, perfil.absorcionPoder ?? 0);
          if (efecto === "curacion" && ((perfil.danioPoder ?? 0) > 0 || (perfil.absorcionPoder ?? 0) > 0)) {
            throw new TypeError(`${tipoAtaque}: una curacion no puede quitar ni absorber poder.`);
          }
          validarEnteroNoNegativo(`${tipoAtaque}.costePoder`, perfil.costePoder);
          validarEnteroNoNegativo(`${tipoAtaque}.costePA`, perfil.costePA ?? (tipoAtaque === "dirigido" ? 3 : 4));
          if ((perfil.costePA ?? (tipoAtaque === "dirigido" ? 3 : 4)) < 1) {
            throw new RangeError(`${tipoAtaque}.costePA debe ser al menos 1.`);
          }
          validarEnteroNoNegativo(`${tipoAtaque}.objetivosMaximos`, perfil.objetivosMaximos);
          const alcancePerfil = perfil.alcance ?? alcance;
          validarEnteroNoNegativo(`${tipoAtaque}.alcance`, alcancePerfil);
          if (alcancePerfil < 1 || alcancePerfil > MAXIMO_ALCANCE) {
            throw new RangeError(`${tipoAtaque}.alcance debe estar entre 1 y ${MAXIMO_ALCANCE}.`);
          }
          if (perfil.efectoEstado !== undefined && perfil.efectoEstado !== null) {
            validarEfectoEstado(`${tipoAtaque}.efectoEstado`, perfil.efectoEstado);
          }
          if (tipoAtaque === "dirigido" && perfil.objetivosMaximos !== 1) {
            throw new RangeError("dirigido.objetivosMaximos debe ser 1.");
          }
          if (tipoAtaque === "area" && (perfil.objetivosMaximos < 1 || perfil.objetivosMaximos > 4)) {
            throw new RangeError("area.objetivosMaximos debe estar entre 1 y 4.");
          }
        }
        if (proteccion !== undefined || proteccionCordura !== undefined || proteccionMoral !== undefined || bonificacion !== undefined) {
          throw new TypeError("Un arma no puede definir protecciones.");
        }
        if (alcance < 1 || alcance > MAXIMO_ALCANCE) {
          throw new RangeError(`alcance debe estar entre 1 y ${MAXIMO_ALCANCE}.`);
        }
      } else if (categoria === "armadura") {
        if (ataquesEspeciales !== undefined) {
          throw new TypeError("Solo un arma puede definir ataques especiales.");
        }
        if (ataque !== undefined
          || alcance !== undefined
          || costePABasico !== undefined
          || danioMoral !== undefined
          || proteccionCordura !== undefined
          || proteccionMoral !== undefined
          || bonificacion !== undefined
          || danioPoder !== 0
          || danioAgilidad !== 0
          || (proteccion !== undefined
            && bonificaciones.resistenciaFisica !== undefined
            && proteccion !== bonificaciones.resistenciaFisica)) {
          throw new TypeError("Una armadura no puede definir ataques, daño ni bonificación de consumible.");
        }
        validarEnteroNoNegativo("proteccion", proteccion ?? bonificaciones.resistenciaFisica ?? 0);
        validarBonificaciones(bonificaciones);
      } else if (categoria === "especial") {
        if (ataquesEspeciales !== undefined || costePABasico !== undefined) {
          throw new TypeError("Solo un arma puede definir ataques especiales.");
        }
        const danioMoralEspecial = danioMoral ?? 0;
        const proteccionCorduraEspecial = proteccionCordura ?? 0;
        const proteccionMoralEspecial = proteccionMoral ?? 0;
        validarEnteroNoNegativo("danioMoral", danioMoralEspecial);
        validarEnteroNoNegativo("proteccionCordura", proteccionCorduraEspecial);
        validarEnteroNoNegativo("proteccionMoral", proteccionMoralEspecial);
        validarBonificaciones(bonificaciones);
        if (ataque !== undefined || alcance !== undefined || bonificacion !== undefined
          || danioPoder !== 0 || danioAgilidad !== 0) {
          throw new TypeError("Un objeto especial no puede definir ataques ni bonificación de consumible.");
        }
        const totalBonificaciones = Object.values(bonificaciones).reduce((total, valor) => total + valor, 0);
        if (!esObjetoMision
          && danioMoralEspecial + proteccionCorduraEspecial + proteccionMoralEspecial + totalBonificaciones === 0) {
          throw new RangeError("Un objeto especial debe aportar daño moral o alguna protección.");
        }
      } else {
        if (ataquesEspeciales !== undefined) {
          throw new TypeError("Solo un arma puede definir ataques especiales.");
        }
        if (ataque !== undefined || alcance !== undefined || costePABasico !== undefined || danioMoral !== undefined
          || danioPoder !== 0 || danioAgilidad !== 0
          || Object.keys(bonificaciones).length > 0) {
          throw new TypeError("Un consumible no puede definir atributos de equipo ni daño.");
        }
        if (bonificacion !== undefined) {
          if (typeof bonificacion !== "object" || bonificacion === null || Array.isArray(bonificacion)) {
            throw new TypeError("bonificacion debe ser un objeto de recursos.");
          }
          const resourceKeys = ["vida", "cordura", "poder"];
          const bonusKeys = Object.keys(bonificacion);
          if (bonusKeys.length === 0 || bonusKeys.some((key) => !resourceKeys.includes(key))) {
            throw new TypeError("La bonificacion debe incluir vida, cordura o poder.");
          }
          bonusKeys.forEach((key) => validarEnteroNoNegativo(`bonificacion.${key}`, bonificacion[key]));
          if (!bonusKeys.some((key) => bonificacion[key] > 0)) {
            throw new RangeError("La bonificacion debe aumentar al menos un recurso.");
          }
        }
        if (bonificacion === undefined) {
          throw new TypeError("Un consumible debe definir una bonificacion.");
        }
      }

      if (categoria !== "consumible" && bonificacion !== undefined) {
        throw new TypeError("Solo los consumibles pueden definir bonificacion.");
      }
      if (typeof bonificaciones !== "object" || bonificaciones === null || Array.isArray(bonificaciones)) {
        throw new TypeError("bonificaciones debe ser un objeto de atributos.");
      }
      const atributosEquipo = [
        "resistenciaFisica", "resistenciaCordura", "resistenciaMagica", "fuerza", "agilidad",
        "poder", "vida", "cordura", "puntosAccion", "danioFisico", "danioMagico", "bonificacionCritico",
      ];
      if (Object.keys(bonificaciones).some((key) => !atributosEquipo.includes(key))) {
        throw new TypeError("bonificaciones contiene un atributo de equipo desconocido.");
      }
      atributosEquipo.forEach((key) => {
        if (bonificaciones[key] !== undefined) {
          if (key === "bonificacionCritico") {
            if (!Number.isFinite(bonificaciones[key]) || bonificaciones[key] < 0 || bonificaciones[key] > 1) {
              throw new RangeError("bonificaciones.bonificacionCritico debe estar entre 0 y 1.");
            }
          } else {
            validarEntero(`bonificaciones.${key}`, bonificaciones[key]);
          }
        }
      });
      if (categoria === "consumible" && Object.keys(bonificaciones).length > 0) {
        throw new TypeError("Solo el equipo puede definir bonificaciones de atributos.");
      }

      this.id = id.trim();
      this.categoria = categoria;
      this.tipo = tipo.trim();
      this.subtipo = subtipo?.trim() || null;
      this.nombre = nombre.trim();
      this.descripcion = descripcion.trim();
      this.nivel = nivel;
      this.rango = rangoFinal;
      this.plantillaId = plantillaId?.trim() ?? null;
      this.efectos = [...new Set(efectos.map((efecto) => efecto.trim()))];
      this.valor = valor ?? Math.max(1, nivel * (categoria === "especial" ? 25 : categoria === "consumible" ? 10 : 20));
      this.pesoBotin = pesoBotin;
      this.clasesPermitidas = clases.map((clase) => clase.trim().toLowerCase());
      this.magico = magico;
      this.esObjetoMision = esObjetoMision;
      this.revivir = revivir;
      this.danioElemental = danioElemental;
      this.elemento = elemento?.trim() ?? null;
      this.efectoCritico = efectoCritico ? { ...efectoCritico } : null;
      this.imagen = imagen.trim();
      this.icono = icono.trim();

      if (categoria === "arma") {
        this.durabilidad = durabilidad ?? Math.round(ESTADOS_EQUIPO[estado ?? "optimo"].eficacia * 100);
        this.estado = this.obtenerEstadoPorDurabilidad();
        this.ataque = ataque;
        this.alcance = alcance;
        this.costePABasico = costePABasico ?? 2;
        this.danioMoral = danioMoral ?? 0;
        this.danioPoder = danioPoder ?? 0;
        this.danioAgilidad = danioAgilidad ?? 0;
        const atributosArma = [
          "resistenciaFisica", "resistenciaCordura", "resistenciaMagica", "fuerza", "agilidad",
          "poder", "vida", "cordura", "puntosAccion", "danioFisico", "danioMagico", "bonificacionCritico",
        ];
        this.bonificaciones = {
          ...Object.fromEntries(atributosArma.map((atributo) => [atributo, 0])),
          ...bonificaciones,
        };
        this.bonificacionesContra = { blindado: 0, maldito: 0, ...bonificacionesContra };
        const perfilesAtaque = ataquesEspeciales ?? ATAQUES_ESPECIALES_PREDETERMINADOS;
        this.ataquesEspeciales = Object.fromEntries(
          ["dirigido", "area"].map((tipoAtaque) => [
            tipoAtaque,
            {
              efecto: "danio",
              ...perfilesAtaque[tipoAtaque],
              alcance: perfilesAtaque[tipoAtaque].alcance ?? alcance,
              costePA: perfilesAtaque[tipoAtaque].costePA ?? (tipoAtaque === "dirigido" ? 3 : 4),
              danioPoder: perfilesAtaque[tipoAtaque].danioPoder ?? 0,
              absorcionPoder: perfilesAtaque[tipoAtaque].absorcionPoder ?? 0,
              efectoEstado: perfilesAtaque[tipoAtaque].efectoEstado
                ? { ...perfilesAtaque[tipoAtaque].efectoEstado }
                : null,
            },
          ]),
        );
        this.hechizosRestauracion = hechizosRestauracion.map((hechizo) => ({ ...hechizo }));
      } else if (categoria === "armadura") {
        this.durabilidad = durabilidad ?? Math.round(ESTADOS_EQUIPO[estado ?? "optimo"].eficacia * 100);
        this.estado = this.obtenerEstadoPorDurabilidad();
        this.proteccion = proteccion ?? bonificaciones.resistenciaFisica ?? 0;
        this.bonificaciones = { ...bonificaciones, resistenciaFisica: this.proteccion };
      } else if (categoria === "especial") {
        this.danioMoral = danioMoral ?? 0;
        this.proteccionCordura = proteccionCordura ?? 0;
        this.proteccionMoral = proteccionMoral ?? 0;
        this.bonificaciones = {
          resistenciaFisica: 0, resistenciaCordura: 0, resistenciaMagica: 0, fuerza: 0,
          agilidad: 0, poder: 0, vida: 0, cordura: 0, puntosAccion: 0,
          danioFisico: 0, danioMagico: 0, bonificacionCritico: 0,
          ...bonificaciones,
        };
      } else {
        this.bonificacion = bonificacion ? { ...bonificacion } : undefined;
      }
    }

    get eficaciaEstado() {
      return (this.durabilidad ?? 100) / 100;
    }

    get etiquetaEstado() {
      return ESTADOS_EQUIPO[this.estado]?.etiqueta ?? "";
    }

    obtenerEstadoPorDurabilidad() {
      if (this.durabilidad >= 100) return "optimo";
      if (this.durabilidad <= 50) return "dañado";
      return "usado";
    }

    deteriorarEstado() {
      if (!["arma", "armadura"].includes(this.categoria)) return null;
      if (this.durabilidad <= 50) return null;
      const anterior = this.estado;
      const eficaciaAnterior = this.eficaciaEstado;
      this.durabilidad = Math.max(50, this.durabilidad - 5);
      this.estado = this.obtenerEstadoPorDurabilidad();
      return {
        anterior,
        actual: this.estado,
        eficaciaAnterior,
        eficacia: this.eficaciaEstado,
      };
    }
  }

  window.juego = window.juego ?? {};
  window.juego.Item = Item;
})();
