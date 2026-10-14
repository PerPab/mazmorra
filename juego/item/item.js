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
    const atributos = ["resistenciaFisica", "resistenciaCordura", "fuerza", "agilidad", "poder"];
    if (Object.keys(bonificaciones).some((key) => !atributos.includes(key))) {
      throw new TypeError("bonificaciones contiene un atributo de equipo desconocido.");
    }
    atributos.forEach((key) => {
      if (bonificaciones[key] !== undefined) validarEntero(`bonificaciones.${key}`, bonificaciones[key]);
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
      nombre,
      descripcion,
      nivel,
      valor,
      clasesPermitidas,
      magico = false,
      imagen,
      icono = "✦",
      ataque,
      alcance,
      danioMoral,
      danioPoder = 0,
      danioAgilidad = 0,
      proteccion,
      ataquesEspeciales,
      proteccionCordura,
      proteccionMoral,
      bonificacion,
      efectoEstado,
      bonificaciones = {},
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
      if (valor !== undefined) validarEnteroNoNegativo("valor", valor);

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
      if (!Array.isArray(clases)
        || (categoria !== "consumible" && clases.length === 0)
        || (categoria === "consumible" && tipo.trim().toLowerCase() === "grimorio" && clases.length === 0)) {
        throw new TypeError("clasesPermitidas debe contener al menos una clase para armas, armaduras y grimorios.");
      }
      clases.forEach((clase) => validarTexto("clase permitida", clase));
      if (categoria === "consumible"
        && tipo.trim().toLowerCase() === "grimorio"
        && clases.some((clase) => !["bruja", "sacerdote"].includes(clase.trim().toLowerCase()))) {
        throw new TypeError("Un grimorio solo puede ser usado por la Bruja o el Sacerdote.");
      }

      if (typeof magico !== "boolean") {
        throw new TypeError("magico debe ser un valor booleano.");
      }
      if (typeof esObjetoMision !== "boolean") {
        throw new TypeError("esObjetoMision debe ser un valor booleano.");
      }
      if (typeof revivir !== "boolean" || (revivir && categoria !== "consumible")) {
        throw new TypeError("revivir solo puede activarse en un consumible.");
      }
      if (tipo.trim().toLowerCase() === "grimorio" && !magico) {
        throw new TypeError("Un grimorio debe ser mágico.");
      }

      validarRutaImagen(imagen);

      if (categoria === "arma") {
        validarBonificaciones(bonificaciones);
        validarEnteroNoNegativo("ataque", ataque);
        validarEnteroNoNegativo("alcance", alcance);
        validarEnteroNoNegativo("danioMoral", danioMoral);
        validarEnteroNoNegativo("danioPoder", danioPoder);
        validarEnteroNoNegativo("danioAgilidad", danioAgilidad);
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
            && (!Number.isFinite(perfil.multiplicadorDanio) || perfil.multiplicadorDanio <= 0)) {
            throw new RangeError(`${tipoAtaque}.multiplicadorDanio debe ser mayor que cero.`);
          }
          validarEnteroNoNegativo(`${tipoAtaque}.costePoder`, perfil.costePoder);
          validarEnteroNoNegativo(`${tipoAtaque}.objetivosMaximos`, perfil.objetivosMaximos);
          if (perfil.efectoEstado !== undefined) {
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
        if (ataquesEspeciales !== undefined) {
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
        if (!esObjetoMision && danioMoralEspecial + proteccionCorduraEspecial + proteccionMoralEspecial === 0) {
          throw new RangeError("Un objeto especial debe aportar daño moral o alguna protección.");
        }
      } else {
        if (ataquesEspeciales !== undefined) {
          throw new TypeError("Solo un arma puede definir ataques especiales.");
        }
        if (ataque !== undefined || alcance !== undefined || danioMoral !== undefined
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
        if (efectoEstado !== undefined) {
          validarEfectoEstado("efectoEstado", efectoEstado);
        }
        if (bonificacion === undefined && efectoEstado === undefined) {
          throw new TypeError("Un consumible debe definir una bonificacion o aplicar un efecto de estado.");
        }
      }

      if (categoria !== "consumible" && bonificacion !== undefined) {
        throw new TypeError("Solo los consumibles pueden definir bonificacion.");
      }
      if (categoria !== "consumible" && efectoEstado !== undefined) {
        throw new TypeError("Solo un consumible puede definir efectoEstado.");
      }
      if (typeof bonificaciones !== "object" || bonificaciones === null || Array.isArray(bonificaciones)) {
        throw new TypeError("bonificaciones debe ser un objeto de atributos.");
      }
      const atributosEquipo = ["resistenciaFisica", "resistenciaCordura", "fuerza", "agilidad", "poder"];
      if (Object.keys(bonificaciones).some((key) => !atributosEquipo.includes(key))) {
        throw new TypeError("bonificaciones contiene un atributo de equipo desconocido.");
      }
      atributosEquipo.forEach((key) => {
        if (bonificaciones[key] !== undefined) {
          validarEntero(`bonificaciones.${key}`, bonificaciones[key]);
        }
      });
      if (categoria === "consumible" && Object.keys(bonificaciones).length > 0) {
        throw new TypeError("Solo el equipo puede definir bonificaciones de atributos.");
      }

      this.id = id.trim();
      this.categoria = categoria;
      this.tipo = tipo.trim();
      this.nombre = nombre.trim();
      this.descripcion = descripcion.trim();
      this.nivel = nivel;
      this.valor = valor ?? Math.max(1, nivel * (categoria === "especial" ? 25 : categoria === "consumible" ? 10 : 20));
      this.clasesPermitidas = clases.map((clase) => clase.trim().toLowerCase());
      this.magico = magico;
      this.esObjetoMision = esObjetoMision;
      this.revivir = revivir;
      this.efectoEstado = efectoEstado ? { ...efectoEstado } : undefined;
      this.imagen = imagen.trim();
      this.icono = icono.trim();

      if (categoria === "arma") {
        this.durabilidad = durabilidad ?? Math.round(ESTADOS_EQUIPO[estado ?? "optimo"].eficacia * 100);
        this.estado = this.obtenerEstadoPorDurabilidad();
        this.ataque = ataque;
        this.alcance = alcance;
        this.danioMoral = danioMoral;
        this.danioPoder = danioPoder;
        this.danioAgilidad = danioAgilidad;
        this.bonificaciones = { ...bonificaciones };
        const perfilesAtaque = ataquesEspeciales ?? ATAQUES_ESPECIALES_PREDETERMINADOS;
        this.ataquesEspeciales = Object.fromEntries(
          ["dirigido", "area"].map((tipoAtaque) => [
            tipoAtaque,
            { efecto: "danio", ...perfilesAtaque[tipoAtaque] },
          ]),
        );
      } else if (categoria === "armadura") {
        this.durabilidad = durabilidad ?? Math.round(ESTADOS_EQUIPO[estado ?? "optimo"].eficacia * 100);
        this.estado = this.obtenerEstadoPorDurabilidad();
        this.proteccion = proteccion ?? bonificaciones.resistenciaFisica ?? 0;
        this.bonificaciones = { ...bonificaciones, resistenciaFisica: this.proteccion };
      } else if (categoria === "especial") {
        this.danioMoral = danioMoral ?? 0;
        this.proteccionCordura = proteccionCordura ?? 0;
        this.proteccionMoral = proteccionMoral ?? 0;
        this.bonificaciones = { ...bonificaciones };
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
