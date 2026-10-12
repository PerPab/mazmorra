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

  class Item {
    constructor({
      id,
      categoria,
      tipo,
      nombre,
      descripcion,
      nivel,
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
      bonificaciones = {},
    }) {
      validarTexto("id", id);
      validarTexto("categoria", categoria);
      validarTexto("tipo", tipo);
      validarTexto("nombre", nombre);
      validarTexto("descripcion", descripcion);
      validarTexto("icono", icono);
      validarEnteroNoNegativo("nivel", nivel);

      if (nivel < 1) {
        throw new RangeError("nivel debe ser al menos 1.");
      }

      if (!["arma", "armadura", "especial", "consumible"].includes(categoria)) {
        throw new RangeError('categoria debe ser "arma", "armadura", "especial" o "consumible".');
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
          || (proteccion !== undefined && bonificaciones.resistenciaFisica !== undefined)) {
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
        if (danioMoralEspecial + proteccionCorduraEspecial + proteccionMoralEspecial === 0) {
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
        if (typeof bonificacion !== "object" || bonificacion === null || Array.isArray(bonificacion)) {
          throw new TypeError("Un consumible debe definir una bonificacion de recursos.");
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

      if (categoria !== "consumible" && bonificacion !== undefined) {
        throw new TypeError("Solo los consumibles pueden definir bonificacion.");
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
      this.clasesPermitidas = clases.map((clase) => clase.trim().toLowerCase());
      this.magico = magico;
      this.imagen = imagen.trim();
      this.icono = icono.trim();

      if (categoria === "arma") {
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
        this.proteccion = proteccion ?? bonificaciones.resistenciaFisica ?? 0;
        this.bonificaciones = { ...bonificaciones, resistenciaFisica: this.proteccion };
      } else if (categoria === "especial") {
        this.danioMoral = danioMoral ?? 0;
        this.proteccionCordura = proteccionCordura ?? 0;
        this.proteccionMoral = proteccionMoral ?? 0;
        this.bonificaciones = { ...bonificaciones };
      } else {
        this.bonificacion = { ...bonificacion };
      }
    }
  }

  window.juego = window.juego ?? {};
  window.juego.Item = Item;
})();
