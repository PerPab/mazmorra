(function inicializarEquipo() {
  const juego = window.juego;
  const inventario = window.inventarioGrupo;
  const actionDialog = document.querySelector(".equipment-actions-dialog");
  const title = actionDialog?.querySelector("#equipment-actions-title");
  const description = actionDialog?.querySelector(".equipment-actions-description");
  const unequipButton = actionDialog?.querySelector(".equipment-unequip");
  const dropButton = actionDialog?.querySelector(".equipment-drop");
  const closeButton = actionDialog?.querySelector(".equipment-actions-close");
  const inventoryDialog = document.querySelector(".inventory-item-dialog");
  const inventoryTitle = inventoryDialog?.querySelector("#inventory-item-title");
  const inventoryDescription = inventoryDialog?.querySelector(".inventory-item-description");
  const inventoryImage = inventoryDialog?.querySelector(".inventory-item-image");
  const characterOptions = inventoryDialog?.querySelector(".inventory-character-options");
  const equipUseButton = inventoryDialog?.querySelector(".inventory-equip-use");
  const inventoryDropButton = inventoryDialog?.querySelector(".inventory-drop");
  const inventoryCloseButton = inventoryDialog?.querySelector(".inventory-item-close");
  const inventoryGrid = document.querySelector(".inventory-grid");

  if (!juego || !Array.isArray(juego.personajes) || !inventario) {
    throw new Error("No se cargaron los personajes o el inventario para gestionar el equipo.");
  }
  if (!(actionDialog instanceof HTMLDialogElement)
    || !(title instanceof HTMLElement)
    || !(description instanceof HTMLElement)
    || !(unequipButton instanceof HTMLButtonElement)
    || !(dropButton instanceof HTMLButtonElement)
    || !(closeButton instanceof HTMLButtonElement)) {
    throw new Error("Faltan controles para las acciones del equipo.");
  }
  if (!(inventoryDialog instanceof HTMLDialogElement)
    || !(inventoryTitle instanceof HTMLElement)
    || !(inventoryDescription instanceof HTMLElement)
    || !(inventoryImage instanceof HTMLImageElement)
    || !(characterOptions instanceof HTMLElement)
    || !(equipUseButton instanceof HTMLButtonElement)
    || !(inventoryDropButton instanceof HTMLButtonElement)
    || !(inventoryCloseButton instanceof HTMLButtonElement)
    || !(inventoryGrid instanceof HTMLOListElement)) {
    throw new Error("Faltan controles para equipar objetos desde el inventario.");
  }

  let activeCharacter = null;
  let activeSlot = null;
  let activeInventorySlot = null;

  function buscarPersonaje(id) {
    const character = juego.personajes.find((entry) => entry.id === id);
    if (!character) {
      throw new Error(`No existe un personaje con el identificador "${id}".`);
    }
    return character;
  }

  function clasePuedeEquipar(character, item) {
    if (character.vida.actual <= 0) return false;
    const clase = character.clase.toLowerCase();
    const claseMagica = ["bruja", "sacerdote"].includes(clase);
    const tipoArma = item.tipo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const tipoArmadura = item.categoria === "armadura"
      ? item.tipo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? ""
      : "";
    const esFocoMagico = item.categoria === "arma" && ["baston", "varita", "libro"].includes(tipoArma);
    if (["caballero", "asesino"].includes(clase) && esFocoMagico) return false;
    if (clase === "caballero" && item.categoria === "armadura" && !tipoArmadura.startsWith("pesada")) return false;
    const equipoMagicoPermitido = item.magico
      && ["arma", "armadura", "especial"].includes(item.categoria)
      && ["caballero", "asesino"].includes(clase);
    return (!item.magico || claseMagica || equipoMagicoPermitido)
      && (item.clasesPermitidas.includes("todas")
        || item.clasesPermitidas.includes(clase)
        || equipoMagicoPermitido);
  }

  function personajePuedeUsar(character, item) {
    return clasePuedeEquipar(character, item);
  }

  function describirEstadisticas(item) {
    const etiquetas = {
      resistenciaFisica: "Protección",
      resistenciaCordura: "Resistencia de cordura",
      resistenciaMagica: "Resistencia mágica",
      fuerza: "Fuerza",
      agilidad: "Agilidad",
      poder: "Poder máximo",
      vida: "Vida máxima",
      cordura: "Cordura máxima",
      puntosAccion: "Puntos de acción",
      danioFisico: "Daño físico",
      danioMagico: "Daño mágico",
      bonificacionCritico: "Crítico",
    };
    const stats = Object.entries(item.bonificaciones ?? {})
      .filter(([, valor]) => valor !== 0)
      .map(([atributo, valor]) => atributo === "bonificacionCritico"
        ? `${etiquetas[atributo]} +${Math.round(valor * 100)} %`
        : `${etiquetas[atributo] ?? atributo} ${valor > 0 ? "+" : "−"}${Math.abs(valor)}`);

    if (item.categoria === "arma") {
      if (item.ataque > 0) stats.unshift(`Daño físico +${item.ataque}`);
      if (item.danioMoral > 0) stats.push(`Daño moral +${item.danioMoral}`);
      if (item.danioAgilidad > 0) stats.push(`Daño a agilidad −${item.danioAgilidad}`);
      if (item.danioPoder > 0) stats.push(`Daño a poder −${item.danioPoder}`);
      const contraBlindado = item.bonificacionesContra?.blindado ?? 0;
      const contraMaldito = item.bonificacionesContra?.maldito ?? 0;
      if (contraBlindado > 0) stats.push(`Contra blindados +${Math.round(contraBlindado * 100)} % daño`);
      if (contraMaldito > 0) stats.push(`Contra malditos +${Math.round(contraMaldito * 100)} % daño`);
    }

    if (item.categoria === "armadura" && stats.length === 0) {
      stats.push("Sin bonificaciones de atributos");
    }
    if (["arma", "armadura"].includes(item.categoria)) {
      stats.push(`Estado ${item.etiquetaEstado} (${Math.round(item.eficaciaEstado * 100)} %)`);
    }
    return stats.join(" · ");
  }

  function describirObjeto(item) {
    if (item.esObjetoMision) return `${item.descripcion} Solo se utiliza en puntos de interés.`;
    if (item.revivir) return `${item.descripcion} Restaura el 25 % de la vida máxima al aliado elegido.`;
    if (item.categoria === "especial" && item.tipo === "anillo") {
      const stats = describirEstadisticas(item);
      const protecciones = [
        item.proteccionCordura > 0 ? `−${item.proteccionCordura} pérdida de Cordura` : "",
        item.proteccionMoral > 0 ? `−${item.proteccionMoral} pérdida de Moral` : "",
      ].filter(Boolean);
      return [item.descripcion, stats, ...protecciones].filter(Boolean).join(" · ");
    }
    if (!["arma", "armadura"].includes(item.categoria)) return item.descripcion;
    return `${item.descripcion} Estado: ${item.etiquetaEstado} (${Math.round(item.eficaciaEstado * 100)} % de eficacia).`;
  }

  function personajePuedeRecibirBonificacion(character, item) {
    const resources = {
      vida: character.vida,
      cordura: character.cordura,
      poder: character.poder,
    };
    return Object.entries(item.bonificacion).some(([key, bonus]) => {
      const resource = resources[key];
      const maximum = resource.maxima ?? resource.maximo;
      return bonus > 0 && resource.actual < maximum;
    });
  }

  function actualizarPersonaje(character) {
    recalcularBonificacionPoder(character);
    juego.actualizarRecursosTarjeta(character.id);
  }

  function recalcularBonificacionPoder(character) {
    const total = character.obtenerBonificacionEquipo("poder");
    character.poder.maximo = Math.max(1, Math.round(character.poderMaximoBase + total));
    character.poder.actual = Math.max(0, Math.min(
      character.poder.maximo,
      character.poder.actual,
    ));
    character._bonificacionPoderEquipo = total;
  }

  // Equipa desde un espacio del inventario y devuelve el objeto anterior a ese mismo espacio.
  function equiparDesdeInventario(numeroEspacio, personajeId) {
    if (!Number.isInteger(numeroEspacio) || numeroEspacio < 1 || numeroEspacio > inventario.items.length) {
      throw new RangeError(`El espacio debe ser un número entre 1 y ${inventario.items.length}.`);
    }

    const character = buscarPersonaje(personajeId);
    const index = numeroEspacio - 1;
    const item = inventario.items[index];
    if (!item) {
      throw new Error(`El espacio ${numeroEspacio} del inventario está vacío.`);
    }

    const slotName = item.categoria === "armadura"
      ? "armadura"
      : item.categoria === "arma"
        ? "arma"
        : item.categoria === "especial"
          ? "especial"
          : null;
    if (!slotName) {
      throw new Error(`La categoría "${item.categoria}" no tiene un espacio de equipo.`);
    }

    if (!clasePuedeEquipar(character, item)) {
      throw new Error(`${character.nombre} no puede equipar ${item.nombre}.`);
    }

    const previousItem = character.equipo[slotName];
    character.equipo[slotName] = item;
    inventario.items[index] = previousItem;
    inventario.actualizar();
    actualizarPersonaje(character);
    juego.sonidos?.reproducir("inventario");
    return previousItem;
  }

  // Devuelve el objeto equipado al inventario; si no hay espacio, no modifica el equipo.
  function desequipar(personajeId, slotName) {
    const character = buscarPersonaje(personajeId);
    if (!(slotName in character.equipo)) {
      throw new RangeError(`El espacio de equipo "${slotName}" no existe.`);
    }

    const item = character.equipo[slotName];
    if (!item) {
      throw new Error(`El espacio "${slotName}" está vacío.`);
    }

    if (!inventario.items.includes(null)) {
      throw new Error("El inventario está lleno.");
    }
    inventario.agregarItem(item);
    character.equipo[slotName] = null;
    recalcularBonificacionPoder(character);
    actualizarPersonaje(character);
    juego.sonidos?.reproducir("inventario");
    return item;
  }

  // Descarta el objeto equipado, sin añadirlo al inventario.
  function soltar(personajeId, slotName) {
    const character = buscarPersonaje(personajeId);
    if (!(slotName in character.equipo)) {
      throw new RangeError(`El espacio de equipo "${slotName}" no existe.`);
    }

    const item = character.equipo[slotName];
    if (!item) {
      throw new Error(`El espacio "${slotName}" está vacío.`);
    }

    character.equipo[slotName] = null;
    recalcularBonificacionPoder(character);
    actualizarPersonaje(character);
    return item;
  }

  // Aplica la restauración del consumible sin superar máximos y lo consume solo si tuvo efecto.
  function usarConsumible(numeroEspacio, personajeId, usuarioId = personajeId) {
    if (!Number.isInteger(numeroEspacio) || numeroEspacio < 1 || numeroEspacio > inventario.items.length) {
      throw new RangeError(`El espacio debe ser un número entre 1 y ${inventario.items.length}.`);
    }

    const character = buscarPersonaje(personajeId);
    const usuario = buscarPersonaje(usuarioId);
    const index = numeroEspacio - 1;
    const item = inventario.items[index];
    if (!item) {
      throw new Error(`El espacio ${numeroEspacio} del inventario está vacío.`);
    }
    if (item.categoria !== "consumible") {
      throw new TypeError(`${item.nombre} no es un consumible.`);
    }
    if (!item.revivir && !personajePuedeUsar(usuario, item)) {
      throw new Error(`${usuario.nombre} no puede usar ${item.nombre}.`);
    }

    if (item.revivir) {
      if (character.vida.actual > 0) {
        throw new Error(`${character.nombre} no necesita ser revivido.`);
      }
      character.vida.actual = 1;
      juego.actualizarRecursosTarjeta(character.id);
      juego.actualizarBonificacionesGrupales?.();
      character.vida.actual = Math.max(1, Math.ceil(character.vida.maxima * 0.25));
      inventario.items[index] = null;
      inventario.actualizar();
      actualizarPersonaje(character);
      juego.sonidos?.reproducir("inventario");
      juego.registrarNovedad?.(`${character.nombre} acaba de revivir y te mira con la mirada vidriosa.`);
      return item;
    }

    const resources = {
      vida: character.vida,
      cordura: character.cordura,
      poder: character.poder,
    };
    const updatedValues = Object.entries(item.bonificacion).map(([key, bonus]) => {
      const resource = resources[key];
      if (!resource) {
        throw new Error(`El consumible ${item.nombre} tiene una bonificación no compatible: "${key}".`);
      }
      const maximum = resource.maxima ?? resource.maximo;
      const curacionSacerdote = key === "vida"
        && usuario.id === "sacerdote-condenado"
        && item.magico;
      const bonusAplicado = curacionSacerdote ? Math.round(bonus * 1.1) : bonus;
      return [key, resource, Math.min(maximum, resource.actual + bonusAplicado)];
    });

    if (updatedValues.every(([, resource, value]) => resource.actual === value)) {
      throw new Error(`${character.nombre} no necesita ninguno de los recursos de ${item.nombre}.`);
    }

    const etiquetasRecurso = { vida: "vida", cordura: "cordura", poder: "poder" };
    const recuperaciones = updatedValues
      .map(([key, resource, value]) => ({
        etiqueta: etiquetasRecurso[key] ?? key,
        cantidad: value - resource.actual,
      }))
      .filter((recuperacion) => recuperacion.cantidad > 0)
      .map((recuperacion) => `${recuperacion.cantidad} de ${recuperacion.etiqueta}`);

    updatedValues.forEach(([, resource, value]) => {
      resource.actual = value;
    });
    inventario.items[index] = null;
    inventario.actualizar();
    actualizarPersonaje(character);
    juego.sonidos?.reproducir("inventario");
    const detalleRecuperacion = recuperaciones.join(" y ");
    const mensaje = usuario.id === character.id
      ? `${usuario.nombre} consumió ${item.nombre} y ahora se siente mejor. Recupera ${detalleRecuperacion}.`
      : `${usuario.nombre} usó ${item.nombre} sobre ${character.nombre}. Recupera ${detalleRecuperacion}.`;
    juego.registrarNovedad?.(mensaje);
    return item;
  }

  function cerrarDialogoAcciones() {
    actionDialog.close();
    activeCharacter = null;
    activeSlot = null;
  }

  function cerrarDialogoInventario() {
    inventoryDialog.close();
    activeInventorySlot = null;
  }

  function mostrarOpcionesPersonaje(item, slotNumber) {
    characterOptions.replaceChildren();
    const isConsumable = item.categoria === "consumible";
    const isRevivePotion = Boolean(item.revivir);
    const combat = isConsumable ? juego.combate?.obtenerEstadoConsumible(item) : null;
    const eligibleCharacters = juego.personajes.filter((character) =>
      isRevivePotion
        ? character.vida.actual <= 0
        : isConsumable
        ? personajePuedeRecibirBonificacion(character, item)
          && (combat?.enCurso
            ? combat.disponible
              && (character.id === combat.personajeEnTurno?.id
                ? combat.personajeEnTurno.puntosAccionTurno >= 2
                : combat.personajeEnTurno.puntosAccionTurno >= 3)
            : !item.magico || personajePuedeUsar(character, item))
        : clasePuedeEquipar(character, item),
    );

    if (combat?.enCurso && !combat.disponible) {
      inventoryDescription.textContent = combat.motivo;
      characterOptions.hidden = true;
      equipUseButton.textContent = item.categoria === "consumible" ? (item.revivir ? "Revivir" : "Usar") : "Equipar";
      equipUseButton.disabled = true;
      return;
    }

    juego.personajes.forEach((character) => {
      if (!isConsumable && !clasePuedeEquipar(character, item)) {
        return;
      }
      if (isConsumable && !combat?.enCurso && item.magico && !personajePuedeUsar(character, item)) {
        return;
      }
      if (isRevivePotion && character.vida.actual > 0) {
        return;
      }
      if (isConsumable && !isRevivePotion
        && !personajePuedeRecibirBonificacion(character, item)) {
        return;
      }

      const characterButton = document.createElement("button");
      characterButton.type = "button";
      characterButton.textContent = isConsumable
        ? isRevivePotion
          ? character.nombre
          : eligibleCharacters.includes(character)
          ? `${character.nombre}${combat?.enCurso ? ` · ${character.id === combat.personajeEnTurno?.id ? 2 : 3} PA` : ""}`
          : `${character.nombre} (sin recursos que recuperar)`
        : character.nombre;
      characterButton.disabled = isConsumable && !eligibleCharacters.includes(character);
      characterButton.addEventListener("click", () => {
        if (activeInventorySlot === null) {
          throw new Error("No hay un objeto seleccionado en el inventario.");
        }

        if (isConsumable) {
          if (combat?.enCurso) {
            juego.combate.usarConsumibleEnTurno(slotNumber, character.id);
          } else {
            usarConsumible(slotNumber, character.id);
          }
        } else {
          equiparDesdeInventario(slotNumber, character.id);
        }
        cerrarDialogoInventario();
      });
      characterOptions.append(characterButton);
    });

    inventoryDescription.textContent = isRevivePotion
      ? eligibleCharacters.length > 0
        ? "Elige a quién quieres devolver a la vida:"
        : "No hay miembros caídos que puedan recibir esta poción."
      : isConsumable
      ? eligibleCharacters.length > 0
        ? "Elige quién recibirá el objeto:"
        : "Ningún personaje necesita recuperar estos recursos."
      : eligibleCharacters.length > 0
        ? "Elige quién equipará el objeto:"
        : "Ningún personaje puede equipar este objeto.";
    characterOptions.hidden = false;
    equipUseButton.textContent = "Volver";
    equipUseButton.disabled = false;
  }

  // El objeto se muestra primero; la selección del personaje es un paso explícito.
  inventoryGrid.addEventListener("click", (clickEvent) => {
    const itemButton = clickEvent.target instanceof Element
      ? clickEvent.target.closest(".inventory-item-button")
      : null;
    if (!(itemButton instanceof HTMLButtonElement)) {
      return;
    }

    const slotNumber = Number(itemButton.dataset.inventorySlot);
    const item = inventario.items[slotNumber - 1];
    if (!item) {
      throw new Error(`El espacio ${slotNumber} del inventario está vacío.`);
    }

    activeInventorySlot = slotNumber;
    inventoryTitle.textContent = item.nombre;
    characterOptions.hidden = true;
    inventoryDescription.textContent = describirObjeto(item);
    inventoryImage.src = item.imagen;
    inventoryImage.alt = `Imagen de ${item.nombre}`;
    inventoryImage.hidden = false;
    equipUseButton.disabled = item.esObjetoMision
      || !["arma", "armadura", "especial", "consumible"].includes(item.categoria);
    if (item.revivir && !juego.personajes.some((character) => character.vida.actual <= 0)) {
      equipUseButton.disabled = true;
      inventoryDescription.textContent = `${describirObjeto(item)} Todavía no hay aliados caídos.`;
    }
    inventoryDropButton.disabled = Boolean(item.esObjetoMision);
    const combat = item.categoria === "consumible" ? juego.combate?.obtenerEstadoConsumible(item) : null;
    if (combat?.enCurso && !combat.disponible) {
      equipUseButton.disabled = true;
      inventoryDescription.textContent = `${describirObjeto(item)} ${combat.motivo}`;
    }
    equipUseButton.textContent = item.categoria === "consumible" ? (item.revivir ? "Revivir" : "Usar") : "Equipar";

    if (!inventoryDialog.open) {
      inventoryDialog.showModal();
    }
  });

  equipUseButton.addEventListener("click", () => {
    if (activeInventorySlot === null) {
      throw new Error("No hay un objeto seleccionado en el inventario.");
    }

    const item = inventario.items[activeInventorySlot - 1];
    if (!item) {
      throw new Error("El objeto seleccionado ya no está en el inventario.");
    }

    if (characterOptions.hidden) {
      mostrarOpcionesPersonaje(item, activeInventorySlot);
      return;
    }

    characterOptions.hidden = true;
    inventoryDescription.textContent = describirObjeto(item);
    equipUseButton.textContent = item.categoria === "consumible" ? (item.revivir ? "Revivir" : "Usar") : "Equipar";
  });

  inventoryDropButton.addEventListener("click", () => {
    if (activeInventorySlot === null) {
      throw new Error("No hay un objeto seleccionado para soltar.");
    }

    inventario.retirarItem(activeInventorySlot);
    cerrarDialogoInventario();
  });

  document.querySelectorAll(".player-equipment-slot").forEach((slot) => {
    if (!(slot instanceof HTMLButtonElement)) {
      throw new TypeError("Los espacios de equipo deben ser botones.");
    }

    slot.addEventListener("click", (clickEvent) => {
      clickEvent.stopPropagation();
      const card = slot.closest("[data-character-id]");
      const characterId = card?.getAttribute("data-character-id");
      const slotName = slot.dataset.equipmentSlot;
      if (!characterId || !slotName) {
        throw new Error("No se pudo identificar el personaje o el espacio de equipo.");
      }

      const character = buscarPersonaje(characterId);
      const item = character.equipo[slotName];
      if (!item) {
        if (slotName === "arma") {
          return;
        }
        throw new Error(`El espacio "${slotName}" está vacío.`);
      }

      activeCharacter = character;
      activeSlot = slotName;
      title.textContent = item.nombre;
      description.textContent = describirEstadisticas(item);
      unequipButton.disabled = !inventario.items.includes(null);
      unequipButton.textContent = unequipButton.disabled
        ? "Inventario lleno"
        : "Desequipar al inventario";

      if (!actionDialog.open) {
        actionDialog.showModal();
      }
    });
  });

  unequipButton.addEventListener("click", () => {
    if (!activeCharacter || !activeSlot) {
      throw new Error("No hay un objeto seleccionado para desequipar.");
    }
    if (!inventario.items.includes(null)) {
      description.textContent = "El inventario está lleno. Libera un espacio antes de desequipar.";
      return;
    }

    desequipar(activeCharacter.id, activeSlot);
    cerrarDialogoAcciones();
  });

  dropButton.addEventListener("click", () => {
    if (!activeCharacter || !activeSlot) {
      throw new Error("No hay un objeto seleccionado para soltar.");
    }
    soltar(activeCharacter.id, activeSlot);
    cerrarDialogoAcciones();
  });

  closeButton.addEventListener("click", cerrarDialogoAcciones);
  inventoryCloseButton.addEventListener("click", cerrarDialogoInventario);
  [actionDialog, inventoryDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
  inventoryDialog.addEventListener("close", () => {
    activeInventorySlot = null;
    characterOptions.hidden = true;
    characterOptions.replaceChildren();
    equipUseButton.disabled = false;
  });
  actionDialog.addEventListener("close", () => {
    activeCharacter = null;
    activeSlot = null;
  });

  juego.equipo = {
    equiparDesdeInventario,
    desequipar,
    soltar,
    usarConsumible,
  };

  const initialPotion = juego.itemsBase.find((item) => item.id === "pocion-curacion");
  if (!initialPotion || initialPotion.categoria !== "consumible") {
    throw new Error("No se encontró la poción de curación inicial.");
  }
  if (inventario.items.filter((item) => item === null).length < 3) {
    throw new Error("No hay espacio suficiente para agregar las tres pociones iniciales.");
  }
  for (let index = 1; index <= 3; index += 1) {
    inventario.agregarItem(new juego.Item({
      ...initialPotion,
      id: `${initialPotion.id}-${index}`,
      bonificacion: { ...initialPotion.bonificacion },
    }));
  }

})();

