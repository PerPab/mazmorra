(function inicializarMazmorra() {
  const juego = window.juego;
  const gameView = document.querySelector("#game-view");
  const mapDisplay = document.querySelector(".map-display");
  const movementButtons = [...document.querySelectorAll(".direction-button[data-direction]")];
  const eventLog = document.querySelector(".event-log");
  const poiPanel = document.querySelector(".poi-intro");
  const poiImage = poiPanel?.querySelector(".poi-image");
  const poiTitle = poiPanel?.querySelector(".poi-title");
  const poiDescription = poiPanel?.querySelector(".poi-description");
  const poiAction = poiPanel?.querySelector(".poi-action");
  if (!juego || !(mapDisplay instanceof HTMLElement) || movementButtons.length !== 4
    || !(eventLog instanceof HTMLElement) || !(poiPanel instanceof HTMLElement)
    || !(poiImage instanceof HTMLImageElement) || !(poiTitle instanceof HTMLElement)
    || !(poiDescription instanceof HTMLElement) || !(poiAction instanceof HTMLButtonElement)) return;

  const FILAS_VISIBLES = 7;
  const COLUMNAS_VISIBLES = 7;
  const RADIO_DESCUBRIMIENTO = 2;
  let mapaActivo = null;
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
      id: "mazmorra-inicial",
      nivel: 1,
      tamano: 15,
      cantidadEnemigos: 3,
      nivelEnemigos: 1,
      cantidadPOI: 1,
      mensajes: {},
    };
    juego.mapaActivoId = mapaActivo.id;
    nivelMapa = Math.max(1, Number(mapaActivo.nivel) || 1);
    configuracionNivel = juego.puntosInteresPorNivel?.[nivelMapa]
      ?? juego.puntosInteresPorNivel?.[1]
      ?? {};
    layout = crearLayout(mapaActivo.tamano ?? mapaActivo.tamaño ?? 15);
    entrance = { row: 1, column: 1 };
    exit = { row: layout.length - 2, column: layout.length - 2 };
  }

  function registrarAcontecimiento(mensaje) {
    eventLog.querySelector(".event-log-placeholder")?.remove();
    const entry = document.createElement("p");
    entry.textContent = mensaje;
    eventLog.append(entry);
    eventLog.scrollTop = eventLog.scrollHeight;
  }

  function elegirAleatorio(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function cerrarPOI() {
    poiActivo = null;
    poiPanel.hidden = true;
    poiImage.removeAttribute("src");
    poiImage.alt = "";
    poiAction.hidden = true;
    actualizarControles();
  }

  function mostrarPOI(poi) {
    poiActivo = poi;
    if (poi.imagen) poiImage.src = poi.imagen;
    else poiImage.removeAttribute("src");
    poiImage.alt = poi.alt ?? poi.titulo;
    poiImage.hidden = !poi.imagen;
    poiTitle.textContent = poi.titulo;
    poiDescription.textContent = poi.texto;
    poiAction.hidden = poi.tipo === "enemigo";
    poiAction.textContent = poi.accion ?? "Continuar";
    poiPanel.hidden = false;
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
        mapaActivo.cantidadEnemigos ?? configuracionNivel.gruposEnemigos ?? 3,
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
          imagen: plantilla?.imagen ?? base.imagen,
          alt: plantilla?.alt ?? base.nombre,
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

    const objetosPosibles = (juego.itemsBase ?? []).filter((item) => item.nivel <= (configuracionNivel.nivelMaximoLoot ?? nivelMapa));
    for (let index = 0; index < (configuracionNivel.tesoros ?? 1); index += 1) {
      const lugarTesoro = tomarUbicacion();
      if (!lugarTesoro) break;
      const plantilla = elegirAleatorio(configuracionNivel.tesoro ?? []);
      const loot = plantilla?.loot === "aleatorio"
        ? (objetosPosibles.length > 0 ? [elegirAleatorio(objetosPosibles)] : [])
        : (Array.isArray(plantilla?.loot)
          ? plantilla.loot.map((id) => (juego.itemsBase ?? []).find((item) => item.id === id)).filter(Boolean)
          : []);
      pointsOfInterest.set(keyOf(lugarTesoro.row, lugarTesoro.column), {
        tipo: "tesoro",
        titulo: plantilla?.titulo ?? "Tesoro oculto",
        texto: plantilla?.texto ?? "Encuentras algo entre las piedras.",
        imagen: plantilla?.imagen ?? "recursos/imagen/especiales/rupee.png",
        alt: plantilla?.alt ?? "Un tesoro oculto",
        loot,
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
        ? [(juego.itemsBase ?? []).find((item) => item.id === poiBase.lootId)].filter(Boolean)
        : [];
      pointsOfInterest.set(keyOf(lugar.row, lugar.column), {
        tipo: enemigo ? "enemigo" : loot.length > 0 ? "tesoro" : "historia",
        id: poiBase.id,
        titulo: poiBase.id.replaceAll("-", " "),
        texto: poiBase.texto,
        imagen: poiBase.imagen,
        alt: poiBase.id,
        enemigos: enemigo ? [enemigo] : undefined,
        loot,
        accion: enemigo ? "Comenzar encuentro" : loot.length > 0 ? "Recoger tesoro" : "Continuar",
        descubierto: false,
        resuelto: false,
      });
    }

    const plantillaSalida = elegirAleatorio(configuracionNivel.salida ?? []);
    pointsOfInterest.set(keyOf(exit.row, exit.column), {
      tipo: "salida",
      titulo: plantillaSalida?.titulo ?? "Salida",
      texto: plantillaSalida?.texto ?? "El camino termina aquí.",
      imagen: plantillaSalida?.imagen ?? "",
      alt: plantillaSalida?.alt ?? "",
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
        ? ["Llegas a una bifurcación; el pasillo continúa en varias direcciones."]
        : categoriaMensaje === "tramo"
          ? ["El corredor se estrecha y apenas hay espacio para maniobrar."]
          : ["Avanzas por un pasillo oscuro. Tus pasos resuenan entre las paredes húmedas."];
    narracion = elegirAleatorio(alternativas).replaceAll("{direccion}", rumbo);
    if (!alternativas.some((mensaje) => mensaje.includes("{direccion}"))) {
      narracion += ` Rumbo ${rumbo}.`;
    }
    registrarAcontecimiento(narracion);

    const poi = pointsOfInterest.get(key);
    if (poi && !poi.resuelto) {
      poi.descubierto = true;
      encounterRoom = key;
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
    }
  }

  poiAction.addEventListener("click", () => {
    if (!poiActivo || poiActivo.tipo === "enemigo") return;
    if (poiActivo.tipo === "tesoro") {
      const loot = poiActivo.loot ?? [];
      const espaciosLibres = window.inventarioGrupo?.items?.filter((item) => item === null).length ?? 0;
      if (espaciosLibres < loot.length) {
        registrarAcontecimiento("El inventario está lleno. Libera un espacio antes de recoger el tesoro.");
        return;
      }
      try {
        loot.forEach((item) => window.inventarioGrupo.agregarItem(item));
        if (loot.length > 0) juego.sonidos?.reproducir("inventario");
        loot.forEach((item) => registrarAcontecimiento(`${item.nombre} enviado al inventario.`));
        poiActivo.resuelto = true;
      } catch (error) {
        registrarAcontecimiento(error instanceof Error ? error.message : "No se pudo recoger el tesoro.");
        return;
      }
    } else if (poiActivo.tipo === "salida") {
      registrarAcontecimiento("La puerta permanece cerrada. El grupo continúa explorando.");
    } else {
      poiActivo.resuelto = true;
      registrarAcontecimiento("El grupo termina de investigar el punto de interés.");
    }
    encounterRoom = null;
    cerrarPOI();
    dibujarMapa();
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
      poiPanel.hidden = true;
    }
    if (tipo === "finalizado") {
      if (resultado === "victoria" && encounterRoom) {
        const poi = pointsOfInterest.get(encounterRoom);
        if (poi) poi.resuelto = true;
      }
      encounterRoom = null;
      poiPanel.hidden = true;
      poiActivo = null;
      dibujarMapa();
    }
    actualizarControles();
  });

  juego.mazmorra = {
    iniciar() {
      configurarMapa();
      position = { ...entrance };
      discovered = new Set();
      descubrirCercanias();
      encounterRoom = null;
      poiActivo = null;
      poiPanel.hidden = true;
      generarEncuentros();
      dibujarMapa();
    },
    obtenerPosicion() {
      return { ...position };
    },
  };

  juego.mazmorra.iniciar();
})();
