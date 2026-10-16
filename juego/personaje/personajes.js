(function inicializarPersonajes() {
  const juego = window.juego;
  const Personaje = juego?.Personaje;
  const definiciones = juego?.personajesBase;
  if (typeof Personaje !== "function" || !Array.isArray(definiciones) || definiciones.length === 0) {
    throw new Error("No se cargaron la clase o las definiciones de los personajes jugables.");
  }
  if (!Array.isArray(juego.itemsBase)) {
    throw new Error("No se cargó el catálogo de objetos para equipar al grupo.");
  }

  const personajes = definiciones.map((definicion) => new Personaje(definicion));
  const playerBar = document.querySelector(".player-bar");

  // EQUIPO INICIAL: cada personaje recibe equipo básico de nivel 1 al 50 % de durabilidad.
  const equipoInicialPorPersonaje = {
    "caballero-maldito": { arma: "espada-larga-oxidada", armadura: "armadura-pesada-antigua" },
    bruja: { arma: "espada-larga-oxidada", armadura: "armadura-media-antigua" },
    "sacerdote-condenado": { arma: "baston-mistico-agotado", armadura: "capa-arcana-antigua" },
    asesino: { arma: "arco-corto-recuperado", armadura: "armadura-ligera-antigua" },
  };
  function crearPiezaInicial(id, categoria) {
    const plantilla = juego.itemsBase.find((item) => item.id === id && item.categoria === categoria);
    if (!plantilla || plantilla.nivel !== 1) {
      throw new Error(`No se encontró el equipo inicial de nivel 1 "${id}".`);
    }
    return new juego.Item({ ...plantilla, estado: "dañado", durabilidad: 50 });
  }

  personajes.forEach((personaje) => {
    const equipoInicial = equipoInicialPorPersonaje[personaje.id];
    if (!equipoInicial) throw new Error(`Falta definir el equipo inicial de ${personaje.nombre}.`);
    personaje.equipo.arma = crearPiezaInicial(equipoInicial.arma, "arma");
    personaje.equipo.armadura = crearPiezaInicial(equipoInicial.armadura, "armadura");
  });

  
  personajes.forEach((personaje) => {
    personaje._bonificacionPoderEquipo = personaje.obtenerBonificacionEquipo("poder");
    personaje.poder.maximo = Math.max(1, Math.round(personaje.poderMaximoBase + personaje._bonificacionPoderEquipo));
    personaje.poder.actual = Math.max(0, Math.min(
      personaje.poder.maximo,
      personaje.poder.actual,
    ));

    personaje.vida.maxima = personaje.vidaMaximaBase + personaje.obtenerBonificacionEquipo("vida");
    personaje.vida.actual = Math.max(0, Math.min(
      personaje.vida.maxima,
      personaje.vida.actual,
    ));
    personaje.cordura.maxima = personaje.corduraMaximaBase + personaje.obtenerBonificacionEquipo("cordura");
    personaje.cordura.actual = Math.min(personaje.cordura.actual, personaje.cordura.maxima);
  });
  juego.personajes = personajes;

  function renderizarRecursosTarjeta(personaje) {
    const card = document.querySelector(`[data-character-id="${personaje.id}"]`);
    if (!(card instanceof HTMLElement)) {
      throw new Error(`No se encontró la tarjeta de ${personaje.nombre}.`);
    }

    const resourceList = card.querySelector(".player-card-resources");
    if (!(resourceList instanceof HTMLElement)) {
      throw new Error(`Falta el resumen de recursos en la tarjeta de ${personaje.nombre}.`);
    }
    const header = card.querySelector(".player-card-header");
    let portrait = header?.querySelector(".player-card-portrait");
    if (header instanceof HTMLElement) {
      if (!(portrait instanceof HTMLImageElement)) {
        portrait = document.createElement("img");
        portrait.className = "player-card-portrait";
        const portraitButton = document.createElement("button");
        portraitButton.className = "player-portrait-button";
        portraitButton.type = "button";
        portraitButton.append(portrait);
        header.prepend(portraitButton);
      }
    }
    const estaMuerto = personaje.vida.actual <= 0;
    const imagenRetrato = estaMuerto
      ? "recursos/imagen/historia/player_death_r.png"
      : personaje.imagen;
    if (portrait instanceof HTMLImageElement) {
      if (portrait.getAttribute("src") !== imagenRetrato) portrait.src = imagenRetrato;
      portrait.alt = estaMuerto ? "Retrato de un aliado caído" : `Retrato de ${personaje.nombre}`;
    }
    card.classList.toggle("is-dead", estaMuerto);
    card.tabIndex = estaMuerto ? -1 : 0;
    card.setAttribute("aria-disabled", String(estaMuerto));
    const portraitButton = card.querySelector(".player-portrait-button");
    if (portraitButton instanceof HTMLButtonElement) {
      portraitButton.disabled = estaMuerto;
      portraitButton.setAttribute("aria-label", estaMuerto
        ? `Retrato de ${personaje.nombre}, fuera de combate`
        : `Abrir ficha de ${personaje.nombre}`);
    }

    const resources = [
      ["vida", "V", "Vida", personaje.vida.actual, personaje.vida.maxima],
      ["cordura", "C", "Cordura", personaje.cordura.actual, personaje.cordura.maxima],
      ["poder", "P", "Poder", personaje.poder.actual, personaje.poder.maximo],
      ["pa", "PA", "Puntos de acción", personaje.puntosAccionTurno ?? personaje.puntosAccionMaximos, personaje.puntosAccionMaximos],
    ];

    resourceList.replaceChildren();
    resources.forEach(([key, icon, label, current, maximum]) => {
      const resource = document.createElement("span");
      resource.className = `player-resource player-resource-${key}`;
      resource.setAttribute("aria-label", `${label}: ${current} de ${maximum}`);
      resource.title = `${label}: ${current} / ${maximum}`;

      const resourceIcon = document.createElement("span");
      resourceIcon.className = "player-resource-icon";
      resourceIcon.setAttribute("aria-hidden", "true");
      resourceIcon.textContent = icon;

      const resourceValue = document.createElement("span");
      resourceValue.textContent = key === "pa" ? `${current}/${maximum}` : String(current);
      resource.append(resourceIcon, resourceValue);
      resourceList.append(resource);
    });
    const equipmentSlots = [...card.querySelectorAll(".player-equipment-slot")];
    if (equipmentSlots.length !== 3) {
      throw new Error(`La tarjeta de ${personaje.nombre} debe tener tres espacios de equipo.`);
    }
    equipmentSlots.forEach((slot) => {
      if (!(slot instanceof HTMLButtonElement)) {
        throw new TypeError(`Los espacios de equipo de ${personaje.nombre} deben ser botones.`);
      }

      const slotName = slot.dataset.equipmentSlot;
      if (!slotName || !(slotName in personaje.equipo)) {
        throw new Error(`Hay un espacio de equipo no válido en la tarjeta de ${personaje.nombre}.`);
      }

      const slotLabel = slot.dataset.slotLabel || slot.title;
      slot.dataset.slotLabel = slotLabel;
      const item = personaje.equipo[slotName];
      slot.classList.toggle("is-unarmed", !item && slotName === "arma");
      const equippedLabel = slotName === "armadura" ? "Armadura equipada"
        : slotName === "arma" ? "Arma equipada"
          : "Ítem especial equipado";
      const stateLabel = item && ["arma", "armadura"].includes(item.categoria)
        ? ` · ${item.etiquetaEstado} (${Math.round(item.eficaciaEstado * 100)} %)`
        : "";
      slot.replaceChildren();
      slot.disabled = estaMuerto || (item === null && slotName !== "arma");
      slot.setAttribute(
        "aria-label",
        item ? `${equippedLabel}: ${item.nombre}${stateLabel}`
          : slotName === "arma" ? "Ataque básico: puños"
            : `Espacio de ${slotLabel.toLowerCase()} vacío`,
      );

      if (item) {
        if (item.imagen) {
          const image = document.createElement("img");
          image.src = item.imagen;
          image.alt = "";
          image.setAttribute("aria-hidden", "true");
          slot.append(image);
        } else {
          slot.textContent = item.icono;
        }
      } else if (slotName === "arma") {
        const image = document.createElement("img");
        image.src = "recursos/imagen/armas/rock.png";
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        slot.append(image);
      } else if (slotName === "armadura") {
        const image = document.createElement("img");
        image.src = "recursos/imagen/armaduras/shirt.png";
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        slot.append(image);
      }
      slot.title = item ? `${item.nombre} — ${slotLabel}${stateLabel}`
        : slotName === "arma" ? "Ataque básico: puños"
          : slotName === "armadura" ? "Sin armadura" : slotLabel;
    });

    const progression = card.querySelector(".player-card-progression");
    const progressionBar = progression?.querySelector(".player-experience-fill");
    const progressionLabel = progression?.querySelector(".player-experience-label");
    if (!(progression instanceof HTMLElement)
      || !(progressionBar instanceof HTMLElement)
      || !(progressionLabel instanceof HTMLElement)) {
      throw new Error(`Falta la barra de experiencia en la tarjeta de ${personaje.nombre}.`);
    }

    const percentage = (personaje.experiencia / personaje.experienciaNecesaria) * 100;
    progressionBar.style.width = `${percentage}%`;
    progression.setAttribute("aria-valuenow", String(personaje.experiencia));
    progression.setAttribute("aria-valuemax", String(personaje.experienciaNecesaria));
    progression.setAttribute(
      "aria-label",
      `Experiencia de ${personaje.nombre}: ${personaje.experiencia} de ${personaje.experienciaNecesaria}`,
    );
    progression.title = `${personaje.experiencia} / ${personaje.experienciaNecesaria} EXP`;
    progressionLabel.textContent =
      `Nv. ${personaje.nivel} · EXP ${personaje.experiencia}/${personaje.experienciaNecesaria}`;
  }

  personajes.forEach(renderizarRecursosTarjeta);

  function ordenarTarjetasPorEstado() {
    if (!(playerBar instanceof HTMLElement)) return;
    const cards = [...playerBar.querySelectorAll(".player-card")];
    const vivos = cards.filter((card) => !card.classList.contains("is-dead"));
    const caidos = cards.filter((card) => card.classList.contains("is-dead"));
    playerBar.append(...vivos, ...caidos);
  }

  juego.actualizarRecursosTarjeta = (id) => {
    const personaje = personajes.find((entry) => entry.id === id);
    if (!personaje) {
      throw new Error(`No existe un personaje con el identificador "${id}".`);
    }

    personaje.poder.maximo = Math.max(
      1,
      Math.round(personaje.poderMaximoBase + personaje.obtenerBonificacionEquipo("poder")),
    );
    personaje.poder.actual = Math.max(0, Math.min(
      personaje.poder.maximo,
      personaje.poder.actual,
    ));
    personaje.vida.maxima = personaje.vidaMaximaBase + personaje.obtenerBonificacionEquipo("vida");
    personaje.vida.actual = Math.max(0, Math.min(
      personaje.vida.maxima,
      personaje.vida.actual,
    ));
    personaje.cordura.maxima = personaje.corduraMaximaBase + personaje.obtenerBonificacionEquipo("cordura");
    personaje.cordura.actual = Math.max(0, Math.min(personaje.cordura.actual, personaje.cordura.maxima));
    if (Number.isInteger(personaje.puntosAccionTurno)) {
      personaje.puntosAccionTurno = Math.min(personaje.puntosAccionTurno, personaje.puntosAccionMaximos);
    }

    renderizarRecursosTarjeta(personaje);
    ordenarTarjetasPorEstado();
  };

  juego.actualizarProgresoTarjeta = (personaje) => {
    renderizarRecursosTarjeta(personaje);
  };

  juego.actualizarBonificacionesGrupales = () => {
    personajes.forEach((personaje) => {
      personaje.vida.maxima = personaje.vidaMaximaBase + personaje.obtenerBonificacionEquipo("vida");
      personaje.cordura.maxima = personaje.corduraMaximaBase + personaje.obtenerBonificacionEquipo("cordura");
      personaje.vida.actual = Math.max(0, Math.min(
        personaje.vida.maxima,
        personaje.vida.actual,
      ));
      personaje.cordura.actual = Math.max(0, Math.min(
        personaje.cordura.maxima,
        personaje.cordura.actual,
      ));
      renderizarRecursosTarjeta(personaje);
    });
  };

  juego.actualizarBonificacionesGrupales();
})();
