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
  const storyModeDialog = document.querySelector(".story-notice-dialog");
  const storyModeClose = storyModeDialog?.querySelector(".story-mode-close");
  const storyModeTitle = storyModeDialog?.querySelector("#story-mode-title");
  const storyModeImage = storyModeDialog?.querySelector(".story-mode-image");
  const storyModeText = storyModeDialog?.querySelector(".story-mode-text");
  const storyModePage = storyModeDialog?.querySelector(".story-mode-page");
  const storyModePrevious = storyModeDialog?.querySelector(".story-mode-previous");
  const storyModeNext = storyModeDialog?.querySelector(".story-mode-next");
  const tutorialDialog = document.querySelector(".tutorial-dialog");
  const tutorialCloseButtons = tutorialDialog?.querySelectorAll(".tutorial-close, .tutorial-close-icon");
  const gameMenuToggle = gameView?.querySelector(".game-menu-toggle");
  const gameMenuPanel = gameView?.querySelector("#game-menu-panel");
  const gameMenuReturn = gameView?.querySelector(".game-menu-return");
  const optionsDialog = document.querySelector(".options-dialog");
  const optionsClose = optionsDialog?.querySelector(".options-back");
  const optionsPOIOpen = optionsDialog?.querySelector(".options-poi-open");
  const optionsMapOpen = optionsDialog?.querySelector(".options-map-open");
  const automaticCombatToggle = optionsDialog?.querySelector("#automatic-combat-toggle");
  const automaticExplorationToggle = optionsDialog?.querySelector("#automatic-exploration-toggle");
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
    || !(storyModeDialog instanceof HTMLDialogElement)
    || !(storyModeClose instanceof HTMLButtonElement)
    || !(storyModeTitle instanceof HTMLElement)
    || !(storyModeImage instanceof HTMLImageElement)
    || !(storyModeText instanceof HTMLElement)
    || !(storyModePage instanceof HTMLElement)
    || !(storyModePrevious instanceof HTMLButtonElement)
    || !(storyModeNext instanceof HTMLButtonElement)
    || !(tutorialDialog instanceof HTMLDialogElement)
    || tutorialCloseButtons.length !== 2
    || !(gameMenuToggle instanceof HTMLButtonElement)
    || !(gameMenuPanel instanceof HTMLElement)
    || !(gameMenuReturn instanceof HTMLButtonElement)
    || !(optionsDialog instanceof HTMLDialogElement)
    || !(optionsClose instanceof HTMLButtonElement)
    || !(optionsPOIOpen instanceof HTMLButtonElement)
    || !(optionsMapOpen instanceof HTMLButtonElement)
    || !(automaticCombatToggle instanceof HTMLInputElement)
    || !(automaticExplorationToggle instanceof HTMLInputElement)) {
    throw new Error("No se pudieron inicializar las pantallas de menú del juego.");
  }

  let adventureStarted = false;
  const historiaInicial = [
    {
      titulo: "La Montaña Negra",
      texto: "Durante generaciones, los pueblos al pie de la montaña evitaron sus senderos. Ahora, una presencia antigua vuelve a llamar desde las profundidades.",
      imagen: "recursos/imagen/historia/caballero_hist/Montana_bg.png",
      alt: "La Montaña Negra bajo un cielo sombrío",
    },
    {
      titulo: "Un llamado en la piedra",
      texto: "Desaparecen viajeros y las galerías se llenan de susurros. Los pocos que regresan hablan de figuras que caminan mucho después de haber muerto.",
      imagen: "recursos/imagen/historia/caballero_hist/Man_in_Armor.png",
      alt: "Una figura acorazada en las galerías oscuras",
    },
    {
      titulo: "Hacia las profundidades",
      texto: "Reúnes a quienes aún se atreven a descender. Cada paso los acerca a los horrores de la montaña y a la voluntad del Dios Negro.",
      imagen: "recursos/imagen/historia/sacerdote_hist/Tentacle.png",
      alt: "Un tentáculo emerge de la oscuridad",
    },
  ];
  let paginaHistoria = 0;
  function renderizarPaginaHistoria() {
    const pagina = historiaInicial[paginaHistoria];
    storyModeTitle.textContent = pagina.titulo;
    storyModeText.textContent = pagina.texto;
    storyModeImage.src = pagina.imagen;
    storyModeImage.alt = pagina.alt;
    storyModeImage.hidden = false;
    storyModePage.textContent = `${paginaHistoria + 1} / ${historiaInicial.length}`;
    storyModePrevious.hidden = paginaHistoria === 0;
    storyModeNext.textContent = paginaHistoria === historiaInicial.length - 1 ? "Comenzar" : "Siguiente";
  }
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

  const explorationStorageKey = "juego.exploracionAutomatica";
  try {
    juego.exploracionAutomatica = window.localStorage.getItem(explorationStorageKey) === "true";
  } catch {
    juego.exploracionAutomatica = false;
  }
  automaticExplorationToggle.checked = juego.exploracionAutomatica;
  automaticExplorationToggle.setAttribute("aria-checked", String(juego.exploracionAutomatica));
  automaticExplorationToggle.addEventListener("change", () => {
    juego.exploracionAutomatica = automaticExplorationToggle.checked;
    automaticExplorationToggle.setAttribute("aria-checked", String(juego.exploracionAutomatica));
    try {
      window.localStorage.setItem(explorationStorageKey, String(juego.exploracionAutomatica));
    } catch {
      // La opción se mantiene activa durante esta sesión.
    }
    juego.mazmorra?.setExploracionAutomatica?.(juego.exploracionAutomatica);
  });

  // --- Música ---
  // Canción fija del menú y preferencia de encendido/apagado persistida.
  const MENU_MUSIC_SRC = "recursos/sonidos/menu.mp3";
  const EXPLORATION_MUSIC_SRCS = [
    "recursos/sonidos/ambiance_1.mp3",
    "recursos/sonidos/ambiance_2.mp3",
  ];
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
    return mapa?.audio ?? EXPLORATION_MUSIC_SRCS;
  }

  // Al explorar usa la música propia del mapa o alterna las pistas de ambiente.
  // El switch controla la música tanto en el menú como durante la partida.
  function aplicarMusicaContexto(enElMapa) {
    if (!juego.musica) return;
    const pista = musicaActiva ? (enElMapa ? audioMapaActivo() : MENU_MUSIC_SRC) : null;
    juego.musica.reproducir(pista);
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
      aplicarMusicaContexto(!gameView.hidden);
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
          juego.mazmorra?.setExploracionAutomatica?.(juego.exploracionAutomatica);
        }
        break;
      case "new":
        mainMenuStatus.textContent = "";
        juego.modoPartida = "historia";
        paginaHistoria = 0;
        renderizarPaginaHistoria();
        storyModeDialog.showModal();
        break;
      case "skirmish":
        juego.modoPartida = "escaramuza";
        juego.rondaEscaramuza = 1;
        juego.encuentrosExtraEscaramuza = 0;
        juego.tamanoBaseEscaramuza = 15;
        juego.gruposBaseEscaramuza = 3;
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
      case "tutorial":
        tutorialDialog.showModal();
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
    juego.mazmorra?.reiniciarFatigaExploracion?.();
    juego.mazmorra?.iniciar();
    mostrarPantalla("game");
    juego.mazmorra?.setExploracionAutomatica?.(juego.exploracionAutomatica);
  });
  adventureIntroDialog.addEventListener("click", (event) => {
    if (event.target === adventureIntroDialog) adventureIntroDialog.close();
  });
  storyModeClose.addEventListener("click", () => storyModeDialog.close());
  storyModePrevious.addEventListener("click", () => {
    paginaHistoria = Math.max(0, paginaHistoria - 1);
    renderizarPaginaHistoria();
  });
  storyModeNext.addEventListener("click", () => {
    if (paginaHistoria < historiaInicial.length - 1) {
      paginaHistoria += 1;
      renderizarPaginaHistoria();
      return;
    }
    storyModeDialog.close();
    adventureIntroDialog.showModal();
  });
  storyModeDialog.addEventListener("click", (event) => {
    if (event.target === storyModeDialog) storyModeDialog.close();
  });
  tutorialCloseButtons.forEach((button) => {
    button.addEventListener("click", () => tutorialDialog.close());
  });
  tutorialDialog.addEventListener("click", (event) => {
    if (event.target === tutorialDialog) tutorialDialog.close();
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
  optionsDialog.addEventListener("close", () => {
    juego.mazmorra?.setExploracionAutomatica?.(juego.exploracionAutomatica);
  });
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
        ["Resist. mágica", entidad.resistenciaMagicaCombate],
      ]
      : [
        ["Nivel", entidad.nivel], ["Vida", entidad.vida.maxima],
        ["Ataque", entidad.ataque], ["Defensa", entidad.resistencia], ["Agilidad", entidad.agilidad],
        ["Resist. cordura", entidad.resistenciaCorduraCombate],
        ["Resist. mágica", entidad.resistenciaMagicaCombate], ["Poder", entidad.poder.maximo],
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
