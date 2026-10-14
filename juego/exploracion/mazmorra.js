(function inicializarMazmorra() {
  const juego = window.juego;
  const gameView = document.querySelector("#game-view");
  const mapDisplay = document.querySelector(".map-display");
  const explorationScene = document.querySelector(".exploration-scene");
  const explorationSceneImage = explorationScene?.querySelector(".exploration-scene-image");
  const movementButtons = [...document.querySelectorAll(".direction-button[data-direction]")];
  const eventLog = document.querySelector(".event-log");
  const poiDialog = document.querySelector(".poi-dialog");
  const levelTransitionDialog = document.querySelector(".level-transition-dialog");
  const levelTransitionClose = levelTransitionDialog?.querySelector(".level-transition-close");
  const poiImage = poiDialog?.querySelector(".poi-image");
  const poiTitle = poiDialog?.querySelector(".poi-title");
  const poiDescription = poiDialog?.querySelector(".poi-description");
  const poiAction = poiDialog?.querySelector(".poi-action");
  const poiClose = poiDialog?.querySelector(".poi-close");
  const poiActions = poiDialog?.querySelector(".poi-dialog-actions");
  if (!juego || !(mapDisplay instanceof HTMLElement) || !(explorationScene instanceof HTMLElement)
    || !(explorationSceneImage instanceof HTMLImageElement) || movementButtons.length !== 4
    || !(eventLog instanceof HTMLElement) || !(poiDialog instanceof HTMLDialogElement)
    || !(poiImage instanceof HTMLImageElement) || !(poiTitle instanceof HTMLElement)
    || !(poiDescription instanceof HTMLElement) || !(poiAction instanceof HTMLButtonElement)
    || !(poiClose instanceof HTMLButtonElement)
    || !(levelTransitionDialog instanceof HTMLDialogElement)
    || !(levelTransitionClose instanceof HTMLButtonElement)) return;

  const FILAS_VISIBLES = 7;
  const COLUMNAS_VISIBLES = 7;
  const RADIO_DESCUBRIMIENTO = 2;
  let mapaActivo = null;
  let tamanoMapaActual = 15;
  let cantidadEncuentrosActual = 3;
  let layout = [];
  let nivelMapa = 1;
  let configuracionNivel = {};
  const directions = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };
  let entrance = { row: 1, column: 1 };
  let exit = { row: 13, column: 13 };
  let position = { ...entrance };
  let discovered = new Set();
  let pointsOfInterest = new Map();
  let encounterRoom = null;
  let poiActivo = null;
  let transicionNivelPendiente = false;
  let cansancioEnZonaPeligro = false;
  let exploracionAutomaticaActiva = false;
  let temporizadorExploracion = null;
  const PASO_AUTOMATICO_MS = 850;

  function keyOf(row, column) {
    return `${row},${column}`;
  }

  function esTransitable(row, column) {
    return layout[row]?.[column] === ".";
  }

  function crearLayout(tamanoSolicitado) {
    const tamanoLimitado = Math.max(9, Math.min(61, Math.floor(Number(tamanoSolicitado) || 15)));
    const tamano = tamanoLimitado % 2 === 0 ? tamanoLimitado + 1 : tamanoLimitado;
    return Array.from({ length: tamano }, (_, row) => (
      Array.from({ length: tamano }, (_, column) => {
        if (row === 0 || column === 0 || row === tamano - 1 || column === tamano - 1) return "#";
        if (row % 2 === 1 || (column - 1) % 4 === 0) return ".";
        return "#";
      }).join("")
    ));
  }

  function configurarMapa() {
    const mapas = juego.mapasBase ?? [];
    mapaActivo = mapas.find((mapa) => mapa.id === juego.mapaActivoId) ?? mapas[0] ?? {
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
    configuracionNivel = juego.configuracionPorMapa?.[mapaActivo.id]
      ?? juego.puntosInteresPorNivel?.[nivelMapa]
      ?? juego.puntosInteresPorNivel?.[1]
      ?? {};
    layout = crearLayout(mapaActivo.tamano ?? mapaActivo.tamaño ?? 15);
    entrance = { row: 1, column: 1 };
    exit = { row: layout.length - 2, column: layout.length - 2 };
    if (juego.modoPartida === "escaramuza") {
      const ronda = Math.max(1, Math.floor(Number(juego.rondaEscaramuza) || 1));
      const encuentrosExtra = Math.max(0, Math.floor(Number(juego.encuentrosExtraEscaramuza) || 0));
      tamanoMapaActual = Math.min(61, layout.length + ((ronda - 1) * 2));
      layout = crearLayout(tamanoMapaActual);
      cantidadEncuentrosActual = 2 + encuentrosExtra;
      exit = { row: layout.length - 2, column: layout.length - 2 };
    } else {
      tamanoMapaActual = layout.length;
      cantidadEncuentrosActual = mapaActivo.cantidadEnemigos ?? configuracionNivel.gruposEnemigos ?? 3;
    }
  }

  function registrarAcontecimiento(mensaje) {
    eventLog.querySelector(".event-log-placeholder")?.remove();
    const entry = document.createElement("p");
    entry.textContent = mensaje;
    eventLog.append(entry);
    eventLog.scrollTop = eventLog.scrollHeight;
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

  function elegirAleatorio(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function obtenerFatigaGrupo() {
    const tarjetas = [...document.querySelectorAll(".player-bar .player-card")];
    const porId = new Map(juego.personajes.map((personaje) => [personaje.id, personaje]));
    const formacion = tarjetas
      .map((card) => porId.get(card.dataset.characterId))
      .filter((personaje) => personaje && personaje.vida.actual > 0);
    const aliadosVivos = formacion.length > 0
      ? formacion
      : juego.personajes.filter((personaje) => personaje.vida.actual > 0);
    if (aliadosVivos.length === 0) return { porcentaje: 1, proteccion: 0 };

    const porcentaje = aliadosVivos.reduce((total, personaje) => (
      total + personaje.poder.actual / Math.max(1, personaje.poder.maximo)
    ), 0) / aliadosVivos.length;
    const sacerdoteRetaguardia = aliadosVivos.at(-1)?.id === "sacerdote-condenado"
      ? aliadosVivos.at(-1).proteccionEmboscada ?? 0
      : 0;
    return { porcentaje, proteccion: sacerdoteRetaguardia };
  }

  function comprobarEmboscadaPorCansancio() {
    const { porcentaje, proteccion } = obtenerFatigaGrupo();
    if (porcentaje > 0.8) {
      cansancioEnZonaPeligro = false;
      return false;
    }
    if (!cansancioEnZonaPeligro) {
      registrarAcontecimiento("Como el grupo está cansado, las posibilidades de sufrir una emboscada aumentan.");
      cansancioEnZonaPeligro = true;
    }

    const progresoFatiga = (0.8 - porcentaje) / 0.8;
    const probabilidadBase = 0.05 + progresoFatiga * 0.30;
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
    poiClose.textContent = "Cerrar";
    poiActions?.classList.remove("is-vendor");
    actualizarControles();
  }

  function cerrarPOI() {
    if (poiDialog.open) poiDialog.close();
    else limpiarPOI();
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
    poiAction.hidden = poi.tipo === "enemigo";
    poiAction.textContent = poi.accion ?? "Continuar";
    poiClose.textContent = poi.tipo === "vendedor" ? "Marcharse" : "Cerrar";
    poiActions?.classList.toggle("is-vendor", poi.tipo === "vendedor");
    if (poi.tipo === "vendedor") poiAction.textContent = "Comerciar";
    if (poi.tipo === "salida") {
      const tieneLlave = window.inventarioGrupo?.items?.some((item) => item?.id === "llave-salida");
      poiDescription.textContent = tieneLlave
        ? "La llave encaja en la cerradura. Puedes abrir la puerta y avanzar al siguiente nivel."
        : poi.texto;
      poiAction.textContent = tieneLlave ? "Usar llave y salir" : (poi.accion ?? "Seguir explorando");
    }
    // En un encuentro con enemigos hay que decidir (Comenzar/Huir controla
    // combate.js), así que el modal no ofrece "Cerrar" ni se descarta al fondo.
    poiClose.hidden = poi.tipo === "enemigo" || poi.tipo === "emboscada";
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
    function tomarUbicacion() {
      if (ubicaciones.length === 0) return null;
      return ubicaciones.splice(Math.floor(Math.random() * ubicaciones.length), 1)[0];
    }

    const poolCompleto = juego.poolEncuentros ?? [];
    const nivelMaximoEnemigo = mapaActivo.nivelEnemigos
      ?? configuracionNivel.nivelMaximoEnemigo
      ?? nivelMapa;
    const pool = poolCompleto.filter((enemigo) => enemigo.nivel <= nivelMaximoEnemigo);
    const enemigosDisponibles = pool.length > 0 ? pool : poolCompleto;
    if (enemigosDisponibles.length > 0) {
      const cantidadGrupos = Math.min(
        cantidadEncuentrosActual,
        ubicaciones.length,
      );
      for (let index = 0; index < cantidadGrupos; index += 1) {
        const lugar = tomarUbicacion();
        const cantidadEnemigos = Math.floor(Math.random() * 4) + 1;
        const enemigos = Array.from({ length: cantidadEnemigos }, () => elegirAleatorio(enemigosDisponibles));
        const base = enemigos[0];
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

    const boss = poolCompleto.find((enemigo) => enemigo.id === mapaActivo.bossId);
    if (boss) {
      const lugarBoss = tomarUbicacion();
      if (lugarBoss) {
        pointsOfInterest.set(keyOf(lugarBoss.row, lugarBoss.column), {
          tipo: "enemigo",
          titulo: boss.nombre,
          texto: `Una presencia imponente bloquea el camino. Reconoces a ${boss.nombre}.`,
          imagen: boss.imagen,
          alt: boss.nombre,
          enemigos: [boss],
          boss: true,
          accion: "Comenzar encuentro",
          descubierto: false,
          resuelto: false,
        });
      }
    }

    const objetosPosibles = (juego.itemsBase ?? []).filter((item) =>
      !item.esObjetoMision && item.nivel <= (configuracionNivel.nivelMaximoLoot ?? nivelMapa));
    const cantidadTesoros = Math.max(1, Math.floor(Number(configuracionNivel.tesoros ?? 1)));
    for (let index = 0; index < cantidadTesoros; index += 1) {
      const lugarTesoro = tomarUbicacion();
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
      if (index === 0) {
        const llave = (juego.itemsBase ?? []).find((item) => item.id === "llave-salida");
        if (llave) loot.unshift(crearInstanciaBotin(llave));
      }
      pointsOfInterest.set(keyOf(lugarTesoro.row, lugarTesoro.column), {
        tipo: "tesoro",
        titulo: plantilla?.titulo ?? "Tesoro oculto",
        texto: index === 0
          ? "Un cofre descansa entre las piedras. Dentro encuentras una llave y otros objetos que puedes guardar en el inventario."
          : (plantilla?.texto ?? "Encuentras algo entre las piedras."),
        imagen: plantilla?.imagen ?? "recursos/imagen/mapa/1_11.webp",
        imagenModal: plantilla?.imagenModal ?? "recursos/imagen/especiales/tesoro_r.png",
        alt: plantilla?.alt ?? "Un tesoro oculto",
        audio: plantilla?.audio ?? null,
        loot,
        monedas: monedasCofre,
        raciones: racionesCofre,
        accion: plantilla?.accion ?? "Continuar",
        descubierto: false,
        resuelto: false,
      });
    }

    const poiCatalog = (juego.puntosInteresBase ?? []).filter((poi) => poi.nivel <= nivelMapa);
    for (let index = 0; index < (mapaActivo.cantidadPOI ?? 0); index += 1) {
      const lugar = tomarUbicacion();
      if (!lugar || poiCatalog.length === 0) break;
      const poiBase = elegirAleatorio(poiCatalog);
      const enemigo = poiBase.enemigoId
        ? poolCompleto.find((entry) => entry.id === poiBase.enemigoId)
        : null;
      const loot = poiBase.lootId
        ? [(juego.itemsBase ?? []).find((item) => item.id === poiBase.lootId)]
          .filter(Boolean)
          .map(crearInstanciaBotin)
        : [];
      pointsOfInterest.set(keyOf(lugar.row, lugar.column), {
      tipo: poiBase.tipo === "vendedor" ? "vendedor" : enemigo ? "enemigo" : loot.length > 0 ? "tesoro" : "historia",
        id: poiBase.id,
        titulo: poiBase.id.replaceAll("-", " "),
        texto: poiBase.texto,
        imagen: poiBase.imagen,
        alt: poiBase.id,
        enemigos: enemigo ? [enemigo] : undefined,
        loot,
        mercancia: poiBase.mercancia,
        accion: poiBase.tipo === "vendedor" ? "Hablar con el vendedor" : enemigo ? "Comenzar encuentro" : loot.length > 0 ? "Recoger tesoro" : "Continuar",
        descubierto: false,
        resuelto: false,
      });
    }

    const plantillaSalida = elegirAleatorio(configuracionNivel.salida ?? []);
    pointsOfInterest.set(keyOf(exit.row, exit.column), {
      tipo: "salida",
      titulo: plantillaSalida?.titulo ?? "Salida",
      texto: plantillaSalida?.texto ?? "El camino termina aquí. La puerta necesita una llave.",
      imagen: plantillaSalida?.imagen ?? "recursos/imagen/mapa/1_12.webp",
      imagenModal: plantillaSalida?.imagenModal ?? "recursos/imagen/especiales/puerta.webp",
      alt: plantillaSalida?.alt ?? "Puerta de salida al final de la mazmorra",
      audio: plantillaSalida?.audio ?? null,
      accion: plantillaSalida?.accion ?? "Continuar",
      descubierto: false,
      resuelto: false,
    });
  }

  function actualizarControles() {
    const puedeMoverse = !poiActivo && juego.combate?.puedeExplorar !== false;
    movementButtons.forEach((button) => {
      const [rowDelta, columnDelta] = directions[button.dataset.direction] ?? [0, 0];
      button.disabled = !puedeMoverse || !esTransitable(
        position.row + rowDelta,
        position.column + columnDelta,
      );
    });
  }

  function dibujarMapa() {
    const grid = document.createElement("div");
    grid.className = "dungeon-grid";
    grid.setAttribute("role", "img");
    grid.setAttribute("aria-label", "Fragmento visible del mapa. Las casillas se revelan al avanzar; @ indica al grupo y E la salida.");

    const rowStart = Math.max(0, Math.min(
      position.row - Math.floor(FILAS_VISIBLES / 2),
      layout.length - FILAS_VISIBLES,
    ));
    const columnStart = Math.max(0, Math.min(
      position.column - Math.floor(COLUMNAS_VISIBLES / 2),
      layout[0].length - COLUMNAS_VISIBLES,
    ));

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
        cell.classList.add(tile === "#" ? "dungeon-wall" : "dungeon-floor");
        if (row === position.row && column === position.column) {
          cell.classList.add("dungeon-player");
          cell.textContent = "@";
          cell.setAttribute("aria-label", "Grupo");
        } else if (row === exit.row && column === exit.column) {
          cell.classList.add("dungeon-exit");
          cell.textContent = "E";
          cell.setAttribute("aria-label", "Salida");
        } else if (pointsOfInterest.get(keyOf(row, column))?.descubierto) {
          const poi = pointsOfInterest.get(keyOf(row, column));
          cell.classList.add(poi.resuelto ? "dungeon-poi-resolved" : "dungeon-poi-marker");
          cell.textContent = poi.resuelto ? "x" : poi.tipo === "tesoro" ? "$" : "!";
          cell.setAttribute("aria-label", poi.resuelto ? "Punto de interés resuelto" : "Punto de interés descubierto");
        } else if (tile === "#") {
          cell.textContent = "#";
          cell.setAttribute("aria-hidden", "true");
        } else {
          cell.textContent = ".";
          cell.setAttribute("aria-hidden", "true");
        }
        grid.append(cell);
      }
    }
    const legend = document.createElement("p");
    legend.className = "dungeon-legend";
    legend.textContent = "@ grupo   E salida   ! POI   $ botín   x resuelto";
    mapDisplay.replaceChildren(grid, legend);
    actualizarControles();
  }

  function mover(direction) {
    if (poiActivo || juego.combate?.puedeExplorar === false) return;
    const [rowDelta, columnDelta] = directions[direction] ?? [0, 0];
    const row = position.row + rowDelta;
    const column = position.column + columnDelta;
    if (!esTransitable(row, column)) return;
    position = { row, column };
    juego.sonidos?.reproducir("pasos");
    if (window.inventarioGrupo?.consumirRacion()) {
      if (window.inventarioGrupo.raciones === 0) {
        registrarAcontecimiento("Se agotaron las raciones. El próximo paso hará perder poder al grupo.");
      }
    } else {
      const afectados = juego.personajes.filter((personaje) => personaje.vida.actual > 0);
      afectados.forEach((personaje) => {
        personaje.poder.actual = Math.max(0, personaje.poder.actual - 10);
        juego.actualizarRecursosTarjeta(personaje.id);
      });
      if (afectados.length > 0) {
        registrarAcontecimiento("Sin comida, la marcha agota al grupo: cada aliado pierde 10 puntos de poder.");
      }
    }
    descubrirCercanias();
    dibujarMapa();

    const key = keyOf(row, column);
    const opciones = Object.keys(directions).filter((nombre) => {
      const [dr, dc] = directions[nombre];
      return esTransitable(row + dr, column + dc);
    }).length;
    const rumbo = { up: "norte", down: "sur", left: "oeste", right: "este" }[direction];
    let narracion;
    const categoriaMensaje = opciones >= 3 ? "bifurcacion" : opciones <= 1 ? "tramo" : "pasillo";
    const mensajes = mapaActivo.mensajes?.[categoriaMensaje];
    const alternativas = Array.isArray(mensajes) && mensajes.length > 0
      ? mensajes
      : categoriaMensaje === "bifurcacion"
        ? [{
          texto: "Llegas a una bifurcación; el pasillo continúa en varias direcciones.",
          imagen: "recursos/imagen/mapa/1_7.webp",
          alt: "Bifurcación en la caverna",
        }]
        : categoriaMensaje === "tramo"
          ? [{
            texto: "El corredor se estrecha y apenas hay espacio para maniobrar.",
            imagen: "recursos/imagen/mapa/1_8.webp",
            alt: "Tramo estrecho del corredor",
          }]
          : [{
            texto: "Avanzas por un pasillo oscuro. Tus pasos resuenan entre las paredes húmedas.",
            imagen: "recursos/imagen/mapa/1_6.webp",
            alt: "Pasillo oscuro de una caverna",
          }];
    const entradaElegida = elegirAleatorio(alternativas);
    const textoBase = typeof entradaElegida === "string"
      ? entradaElegida
      : (entradaElegida?.texto ?? "");
    narracion = textoBase.replaceAll("{direccion}", rumbo);
    mostrarEscenaExploracion(
      typeof entradaElegida === "object" ? entradaElegida.imagen : "",
      typeof entradaElegida === "object" ? entradaElegida.alt : "",
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
        poi.imagenEscena ?? (poi.tipo === "tesoro" ? "recursos/imagen/mapa/1_11.webp" : poi.imagen),
        poi.altEscena ?? poi.alt,
      );
      if (poi.tipo === "enemigo") {
        registrarAcontecimiento(poi.boss
          ? "Una presencia poderosa corta el paso. El grupo se detiene para prepararse."
          : "Algo se mueve en la oscuridad. El grupo se detiene para prepararse.");
      } else if (poi.tipo === "tesoro") {
        registrarAcontecimiento("La luz revela un objeto oculto entre las piedras.");
      } else if (poi.tipo === "salida") {
        registrarAcontecimiento("Al final del pasillo encuentras la puerta de salida.");
      } else {
        registrarAcontecimiento("El grupo descubre un punto de interés.");
      }
      mostrarPOI(poi);
      dibujarMapa();
      if (poi.tipo === "enemigo" && !juego.combate?.prepararEncuentro(poi.enemigos)) {
        cerrarPOI();
        encounterRoom = null;
      }
    } else if (poi?.tipo === "tesoro" && poi.resuelto) {
      // El cofre permanece visible en la escena del explorador al regresar.
      mostrarEscenaExploracion(
        poi.imagenEscena ?? "recursos/imagen/mapa/1_11.webp",
        poi.altEscena ?? poi.alt ?? "Cofre encontrado entre las piedras",
      );
    } else if (poi?.tipo === "enemigo" && poi.resuelto) {
      mostrarEscenaExploracion(
        poi.imagenPosterior ?? "recursos/imagen/mapa/1_9.webp",
        "El lugar del encuentro tras la batalla",
      );
    } else if (poi?.tipo === "salida" && poi.resuelto) {
      mostrarEscenaExploracion(poi.imagen, poi.alt ?? "Puerta de salida");
    }
    if ((!poi || poi.resuelto) && comprobarEmboscadaPorCansancio()) return;
    programarExploracionAutomatica();
  }

  function encontrarSiguientePasoAutomatico() {
    const objetivos = new Set([...pointsOfInterest.entries()]
      .filter(([key, poi]) => !poi.resuelto && key !== keyOf(position.row, position.column))
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
        if (visitados.has(key) || !esTransitable(row, column)) continue;
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
      || gameView.hidden || poiActivo || juego.combate?.puedeExplorar === false
      || document.querySelector("dialog[open]")) return;
    temporizadorExploracion = window.setTimeout(() => {
      temporizadorExploracion = null;
      if (!exploracionAutomaticaActiva || gameView.hidden || poiActivo
        || juego.combate?.puedeExplorar === false || document.querySelector("dialog[open]")) return;
      if (!juego.personajes.some((personaje) => personaje.vida.actual > 0)) {
        exploracionAutomaticaActiva = false;
        registrarAcontecimiento("La exploración automática se detiene: no quedan aliados en pie.");
        return;
      }
      const siguientePaso = encontrarSiguientePasoAutomatico();
      if (!siguientePaso) {
        exploracionAutomaticaActiva = false;
        registrarAcontecimiento("La exploración automática se detiene: no quedan puntos de interés alcanzables.");
        return;
      }
      mover(siguientePaso);
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

  poiAction.addEventListener("click", () => {
    if (!poiActivo || poiActivo.tipo === "enemigo") return;
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
        poiActivo.resuelto = true;
      } catch (error) {
        registrarAcontecimiento(error instanceof Error ? error.message : "No se pudo recoger el tesoro.");
        return;
      }
    } else if (poiActivo.tipo === "salida") {
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
      poiActivo.resuelto = true;
      registrarAcontecimiento("El grupo termina de investigar el punto de interés.");
    }
    encounterRoom = null;
    cerrarPOI();
    dibujarMapa();
  });

  // El botón "Cerrar" y el fondo descartan el aviso; el estado se limpia en el
  // evento "close". Los avisos de enemigo y emboscada requieren elegir una acción.
  poiClose.addEventListener("click", () => poiDialog.close());
  poiDialog.addEventListener("click", (event) => {
    if (event.target === poiDialog && !["enemigo", "emboscada"].includes(poiActivo?.tipo)) poiDialog.close();
  });
  poiDialog.addEventListener("cancel", (event) => {
    if (["enemigo", "emboscada"].includes(poiActivo?.tipo)) event.preventDefault();
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
    if (poiActivo?.tipo === "salida") {
      mostrarEscenaExploracion(poiActivo.imagen, poiActivo.alt ?? "Puerta de salida");
    }
    limpiarPOI();
    if (poiQueSeCerro?.tipo !== "salida" || poiQueSeCerro.resuelto) {
      programarExploracionAutomatica();
    }
  });

  levelTransitionDialog.addEventListener("close", () => {
    if (!transicionNivelPendiente) return;
    transicionNivelPendiente = false;
    juego.mazmorra?.iniciarSiguienteNivel();
  });
  levelTransitionDialog.addEventListener("click", (event) => {
    if (event.target === levelTransitionDialog) levelTransitionDialog.close();
  });
  levelTransitionClose.addEventListener("click", () => levelTransitionDialog.close());

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
    if (!direction || !gameView || gameView.hidden || document.querySelector("dialog[open]")) return;
    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))) return;
    event.preventDefault();
    const button = movementButtons.find((entry) => entry.dataset.direction === direction);
    if (button && !button.disabled) button.click();
  });

  window.addEventListener("juego:estado-encuentro", (event) => {
    const { tipo, resultado } = event.detail ?? {};
    if (tipo === "combate-iniciado") {
      explorationScene.hidden = true;
      cerrarPOI();
    }
    if (tipo === "finalizado") {
      let escenaTrasVictoria = null;
      if (resultado === "victoria" && encounterRoom) {
        const poi = pointsOfInterest.get(encounterRoom);
        if (poi) {
          poi.resuelto = true;
          if (poi.tipo === "enemigo") {
            poi.imagenPosterior = "recursos/imagen/mapa/1_9.webp";
            escenaTrasVictoria = poi.imagenPosterior;
          }
        }
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
    iniciar() {
      configurarMapa();
      position = { ...entrance };
      discovered = new Set();
      cansancioEnZonaPeligro = false;
      descubrirCercanias();
      encounterRoom = null;
      poiActivo = null;
      const primeraEscena = mapaActivo.mensajes?.pasillo?.find((entrada) => (
        entrada && typeof entrada === "object" && typeof entrada.imagen === "string"
      ));
      mostrarEscenaExploracion(
        primeraEscena?.imagen ?? "recursos/imagen/mapa/1_1.webp",
        primeraEscena?.alt ?? "Entrada a un pasillo oscuro",
      );
      cerrarPOI();
      generarEncuentros();
      dibujarMapa();
      if (juego.modoPartida === "escaramuza") {
        registrarAcontecimiento(
          `Escaramuza · ronda ${juego.rondaEscaramuza}: mapa ${layout.length} × ${layout.length}, ${cantidadEncuentrosActual} encuentros enemigos.`,
        );
      }
      programarExploracionAutomatica();
    },
    iniciarSiguienteNivel() {
      const aliadosVivos = juego.personajes.filter((personaje) => personaje.vida.actual > 0);
      aliadosVivos.forEach((personaje) => {
        personaje.vida.actual = personaje.vida.maxima;
        personaje.cordura.actual = personaje.cordura.maxima;
        personaje.poder.actual = personaje.poder.maximo;
        juego.actualizarRecursosTarjeta(personaje.id);
      });
      if (aliadosVivos.length > 0) {
        registrarAcontecimiento("Al cruzar al siguiente nivel, los aliados vivos recuperan toda su vida, cordura y poder.");
      }

      const siguienteNivel = nivelMapa + 1;
      if (juego.modoPartida === "escaramuza") {
        juego.rondaEscaramuza = Math.max(1, Math.floor(Number(juego.rondaEscaramuza) || 1)) + 1;
        juego.encuentrosExtraEscaramuza = Math.max(
          0,
          Math.floor(Number(juego.encuentrosExtraEscaramuza) || 0),
        ) + Math.floor(Math.random() * 2) + 1;
      }
      const siguienteMapa = (juego.mapasBase ?? []).find((mapa) => Number(mapa.nivel) === siguienteNivel);
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
