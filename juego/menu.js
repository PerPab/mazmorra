(function inicializarMenus() {
  const juego = window.juego;
  const mainMenu = document.querySelector("#main-menu-screen");
  const charactersScreen = document.querySelector("#chosen-characters-screen");
  const gameView = document.querySelector("#game-view");
  const mainMenuStatus = mainMenu?.querySelector(".main-menu-status");
  const continueButton = mainMenu?.querySelector('[data-menu-action="continue"]');
  const characterGrid = charactersScreen?.querySelector(".chosen-characters-grid");
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

  if (!juego
    || !Array.isArray(juego.personajes)
    || !(mainMenu instanceof HTMLElement)
    || !(charactersScreen instanceof HTMLElement)
    || !(gameView instanceof HTMLElement)
    || !(mainMenuStatus instanceof HTMLElement)
    || !(continueButton instanceof HTMLButtonElement)
    || !(characterGrid instanceof HTMLElement)
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

  function mostrarPantalla(pantalla) {
    mainMenu.hidden = pantalla !== "menu";
    charactersScreen.hidden = pantalla !== "characters";
    gameView.hidden = pantalla !== "game";
    if (pantalla !== "game") {
      gameMenuPanel.hidden = true;
      gameMenuToggle.setAttribute("aria-expanded", "false");
    }
  }

  function renderizarElegidos() {
    characterGrid.replaceChildren();
    juego.personajes.forEach((personaje) => {
      const card = document.createElement("article");
      card.className = "chosen-character-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      card.setAttribute("aria-label", `Leer el trasfondo de ${personaje.nombre}`);

      const portrait = document.createElement("img");
      portrait.className = "chosen-character-portrait";
      portrait.src = personaje.imagen;
      portrait.alt = `Retrato de ${personaje.nombre}`;

      const content = document.createElement("div");
      content.className = "chosen-character-content";

      const className = document.createElement("p");
      className.className = "chosen-character-class";
      className.textContent = personaje.clase;

      const name = document.createElement("h2");
      name.textContent = personaje.nombre;

      const passiveTitle = document.createElement("h3");
      passiveTitle.textContent = "Pasiva";
      const passive = document.createElement("p");
      passive.textContent = personaje.pasiva;

      const abilityTitle = document.createElement("h3");
      abilityTitle.textContent = "Habilidad de grupo";
      const ability = document.createElement("p");
      ability.textContent = personaje.habilidadGrupo;

      content.append(className, name, passiveTitle, passive, abilityTitle, ability);
      card.append(portrait, content);
      card.personaje = personaje;
      characterGrid.append(card);
    });
  }

  function agregarParrafo(texto) {
    if (typeof texto !== "string" || !texto.trim()) {
      return;
    }
    const paragraph = document.createElement("p");
    paragraph.textContent = texto;
    storyContent.append(paragraph);
  }

  function mostrarTrasfondo(personaje) {
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
    storyDialog.addEventListener("close", () => {
      const selectedCard = [...characterGrid.querySelectorAll(".chosen-character-card")]
        .find((card) => card.personaje === personaje);
      selectedCard?.focus();
    }, { once: true });
    storyClose.focus();
  }

  characterGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const card = event.target.closest(".chosen-character-card");
    if (!(card instanceof HTMLElement) || !card.personaje) {
      return;
    }
    mostrarTrasfondo(card.personaje);
  });

  characterGrid.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLElement)
      || !event.target.matches(".chosen-character-card")
      || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    event.target.click();
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
      case "characters":
        renderizarElegidos();
        mostrarPantalla("characters");
        break;
      case "options":
        optionsDialog.showModal();
        break;
      default:
        throw new Error(`Opción de menú desconocida: "${button.dataset.menuAction}".`);
    }
  });

  charactersScreen.querySelector(".chosen-characters-back")?.addEventListener("click", () => {
    mostrarPantalla("menu");
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
  optionsDialog.addEventListener("click", (event) => {
    if (event.target === optionsDialog) {
      optionsDialog.close();
    }
  });
})();
