(function inicializarMazmorra() {
  const juego = window.juego;
  const gameView = document.querySelector("#game-view");
  const mapDisplay = document.querySelector(".map-display");
  const fatigueDisplay = document.querySelector(".inventory-fatigue");
  const explorationScene = document.querySelector(".exploration-scene");
  const explorationSceneImage = explorationScene?.querySelector(".exploration-scene-image");
  const movementButtons = [...document.querySelectorAll(".direction-button[data-direction]")];
  const poiDialog = document.querySelector(".poi-dialog");
  const levelTransitionDialog = document.querySelector(".level-transition-dialog");
  const levelTransitionClose = levelTransitionDialog?.querySelector(".level-transition-close");
  const poiImage = poiDialog?.querySelector(".poi-image");
  const poiTitle = poiDialog?.querySelector(".poi-title");
  const poiDescription = poiDialog?.querySelector(".poi-description");
  const poiAction = poiDialog?.querySelector(".poi-action");
  const poiStorage = poiDialog?.querySelector(".poi-storage");
  const poiClose = poiDialog?.querySelector(".poi-close");
  const poiActions = poiDialog?.querySelector(".poi-dialog-actions");
  if (!juego || !(mapDisplay instanceof HTMLElement) || !(explorationScene instanceof HTMLElement)
    || !(explorationSceneImage instanceof HTMLImageElement) || movementButtons.length !== 4
    || !(poiDialog instanceof HTMLDialogElement)
    || !(poiImage instanceof HTMLImageElement) || !(poiTitle instanceof HTMLElement)
    || !(poiDescription instanceof HTMLElement) || !(poiAction instanceof HTMLButtonElement)
    || !(poiStorage instanceof HTMLButtonElement) || !(poiClose instanceof HTMLButtonElement)
    || !(levelTransitionDialog instanceof HTMLDialogElement)
    || !(levelTransitionClose instanceof HTMLButtonElement)) return;

  const FILAS_VISIBLES = 7;
  const COLUMNAS_VISIBLES = 7;
  const RADIO_DESCUBRIMIENTO = 2;
  const DURACION_ANIMACION_MOVIMIENTO = 180;
  let mapaActivo = null;
  let tamanoMapaActual = 15;
  let cantidadEncuentrosActual = 3;
  let layout = [];
  let salasMapa = [];
  let mapaGenerado = null;
  let nivelMapa = 1;
  let configuracionNivel = {};
  const directions = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };
  const ordenDirecciones = ["up", "right", "down", "left"];
  let entrance = { row: 1, column: 1 };
  let exit = { row: 13, column: 13 };
  let position = { ...entrance };
  let discovered = new Set();
  let pointsOfInterest = new Map();
  let encounterRoom = null;
  let poiActivo = null;
  let transicionNivelPendiente = false;
  let cansancioEnZonaPeligro = false;
  let pasosDesdeRacion = 0;
  let fatigaExploracion = 0;
  const PASOS_POR_RACION = 5;
  const MAX_FATIGA_EXPLORACION = 6;
  let exploracionAutomaticaActiva = false;
  let movimientoEscenaEnCurso = false;
  let temporizadorExploracion = null;
  const PASO_AUTOMATICO_MS = 850;

  function keyOf(row, column) {
    return `${row},${column}`;
  }

  function esTransitable(row, column) {
    return layout[row]?.[column] === ".";
  }

  function hayGuardianBloqueandoPuerta() {
    return [...pointsOfInterest.values()].some((poi) => poi.guardianPuerta && !poi.resuelto);
  }

  function puedeMoverA(row, column) {
    if (!esTransitable(row, column)) return false;
    return !(row === exit.row && column === exit.column && hayGuardianBloqueandoPuerta());
  }

  function crearLayout(tamanoSolicitado) {
    if (window.GeneradorMazmorra && mapaActivo?.generacionProcedural !== false) {
      mapaGenerado = window.GeneradorMazmorra.generar({
        ancho: tamanoSolicitado,
        alto: mapaActivo.alto ?? tamanoSolicitado,
        minHabitaciones: juego.modoPartida === "escaramuza"
          ? Math.min(10, 2 + Math.floor((Math.max(1, Number(juego.rondaEscaramuza) || 1) - 1) / 2))
          : mapaActivo.minHabitaciones ?? 6,
        maxHabitaciones: juego.modoPartida === "escaramuza"
          ? Math.min(10, 2 + Math.floor((Math.max(1, Number(juego.rondaEscaramuza) || 1) - 1) / 2))
          : mapaActivo.maxHabitaciones ?? 10,
        semilla: mapaActivo.semillaProcedural,
      });
      juego.mapaGeneradoActual = mapaGenerado;
      salasMapa = mapaGenerado.habitaciones.map((habitacion) => ({
        ...(mapaActivo.cuartoPrueba ?? {}),
        ...habitacion,
        ancho: habitacion.ancho,
        alto: habitacion.alto,
      }));
      entrance = { row: mapaGenerado.entrada.fila, column: mapaGenerado.entrada.columna };
      exit = { row: mapaGenerado.salida.fila, column: mapaGenerado.salida.columna };
      return mapaGenerado.celdas.map((fila) => fila.map((celda) => (
        celda.tipo === "rock" ? "#" : "."
      )).join(""));
    }
    const tamanoLimitado = Math.max(9, Math.min(61, Math.floor(Number(tamanoSolicitado) || 15)));
    const tamano = tamanoLimitado % 2 === 0 ? tamanoLimitado + 1 : tamanoLimitado;
    const celdas = Array.from({ length: tamano }, (_, row) => (
      Array.from({ length: tamano }, (_, column) => {
        if (row === 0 || column === 0 || row === tamano - 1 || column === tamano - 1) return "#";
        if (row % 2 === 1 || (column - 1) % 4 === 0) return ".";
        return "#";
      }).join("")
    )).map((fila) => [...fila]);
    salasMapa = [];
    const plantilla = mapaActivo?.cuartoPrueba;
    if (plantilla && tamano >= 13) {
      const ancho = Math.max(2, Math.floor(Number(plantilla.ancho) || 4));
      const alto = Math.max(2, Math.floor(Number(plantilla.alto) || 4));
      let top = Math.floor((tamano - alto) / 2);
      if (top % 2 === 0) top += 1;
      const left = Math.floor((tamano - ancho) / 2);
      if (top + alto < tamano - 1 && left + ancho < tamano - 1) {
        for (let row = top - 1; row <= top + alto; row += 1) {
          for (let column = left - 1; column <= left + ancho; column += 1) {
            celdas[row][column] = row >= top && row < top + alto
              && column >= left && column < left + ancho ? "." : "#";
          }
        }
        const puerta = { row: top - 1, column: left + Math.floor(ancho / 2) };
        celdas[puerta.row][puerta.column] = ".";
        salasMapa.push({ ...plantilla, top, left, ancho, alto, puerta });
      }
    }
    return celdas.map((fila) => fila.join(""));
  }

  function configurarMapa() {
    mapaGenerado = null;
    const mapas = juego.mapasBase ?? [];
    const modoActual = juego.modoPartida === "historia" ? "historia" : "escaramuza";
    const mapaActual = mapas.find((mapa) => mapa.id === juego.mapaActivoId);
    const esCompatible = (mapa) => !mapa.modo || mapa.modo === "ambos" || mapa.modo === modoActual;
    const mapaHistoriaInicial = modoActual === "historia"
      ? mapas.find((mapa) => mapa.modo === "historia" && mapa.usarAlIniciar)
        ?? mapas.find((mapa) => mapa.modo === "historia")
      : null;
    mapaActivo = (modoActual === "historia" && mapaHistoriaInicial
      ? (juego.nivelMazmorraActual !== null && juego.nivelMazmorraActual !== undefined
        && mapaActual?.modo === "historia"
        ? mapaActual
        : mapaHistoriaInicial)
      : (mapaActual && esCompatible(mapaActual) ? mapaActual : mapas.find(esCompatible))) ?? {
      id: "mapa_demo",
      nivel: 1,
      tamano: 15,
      cantidadEnemigos: 3,
      nivelEnemigos: 1,
      cantidadPOI: 1,
      mensajes: {},
    };
    juego.mapaActivoId = mapaActivo.id;
    nivelMapa = Math.max(1, Number(juego.nivelMazmorraActual) || Number(mapaActivo.nivel) || 1);
    const gameTitle = document.querySelector(".game-topbar-title");
    if (gameTitle instanceof HTMLElement) gameTitle.textContent = `Nivel ${nivelMapa}`;
    configuracionNivel = juego.configuracionPorMapa?.[mapaActivo.id]
      ?? juego.puntosInteresPorNivel?.[nivelMapa]
      ?? juego.puntosInteresPorNivel?.[1]
      ?? {};
    const layoutDefinido = juego.modoPartida === "historia" && Array.isArray(mapaActivo.layout)
      ? mapaActivo.layout.map((fila) => Array.isArray(fila) ? fila.join("") : String(fila))
      : null;
    const layoutManualValido = layoutDefinido?.length > 2
      && layoutDefinido.every((fila) => fila.length === layoutDefinido[0].length && /^[.#]+$/.test(fila));
    if (layoutManualValido) {
      layout = layoutDefinido;
      salasMapa = Array.isArray(mapaActivo.cuartos) ? mapaActivo.cuartos : [];
    } else {
      layout = crearLayout(mapaActivo.tamano ?? mapaActivo.tamaño ?? 15);
    }
    const entradaDefinida = mapaActivo.entrada ?? {};
    entrance = mapaGenerado ? { row: mapaGenerado.entrada.fila, column: mapaGenerado.entrada.columna } : {
      row: Number(entradaDefinida.row ?? entradaDefinida.fila ?? 1),
      column: Number(entradaDefinida.column ?? entradaDefinida.columna ?? 1),
    };
    const salidaDefinida = mapaActivo.salida ?? {};
    exit = mapaGenerado ? { row: mapaGenerado.salida.fila, column: mapaGenerado.salida.columna } : {
      row: Number(salidaDefinida.row ?? salidaDefinida.fila ?? layout.length - 2),
      column: Number(salidaDefinida.column ?? salidaDefinida.columna ?? layout[0].length - 2),
    };
    if (!esTransitable(entrance.row, entrance.column)) entrance = { row: 1, column: 1 };
    if (!esTransitable(exit.row, exit.column)) {
      exit = { row: layout.length - 2, column: layout[0].length - 2 };
    }
    if (juego.modoPartida === "escaramuza") {
      const ronda = Math.max(1, Math.floor(Number(juego.rondaEscaramuza) || 1));
      const encuentrosExtra = Math.max(0, Math.floor(Number(juego.encuentrosExtraEscaramuza) || 0));
      const tamanoBaseEscaramuza = Number(juego.tamanoBaseEscaramuza) || 15;
      tamanoMapaActual = Math.min(61, tamanoBaseEscaramuza + ((ronda - 1) * 2));
      layout = crearLayout(tamanoMapaActual);
      cantidadEncuentrosActual = (Number(juego.gruposBaseEscaramuza) || 2) + encuentrosExtra;
      if (!mapaGenerado) {
        entrance = { row: 1, column: 1 };
        exit = { row: layout.length - 2, column: layout[0].length - 2 };
      }
    } else {
      tamanoMapaActual = layout.length;
      cantidadEncuentrosActual = mapaActivo.cantidadEnemigos ?? configuracionNivel.gruposEnemigos ?? 3;
    }
  }

  function registrarAcontecimiento(mensaje) {
    juego.mostrarAviso?.(mensaje);
  }

  function actualizarIndicadorFatiga() {
    if (fatigueDisplay) fatigueDisplay.textContent = `Fatiga: ${fatigaExploracion}/${MAX_FATIGA_EXPLORACION}`;
  }

  function mostrarEscenaExploracion(imagen, alt = "") {
    if (typeof imagen !== "string" || !imagen.trim()) {
      explorationScene.hidden = true;
      explorationSceneImage.removeAttribute("src");
      explorationSceneImage.alt = "";
      return;
    }
    explorationSceneImage.src = imagen;
    explorationSceneImage.alt = alt || "Escena de exploración";
    explorationScene.hidden = false;
  }

  function esperarAnimacionMovimiento() {
    return new Promise((resolve) => window.setTimeout(resolve, DURACION_ANIMACION_MOVIMIENTO));
  }

  function elegirAleatorio(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function perteneceASala(sala, row, column) {
    return row >= sala.top && row < sala.top + sala.alto
      && column >= sala.left && column < sala.left + sala.ancho;
  }

  function obtenerEscenaSala(posicionAnterior, direccion) {
    const sala = salasMapa.find((entrada) => perteneceASala(entrada, position.row, position.column)
      || (position.row === entrada.puerta?.row && position.column === entrada.puerta?.column));
    if (!sala) return null;
    if (position.row === sala.puerta?.row && position.column === sala.puerta?.column) {
      const sale = perteneceASala(sala, posicionAnterior.row, posicionAnterior.column);
      return {
        imagen: sale ? sala.imagenSalida : sala.imagenEntrada,
        alt: sale ? "Salida de la sala" : "Entrada a una sala de la mazmorra",
        texto: sale ? "El grupo sale de la cámara y vuelve a la galería."
          : "El corredor se abre a una pequeña cámara excavada en la roca.",
      };
    }
    const filaSala = position.row - sala.top;
    const columnaSala = position.column - sala.left;
    const claveCelda = `${filaSala},${columnaSala}`;
    const imagenCelda = sala.imagenesCeldas?.[claveCelda];
    if (imagenCelda) {
      const esIzquierda = imagenCelda === sala.imagenAnguloIzquierdo;
      return {
        imagen: imagenCelda,
        alt: esIzquierda ? "Esquina izquierda de la sala" : "Esquina derecha de la sala",
        texto: esIzquierda ? "La pared forma un ángulo a la izquierda." : "La pared forma un ángulo a la derecha.",
      };
    }
    return { imagen: sala.imagenFondo, alt: "Interior de una sala pequeña", texto: "El grupo avanza por una pequeña cámara de piedra." };
  }

  function obtenerEscenaFormaPasillo(posicionAnterior, direccionMapa, cantidadSalidas) {
    if (cantidadSalidas !== 2) return null;

    const continuaciones = Object.entries(directions).filter(([direccion, [dr, dc]]) => {
      const row = position.row + dr;
      const column = position.column + dc;
      return !(row === posicionAnterior.row && column === posicionAnterior.column)
        && puedeMoverA(row, column);
    });
    if (continuaciones.length !== 1) return null;

    const indiceEntrada = ordenDirecciones.indexOf(direccionMapa);
    const indiceSalida = ordenDirecciones.indexOf(continuaciones[0][0]);
    const giro = (indiceSalida - indiceEntrada + 4) % 4;
    if (giro !== 1 && giro !== 3) return null;
    const derecha = giro === 1;
    return {
      imagen: `recursos/imagen/mapa/curva_${derecha ? "derecha" : "izquierda"}.webp`,
      alt: `El pasillo gira a la ${derecha ? "derecha" : "izquierda"}`,
      texto: `El pasillo gira a la ${derecha ? "derecha" : "izquierda"}.`,
    };
  }

  function elegirEnemigoEscaramuza(pool, nivelAmenaza) {
    const disponibles = pool.filter((enemigo) => enemigo.nivel <= nivelAmenaza);
    return elegirAleatorio(disponibles.length > 0 ? disponibles : pool);
  }

  function obtenerFatigaGrupo() {
    const sacerdote = juego.personajes.find((personaje) =>
      personaje.id === "sacerdote-condenado" && personaje.vida.actual > 0,
    );
    return { proteccion: sacerdote?.proteccionEmboscada ?? 0 };
  }

  function comprobarEmboscadaPorCansancio() {
    const { proteccion } = obtenerFatigaGrupo();
    if (fatigaExploracion === 0) {
      cansancioEnZonaPeligro = false;
      return false;
    }
    if (!cansancioEnZonaPeligro) {
      registrarAcontecimiento("Como el grupo está cansado, las posibilidades de sufrir una emboscada aumentan.");
      cansancioEnZonaPeligro = true;
    }

    const probabilidadBase = Math.min(0.15, fatigaExploracion * 0.05);
    const probabilidadFinal = Math.max(0, probabilidadBase - proteccion);
    if (Math.random() >= probabilidadFinal) return false;

    registrarAcontecimiento("¡Una emboscada! Enemigos aparecen por la espalda y bloquean el camino.");
    if (juego.combate?.puedeExplorar === false || (juego.poolEncuentros ?? []).length === 0) {
      registrarAcontecimiento("El grupo no puede iniciar el encuentro en este momento.");
      return false;
    }
    mostrarPOI({
      tipo: "emboscada",
      titulo: "¡Emboscada!",
      texto: "El grupo, agotado, es sorprendido por la espalda. ¡Los enemigos atacan primero!",
      imagen: "recursos/imagen/especiales/emboscada.webp",
      alt: "Enemigos sorprenden al grupo por la espalda",
      accion: "Enfrentar emboscada",
    });
    return true;
  }

  function crearInstanciaBotin(item) {
    return juego.combate?.crearInstanciaBotin(item) ?? item;
  }

  function limpiarPOI() {
    poiActivo = null;
    poiImage.removeAttribute("src");
    poiImage.alt = "";
    poiImage.hidden = true;
    poiAction.hidden = true;
    poiAction.textContent = "";
    poiAction.disabled = false;
    poiStorage.hidden = true;
    poiClose.textContent = "Cerrar";
    poiActions?.classList.remove("is-vendor");
    actualizarControles();
  }

  function cerrarPOI() {
    if (poiDialog.open) poiDialog.close();
    else limpiarPOI();
  }

  async function resolverTrampa(poi) {
    if (!poi || poi.resuelto || poi.resolviendo) return;
    poi.resolviendo = true;
    poiAction.disabled = true;
    const vivos = (juego.personajes ?? []).filter((personaje) => personaje.vida.actual > 0);
    const especialista = [...vivos].sort((a, b) => (b.agilidadEfectiva ?? b.agilidad ?? 0)
      - (a.agilidadEfectiva ?? a.agilidad ?? 0))[0];
    const agilidad = especialista?.agilidadEfectiva ?? especialista?.agilidad ?? 0;
    const probabilidad = Math.max(0.1, Math.min(0.85,
      Number(poi.probabilidadDesactivacion ?? 0.35) + Math.max(0, agilidad) * 0.025));
    if (especialista && Math.random() < probabilidad) {
      poi.resuelto = true;
      registrarAcontecimiento(`${especialista.nombre} desactiva la trampa antes de que se active.`);
      encounterRoom = null;
      cerrarPOI();
      dibujarMapa();
      return;
    }
    registrarAcontecimiento(especialista
      ? `${especialista.nombre} no logra desactivar la trampa.`
      : "No queda nadie en condiciones de desactivar la trampa.");

    // La trampa es de un solo uso: al activarse queda inerte aunque no se haya desactivado.
    poi.resuelto = true;
    registrarAcontecimiento("El mecanismo se activa y alcanza al grupo.");
    try {
      for (const personaje of vivos) {
        await juego.combate?.recibirDanioExploracion?.(personaje, Number(poi.danio ?? 30), "la trampa");
      }
    } finally {
      poi.resolviendo = false;
      encounterRoom = null;
      cerrarPOI();
      dibujarMapa();
    }
  }

  function mostrarPOI(poi) {
    poiActivo = poi;
    const imagenPOI = poi.imagenModal ?? poi.imagen;
    if (imagenPOI) poiImage.src = imagenPOI;
    else poiImage.removeAttribute("src");
    poiImage.alt = poi.altModal ?? poi.alt ?? poi.titulo;
    poiImage.hidden = !imagenPOI;
    poiTitle.textContent = poi.titulo;
    poiDescription.textContent = poi.texto;
    poiAction.disabled = false;
    poiAction.hidden = poi.tipo === "enemigo" && !poi.guardianPuerta;
    poiStorage.hidden = poi.tipo !== "vendedor";
    poiAction.textContent = poi.accion ?? "Continuar";
    poiClose.textContent = poi.tipo === "vendedor" ? "Marcharse"
      : poi.guardianPuerta ? "No, seguir explorando" : "Cerrar";
    poiActions?.classList.toggle("is-vendor", poi.tipo === "vendedor");
    if (poi.tipo === "tesoro" && poi.objetoRequeridoId) {
      const tieneLlaveCofre = window.inventarioGrupo?.items?.some((item) => item?.id === poi.objetoRequeridoId);
      poiDescription.textContent = tieneLlaveCofre
        ? "El cofre está cerrado. La llave que llevas parece encajar en la cerradura."
        : "El cofre está cerrado con llave. Necesitas encontrar una llave para abrirlo.";
      poiAction.textContent = tieneLlaveCofre ? "Usar llave y abrir" : "Abrir cofre";
    }
    if (poi.tipo === "vendedor") poiAction.textContent = "Comerciar";
    if (poi.tipo === "trampa") {
      poiAction.hidden = false;
      poiAction.textContent = "Intentar desactivarla";
      poiAction.disabled = Boolean(poi.resolviendo);
      poiClose.hidden = true;
    }
    if (poi.tipo === "salida") {
      const tieneLlave = window.inventarioGrupo?.items?.some((item) => item?.id === "llave-salida");
      poiDescription.textContent = !poi.requiereLlave
        ? "La puerta está libre. Puedes continuar al siguiente mapa."
        : tieneLlave
          ? "La llave encaja en la cerradura. Puedes abrir la puerta y avanzar al siguiente nivel."
          : poi.texto;
      poiAction.textContent = !poi.requiereLlave
        ? "Continuar"
        : tieneLlave ? "Usar llave y salir" : (poi.accion ?? "Seguir explorando");
    }
    // En un encuentro con enemigos hay que decidir (Comenzar/Huir controla
    // combate.js), así que el modal no ofrece "Cerrar" ni se descarta al fondo.
    poiClose.hidden = (poi.tipo === "enemigo" && !poi.guardianPuerta)
      || poi.tipo === "emboscada" || poi.tipo === "trampa";
    if (poi.sonido) juego.sonidos?.reproducirRuta(poi.sonido, 0.6);
    if (!poiDialog.open) poiDialog.showModal();
    actualizarControles();
  }

  function descubrirCercanias() {
    for (let row = position.row - RADIO_DESCUBRIMIENTO; row <= position.row + RADIO_DESCUBRIMIENTO; row += 1) {
      for (let column = position.column - RADIO_DESCUBRIMIENTO; column <= position.column + RADIO_DESCUBRIMIENTO; column += 1) {
        if (layout[row]?.[column]) discovered.add(keyOf(row, column));
      }
    }
  }

  function generarEncuentros() {
    pointsOfInterest = new Map();
    const ubicaciones = [];
    for (let row = 0; row < layout.length; row += 1) {
      for (let column = 0; column < layout[row].length; column += 1) {
        if (!esTransitable(row, column)
          || keyOf(row, column) === keyOf(entrance.row, entrance.column)
          || keyOf(row, column) === keyOf(exit.row, exit.column)) continue;
        ubicaciones.push({ row, column });
      }
    }
    const esEscaramuza = juego.modoPartida === "escaramuza";
    const esHistoria = juego.modoPartida === "historia";
    const poisFijosHistoria = esHistoria && Array.isArray(mapaActivo.poisFijos)
      ? mapaActivo.poisFijos
      : [];
    poisFijosHistoria.forEach((poi) => {
      const row = Number(poi.row ?? poi.fila);
      const column = Number(poi.column ?? poi.columna);
      if ((row === entrance.row && column === entrance.column)
        || (row === exit.row && column === exit.column)) return;
      const indice = ubicaciones.findIndex((lugar) => lugar.row === row && lugar.column === column);
      if (indice >= 0) ubicaciones.splice(indice, 1);
    });
    const guardianRow = exit.row;
    const guardianColumn = exit.column - 1;
    const guardianKey = keyOf(guardianRow, guardianColumn);
    const rondaEscaramuza = Math.max(1, Math.floor(Number(juego.rondaEscaramuza) || 1));
    const guardianProgramado = !esEscaramuza || rondaEscaramuza % 2 === 0;
    const jefesDisponibles = (juego.poolEncuentros ?? []).filter((enemigo) => enemigo.esJefe);
    const bossEscaramuza = esEscaramuza && jefesDisponibles.length > 0
      ? jefesDisponibles[Math.floor((rondaEscaramuza / 2 - 1) % jefesDisponibles.length)]
      : null;
    const bossIdConfigurado = esEscaramuza
      ? bossEscaramuza?.id
      : esHistoria && mapaActivo.modo === "historia" ? mapaActivo.bossId : null;
    const bossIdActivo = guardianProgramado ? bossIdConfigurado : null;
    if (bossIdActivo
      && (juego.poolEncuentros ?? []).some((enemigo) => enemigo.id === bossIdActivo)) {
      const guardianIndex = ubicaciones.findIndex((lugar) => keyOf(lugar.row, lugar.column) === guardianKey);
      if (guardianIndex >= 0) ubicaciones.splice(guardianIndex, 1);
    }
    function tomarUbicacion(preferencia = null) {
      if (ubicaciones.length === 0) return null;
      const candidatas = preferencia ? ubicaciones.filter(preferencia) : [];
      const poolUbicaciones = candidatas.length > 0 ? candidatas : ubicaciones;
      const elegida = poolUbicaciones[Math.floor(Math.random() * poolUbicaciones.length)];
      const indice = ubicaciones.findIndex((lugar) => lugar.row === elegida.row && lugar.column === elegida.column);
      return ubicaciones.splice(indice, 1)[0];
    }
    function estaDentroDeSala(lugar) {
      return salasMapa.some((sala) => perteneceASala(sala, lugar.row, lugar.column));
    }
    function esCruceOPuertaDeSala(lugar) {
      const esPuertaSala = salasMapa.some((sala) => (
        sala.puerta?.row === lugar.row && sala.puerta?.column === lugar.column
      ));
      if (esPuertaSala) return true;
      if (estaDentroDeSala(lugar)) return false;
      const vecinosAbiertos = Object.values(directions).filter(([dr, dc]) => (
        esTransitable(lugar.row + dr, lugar.column + dc)
      )).length;
      return vecinosAbiertos >= 3;
    }

    function obtenerEnemigoAlFrente(enemigos) {
      const posicionDe = (enemigo) => {
        const proteccion = (enemigo.resistenciaBase ?? 0)
          + (enemigo.equipo?.armadura?.bonificaciones?.resistenciaFisica ?? 0);
        const arma = enemigo.equipo?.arma;
        const alcance = Math.max(
          1,
          arma?.alcance ?? 1,
          ...(arma?.ataquesEspeciales
            ? Object.values(arma.ataquesEspeciales).map((ataque) => ataque?.alcance ?? arma.alcance ?? 1)
            : []),
          ...(enemigo.ataques ?? []).map((ataque) => ataque.alcance ?? 1),
        );
        const armaduraPesada = enemigo.equipo?.armadura?.tipo === "pesada";
        const armaMagica = Boolean(arma?.magico);
        if ((armaduraPesada || proteccion >= 3) && alcance <= 2) return 1;
        if (alcance >= 3 || (armaMagica && proteccion < 3)) return 3;
        return 2;
      };
      return enemigos.find((enemigo) => posicionDe(enemigo) === 1)
        ?? [...enemigos].sort((a, b) => {
          const proteccionA = (a.resistenciaBase ?? 0)
            + (a.equipo?.armadura?.bonificaciones?.resistenciaFisica ?? 0);
          const proteccionB = (b.resistenciaBase ?? 0)
            + (b.equipo?.armadura?.bonificaciones?.resistenciaFisica ?? 0);
          return proteccionB - proteccionA || posicionDe(a) - posicionDe(b);
        })[0];
    }

    const poolCompleto = juego.poolEncuentros ?? [];
    const boss = bossIdActivo
      ? poolCompleto.find((enemigo) => enemigo.id === bossIdActivo)
      : null;
    if (boss) boss.esJefe = true;
    const nivelAmenazaEscaramuza = juego.obtenerNivelAmenazaEscaramuza?.(rondaEscaramuza) ?? rondaEscaramuza;
    const nivelMaximoEnemigo = esEscaramuza
      ? nivelAmenazaEscaramuza
      : mapaActivo.nivelEnemigos ?? configuracionNivel.nivelMaximoEnemigo ?? nivelMapa;
    const idsEnemigosTema = !esEscaramuza && Array.isArray(mapaActivo.enemigosIds)
      ? new Set(mapaActivo.enemigosIds)
      : null;
    const pool = poolCompleto.filter((enemigo) => !enemigo.esJefe && enemigo.id !== bossIdActivo
      && enemigo.nivel <= nivelMaximoEnemigo
      && (!idsEnemigosTema || idsEnemigosTema.has(enemigo.id)));
    const enemigosDisponibles = pool.length > 0
      ? pool
      : poolCompleto.filter((enemigo) => !enemigo.esJefe && enemigo.id !== bossIdActivo
        && enemigo.nivel <= nivelMaximoEnemigo
        && (!idsEnemigosTema || idsEnemigosTema.has(enemigo.id)));
    if (enemigosDisponibles.length > 0) {
      const cantidadGrupos = Math.min(
        cantidadEncuentrosActual,
        ubicaciones.length,
      );
      for (let index = 0; index < cantidadGrupos; index += 1) {
        const lugar = tomarUbicacion();
        const tramoCantidadEnemigos = Math.min(2, Math.floor((rondaEscaramuza - 1) / 3));
        const cantidadMinimaEnemigos = 1 + tramoCantidadEnemigos;
        const cantidadMaximaEnemigos = cantidadMinimaEnemigos + 1;
        const cantidadEnemigos = cantidadMinimaEnemigos
          + Math.floor(Math.random() * (cantidadMaximaEnemigos - cantidadMinimaEnemigos + 1));
        const enemigos = Array.from({ length: cantidadEnemigos }, () => (
          esEscaramuza
            ? elegirEnemigoEscaramuza(enemigosDisponibles, nivelAmenazaEscaramuza)
            : elegirAleatorio(enemigosDisponibles)
        ));
        const base = obtenerEnemigoAlFrente(enemigos);
        const plantilla = elegirAleatorio(configuracionNivel.enemigo ?? []);
        pointsOfInterest.set(keyOf(lugar.row, lugar.column), {
          tipo: "enemigo",
          titulo: plantilla?.titulo ?? "Presencias en la oscuridad",
          texto: typeof plantilla?.texto === "function"
            ? plantilla.texto({ cantidad: enemigos.length, nombre: base.nombre })
            : (plantilla?.texto ?? `${base.nombre} bloquea el pasillo.`),
          // El aviso del POI conserva el retrato del enemigo; la ilustración
          // ambiental se reserva para el panel de escena.
          imagen: base.imagen,
          alt: base.nombre,
          imagenEscena: plantilla?.imagen,
          altEscena: plantilla?.alt ?? "Presencias en la oscuridad",
          audio: plantilla?.audio ?? null,
          enemigos,
          accion: "Comenzar encuentro",
          descubierto: false,
          resuelto: false,
        });
      }
    }

    if (boss) {
      if (esTransitable(guardianRow, guardianColumn)) {
        pointsOfInterest.set(guardianKey, {
          tipo: "enemigo",
          titulo: "Guardián de la puerta",
          texto: `Hay un guardián defendiendo la puerta de salida de la mazmorra: ${boss.nombre}. ¿Deseas enfrentarlo?`,
          imagen: boss.imagen,
          alt: boss.nombre,
          enemigos: [boss],
          boss: true,
          guardianPuerta: true,
          accion: "Enfrentar guardián",
          descubierto: false,
          resuelto: false,
        });
      }
    }

    const objetosPosibles = (juego.itemsBase ?? []).filter((item) =>
      !item.esObjetoMision && item.nivel <= (configuracionNivel.nivelMaximoLoot ?? nivelMapa));
    const cantidadTesoros = esEscaramuza || configuracionNivel.generarTesorosAleatorios === true
      ? Math.max(1, Math.floor(Number(configuracionNivel.tesoros ?? 1)))
      : 0;
    for (let index = 0; index < cantidadTesoros; index += 1) {
      const lugarTesoro = tomarUbicacion(estaDentroDeSala);
      if (!lugarTesoro) break;
      const plantilla = elegirAleatorio(configuracionNivel.tesoro ?? []);
      const loot = plantilla?.loot === "aleatorio"
        ? (objetosPosibles.length > 0 ? [crearInstanciaBotin(elegirAleatorio(objetosPosibles))] : [])
        : (Array.isArray(plantilla?.loot)
          ? plantilla.loot
            .map((id) => (juego.itemsBase ?? []).find((item) => item.id === id))
            .filter(Boolean)
            .map(crearInstanciaBotin)
          : []);
      const monedasCofre = Math.floor(Math.random() * 16) + 10;
      const racionesCofre = Math.floor(Math.random() * 4) + 2;
      const requiereLlave = typeof plantilla?.requiereLlave === "boolean"
        ? plantilla.requiereLlave
        : Math.random() < Number(configuracionNivel.probabilidadCofreCerrado ?? 0.35);
      pointsOfInterest.set(keyOf(lugarTesoro.row, lugarTesoro.column), {
        tipo: "tesoro",
        titulo: plantilla?.titulo ?? "Tesoro oculto",
        texto: index === 0
          ? "Un cofre descansa entre las piedras. Dentro encuentras objetos que puedes guardar en el inventario."
          : (plantilla?.texto ?? "Encuentras algo entre las piedras."),
        imagen: plantilla?.imagen ?? "recursos/imagen/mapa/pasillo_tesoro.webp",
        imagenEscena: plantilla?.imagen ?? "recursos/imagen/mapa/pasillo_tesoro.webp",
        imagenModal: plantilla?.imagenModal ?? "recursos/imagen/mapa/tesoro_poi.webp",
        alt: plantilla?.alt ?? "Un tesoro oculto",
        audio: plantilla?.audio ?? null,
        loot,
        ...(requiereLlave ? {
          objetoRequeridoId: "llave-cofre",
          consumirObjetoRequerido: true,
        } : {}),
        monedas: monedasCofre,
        raciones: racionesCofre,
        accion: plantilla?.accion ?? "Continuar",
        descubierto: false,
        resuelto: false,
      });
    }

    const poiCatalog = (juego.puntosInteresBase ?? []).filter((poi) => poi.nivel <= nivelMapa);
    if (esHistoria) {
      poisFijosHistoria.forEach((referencia) => {
        const row = Number(referencia.row ?? referencia.fila);
        const column = Number(referencia.column ?? referencia.columna);
        if ((row === entrance.row && column === entrance.column)
          || (row === exit.row && column === exit.column)) return;
        if (!esTransitable(row, column)) return;
        const base = referencia.poiId
          ? poiCatalog.find((poi) => poi.id === referencia.poiId)
          : null;
        if (referencia.poiId && !base) return;
        const poiBase = { ...(base ?? {}), ...referencia };
        const enemigo = poiBase.enemigoId
          ? poolCompleto.find((entry) => entry.id === poiBase.enemigoId)
          : null;
        const loot = poiBase.lootId
          ? [(juego.itemsBase ?? []).find((item) => item.id === poiBase.lootId)]
            .filter(Boolean)
            .map((item) => crearInstanciaBotin(item, !item.esObjetoMision))
          : [];
        pointsOfInterest.set(keyOf(row, column), {
          tipo: poiBase.tipo ?? (enemigo ? "enemigo" : loot.length > 0 ? "tesoro" : "historia"),
          id: poiBase.id ?? poiBase.poiId,
          titulo: poiBase.titulo ?? poiBase.id?.replaceAll("-", " ") ?? "Punto de interés",
          texto: poiBase.texto,
          imagen: poiBase.imagen,
          imagenModal: poiBase.imagenModal,
          imagenEscena: poiBase.imagenEscena,
          alt: poiBase.alt ?? poiBase.id ?? "Punto de interés",
          sonido: poiBase.sonido,
          danio: poiBase.danio,
          probabilidadDesactivacion: poiBase.probabilidadDesactivacion,
          objetoRequeridoId: poiBase.objetoRequeridoId,
          consumirObjetoRequerido: poiBase.consumirObjetoRequerido === true,
          enemigos: enemigo ? [enemigo] : undefined,
          loot,
          mercancia: poiBase.mercancia,
          accion: poiBase.accion ?? (poiBase.tipo === "tesoro" ? "Abrir cofre" : enemigo ? "Comenzar encuentro" : loot.length > 0 ? "Recoger objeto" : "Continuar"),
          descubierto: false,
          resuelto: false,
        });
      });
    }
    const poiDisponibles = [...poiCatalog].filter((poi) => !esEscaramuza || poi.tipo === "trampa");
    const cantidadPOIAleatorios = esEscaramuza ? (mapaActivo.cantidadPOI ?? 0) : 0;
    for (let index = 0; index < cantidadPOIAleatorios; index += 1) {
      if (poiDisponibles.length === 0) break;
      const indicePoi = Math.floor(Math.random() * poiDisponibles.length);
      const [poiBase] = poiDisponibles.splice(indicePoi, 1);
      const lugar = tomarUbicacion(poiBase.tipo === "trampa" ? esCruceOPuertaDeSala : null);
      if (!lugar) break;
      const enemigo = poiBase.enemigoId
        ? poolCompleto.find((entry) => entry.id === poiBase.enemigoId)
        : null;
      const loot = poiBase.lootId
        ? [(juego.itemsBase ?? []).find((item) => item.id === poiBase.lootId)]
          .filter(Boolean)
          .map((item) => crearInstanciaBotin(item, !item.esObjetoMision))
        : [];
      pointsOfInterest.set(keyOf(lugar.row, lugar.column), {
        tipo: poiBase.tipo ?? (enemigo ? "enemigo" : loot.length > 0 ? "tesoro" : "historia"),
        id: poiBase.id,
        titulo: poiBase.titulo ?? poiBase.id.replaceAll("-", " "),
        texto: poiBase.texto,
        imagen: poiBase.imagen,
        imagenModal: poiBase.imagenModal,
        imagenEscena: poiBase.imagenEscena,
        alt: poiBase.alt ?? poiBase.id,
        sonido: poiBase.sonido,
        danio: poiBase.danio,
        probabilidadDesactivacion: poiBase.probabilidadDesactivacion,
        objetoRequeridoId: poiBase.objetoRequeridoId,
        consumirObjetoRequerido: poiBase.consumirObjetoRequerido === true,
        enemigos: enemigo ? [enemigo] : undefined,
        loot,
        mercancia: poiBase.mercancia,
        accion: poiBase.accion ?? (poiBase.tipo === "vendedor" ? "Hablar con el vendedor" : poiBase.tipo === "tesoro" ? "Abrir cofre" : enemigo ? "Comenzar encuentro" : loot.length > 0 ? "Recoger objeto" : "Investigar"),
        descubierto: false,
        resuelto: false,
      });
    }

    const plantillaSalida = elegirAleatorio(configuracionNivel.salida ?? []);
    pointsOfInterest.set(keyOf(exit.row, exit.column), {
      tipo: "salida",
      titulo: plantillaSalida?.titulo ?? "Salida",
      texto: esEscaramuza && !boss
        ? "El camino termina aquí. La puerta está libre y puedes continuar."
        : plantillaSalida?.texto ?? "El camino termina aquí. La puerta necesita una llave.",
      imagen: elegirAleatorio(plantillaSalida?.imagenesPuerta
        ?? (plantillaSalida?.imagen ? [plantillaSalida.imagen] : [
          "recursos/imagen/mapa/pasillo_puerta_1.webp",
          "recursos/imagen/mapa/pasillo_puerta_2.webp",
        ])),
      imagenModal: plantillaSalida?.imagenModal ?? "recursos/imagen/especiales/puerta.webp",
      alt: plantillaSalida?.alt ?? "Puerta de salida al final de la mazmorra",
      audio: plantillaSalida?.audio ?? null,
      accion: plantillaSalida?.accion ?? "Continuar",
      requiereLlave: !esEscaramuza || Boolean(boss),
      descubierto: false,
      resuelto: false,
    });
  }

  function actualizarControles() {
    const puedeMoverse = !poiActivo && juego.combate?.enCurso !== true
      && juego.combate?.puedeExplorar !== false && !movimientoEscenaEnCurso;
    movementButtons.forEach((button) => {
      const [rowDelta, columnDelta] = directions[button.dataset.direction];
      button.disabled = !puedeMoverse || !puedeMoverA(position.row + rowDelta, position.column + columnDelta);
    });
  }

  function dibujarMapa() {
    const grid = document.createElement("div");
    grid.className = "dungeon-grid";
    grid.setAttribute("role", "img");
    grid.setAttribute("aria-label", "Fragmento visible del mapa. El punto muestra al grupo; E indica la salida.");

    // Mantiene al grupo en el centro del recorte, incluso junto a los bordes.
    // Las celdas fuera del mapa quedan vacías y transparentes.
    const rowStart = position.row - Math.floor(FILAS_VISIBLES / 2);
    const columnStart = position.column - Math.floor(COLUMNAS_VISIBLES / 2);

    for (let viewRow = 0; viewRow < FILAS_VISIBLES; viewRow += 1) {
      for (let viewColumn = 0; viewColumn < COLUMNAS_VISIBLES; viewColumn += 1) {
        const row = rowStart + viewRow;
        const column = columnStart + viewColumn;
        const tile = layout[row]?.[column];
        const cell = document.createElement("span");
        cell.className = "dungeon-cell";
        if (!discovered.has(keyOf(row, column))) {
          cell.classList.add("dungeon-unexplored");
          cell.textContent = " ";
          cell.setAttribute("aria-hidden", "true");
          grid.append(cell);
          continue;
        }
        if (tile === "#") {
          cell.classList.add("dungeon-wall");
          cell.setAttribute("aria-hidden", "true");
          grid.append(cell);
          continue;
        }
        cell.classList.add("dungeon-floor");
        Object.entries(directions).forEach(([direccion, [deltaFila, deltaColumna]]) => {
          const filaVecina = row + deltaFila;
          const columnaVecina = column + deltaColumna;
          if (discovered.has(keyOf(filaVecina, columnaVecina))
            && layout[filaVecina]?.[columnaVecina] === "#") {
            cell.classList.add(`dungeon-edge-${direccion}`);
          }
        });
        if (row === position.row && column === position.column) {
          cell.classList.add("dungeon-player");
          cell.textContent = "●";
          const poiEnCasilla = pointsOfInterest.get(keyOf(row, column));
          if (poiEnCasilla?.guardianPuerta && poiEnCasilla.descubierto) {
            cell.classList.add("dungeon-poi-guardian");
            cell.setAttribute("aria-label", "Grupo frente al guardián de la puerta");
          } else {
            cell.setAttribute("aria-label", "Grupo");
          }
        } else if (row === exit.row && column === exit.column) {
          cell.classList.add("dungeon-exit");
          cell.textContent = "E";
          cell.setAttribute("aria-label", hayGuardianBloqueandoPuerta()
            ? "Salida bloqueada por el guardián"
            : "Salida");
        } else if (pointsOfInterest.get(keyOf(row, column))?.descubierto) {
          const poi = pointsOfInterest.get(keyOf(row, column));
          cell.classList.add(poi.resuelto ? "dungeon-poi-resolved" : "dungeon-poi-marker");
          if (poi.guardianPuerta) cell.classList.add("dungeon-poi-guardian");
          if (poi.tipo === "vendedor") cell.classList.add("dungeon-poi-vendor");
          cell.textContent = poi.resuelto ? "x"
            : poi.guardianPuerta ? "B"
              : poi.tipo === "vendedor" ? "\u00a4"
                : poi.tipo === "trampa" ? "T"
                  : poi.tipo === "tesoro" ? "$" : "!";
          cell.setAttribute("aria-label", poi.resuelto ? "Punto de interés resuelto" : "Punto de interés descubierto");
        } else {
          cell.setAttribute("aria-hidden", "true");
        }
        grid.append(cell);
      }
    }
    const legend = document.createElement("p");
    legend.className = "dungeon-legend";
    legend.textContent = "Punto: grupo   E salida   B guardián   \u00a4 vendedor   T trampa   ! POI   $ botín   x resuelto";
    mapDisplay.replaceChildren(grid, legend);
    actualizarControles();
  }

  async function mover(direction) {
    if (poiActivo || movimientoEscenaEnCurso || juego.combate?.enCurso === true
      || juego.combate?.puedeExplorar === false) return;
    const direccionMapa = direction;
    const [rowDelta, columnDelta] = directions[direccionMapa] ?? [0, 0];
    const row = position.row + rowDelta;
    const column = position.column + columnDelta;
    if (!puedeMoverA(row, column)) return;
    const posicionAnterior = { ...position };
    const claseAnimacion = "is-moving-forward";
    const animarEscena = !explorationScene.hidden && explorationSceneImage.hasAttribute("src")
      && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    movimientoEscenaEnCurso = true;
    actualizarControles();
    if (animarEscena && claseAnimacion) explorationSceneImage.classList.add(claseAnimacion);
    try {
      if (animarEscena) await esperarAnimacionMovimiento();
    position = { row, column };
    juego.sonidos?.reproducir("pasos");
    pasosDesdeRacion += 1;
    if (pasosDesdeRacion >= PASOS_POR_RACION) {
      pasosDesdeRacion = 0;
      if (window.inventarioGrupo?.consumirRacion()) {
        fatigaExploracion = Math.max(0, fatigaExploracion - 1);
        cansancioEnZonaPeligro = fatigaExploracion > 0;
        registrarAcontecimiento("El grupo consume una ración y recupera fuerzas durante la marcha.");
        if (window.inventarioGrupo.raciones === 0) {
          registrarAcontecimiento("Se agotaron las raciones. Sin comida, el cansancio empezará a acumularse.");
        }
      } else {
        fatigaExploracion = Math.min(MAX_FATIGA_EXPLORACION, fatigaExploracion + 1);
        registrarAcontecimiento(
          `Sin raciones, el grupo acumula cansancio (${fatigaExploracion}/${MAX_FATIGA_EXPLORACION}) y aumenta el riesgo de emboscada.`,
        );
      }
      actualizarIndicadorFatiga();
    }
    descubrirCercanias();
    dibujarMapa();

    const key = keyOf(row, column);
    const opciones = Object.keys(directions).filter((nombre) => {
      const [dr, dc] = directions[nombre];
      return puedeMoverA(row + dr, column + dc);
    }).length;
    const rumbo = { up: "norte", down: "sur", left: "oeste", right: "este" }[direccionMapa];
    let narracion;
    const categoriaMensaje = opciones >= 3 ? "bifurcacion" : opciones <= 1 ? "tramo" : "pasillo";
    const mensajes = mapaActivo.mensajes?.[categoriaMensaje];
    const alternativas = Array.isArray(mensajes) && mensajes.length > 0
      ? mensajes
      : categoriaMensaje === "bifurcacion"
        ? [{
          texto: "Llegas a una bifurcación; el pasillo continúa en varias direcciones.",
          imagen: "recursos/imagen/mapa/cruce_1.webp",
          alt: "Bifurcación en la caverna",
        }]
        : categoriaMensaje === "tramo"
          ? [{
            texto: "El corredor se estrecha y apenas hay espacio para maniobrar.",
            imagen: "recursos/imagen/mapa/pasillo_final.webp",
            alt: "Tramo estrecho del corredor",
          }]
          : [{
            texto: "Avanzas por un pasillo oscuro. Tus pasos resuenan entre las paredes húmedas.",
            imagen: "recursos/imagen/mapa/pasillo_1.webp",
            alt: "Pasillo oscuro de una caverna",
          }];
    const entradaElegida = elegirAleatorio(alternativas);
    const escenaSala = obtenerEscenaSala(posicionAnterior, direction);
    const escenaFormaPasillo = escenaSala
      ? null
      : obtenerEscenaFormaPasillo(posicionAnterior, direccionMapa, opciones);
    const textoBase = escenaSala?.texto ?? escenaFormaPasillo?.texto ?? (typeof entradaElegida === "string"
      ? entradaElegida
      : (entradaElegida?.texto ?? ""));
    narracion = textoBase.replaceAll("{direccion}", rumbo);
    mostrarEscenaExploracion(
      escenaSala?.imagen ?? escenaFormaPasillo?.imagen ?? (typeof entradaElegida === "object" ? entradaElegida.imagen : ""),
      escenaSala?.alt ?? escenaFormaPasillo?.alt ?? (typeof entradaElegida === "object" ? entradaElegida.alt : ""),
    );
    if (!textoBase.includes("{direccion}")) {
      narracion += ` Rumbo ${rumbo}.`;
    }
    registrarAcontecimiento(narracion);

    const poi = pointsOfInterest.get(key);
    if (poi && !poi.resuelto) {
      poi.descubierto = true;
      encounterRoom = key;
      mostrarEscenaExploracion(
        poi.imagenEscena ?? poi.imagen,
        poi.altEscena ?? poi.alt,
      );
      if (poi.tipo === "enemigo") {
        registrarAcontecimiento(poi.guardianPuerta
          ? "El guardián de la puerta bloquea el paso."
          : "Algo se mueve en la oscuridad. El grupo se detiene para prepararse.");
      } else if (poi.tipo === "tesoro") {
        registrarAcontecimiento("La luz revela un objeto oculto entre las piedras.");
      } else if (poi.tipo === "trampa") {
        registrarAcontecimiento("El grupo detecta un mecanismo oculto en el corredor.");
      } else if (poi.tipo === "salida") {
        registrarAcontecimiento("Al final del pasillo encuentras la puerta de salida.");
      } else {
        registrarAcontecimiento("El grupo descubre un punto de interés.");
      }
      mostrarPOI(poi);
      dibujarMapa();
      if (poi.tipo === "enemigo" && !poi.guardianPuerta
        && !juego.combate?.prepararEncuentro(poi.enemigos)) {
        cerrarPOI();
        encounterRoom = null;
      }
    } else if (poi?.tipo === "tesoro" && poi.resuelto) {
      // El cofre permanece visible en la escena del explorador al regresar.
      mostrarEscenaExploracion(
        poi.imagenEscena ?? "recursos/imagen/mapa/pasillo_tesoro.webp",
        poi.altEscena ?? poi.alt ?? "Cofre encontrado entre las piedras",
      );
    } else if (poi?.tipo === "trampa" && poi.resuelto) {
      mostrarEscenaExploracion(poi.imagenEscena ?? "recursos/imagen/mapa/pasillo_trampa.webp", "La trampa activada en el corredor");
    } else if (poi?.tipo === "enemigo" && poi.resuelto) {
      mostrarEscenaExploracion(
        poi.imagenPosterior ?? "recursos/imagen/mapa/pasillo_post_combate.webp",
        "El lugar del encuentro tras la batalla",
      );
    } else if (poi?.tipo === "vendedor" && poi.resuelto) {
      mostrarEscenaExploracion(poi.imagenEscena ?? "recursos/imagen/mapa/pasillo_enano.webp", "El pasillo junto al vendedor enano");
    } else if (poi?.tipo === "salida" && poi.resuelto) {
      mostrarEscenaExploracion(poi.imagen, poi.alt ?? "Puerta de salida");
    }
    if ((!poi || poi.resuelto) && comprobarEmboscadaPorCansancio()) return;
    programarExploracionAutomatica();
    } finally {
      if (animarEscena && claseAnimacion) {
        explorationSceneImage.classList.remove(claseAnimacion);
        await esperarAnimacionMovimiento();
      }
      movimientoEscenaEnCurso = false;
      actualizarControles();
    }
  }

  function encontrarSiguientePasoAutomatico() {
    const objetosDisponibles = window.inventarioGrupo?.items ?? [];
    const tieneLlaveSalida = objetosDisponibles.some((item) => item?.id === "llave-salida");
    const salidaBloqueada = [...pointsOfInterest.values()].some((poi) => (
      poi.tipo === "salida" && poi.requiereLlave && !tieneLlaveSalida && !poi.resuelto
    ));
    const objetivos = new Set([...pointsOfInterest.entries()]
      .filter(([key, poi]) => !poi.resuelto
        && key !== keyOf(position.row, position.column)
        && !(poi.tipo === "salida" && poi.requiereLlave && !tieneLlaveSalida)
        && (!poi.objetoRequeridoId || objetosDisponibles.some((item) => item?.id === poi.objetoRequeridoId)))
      .map(([key]) => key));
    if (objetivos.size === 0) return null;

    const visitados = new Set([keyOf(position.row, position.column)]);
    const cola = [{ ...position, primerPaso: null }];
    for (let indice = 0; indice < cola.length; indice += 1) {
      const actual = cola[indice];
      for (const [direccion, [dr, dc]] of Object.entries(directions)) {
        const row = actual.row + dr;
        const column = actual.column + dc;
        const key = keyOf(row, column);
        if (visitados.has(key) || !puedeMoverA(row, column)) continue;
        if (salidaBloqueada && row === exit.row && column === exit.column) continue;
        const primerPaso = actual.primerPaso ?? direccion;
        if (objetivos.has(key)) return primerPaso;
        visitados.add(key);
        cola.push({ row, column, primerPaso });
      }
    }
    return null;
  }

  function programarExploracionAutomatica() {
    if (!exploracionAutomaticaActiva || temporizadorExploracion !== null
      || juego.partidaTerminada || gameView.hidden || poiActivo || juego.combate?.puedeExplorar === false
      || document.querySelector("dialog[open]")) return;
    temporizadorExploracion = window.setTimeout(() => {
      temporizadorExploracion = null;
      if (!exploracionAutomaticaActiva || juego.partidaTerminada || gameView.hidden || poiActivo
        || juego.combate?.puedeExplorar === false || document.querySelector("dialog[open]")) return;
      if (!juego.personajes.some((personaje) => personaje.vida.actual > 0)) {
        exploracionAutomaticaActiva = false;
        registrarAcontecimiento("La exploración automática se detiene: no quedan aliados en pie.");
        return;
      }
      const siguientePasoMapa = encontrarSiguientePasoAutomatico();
      if (!siguientePasoMapa) {
        exploracionAutomaticaActiva = false;
        const hayCofreCerrado = [...pointsOfInterest.values()].some((poi) => poi.tipo === "tesoro"
          && !poi.resuelto
          && poi.objetoRequeridoId
          && !window.inventarioGrupo?.items?.some((item) => item?.id === poi.objetoRequeridoId));
        registrarAcontecimiento(hayCofreCerrado
          ? "La exploración automática se detiene frente a un cofre cerrado. Sigue explorando para encontrar su llave."
          : "La exploración automática se detiene: no quedan puntos de interés alcanzables.");
        return;
      }
      mover(siguientePasoMapa);
      programarExploracionAutomatica();
    }, PASO_AUTOMATICO_MS);
  }

  function establecerExploracionAutomatica(activa) {
    exploracionAutomaticaActiva = Boolean(activa);
    if (temporizadorExploracion !== null) {
      window.clearTimeout(temporizadorExploracion);
      temporizadorExploracion = null;
    }
    if (exploracionAutomaticaActiva) programarExploracionAutomatica();
  }

  function pausarExploracionAutomaticaTrasEncuentro() {
    if (!exploracionAutomaticaActiva) return;
    exploracionAutomaticaActiva = false;
    if (temporizadorExploracion !== null) {
      window.clearTimeout(temporizadorExploracion);
      temporizadorExploracion = null;
    }
    juego.exploracionAutomatica = false;
    window.dispatchEvent(new CustomEvent("juego:pausar-exploracion-automatica"));
    registrarAcontecimiento("La exploración automática se pausa: el encuentro sigue pendiente. Puedes volver a intentarlo cuando quieras.");
  }

  poiAction.addEventListener("click", async () => {
    if (!poiActivo) return;
    if (poiActivo.tipo === "trampa") {
      await resolverTrampa(poiActivo);
      return;
    }
    if (poiActivo.guardianPuerta) {
      const guardian = poiActivo;
      guardian.enfrentamientoAceptado = true;
      if (juego.combate?.iniciarEncuentro(guardian.enemigos)) {
        if (poiDialog.open) {
          poiDescription.textContent = "Aceptaste el desafío. El grupo se prepara para enfrentar al guardián.";
          poiAction.hidden = true;
          poiClose.hidden = true;
        }
      } else {
        guardian.enfrentamientoAceptado = false;
        registrarAcontecimiento("El grupo no puede iniciar el encuentro en este momento.");
      }
      return;
    }
    if (poiActivo.tipo === "enemigo") return;
    if (poiActivo.tipo === "emboscada") {
      if (!juego.combate?.iniciarEmboscada()) {
        registrarAcontecimiento("El grupo no puede iniciar el encuentro en este momento.");
        return;
      }
      cerrarPOI();
      return;
    }
    if (poiActivo.tipo === "vendedor") {
      juego.vendedor?.abrir(poiActivo, () => {
        encounterRoom = null;
        cerrarPOI();
        dibujarMapa();
      });
      return;
    }
    const objetoRequeridoId = poiActivo.objetoRequeridoId;
    if (objetoRequeridoId) {
      const tieneObjetoRequerido = window.inventarioGrupo?.items?.some((item) => item?.id === objetoRequeridoId);
      if (!tieneObjetoRequerido) {
        if (poiActivo.tipo === "tesoro" && objetoRequeridoId === "llave-cofre") {
          poiDescription.textContent = "El cofre está cerrado con llave. Busca una llave entre los enemigos o en otro punto de interés.";
          registrarAcontecimiento("El cofre está cerrado. Necesitas una llave de cofre para abrirlo.");
          return;
        }
        const nombreObjeto = juego.itemsBase?.find((item) => item.id === objetoRequeridoId)?.nombre ?? "el objeto requerido";
        poiDescription.textContent = `Necesitas ${nombreObjeto} para continuar.`;
        registrarAcontecimiento(`No puedes continuar en ${poiActivo.titulo}: falta ${nombreObjeto}.`);
        return;
      }
    }
    const consumirObjetoRequerido = () => {
      if (!objetoRequeridoId || !poiActivo.consumirObjetoRequerido) return;
      const index = window.inventarioGrupo?.items?.findIndex((item) => item?.id === objetoRequeridoId) ?? -1;
      if (index >= 0) {
        const objeto = window.inventarioGrupo.retirarItem(index + 1);
        registrarAcontecimiento(poiActivo.tipo === "tesoro"
          ? `Usas ${objeto.nombre} para abrir el cofre.`
          : `Usas ${objeto.nombre} para continuar.`);
      }
    };
    if (poiActivo.tipo === "tesoro") {
      const loot = poiActivo.loot ?? [];
      const espaciosLibres = window.inventarioGrupo?.items?.filter((item) => item === null).length ?? 0;
      if (espaciosLibres < loot.length) {
        registrarAcontecimiento("El inventario está lleno. Libera un espacio antes de recoger el tesoro.");
        if (poiActivo.monedas > 0) {
          window.inventarioGrupo.agregarMonedas(poiActivo.monedas);
          registrarAcontecimiento(`Encuentras ${poiActivo.monedas} monedas en el cofre.`);
          poiActivo.monedas = 0;
        }
        if (poiActivo.raciones > 0) {
          window.inventarioGrupo.agregarRaciones(poiActivo.raciones);
          registrarAcontecimiento(`Encuentras ${poiActivo.raciones} raciones de comida en el cofre.`);
          poiActivo.raciones = 0;
        }
        return;
      }
      try {
        loot.forEach((item) => window.inventarioGrupo.agregarItem(item));
        if (loot.length > 0) juego.sonidos?.reproducir("inventario");
        loot.forEach((item) => registrarAcontecimiento(`${item.nombre} enviado al inventario.`));
        if (poiActivo.monedas > 0) {
          window.inventarioGrupo.agregarMonedas(poiActivo.monedas);
          registrarAcontecimiento(`Encuentras ${poiActivo.monedas} monedas en el cofre.`);
          poiActivo.monedas = 0;
        }
        if (poiActivo.raciones > 0) {
          window.inventarioGrupo.agregarRaciones(poiActivo.raciones);
          registrarAcontecimiento(`Encuentras ${poiActivo.raciones} raciones de comida en el cofre.`);
          poiActivo.raciones = 0;
        }
        consumirObjetoRequerido();
        poiActivo.resuelto = true;
      } catch (error) {
        registrarAcontecimiento(error instanceof Error ? error.message : "No se pudo recoger el tesoro.");
        return;
      }
    } else if (poiActivo.tipo === "salida") {
      const guardianPendiente = [...pointsOfInterest.values()].find((poi) => poi.guardianPuerta && !poi.resuelto);
      if (guardianPendiente) {
        registrarAcontecimiento("El guardián sigue bloqueando la salida. Debes derrotarlo para abrir la puerta.");
        cerrarPOI();
        return;
      }
      if (!poiActivo.requiereLlave) {
        poiActivo.resuelto = true;
        registrarAcontecimiento("La puerta está libre. El grupo avanza al siguiente mapa.");
        juego.sonidos?.reproducirRuta("recursos/sonidos/puerta-abierta.mp3", 0.65);
        encounterRoom = null;
        cerrarPOI();
        transicionNivelPendiente = true;
        levelTransitionDialog.showModal();
        return;
      }
      const indexLlave = window.inventarioGrupo?.items?.findIndex((item) => item?.id === "llave-salida") ?? -1;
      if (indexLlave < 0) {
        registrarAcontecimiento("La puerta permanece cerrada. El grupo continúa explorando.");
        mostrarEscenaExploracion("recursos/imagen/mapa/1_2.webp", "La puerta sigue cerrada");
      } else {
        window.inventarioGrupo.retirarItem(indexLlave + 1);
        poiActivo.resuelto = true;
        registrarAcontecimiento("Usas la llave. La puerta se abre y revela el camino al nivel 2.");
        juego.sonidos?.reproducirRuta("recursos/sonidos/puerta-abierta.mp3", 0.65);
        encounterRoom = null;
        cerrarPOI();
        transicionNivelPendiente = true;
        levelTransitionDialog.showModal();
        return;
      }
    } else {
      const loot = poiActivo.loot ?? [];
      const espaciosLibres = window.inventarioGrupo?.items?.filter((item) => item === null).length ?? 0;
      if (espaciosLibres < loot.length) {
        registrarAcontecimiento("El inventario está lleno. Libera un espacio antes de recoger el objeto.");
        return;
      }
      try {
        loot.forEach((item) => window.inventarioGrupo.agregarItem(item));
        if (loot.length > 0) juego.sonidos?.reproducir("inventario");
        loot.forEach((item) => registrarAcontecimiento(`${item.nombre} enviado al inventario.`));
      } catch (error) {
        registrarAcontecimiento(error instanceof Error ? error.message : "No se pudo recoger el objeto.");
        return;
      }
      consumirObjetoRequerido();
      poiActivo.resuelto = true;
      if (loot.length === 0) registrarAcontecimiento("El grupo termina de investigar el punto de interés.");
    }
    encounterRoom = null;
    cerrarPOI();
    dibujarMapa();
  });

  poiStorage.addEventListener("click", () => {
    if (poiActivo?.tipo !== "vendedor") return;
    juego.vendedor?.abrirCofre?.();
  });

  // El botón "Cerrar" y el fondo descartan el aviso; el estado se limpia en el
  // evento "close". Los avisos de enemigo y emboscada requieren elegir una acción.
  poiClose.addEventListener("click", async () => {
    poiDialog.close();
  });
  poiDialog.addEventListener("click", (event) => {
    if (event.target === poiDialog
      && (poiActivo?.guardianPuerta || !["enemigo", "emboscada", "trampa"].includes(poiActivo?.tipo))) poiDialog.close();
  });
  poiDialog.addEventListener("cancel", (event) => {
    if (["enemigo", "emboscada", "trampa"].includes(poiActivo?.tipo) && !poiActivo?.guardianPuerta) event.preventDefault();
  });
  poiDialog.addEventListener("close", () => {
    const poiQueSeCerro = poiActivo;
    if (poiQueSeCerro?.tipo === "vendedor") {
      // Visitar o marcharse resuelve el POI; evita que la exploración
      // automática vuelva a seleccionar al vendedor en la misma casilla.
      poiQueSeCerro.resuelto = true;
      encounterRoom = null;
      dibujarMapa();
    }
    if (poiQueSeCerro?.guardianPuerta && !poiQueSeCerro.enfrentamientoAceptado) {
      encounterRoom = null;
      registrarAcontecimiento("El guardián sigue bloqueando el acceso a la puerta de salida.");
      dibujarMapa();
    }
    if (poiQueSeCerro?.tipo === "salida") {
      if (poiQueSeCerro.resuelto) {
        mostrarEscenaExploracion("recursos/imagen/mapa/pasillo_1.webp", "El camino continúa más allá de la puerta abierta");
      } else {
        mostrarEscenaExploracion(poiQueSeCerro.imagen, poiQueSeCerro.alt ?? "Puerta de salida");
      }
    }
    if (["vendedor", "tesoro", "trampa"].includes(poiQueSeCerro?.tipo)) {
      const escenas = {
        vendedor: "recursos/imagen/mapa/pasillo_enano.webp",
        tesoro: "recursos/imagen/mapa/pasillo_tesoro.webp",
        trampa: "recursos/imagen/mapa/pasillo_trampa.webp",
      };
      mostrarEscenaExploracion(poiQueSeCerro.imagenEscena ?? escenas[poiQueSeCerro.tipo], poiQueSeCerro.alt);
    }
    if (poiQueSeCerro?.tipo === "enemigo" && poiQueSeCerro.resuelto) {
      mostrarEscenaExploracion(poiQueSeCerro.imagenPosterior ?? "recursos/imagen/mapa/pasillo_post_combate.webp", "El lugar del encuentro tras la batalla");
    }
    limpiarPOI();
    const tieneLlaveSalida = window.inventarioGrupo?.items?.some((item) => item?.id === "llave-salida");
    if (poiQueSeCerro?.tipo !== "salida" || poiQueSeCerro.resuelto
      || (poiQueSeCerro.requiereLlave && !tieneLlaveSalida)) {
      programarExploracionAutomatica();
    }
  });

  function completarTransicionNivel() {
    if (!transicionNivelPendiente) return;
    transicionNivelPendiente = false;
    juego.mazmorra?.iniciarSiguienteNivel();
  }
  levelTransitionDialog.addEventListener("close", completarTransicionNivel);
  levelTransitionDialog.addEventListener("click", (event) => {
    if (event.target === levelTransitionDialog) levelTransitionDialog.close();
  });
  levelTransitionClose.addEventListener("click", () => {
    levelTransitionDialog.close();
    completarTransicionNivel();
  });

  movementButtons.forEach((button) => {
    button.addEventListener("click", () => mover(button.dataset.direction));
  });

  const keyboardDirections = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  window.addEventListener("keydown", (event) => {
    const direction = keyboardDirections[event.key];
    if (!direction || !gameView || gameView.hidden || juego.combate?.enCurso === true
      || juego.combate?.puedeExplorar === false || document.querySelector("dialog[open]")) return;
    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))) return;
    event.preventDefault();
    const button = movementButtons.find((entry) => entry.dataset.direction === direction);
    if (button && !button.disabled) button.click();
  });

  window.addEventListener("juego:estado-encuentro", (event) => {
    const { tipo, resultado, enemigos } = event.detail ?? {};
    if (tipo === "combate-iniciado") {
      explorationScene.hidden = true;
      cerrarPOI();
    }
    if (tipo === "finalizado") {
      let escenaTrasVictoria = null;
      const encuentroResuelto = resultado === "victoria" || resultado === "huida_enemiga";
      if (encuentroResuelto && encounterRoom) {
        const poi = pointsOfInterest.get(encounterRoom);
        if (poi) {
          poi.resuelto = true;
          if (poi.tipo === "enemigo") {
            poi.imagenPosterior = Math.random() < 0.5
              ? "recursos/imagen/mapa/pasillo_post_combate.webp"
              : "recursos/imagen/mapa/post_combate_2.png";
            escenaTrasVictoria = poi.imagenPosterior;
          }
        }
      } else if (encounterRoom && Array.isArray(enemigos)) {
        const poi = pointsOfInterest.get(encounterRoom);
        if (poi?.tipo === "enemigo") poi.enemigos = enemigos;
      }
      // Si el encuentro no termina en victoria, detener la exploración automática
      // evita que vuelva a activar inmediatamente el mismo POI pendiente.
      if (!encuentroResuelto && !juego.partidaTerminada) {
        pausarExploracionAutomaticaTrasEncuentro();
      }
      encounterRoom = null;
      cansancioEnZonaPeligro = false;
      cerrarPOI();
      mostrarEscenaExploracion(escenaTrasVictoria
        ?? explorationSceneImage.getAttribute("src")
        ?? "", escenaTrasVictoria ? "El lugar del encuentro tras la batalla" : explorationSceneImage.alt);
      if (document.querySelector(".encounter-enemies")?.hidden === false) {
        explorationScene.hidden = true;
      }
      dibujarMapa();
      programarExploracionAutomatica();
    }
    if (tipo === "botin-recogido") {
      explorationScene.hidden = !explorationSceneImage.getAttribute("src");
      programarExploracionAutomatica();
    }
    actualizarControles();
  });

  juego.mazmorra = {
    reiniciarFatigaExploracion() {
      pasosDesdeRacion = 0;
      fatigaExploracion = 0;
      cansancioEnZonaPeligro = false;
      actualizarIndicadorFatiga();
    },
    iniciar() {
      configurarMapa();
      position = { ...entrance };
      discovered = new Set();
      cansancioEnZonaPeligro = fatigaExploracion > 0;
      descubrirCercanias();
      encounterRoom = null;
      poiActivo = null;
      const primeraEscena = mapaActivo.mensajes?.pasillo?.find((entrada) => (
        entrada && typeof entrada === "object" && typeof entrada.imagen === "string"
      ));
      mostrarEscenaExploracion(
        primeraEscena?.imagen ?? "recursos/imagen/mapa/pasillo_1.webp",
        primeraEscena?.alt ?? "Entrada a un pasillo oscuro",
      );
      cerrarPOI();
      generarEncuentros();
      dibujarMapa();
      if (juego.modoPartida === "escaramuza") {
        registrarAcontecimiento(
          `Escaramuza · ronda ${juego.rondaEscaramuza}: mapa ${layout.length} × ${layout[0].length}, ${mapaGenerado?.habitaciones.length ?? 0} salas de 2×2 y ${cantidadEncuentrosActual} encuentros enemigos.${mapaGenerado ? ` Semilla: ${mapaGenerado.semilla}.` : ""}`,
        );
      }
      programarExploracionAutomatica();
    },
    iniciarSiguienteNivel() {
      const aliadosVivos = juego.personajes.filter((personaje) => personaje.vida.actual > 0);
      aliadosVivos.forEach((personaje) => {
        personaje.vida.actual = personaje.vida.maxima;
        personaje.cordura.actual = personaje.cordura.maxima;
        juego.actualizarRecursosTarjeta(personaje.id);
      });
      if (aliadosVivos.length > 0) {
        registrarAcontecimiento("Al cruzar al siguiente nivel, los aliados vivos recuperan toda su vida y cordura. El poder conserva su valor actual.");
      }

      const siguienteNivel = nivelMapa + 1;
      if (juego.modoPartida === "escaramuza") {
        juego.rondaEscaramuza = Math.max(1, Math.floor(Number(juego.rondaEscaramuza) || 1)) + 1;
        juego.encuentrosExtraEscaramuza = Math.max(
          0,
          Math.floor(Number(juego.encuentrosExtraEscaramuza) || 0),
        ) + Math.floor(Math.random() * 2) + 1;
      }
      const modoMapaSiguiente = juego.modoPartida === "historia" ? "historia" : "escaramuza";
      const siguienteMapa = (juego.mapasBase ?? []).find((mapa) => Number(mapa.nivel) === siguienteNivel
        && (!mapa.modo || mapa.modo === "ambos" || mapa.modo === modoMapaSiguiente));
      if (siguienteMapa) juego.mapaActivoId = siguienteMapa.id;
      juego.nivelMazmorraActual = siguienteNivel;
      this.iniciar();
    },
    obtenerPosicion() {
      return { ...position };
    },
    setExploracionAutomatica: establecerExploracionAutomatica,
  };

  juego.mazmorra.iniciar();
})();
