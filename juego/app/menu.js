(function inicializarMenus() {
  const juego = window.juego;
  const mainMenu = document.querySelector("#main-menu-screen");
  const bestiaryScreen = document.querySelector("#bestiary-screen");
  const bestiaryList = bestiaryScreen?.querySelector(".bestiary-list");
  const bestiaryBack = bestiaryScreen?.querySelector(".bestiary-back");
  const gameView = document.querySelector("#game-view");
  const mainMenuStatus = mainMenu?.querySelector(".main-menu-status");
  const continueButton = mainMenu?.querySelector('[data-menu-action="continue"]');
  const storyDialog = document.querySelector(".character-story-dialog");
  const storyTitle = storyDialog?.querySelector("#character-story-title");
  const storyContent = storyDialog?.querySelector(".character-story-content");
  const storyClose = storyDialog?.querySelector(".character-story-close");
  const adventureIntroDialog = document.querySelector(".adventure-intro-dialog");
  const adventureEnter = adventureIntroDialog?.querySelector(".adventure-enter");
  const gameMenuToggle = gameView?.querySelector(".game-menu-toggle");
  const gameMenuPanel = gameView?.querySelector("#game-menu-panel");
  const gameMenuReturn = gameView?.querySelector(".game-menu-return");
  const optionsDialog = document.querySelector(".options-dialog");
  const optionsClose = optionsDialog?.querySelector(".options-back");
  const optionsPOIOpen = optionsDialog?.querySelector(".options-poi-open");
  const optionsMapOpen = optionsDialog?.querySelector(".options-map-open");
  const automaticCombatToggle = optionsDialog?.querySelector("#automatic-combat-toggle");
  const musicToggle = optionsDialog?.querySelector("#music-toggle");

  if (!juego
    || !Array.isArray(juego.personajes)
    || !(mainMenu instanceof HTMLElement)
    || !(bestiaryScreen instanceof HTMLElement)
    || !(bestiaryList instanceof HTMLElement)
    || !(bestiaryBack instanceof HTMLButtonElement)
    || !(gameView instanceof HTMLElement)
    || !(mainMenuStatus instanceof HTMLElement)
    || !(continueButton instanceof HTMLButtonElement)
    || !(storyDialog instanceof HTMLDialogElement)
    || !(storyTitle instanceof HTMLElement)
    || !(storyContent instanceof HTMLElement)
    || !(storyClose instanceof HTMLButtonElement)
    || !(adventureIntroDialog instanceof HTMLDialogElement)
    || !(adventureEnter instanceof HTMLButtonElement)
    || !(gameMenuToggle instanceof HTMLButtonElement)
    || !(gameMenuPanel instanceof HTMLElement)
    || !(gameMenuReturn instanceof HTMLButtonElement)
    || !(optionsDialog instanceof HTMLDialogElement)
    || !(optionsClose instanceof HTMLButtonElement)
    || !(optionsPOIOpen instanceof HTMLButtonElement)
    || !(optionsMapOpen instanceof HTMLButtonElement)
    || !(automaticCombatToggle instanceof HTMLInputElement)) {
    throw new Error("No se pudieron inicializar las pantallas de menú del juego.");
  }

  let adventureStarted = false;
  const storageKey = "juego.combateAutomatico";
  try {
    juego.combateAutomatico = window.localStorage.getItem(storageKey) === "true";
  } catch {
    juego.combateAutomatico = false;
  }
  automaticCombatToggle.checked = juego.combateAutomatico;
  automaticCombatToggle.setAttribute("aria-checked", String(juego.combateAutomatico));
  automaticCombatToggle.addEventListener("change", () => {
    juego.combateAutomatico = automaticCombatToggle.checked;
    automaticCombatToggle.setAttribute("aria-checked", String(juego.combateAutomatico));
    try {
      window.localStorage.setItem(storageKey, String(juego.combateAutomatico));
    } catch {
      // La opción sigue activa durante esta sesión si el navegador bloquea el almacenamiento.
    }
  });

  // --- Música ---
  // Canción fija del menú y preferencia de encendido/apagado persistida.
  const MENU_MUSIC_SRC = "recursos/sonidos/menu.mp3";
  const musicStorageKey = "juego.musica";
  let musicaActiva = true;
  try {
    musicaActiva = window.localStorage.getItem(musicStorageKey) !== "false";
  } catch {
    musicaActiva = true;
  }

  function audioMapaActivo() {
    const mapas = juego.mapasBase ?? [];
    const mapa = mapas.find((entry) => entry.id === juego.mapaActivoId) ?? mapas[0];
    return mapa?.audio ?? null;
  }

  // Reproduce la pista adecuada según el contexto. Al explorar suena la música
  // del mapa (independiente del switch); fuera del mapa suena la canción fija
  // del menú solo si la música está activa. El gestor evita reiniciar la misma.
  function aplicarMusicaContexto(enElMapa) {
    if (!juego.musica) return;
    juego.musica.reproducir(enElMapa ? audioMapaActivo() : (musicaActiva ? MENU_MUSIC_SRC : null));
  }

  if (musicToggle instanceof HTMLInputElement) {
    musicToggle.checked = musicaActiva;
    musicToggle.setAttribute("aria-checked", String(musicaActiva));
    musicToggle.addEventListener("change", () => {
      musicaActiva = musicToggle.checked;
      musicToggle.setAttribute("aria-checked", String(musicaActiva));
      try {
        window.localStorage.setItem(musicStorageKey, String(musicaActiva));
      } catch {
        // La preferencia sigue activa durante esta sesión si el navegador bloquea el almacenamiento.
      }
      if (gameView.hidden) aplicarMusicaContexto(false);
    });
  }
  // Arranca la música del menú al cargar (el gestor reintenta si el navegador
  // bloquea el autoplay hasta la primera interacción del usuario).
  aplicarMusicaContexto(false);

  function mostrarPantalla(pantalla) {
    mainMenu.hidden = pantalla !== "menu";
    gameView.hidden = pantalla !== "game";
    if (pantalla !== "game") {
      gameMenuPanel.hidden = true;
      gameMenuToggle.setAttribute("aria-expanded", "false");
    }
    aplicarMusicaContexto(pantalla === "game");
  }

  function agregarParrafo(texto) {
    if (typeof texto !== "string" || !texto.trim()) {
      return;
    }
    const paragraph = document.createElement("p");
    paragraph.textContent = texto;
    storyContent.append(paragraph);
  }

  let storyTrigger = null;
  function mostrarTrasfondo(personaje, trigger = null) {
    storyTrigger = trigger;
    storyTitle.textContent = personaje.nombre;
    storyContent.replaceChildren();
    storyContent.scrollTop = 0;

    const story = juego.trasfondos?.[personaje.id];
    const sections = Array.isArray(story) ? story : (story ? [story] : []);
    sections.forEach((section) => {
      if (typeof section === "string") {
        agregarParrafo(section);
        return;
      }
      if (!section || typeof section !== "object") {
        return;
      }

      if (typeof section.titulo === "string" && section.titulo.trim()) {
        const heading = document.createElement("h3");
        heading.textContent = section.titulo;
        storyContent.append(heading);
      }
      agregarParrafo(section.texto);
      if (typeof section.imagen === "string" && section.imagen.trim()) {
        const image = document.createElement("img");
        image.src = section.imagen;
        image.alt = section.alt || "";
        image.loading = "lazy";
        storyContent.append(image);
        agregarParrafo(section.pie);
      }
    });

    if (!storyContent.childElementCount) {
      agregarParrafo("La historia de este personaje todavía no está escrita.");
    }
    storyDialog.showModal();
    storyContent.scrollTop = 0;
    storyClose.focus();
  }
  juego.abrirHistoriaPersonaje = mostrarTrasfondo;
  storyDialog.addEventListener("close", () => {
    storyTrigger?.focus();
    storyTrigger = null;
  });

  mainMenu.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const button = event.target.closest("[data-menu-action]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    switch (button.dataset.menuAction) {
      case "continue":
        if (adventureStarted) {
          mostrarPantalla("game");
        }
        break;
      case "new":
        mainMenuStatus.textContent = "";
        adventureIntroDialog.showModal();
        break;
      case "options":
        optionsDialog.showModal();
        break;
      case "bestiary":
        renderizarBestiario();
        mainMenu.hidden = true;
        bestiaryScreen.hidden = false;
        break;
      default:
        throw new Error(`Opción de menú desconocida: "${button.dataset.menuAction}".`);
    }
  });

  storyClose.addEventListener("click", () => storyDialog.close());
  storyDialog.addEventListener("click", (event) => {
    if (event.target === storyDialog) {
      storyDialog.close();
    }
  });

  adventureEnter.addEventListener("click", () => {
    adventureIntroDialog.close();
    adventureStarted = true;
    continueButton.disabled = false;
    juego.nivelMazmorraActual = null;
    window.inventarioGrupo?.iniciarPartida?.();
    juego.mazmorra?.iniciar();
    mostrarPantalla("game");
  });
  adventureIntroDialog.addEventListener("click", (event) => {
    if (event.target === adventureIntroDialog) adventureIntroDialog.close();
  });

  gameMenuToggle.addEventListener("click", () => {
    const isExpanded = gameMenuToggle.getAttribute("aria-expanded") === "true";
    gameMenuToggle.setAttribute("aria-expanded", String(!isExpanded));
    gameMenuPanel.hidden = isExpanded;
  });

  gameMenuReturn.addEventListener("click", () => {
    if (document.querySelector(".encounter-start")?.matches(":disabled")) {
      mainMenuStatus.textContent = "Termina el combate antes de volver al menú principal.";
      gameMenuPanel.hidden = true;
      gameMenuToggle.setAttribute("aria-expanded", "false");
      return;
    }
    mostrarPantalla("menu");
  });

  optionsClose.addEventListener("click", () => optionsDialog.close());
  optionsPOIOpen.addEventListener("click", () => juego.editorRecursos?.abrir("poi"));
  optionsMapOpen.addEventListener("click", () => juego.editorRecursos?.abrir("mapa"));
  function crearFichaBestiario(entidad, esPersonaje) {
    const card = document.createElement("article");
    card.className = "bestiary-card";
    const image = document.createElement("img");
    image.src = entidad.imagen;
    image.alt = entidad.nombre;
    image.loading = "lazy";
    const content = document.createElement("div");
    content.className = "bestiary-card-content";
    const title = document.createElement("h3");
    title.textContent = entidad.nombre;
    const kind = document.createElement("p");
    kind.className = "bestiary-kind";
    kind.textContent = esPersonaje ? entidad.clase : (entidad.tipo === "criatura" ? "Criatura" : "Enemigo");
    const description = document.createElement("p");
    description.textContent = entidad.descripcion;
    const stats = document.createElement("dl");
    stats.className = "bestiary-stats";
    const values = esPersonaje
      ? [
        ["Nivel", entidad.nivel], ["Vida", entidad.vida.maxima],
        ["Cordura", entidad.cordura.maxima], ["Poder", entidad.poder.maximo],
        ["Ataque", entidad.fuerzaEfectiva + (entidad.equipo.arma?.ataque ?? 0)],
        ["Defensa", entidad.resistenciaFisicaCombate], ["Agilidad", entidad.agilidadEfectiva],
        ["Resist. cordura", entidad.resistenciaCorduraCombate],
      ]
      : [
        ["Nivel", entidad.nivel], ["Vida", entidad.vida.maxima],
        ["Ataque", entidad.ataque], ["Defensa", entidad.resistencia], ["Agilidad", entidad.agilidad],
        ["Resist. cordura", entidad.resistenciaCorduraCombate], ["Poder", entidad.poder.maximo],
      ];
    if (entidad.bonificacionCritico > 0) values.push(["Crítico", `${Math.round(entidad.bonificacionCritico * 100)} %`]);
    if (!esPersonaje && entidad.efectoGolpe?.tipo === "veneno") {
      values.push([
        "Veneno",
        `${Math.round(entidad.efectoGolpe.probabilidad * 100)} % · ${entidad.efectoGolpe.danioPorTurno}/turno · ${entidad.efectoGolpe.duracion} turnos`,
      ]);
    }
    values.forEach(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = String(value);
      stats.append(term, detail);
    });
    content.append(title, kind, description, stats);
    card.append(image, content);
    return card;
  }

  function renderizarBestiario() {
    const entries = [
      ...(juego.personajes ?? []).map((entry) => ({ entry, character: true })),
      ...[...new Map((juego.poolEncuentros ?? []).map((entry) => [entry.id, entry])).values()]
        .map((entry) => ({ entry, character: false })),
    ];
    bestiaryList.replaceChildren(...entries.map(({ entry, character }) => (
      crearFichaBestiario(entry, character)
    )));
  }

  bestiaryBack.addEventListener("click", () => {
    bestiaryScreen.hidden = true;
    mainMenu.hidden = false;
  });
  optionsDialog.addEventListener("click", (event) => {
    if (event.target === optionsDialog) {
      optionsDialog.close();
    }
  });
})();
