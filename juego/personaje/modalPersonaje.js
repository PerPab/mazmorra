(function inicializarModalPersonaje() {
  // Busca las tarjetas y el diálogo de ficha en la interfaz.
  const playerBar = document.querySelector(".player-bar");
  const characterDialog = document.querySelector(".character-dialog");
  const characters = window.juego?.personajes;

  if (!(playerBar instanceof HTMLElement)) {
    throw new Error('No se encontró el contenedor ".player-bar".');
  }

  if (!(characterDialog instanceof HTMLDialogElement)) {
    throw new Error('No se encontró el diálogo ".character-dialog".');
  }

  if (!Array.isArray(characters)) {
    throw new Error("No se cargaron los personajes jugables.");
  }

  // Estos son los atributos que pueden mejorarse con puntos de habilidad.
  const upgradableAttributes = [
    ["resistenciaFisica", "Resistencia física"],
    ["resistenciaCordura", "Resistencia de cordura"],
    ["fuerza", "Fuerza"],
    ["agilidad", "Agilidad"],
  ];

  let activeCharacter = null;
  let characterDraft = null;

  function obtenerBonificacionEquipo(character, attribute) {
    return Object.values(character.equipo).reduce(
      (total, item) => total + (item?.bonificaciones?.[attribute] ?? 0),
      0,
    );
  }

  function etiquetaAtributo(attribute) {
    return ({ resistenciaFisica: "resistencia física", resistenciaCordura: "resistencia de cordura", fuerza: "fuerza", agilidad: "agilidad", poder: "poder" })[attribute] ?? attribute;
  }

  function actualizarBonificacionPoder(character) {
    const total = character.obtenerBonificacionEquipo("poder");
    character.poder.maximo = Math.max(1, character.poderMaximoBase + total);
    character.poder.actual = Math.min(character.poder.actual, character.poder.maximo);
    character._bonificacionPoderEquipo = total;
  }

  // Crea una copia editable para que cerrar el modal descarte los cambios.
  function createCharacterDraft(character) {
    return {
      skillPoints: character.puntosHabilidad,
      attributes: Object.fromEntries(
        upgradableAttributes.map(([key]) => [key, character[key]]),
      ),
      originalAttributes: Object.fromEntries(
        upgradableAttributes.map(([key]) => [key, character[key]]),
      ),
    };
  }

  // Actualiza valores y controles de los atributos según el borrador.
  function renderAttributes() {
    if (!characterDraft) {
      return;
    }

    const points = characterDialog.querySelector(".skill-points strong");
    const attributeList = characterDialog.querySelector(".attribute-list");
    if (!(points instanceof HTMLElement) || !(attributeList instanceof HTMLUListElement)) {
      throw new Error("Faltan los controles de atributos en la ficha del personaje.");
    }

    points.textContent = String(characterDraft.skillPoints);
    attributeList.replaceChildren();

    upgradableAttributes.forEach(([key, label]) => {
      const row = document.createElement("li");
      row.className = "attribute-row";

      const attributeName = document.createElement("span");
      attributeName.textContent = label;

      const controls = document.createElement("span");
      controls.className = "attribute-controls";

      const value = document.createElement("span");
      value.className = "attribute-value";
      const equipmentBonus = obtenerBonificacionEquipo(activeCharacter, key);
      const baseValue = document.createElement("span");
      baseValue.textContent = String(characterDraft.attributes[key]);
      value.append(baseValue);
      if (equipmentBonus !== 0) {
        const bonus = document.createElement("span");
        bonus.className = "attribute-equipment-bonus";
        bonus.textContent = equipmentBonus > 0 ? `+${equipmentBonus}` : `−${Math.abs(equipmentBonus)}`;
        bonus.title = "Bonificación de armadura";
        bonus.setAttribute("aria-label", `más ${equipmentBonus} por equipo`);
        value.append(bonus);
      }

      const pointButtons = document.createElement("span");
      pointButtons.className = "attribute-point-buttons";

      const decreaseButton = document.createElement("button");
      decreaseButton.className = "attribute-decrease";
      decreaseButton.type = "button";
      decreaseButton.dataset.attribute = key;
      decreaseButton.textContent = "−";
      decreaseButton.disabled = characterDraft.attributes[key] <= characterDraft.originalAttributes[key];
      decreaseButton.setAttribute("aria-label", `Quitar un punto de ${label}`);

      const increaseButton = document.createElement("button");
      increaseButton.className = "attribute-increase";
      increaseButton.type = "button";
      increaseButton.dataset.attribute = key;
      increaseButton.textContent = "+";
      increaseButton.disabled = characterDraft.skillPoints === 0 || characterDraft.attributes[key] >= 10;
      increaseButton.setAttribute("aria-label", `Aumentar ${label}`);

      pointButtons.append(decreaseButton, increaseButton);
      controls.append(value, pointButtons);
      row.append(attributeName, controls);
      attributeList.append(row);
    });

  }

  // Rellena la ficha usando la instancia real del personaje seleccionado.
  function openCharacterDialog(character) {
    const title = characterDialog.querySelector("#character-dialog-title");
    const meta = characterDialog.querySelector(".character-meta");
    const portrait = characterDialog.querySelector(".dialog-portrait");
    const passive = characterDialog.querySelector(".character-passive");
    const buff = characterDialog.querySelector(".character-buff");

    if (
      !(title instanceof HTMLElement)
      || !(meta instanceof HTMLElement)
      || !(portrait instanceof HTMLImageElement)
      || !(passive instanceof HTMLElement)
      || !(buff instanceof HTMLElement)
    ) {
      throw new Error("Faltan elementos necesarios en la ficha del personaje.");
    }

    activeCharacter = character;
    characterDraft = createCharacterDraft(character);
    title.textContent = character.nombre;
    meta.textContent = `${character.clase} · Nivel ${character.nivel}`;
    portrait.src = character.imagen;
    portrait.alt = `Retrato de ${character.nombre}`;
    passive.textContent = character.pasiva;
    buff.textContent = character.habilidadGrupo;

    const resources = [
      ["vida", character.vida],
      ["cordura", character.cordura],
      ["poder", character.poder],
    ];
    resources.forEach(([key, resource]) => {
      const value = characterDialog.querySelector(`[data-resource="${key}"]`);
      if (!(value instanceof HTMLElement)) {
        throw new Error(`Falta el campo del recurso "${key}" en la ficha.`);
      }

      const maximum = resource.maxima ?? resource.maximo;
      value.textContent = `${resource.actual} / ${maximum}`;
    });

    const equipmentBySlot = {
      arma: character.equipo.arma,
      armadura: character.equipo.armadura,
      especial: character.equipo.especial,
    };
    characterDialog.querySelectorAll("[data-equipment]").forEach((element) => {
      if (element instanceof HTMLElement) {
        const item = equipmentBySlot[element.dataset.equipment];
        element.replaceChildren();
        if (item) {
          element.append(document.createTextNode(item.nombre));
          const bonuses = Object.entries(item.bonificaciones ?? {})
            .filter(([, value]) => value > 0)
            .map(([key, value]) => `+${value} ${etiquetaAtributo(key)}`);
          if (item.categoria === "arma") bonuses.unshift(`+${item.ataque} ataque`);
          if (item.categoria === "arma" && item.danioAgilidad > 0) bonuses.push(`−${item.danioAgilidad} agilidad al objetivo`);
          if (item.categoria === "arma" && item.danioPoder > 0) bonuses.push(`−${item.danioPoder} poder al objetivo`);
          bonuses.forEach((bonusText) => {
            const bonus = document.createElement("span");
            bonus.className = "equipment-stat-bonus";
            bonus.textContent = bonusText;
            bonus.title = `Bonificación de ${item.nombre}`;
            element.append(bonus);
          });
          //if (item.danioMoral > 0) {
          //  const moralBonus = document.createElement("span");
          //  moralBonus.className = "equipment-stat-bonus";
          //  moralBonus.textContent = `+${item.danioMoral} daño moral`;
          //  moralBonus.title = `Daño moral de ${item.nombre}`;
          //  element.append(moralBonus);
          //}
          if (item.proteccionCordura > 0) {
            const sanityProtection = document.createElement("span");
            sanityProtection.className = "equipment-stat-bonus";
            sanityProtection.textContent = `−${item.proteccionCordura} pérdida de cordura`;
            sanityProtection.title = `Protección de cordura de ${item.nombre}`;
            element.append(sanityProtection);
          }
          if (item.proteccionMoral > 0) {
            const moraleProtection = document.createElement("span");
            moraleProtection.className = "equipment-stat-bonus";
            moraleProtection.textContent = `−${item.proteccionMoral} pérdida de moral`;
            moraleProtection.title = `Protección moral de ${item.nombre}`;
            element.append(moraleProtection);
          }
        } else {
          element.textContent = "Sin equipo";
        }
      }
    });

    renderAttributes();
    if (!characterDialog.open) {
      characterDialog.showModal();
    }
  }

  // Cierra la ficha; Escape y la X descartan el borrador sin alterar el personaje.
  const closeButton = characterDialog.querySelector(".dialog-close");
  if (!(closeButton instanceof HTMLButtonElement)) {
    throw new Error("Falta el botón para cerrar la ficha del personaje.");
  }

  closeButton.addEventListener("click", () => characterDialog.close());
  characterDialog.addEventListener("click", (event) => {
    if (event.target === characterDialog) {
      characterDialog.close();
    }
  });
  characterDialog.addEventListener("close", () => {
    activeCharacter = null;
    characterDraft = null;
  });

  // Confirma de una vez los atributos y puntos editados en el borrador.
  const acceptButton = characterDialog.querySelector(".dialog-accept");
  if (!(acceptButton instanceof HTMLButtonElement)) {
    throw new Error("Falta el botón para aceptar los cambios de la ficha.");
  }

  acceptButton.addEventListener("click", () => {
    if (!activeCharacter || !characterDraft) {
      return;
    }

    activeCharacter.puntosHabilidad = characterDraft.skillPoints;
    upgradableAttributes.forEach(([key]) => {
      activeCharacter[key] = characterDraft.attributes[key];
    });
    actualizarBonificacionPoder(activeCharacter);
    juego.actualizarRecursosTarjeta(activeCharacter.id);
    characterDialog.close();
  });

  // Los botones de puntos modifican solo el borrador hasta pulsar Aceptar.
  characterDialog.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !characterDraft) {
      return;
    }

    const button = event.target.closest(".attribute-increase, .attribute-decrease");
    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }

    const attribute = button.dataset.attribute;
    if (!attribute || !(attribute in characterDraft.attributes)) {
      return;
    }

    if (button.classList.contains("attribute-increase")) {
      if (characterDraft.skillPoints < 1 || characterDraft.attributes[attribute] >= 10) {
        return;
      }

      characterDraft.attributes[attribute] += 1;
      characterDraft.skillPoints -= 1;
    } else {
      if (characterDraft.attributes[attribute] <= characterDraft.originalAttributes[attribute]) {
        return;
      }

      characterDraft.attributes[attribute] -= 1;
      characterDraft.skillPoints += 1;
    }

    renderAttributes();
  });

  // Abre la ficha de cada personaje al pulsar su tarjeta, salvo en las flechas de posición.
  playerBar.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || event.target.closest(".move-button")) {
      return;
    }

    const card = event.target.closest(".player-card");
    if (!(card instanceof HTMLElement)) {
      return;
    }

    const character = characters.find((entry) => entry.id === card.dataset.characterId);
    if (!character) {
      throw new Error(`No se encontró el personaje "${card.dataset.characterId}".`);
    }

    openCharacterDialog(character);
  });
})();
