(function inicializarCombate() {
  const juego = window.juego;
  const startButton = document.querySelector(".encounter-start");
  const playerBar = document.querySelector(".player-bar");
  const characterDeathDialog = document.querySelector(".character-death-dialog");
  const characterDeathDescription = characterDeathDialog?.querySelector(".character-death-description");
  const characterDeathClose = characterDeathDialog?.querySelector(".character-death-close");
  const encounterEnemies = document.querySelector(".encounter-enemies");
  const actionDialog = document.querySelector(".combat-action-dialog");
  const Enemigo = juego?.Enemigo;
  const actionTitle = actionDialog?.querySelector("#combat-action-title");
  const actionStatus = actionDialog?.querySelector(".combat-action-status");
  const actionOptions = actionDialog?.querySelector(".combat-action-options");

  if (!(startButton instanceof HTMLButtonElement)
    || !(playerBar instanceof HTMLElement)
    || !(characterDeathDialog instanceof HTMLDialogElement)
    || !(characterDeathDescription instanceof HTMLElement)
    || !(characterDeathClose instanceof HTMLButtonElement)
    || !(encounterEnemies instanceof HTMLElement)
    || !(actionDialog instanceof HTMLDialogElement)
    || !(actionTitle instanceof HTMLElement)
    || !(actionStatus instanceof HTMLElement)
    || !(actionOptions instanceof HTMLElement)
    || typeof Enemigo !== "function"
    || !Array.isArray(juego?.personajes)
    || !Array.isArray(juego?.poolEncuentros)
    || typeof juego.actualizarRecursosTarjeta !== "function"
    || typeof juego.ganarExperiencia !== "function"
    || typeof juego.actualizarProgresoTarjeta !== "function"
    || typeof juego.Personaje !== "function") {
    throw new Error("No se pudo iniciar el combate: faltan elementos o datos del juego.");
  }

  const DELAY_MS = 600;
  const MAX_ROUNDS = 50;
  const MULTIPLICADOR_EVASION_ATAQUE_AREA = 0.5;
  const PENALIZACION_FALLO_POR_POSICION = 0.05;
  const PENALIZACION_FALLO_DISTANCIA_MAXIMA = 0.15;
  const PROBABILIDAD_MAXIMA_FALLO_ATAQUE = 0.5;
  const PROBABILIDAD_FALLO_CURACION = 0.1;
  const PROBABILIDAD_FALLO_HECHIZO_RESTAURATIVO = PROBABILIDAD_FALLO_CURACION;
  const CORDURA_POR_ENEMIGO_DERROTADO = 5;
  const RECUPERACION_CORDURA_FIN_COMBATE = 0.2;
  const RECUPERACION_PODER_FIN_COMBATE = 0.2;
  let combatInProgress = false;
  let personajeEnTurno = null;
  let objetivosDelTurno = [];
  let grupoDelEncuentro = [];
  let participantesEncuentro = [];
  let danioPorPersonajeEncuentro = null;
  let enemigosDelEncuentro = [];
  let resolverAccionTurno = null;
  let consumiblesUsadosEsteTurno = new Set();
  let fugitivosDelEncuentro = new Set();
  let agilidadReducidaEncuentro = new Map();
  let emboscadaPendiente = false;
  let encuentroPreparado = null;
  let contadorEncuentros = 0;
  let botinPendiente = [];
  let grupoEncuentroForzado = null;
  let forzarInicioManual = false;
  let emboscadaEnemigaForzada = false;
  let equipoUsadoEncuentro = new Set();
  let caidosDuranteCombate = new Set();
  let efectosEstadoEncuentro = new Map();
  let personajesCubiertos = new Set();
  let contraataquesPreparados = new Set();
  let mitigacionCaballeroFasesEnemigas = 0;
  let proteccionesMagicas = new Map();
  let aliadosConCriticoAsesinoPendiente = new Set();

  function registrarEquipoUsado(personaje) {
    ["arma", "armadura"].forEach((slot) => {
      const item = personaje.equipo[slot];
      if (item) equipoUsadoEncuentro.add(item);
    });
  }

  function sortearEstadoBotin() {
    const tirada = Math.random();
    if (tirada < 0.25) return "optimo";
    if (tirada < 0.75) return "usado";
    return "dañado";
  }

  function crearInstanciaBotin(item, generarVariante = true) {
    const equipo = ["arma", "armadura"].includes(item.categoria);
    const propiedadesArmadura = generarVariante && item.categoria === "armadura"
      ? juego.generarPropiedadesArmadura?.(item) ?? []
      : [];
    const propiedadesAnillo = generarVariante && item.categoria === "especial" && item.tipo === "anillo"
      ? juego.generarPropiedadesAnillo?.(item) ?? []
      : [];
    const propiedadesGeneradas = [...propiedadesArmadura, ...propiedadesAnillo];
    const bonificacionesGeneradas = propiedadesGeneradas.reduce((bonificaciones, propiedad) => {
      Object.entries(propiedad.bonificaciones ?? {}).forEach(([atributo, valor]) => {
        bonificaciones[atributo] = (bonificaciones[atributo] ?? 0) + valor;
      });
      return bonificaciones;
    }, { ...(item.bonificaciones ?? {}) });
    const proteccionCorduraGenerada = propiedadesAnillo.reduce((total, propiedad) => total + (propiedad.proteccionCordura ?? 0), item.proteccionCordura ?? 0);
    const proteccionMoralGenerada = propiedadesAnillo.reduce((total, propiedad) => total + (propiedad.proteccionMoral ?? 0), item.proteccionMoral ?? 0);
    const nombresPropiedad = {
      reforzada: "reforzada", protectora: "protectora", serena: "serena", flexible: "flexible",
      critica: "crítica", imbuida: "imbuida", fortificada: "fortificada", encantada: "encantada",
      apaciguadora: "apaciguadora", liviana: "liviana", certera: "certera", potenciada: "potenciada",
      inquebrantable: "inquebrantable", runica: "rúnica", serenadora: "serenadora", eterea: "etérea",
      letal: "letal", sobrecargada: "sobrecargada",
      "fuerza-fisica": "fuerza", "resguardo-magico": "resguardo mágico",
      "resguardo-fisico": "resguardo físico", sereno: "sereno", agil: "ágil",
      vigoroso: "vigoroso", concentrado: "concentrado", imbuido: "imbuido",
      arcano: "arcano", critico: "crítico", fortalecido: "fortalecido", runico: "rúnico",
      fortificado: "fortificado", apaciguador: "apaciguador", liviano: "liviano",
      vital: "vital", centrado: "centrado", potenciado: "potenciado", hechicero: "hechicero",
      certero: "certero", "arcano-superior": "arcano superior", inexpugnable: "inexpugnable",
      imperturbable: "imperturbable", gracil: "grácil", robusto: "robusto", voluntad: "voluntad",
      mago: "mago", mortal: "mortal",
    };
    const sufijoPropiedades = propiedadesGeneradas.length > 0
      ? ` — ${propiedadesGeneradas.map((propiedad) => nombresPropiedad[propiedad.id] ?? propiedad.id).join(" y ")}`
      : "";
    return new juego.Item({
      ...item,
      ...(propiedadesGeneradas.length > 0 ? {
        nombre: `${item.nombre}${sufijoPropiedades}`,
        plantillaId: item.id,
        efectos: [...new Set([...(item.efectos ?? []), ...propiedadesGeneradas.map((propiedad) => propiedad.id)])],
        bonificaciones: bonificacionesGeneradas,
        ...(propiedadesAnillo.length > 0 ? {
          proteccionCordura: proteccionCorduraGenerada,
          proteccionMoral: proteccionMoralGenerada,
        } : {}),
      } : {}),
      ...(generarVariante && item.subtipo === "libro-restaurativo" && !item.esObjetoMision
        ? { hechizosRestauracion: window.juego.generarHechizosRestauracion(item.nivel) }
        : {}),
      ...(equipo ? { estado: sortearEstadoBotin(), durabilidad: undefined } : {}),
    });
  }

  function deteriorarEquipoUsado() {
    equipoUsadoEncuentro.forEach((item) => {
      const cambio = item.deteriorarEstado?.();
      if (!cambio) return;
      registrarSuceso(
        `${item.nombre} pierde 5 % de eficacia: ${Math.round(cambio.eficaciaAnterior * 100)} % → ${Math.round(cambio.eficacia * 100)} % (${item.etiquetaEstado}).`,
      );
    });
    equipoUsadoEncuentro = new Set();
  }

  function notificarExploracion(tipo, datos = {}) {
    window.dispatchEvent(new CustomEvent("juego:estado-encuentro", {
      detail: { tipo, ...datos },
    }));
  }

  actionOptions.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const button = event.target.closest("[data-attack-type]");
    if (!(button instanceof HTMLButtonElement) || button.disabled || !resolverAccionTurno) {
      return;
    }

    const choice = {
      tipo: button.dataset.attackType,
      objetivoId: button.dataset.targetId ?? null,
      hechizoId: button.dataset.spellId ?? null,
      inventarioSlot: button.dataset.inventorySlot
        ? Number(button.dataset.inventorySlot)
        : null,
    };
    const resolve = resolverAccionTurno;
    resolverAccionTurno = null;
    actionDialog.close();
    resolve(choice);
  });

  actionDialog.addEventListener("cancel", (event) => {
    if (resolverAccionTurno) {
      event.preventDefault();
    }
  });

  actionDialog.addEventListener("click", (event) => {
    if (event.target === actionDialog && !resolverAccionTurno) {
      actionDialog.close();
    }
  });

  characterDeathClose.addEventListener("click", () => characterDeathDialog.close());
  characterDeathDialog.addEventListener("click", (event) => {
    if (event.target === characterDeathDialog) characterDeathDialog.close();
  });

  function esperarTurno() {
    return new Promise((resolve) => window.setTimeout(resolve, DELAY_MS)).then(async () => {
      while (combatInProgress && juego.combateAutomatico && document.querySelector("dialog[open]")) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
      }
    });
  }

  function registrarSuceso(mensaje) {
    juego.mostrarAviso?.(mensaje);
  }
  juego.registrarNovedad = registrarSuceso;

  function restaurarPoderTrasCombate(grupo) {
    grupo.filter((personaje) => estaVivoCombatiente(personaje)).forEach((personaje) => {
      const poderAntes = personaje.poder.actual;
      const recuperacion = Math.ceil(personaje.poder.maximo * RECUPERACION_PODER_FIN_COMBATE);
      personaje.poder.actual = Math.min(personaje.poder.maximo, poderAntes + recuperacion);
      const recuperado = personaje.poder.actual - poderAntes;
      if (recuperado > 0) {
        registrarSuceso(`${personaje.nombre} recupera ${recuperado} de Poder al terminar el combate.`);
        juego.actualizarRecursosTarjeta(personaje.id);
      }
    });
  }

  function renderizarGrupoEnemigo(enemigos, fugitivos = new Set()) {
    encounterEnemies.replaceChildren();
    encounterEnemies.setAttribute("aria-label", "Enemigos del encuentro");
    const enemigosVivos = enemigos.filter(estaVivoCombatiente).sort((a, b) => (
      obtenerPosicionFormacionEnemigo(a, enemigos, fugitivos)
        - obtenerPosicionFormacionEnemigo(b, enemigos, fugitivos)
    ));
    enemigosVivos.forEach((enemigo) => {
      const card = document.createElement("figure");
      card.className = "encounter-enemy-card";
      card.setAttribute("role", "listitem");
      card.dataset.enemyId = enemigo.id;
      const posicion = obtenerPosicionFormacionEnemigo(enemigo, enemigos, fugitivos);
      card.dataset.formationPosition = String(posicion);

      const formationLabel = document.createElement("span");
      formationLabel.className = "encounter-enemy-formation";
      formationLabel.textContent = ["", "Frente", "Centro", "Retaguardia"][posicion];

      const health = document.createElement("div");
      health.className = "encounter-enemy-health";
      const healthLabel = document.createElement("span");
      healthLabel.className = "encounter-enemy-health-label";
      const healthTrack = document.createElement("div");
      healthTrack.className = "encounter-enemy-health-track";
      healthTrack.setAttribute("role", "progressbar");
      healthTrack.setAttribute("aria-label", `Puntos de vida de ${enemigo.nombre}`);
      healthTrack.setAttribute("aria-valuemin", "0");
      healthTrack.setAttribute("aria-valuemax", String(enemigo.vida.maxima));
      const healthFill = document.createElement("span");
      healthFill.className = "encounter-enemy-health-fill";
      healthTrack.append(healthFill);
      health.append(healthLabel, healthTrack);

      const image = document.createElement("img");
      image.src = enemigo.imagen;
      image.alt = "";
      image.draggable = false;

      const name = document.createElement("figcaption");
      name.className = "encounter-enemy-name";
      name.textContent = enemigo.nombre;

      const status = document.createElement("span");
      status.className = "encounter-enemy-status";
      status.hidden = true;
      status.setAttribute("aria-live", "polite");

      card.append(formationLabel, health, image, name, status);
      encounterEnemies.append(card);
      actualizarEstadoEnemigoPanel(enemigo, fugitivos);
    });
    encounterEnemies.hidden = enemigosVivos.length === 0;
  }

  function obtenerAlcanceMaximoEnemigo(enemigo) {
    const arma = enemigo.equipo?.arma;
    return Math.max(
      1,
      arma?.alcance ?? 1,
      ...(arma?.ataquesEspeciales
        ? Object.values(arma.ataquesEspeciales).map((ataque) => ataque?.alcance ?? arma.alcance ?? 1)
        : []),
      ...(enemigo.ataques ?? []).map((ataque) => ataque.alcance ?? 1),
    );
  }

  function asignarFormacionEnemiga(enemigos) {
    enemigos.forEach((enemigo) => {
      const armadura = enemigo.equipo?.armadura;
      const proteccion = (enemigo.resistenciaBase ?? 0)
        + (armadura?.bonificaciones?.resistenciaFisica ?? 0);
      const alcance = obtenerAlcanceMaximoEnemigo(enemigo);
      const armaMagica = Boolean(enemigo.equipo?.arma?.magico);
      const armaduraPesada = armadura?.tipo === "pesada";
      let posicion = 2;

      if ((armaduraPesada || proteccion >= 3) && alcance <= 2) {
        posicion = 1;
      } else if (alcance >= 3 || (armaMagica && proteccion < 3)) {
        posicion = 3;
      }

      enemigo.posicionFormacion = posicion;
    });

    if (enemigos.length === 1) {
      enemigos[0].posicionFormacion = 1;
    } else if (enemigos.length > 1 && !enemigos.some((enemigo) => enemigo.posicionFormacion === 1)) {
      const candidatoFrontal = [...enemigos].sort((a, b) => {
        const proteccionA = (a.resistenciaBase ?? 0) + (a.equipo?.armadura?.bonificaciones?.resistenciaFisica ?? 0);
        const proteccionB = (b.resistenciaBase ?? 0) + (b.equipo?.armadura?.bonificaciones?.resistenciaFisica ?? 0);
        return proteccionB - proteccionA || obtenerAlcanceMaximoEnemigo(a) - obtenerAlcanceMaximoEnemigo(b);
      })[0];
      candidatoFrontal.posicionFormacion = 1;
    }
  }

  function obtenerPosicionFormacionEnemigo(
    enemigo,
    enemigos = enemigosDelEncuentro,
    fugitivos = fugitivosDelEncuentro,
  ) {
    const posicionOriginal = Math.max(1, Math.min(3, enemigo.posicionFormacion ?? 1));
    const rangosActivos = [...new Set(enemigos
      .filter((candidato) => estaVivoCombatiente(candidato) && !fugitivos.has(candidato))
      .map((candidato) => Math.max(1, Math.min(3, candidato.posicionFormacion ?? 1))))]
      .sort((a, b) => a - b);
    const indiceRango = rangosActivos.indexOf(posicionOriginal);
    return indiceRango < 0 ? posicionOriginal : indiceRango + 1;
  }

  function actualizarFormacionVisualEnemigos() {
    const tarjetas = [...encounterEnemies.querySelectorAll("[data-enemy-id]")];
    tarjetas.forEach((tarjeta) => {
      const enemigo = enemigosDelEncuentro.find((candidato) => candidato.id === tarjeta.dataset.enemyId);
      if (!enemigo || !estaVivoCombatiente(enemigo) || fugitivosDelEncuentro.has(enemigo)) return;
      const posicion = obtenerPosicionFormacionEnemigo(enemigo);
      tarjeta.dataset.formationPosition = String(posicion);
      const etiqueta = tarjeta.querySelector(".encounter-enemy-formation");
      if (etiqueta) etiqueta.textContent = ["", "Frente", "Centro", "Retaguardia"][posicion];
    });

    tarjetas.sort((a, b) => {
      const enemigoA = enemigosDelEncuentro.find((candidato) => candidato.id === a.dataset.enemyId);
      const enemigoB = enemigosDelEncuentro.find((candidato) => candidato.id === b.dataset.enemyId);
      const estadoA = !enemigoA || !estaVivoCombatiente(enemigoA) ? 2
        : fugitivosDelEncuentro.has(enemigoA) ? 1 : 0;
      const estadoB = !enemigoB || !estaVivoCombatiente(enemigoB) ? 2
        : fugitivosDelEncuentro.has(enemigoB) ? 1 : 0;
      return estadoA - estadoB
        || Number(a.dataset.formationPosition) - Number(b.dataset.formationPosition);
    });
    tarjetas.forEach((tarjeta) => encounterEnemies.append(tarjeta));
  }

  function extraerBotinPonderado(disponibles) {
    const pesoTotal = disponibles.reduce((total, item) => total + (item.pesoBotin ?? 1), 0);
    let tirada = Math.random() * pesoTotal;
    const indice = disponibles.findIndex((item) => {
      tirada -= item.pesoBotin ?? 1;
      return tirada < 0;
    });
    return disponibles.splice(indice < 0 ? disponibles.length - 1 : indice, 1)[0];
  }

  function calcularTablaBotin(enemigos) {
    if (enemigos.length === 0) return [];
    const nivelGrupo = Math.max(1, Math.round(
      enemigos.reduce((total, enemigo) => total + enemigo.nivel, 0) / enemigos.length,
    ));
    const nivelBotinPorEncuentro = nivelGrupo + (enemigos.length >= 3 ? 1 : 0);
    const nivelMaximoConfigurado = Number(
      juego.configuracionPorMapa?.[juego.mapaActivoId]?.nivelMaximoLoot,
    );
    const nivelMaximoBotin = Number.isFinite(nivelMaximoConfigurado) && nivelMaximoConfigurado >= 1
      ? Math.min(nivelBotinPorEncuentro, nivelMaximoConfigurado)
      : nivelBotinPorEncuentro;
    const rangos = juego.rangosEquipo ?? [];
    const rangoMaximoBotin = juego.configuracionPorMapa?.[juego.mapaActivoId]?.rangoMaximoLoot
      ?? juego.obtenerRangoEquipo?.(nivelMaximoBotin)
      ?? "basico";
    const indiceConfigurado = rangos.findIndex((rango) => rango.id === rangoMaximoBotin);
    const indiceRangoPermitido = indiceConfigurado >= 0 ? indiceConfigurado : rangos.length - 1;
    const itemDentroDelRango = (item) => {
      const indiceRangoItem = rangos.findIndex((rango) => rango.id === item.rango);
      return item.nivel <= nivelMaximoBotin
        && (indiceRangoItem < 0 || indiceRangoItem <= indiceRangoPermitido);
    };
    const cantidadOpciones = enemigos.length >= 4 ? 3 : enemigos.length >= 2 ? 2 : 1;
    const idsBotinGarantizado = enemigos.flatMap((enemigo) => [
      enemigo.botinGarantizadoId,
      ...(enemigo.botinGarantizadoIds ?? []),
    ]).filter(Boolean);
    const botinGarantizado = [...new Set(idsBotinGarantizado)]
      .map((id) => (juego.itemsBase ?? []).find((item) => item.id === id))
      .filter((item) => item && itemDentroDelRango(item));
    const idsGarantizados = new Set(botinGarantizado.map((item) => item.id));
    const candidatos = (juego.itemsBase ?? []).filter((item) =>
      !item.esObjetoMision && !idsGarantizados.has(item.id) && itemDentroDelRango(item));
    const disponibles = [...candidatos];
    const recompensas = [];
    while (recompensas.length < cantidadOpciones && disponibles.length > 0) {
      recompensas.push(extraerBotinPonderado(disponibles));
    }
    const llaveCofre = (juego.itemsBase ?? []).find((item) => item.id === "llave-cofre");
    const llaveCofreSoltada = llaveCofre
      && !idsBotinGarantizado.includes("llave-cofre")
      && enemigos.some(() => Math.random() < 0.08);
    return [
      ...botinGarantizado.map((item) => crearInstanciaBotin(item, false)),
      ...recompensas.map((item) => crearInstanciaBotin(item)),
      ...(llaveCofreSoltada ? [crearInstanciaBotin(llaveCofre, false)] : []),
    ];
  }

  function renderizarBotin(enemigos) {
    botinPendiente = calcularTablaBotin(enemigos);
    encounterEnemies.setAttribute("aria-label", "Botín del encuentro");
    renderizarBotinDesdePendiente();
  }

  function renderizarBotinDesdePendiente() {
    encounterEnemies.replaceChildren();
    botinPendiente.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "encounter-enemy-card encounter-loot-card";
      card.setAttribute("role", "listitem");

      if (item.imagen) {
        const image = document.createElement("img");
        image.src = item.imagen;
        image.alt = "";
        image.draggable = false;
        card.append(image);
      } else {
        const icon = document.createElement("span");
        icon.className = "loot-item-icon";
        icon.textContent = item.icono;
        icon.setAttribute("aria-hidden", "true");
        card.append(icon);
      }

      const name = document.createElement("span");
      name.className = "encounter-enemy-name";
      name.textContent = item.nombre;
      const details = document.createElement("span");
      details.className = "loot-item-details";
      const estadoBotin = ["arma", "armadura"].includes(item.categoria)
        ? ` · ${item.etiquetaEstado} (${Math.round(item.eficaciaEstado * 100)} %)`
        : "";
      details.textContent = `${item.categoria} · ${item.rango} · nivel ${item.nivel}${estadoBotin}`;
      const takeButton = document.createElement("button");
      takeButton.className = "loot-take-button";
      takeButton.type = "button";
      takeButton.dataset.lootIndex = String(index);
      takeButton.textContent = "Enviar al inventario";
      card.append(name, details, takeButton);
      encounterEnemies.append(card);
    });
    encounterEnemies.hidden = botinPendiente.length === 0;
  }

  encounterEnemies.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-loot-index]");
    if (!(button instanceof HTMLButtonElement)) return;
    const index = Number(button.dataset.lootIndex);
    const item = botinPendiente[index];
    if (!item) return;
    if (!window.inventarioGrupo?.items?.includes(null)) {
      registrarSuceso("El inventario está lleno. Libera un espacio antes de recoger el botín.");
      return;
    }
    try {
      window.inventarioGrupo.agregarItem(item);
      juego.sonidos?.reproducir("inventario");
      botinPendiente.splice(index, 1);
      registrarSuceso(`${item.nombre} enviado al inventario.`);
      if (botinPendiente.length === 0) {
        renderizarGrupoEnemigo([]);
        encounterEnemies.setAttribute("aria-label", "Enemigos del encuentro");
        notificarExploracion("botin-recogido");
      } else {
        renderizarBotinDesdePendiente();
      }
    } catch (error) {
      registrarSuceso(error instanceof Error ? error.message : "No se pudo recoger el objeto.");
    }
  });

  function actualizarEstadoEnemigoPanel(enemigo, fugitivos = fugitivosDelEncuentro) {
    const card = encounterEnemies.querySelector(`[data-enemy-id="${enemigo.id}"]`);
    if (!(card instanceof HTMLElement)) return;
    const healthLabel = card.querySelector(".encounter-enemy-health-label");
    const healthTrack = card.querySelector(".encounter-enemy-health-track");
    const healthFill = card.querySelector(".encounter-enemy-health-fill");
    if (healthLabel instanceof HTMLElement
      && healthTrack instanceof HTMLElement
      && healthFill instanceof HTMLElement) {
      const vidaMaxima = Math.max(1, enemigo.vida.maxima);
      const vidaActual = Math.max(0, Math.min(vidaMaxima, enemigo.vida.actual));
      const porcentajeVida = (vidaActual / vidaMaxima) * 100;
      healthLabel.textContent = `PV ${vidaActual}/${vidaMaxima}`;
      healthTrack.setAttribute("aria-valuemax", String(vidaMaxima));
      healthTrack.setAttribute("aria-valuenow", String(vidaActual));
      healthFill.style.width = `${porcentajeVida}%`;
      card.classList.toggle("is-wounded", porcentajeVida <= 60);
      card.classList.toggle("is-critical", porcentajeVida <= 30);
    }
    const status = card.querySelector(".encounter-enemy-status");
    if (!(status instanceof HTMLElement)) return;
    const huyo = fugitivos.has(enemigo);
    const derrotado = !estaVivoCombatiente(enemigo);
    card.classList.toggle("is-fled", huyo);
    card.classList.toggle("is-defeated", !huyo && derrotado);
    const efectos = efectosEstadoEncuentro.get(enemigo.id) ?? [];
    const etiquetasEfecto = efectos.map((efecto) => {
      const nombre = efecto.tipo === "veneno" ? "Envenenado"
        : efecto.tipo === "quemadura" ? "Quemado" : "Paralizado";
      return `${nombre} (${efecto.turnosRestantes})`;
    });
    status.textContent = huyo ? "Huyó" : derrotado ? "Derrotado" : etiquetasEfecto.join(" · ");
    status.hidden = !huyo && !derrotado && etiquetasEfecto.length === 0;
  }

  function animarEnemigo(enemigo, animacion) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = encounterEnemies.querySelector(`[data-enemy-id="${enemigo.id}"]`);
    if (!(card instanceof HTMLElement)) return;
    card.classList.remove(animacion);
    void card.offsetWidth;
    card.classList.add(animacion);
    card.addEventListener("animationend", () => card.classList.remove(animacion), { once: true });
  }

  function animarTarjeta(personaje, animacion) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const card = playerBar.querySelector(`[data-character-id="${personaje.id}"]`);
    if (!(card instanceof HTMLElement)) {
      throw new Error(`No se encontró la tarjeta de ${personaje.nombre} para animar el combate.`);
    }

    card.classList.remove(animacion);
    void card.offsetWidth;
    card.classList.add(animacion);
    card.addEventListener("animationend", () => {
      card.classList.remove(animacion);
    }, { once: true });
  }

  function marcarTurnoActual(personaje) {
    personajeEnTurno = personaje;
    playerBar.querySelectorAll(".player-card.is-current-turn").forEach((card) => {
      card.classList.remove("is-current-turn");
    });
    const card = playerBar.querySelector(`[data-character-id="${personaje.id}"]`);
    if (!(card instanceof HTMLElement)) {
      throw new Error(`No se encontró la tarjeta de ${personaje.nombre} para marcar su turno.`);
    }
    card.classList.add("is-current-turn");
  }

  function quitarMarcaTurno() {
    personajeEnTurno = null;
    objetivosDelTurno = [];
    playerBar.querySelectorAll(".player-card.is-current-turn").forEach((card) => {
      card.classList.remove("is-current-turn");
    });
  }

  function obtenerGrupoEnOrden() {
    return [...playerBar.querySelectorAll(".player-card:not([hidden])")].map((card) => {
      const personaje = juego.personajes.find((entry) => entry.id === card.dataset.characterId);
      if (!personaje) {
        throw new Error(`No se encontró el personaje de la tarjeta "${card.dataset.characterId}".`);
      }
      return personaje;
    }).filter((personaje) => estaVivoCombatiente(personaje));
  }

  function crearEnemigoParaEncuentro(base, numeroEncuentro, posicion) {
    const enemigo = new Enemigo({
      id: `${base.id}-encuentro-${numeroEncuentro}-${posicion}`,
      nombre: base.nombre,
      tipo: base.tipo,
      imagen: base.imagen,
      nivel: base.nivel,
      rango: base.rango,
      vidaMaxima: base.vida.maxima,
      corduraMaxima: base.cordura.maxima,
      poderMaximo: base.poder.maximo,
      ataqueBase: base.ataqueBase,
      resistenciaBase: base.resistenciaBase,
      resistenciaMagica: base.resistenciaMagica,
      agilidad: base.agilidad,
      bonificacionCritico: base.bonificacionCritico,
      maldito: base.maldito,
      danioCorduraPorGolpe: base.danioCorduraPorGolpe,
      danioMoralPorGolpe: base.danioMoralPorGolpe,
      efectoGolpe: base.efectoGolpe ? { ...base.efectoGolpe } : null,
      ataques: base.ataques.map((ataque) => ({ ...ataque })),
      esJefe: base.esJefe,
      botinGarantizadoId: base.botinGarantizadoId,
      botinGarantizadoIds: [...(base.botinGarantizadoIds ?? [])],
      equipo: { ...base.equipo },
      descripcion: base.descripcion,
    });
    // Los POI conservan las instancias del combate anterior si el grupo tuvo que retirarse.
    enemigo.vida.actual = Math.max(0, Math.min(enemigo.vida.maxima, base.vida.actual));
    enemigo.estabilidadMental.actual = Math.max(
      0,
      Math.min(enemigo.estabilidadMental.maxima, base.estabilidadMental.actual),
    );
    enemigo.poder.actual = Math.max(0, Math.min(enemigo.poder.maximo, base.poder.actual));
    return enemigo;
  }
  function obtenerCostePoder(personaje, arma, perfil) {
    const pasivaCaballero = personaje.id === "caballero-maldito";
    const pasivaBruja = personaje.id === "bruja" && arma.magico && perfil.efecto !== "curacion";
    return pasivaCaballero || pasivaBruja ? Math.ceil(perfil.costePoder / 2) : perfil.costePoder;
  }

  function personajePuedeUsarPerfilAtaque(personaje, arma, perfil) {
    const clase = personaje.clase.toLowerCase();
    return ["bruja", "sacerdote"].includes(clase)
      || (!arma?.magico && perfil?.tipoDanio !== "magico");
  }

  function calcularIniciativa(combatiente) {
    const dado = Math.floor(Math.random() * 20) + 1;
    const agilidad = combatiente instanceof juego.Personaje
      ? combatiente.agilidadCombate
      : combatiente.agilidad;
    return { dado, total: dado + agilidad + Math.round(combatiente.bonificacionCritico * 100) };
  }

  function prepararIniciativa(grupo, enemigos) {
    const lider = grupo.filter(estaVivoCombatiente).sort((a, b) => b.agilidadCombate - a.agilidadCombate)[0] ?? grupo[0];
    const enemigoEnPunta = enemigos.find(estaVivoCombatiente);
    if (!enemigoEnPunta) return true;
    const iniciativaGrupo = calcularIniciativa(lider);
    const iniciativaEnemigo = calcularIniciativa(enemigoEnPunta);
    const enemigosEmboscan = emboscadaEnemigaForzada;
    const grupoPrimero = !enemigosEmboscan && iniciativaGrupo.total >= iniciativaEnemigo.total;
    emboscadaEnemigaForzada = false;
    const asesinoActivo = grupo.some((personaje) => personaje.id === "asesino" && estaVivoCombatiente(personaje));
    emboscadaPendiente = grupoPrimero && asesinoActivo;
    registrarSuceso(
      `Iniciativa: grupo ${iniciativaGrupo.dado} + ${iniciativaGrupo.total - iniciativaGrupo.dado} = ${iniciativaGrupo.total}; `
      + `${enemigoEnPunta.nombre} ${iniciativaEnemigo.dado} + ${iniciativaEnemigo.total - iniciativaEnemigo.dado} = ${iniciativaEnemigo.total}. `
      + `${grupoPrimero ? "El grupo toma la iniciativa." : `${enemigoEnPunta.nombre} toma la iniciativa.`}`,
    );
    if (emboscadaPendiente) {
      registrarSuceso("La presencia del Asesino permite la emboscada: el primer golpe conectado será crítico.");
    }
    if (enemigosEmboscan) {
      registrarSuceso("Los enemigos emboscan al grupo por la espalda y atacan primero.");
    }
    return grupoPrimero;
  }

  function estaVivoCombatiente(combatiente) {
    return combatiente.vida.actual > 0;
  }

  function aplicarEfectoEstado(objetivo, efecto, fuente) {
    if (!(objetivo instanceof Enemigo) && !(objetivo instanceof juego.Personaje)) return;
    if (!efecto) return;
    const efectos = efectosEstadoEncuentro.get(objetivo.id) ?? [];
    const existente = efectos.find((entrada) => entrada.tipo === efecto.tipo);
    const nuevoEfecto = {
      tipo: efecto.tipo,
      danioPorTurno: efecto.danioPorTurno ?? 0,
      turnosRestantes: efecto.duracion,
      fuente,
    };
    if (existente) Object.assign(existente, nuevoEfecto);
    else efectos.push(nuevoEfecto);
    efectosEstadoEncuentro.set(objetivo.id, efectos);
    const descripcion = efecto.tipo === "veneno" ? "envenenado"
      : efecto.tipo === "quemadura" ? "ardiendo" : "paralizado";
    registrarSuceso(
      `${objetivo.nombre} queda ${descripcion}${efecto.danioPorTurno ? `: ${efecto.danioPorTurno} de daño durante ${efecto.duracion} turnos` : ` durante ${efecto.duracion} turnos`}.`,
    );
    if (objetivo instanceof Enemigo) actualizarEstadoEnemigoPanel(objetivo);
  }

  async function procesarEfectosEstadoInicioTurno(objetivo) {
    const efectos = efectosEstadoEncuentro.get(objetivo.id) ?? [];
    let paralizado = false;
    const restantes = [];
    for (const efecto of efectos) {
      if (!estaVivoCombatiente(objetivo)) break;
      if (efecto.tipo === "paralisis") {
        paralizado = true;
        efecto.turnosRestantes -= 1;
        registrarSuceso(`${objetivo.nombre} está paralizado y pierde su turno.`);
      } else {
        const vidaAntes = objetivo.vida.actual;
        const danio = Math.min(vidaAntes, efecto.danioPorTurno);
        objetivo.vida.actual = Math.max(0, vidaAntes - danio);
        efecto.turnosRestantes -= 1;
        if (danio > 0) {
          if (objetivo instanceof Enemigo) animarEnemigo(objetivo, "is-taking-damage");
          else animarTarjeta(objetivo, "is-taking-damage");
        }
        const nombreEfecto = efecto.tipo === "veneno" ? "veneno" : "quemadura";
        registrarSuceso(`${objetivo.nombre} recibe ${danio} de daño por ${nombreEfecto} (${objetivo.vida.actual}/${objetivo.vida.maxima} PV).`);
        if (objetivo instanceof Enemigo) actualizarEstadoEnemigoPanel(objetivo);
        else juego.actualizarRecursosTarjeta(objetivo.id);
        if (vidaAntes > 0 && objetivo.vida.actual <= 0) {
          registrarSuceso(`${objetivo.nombre} muere por ${efecto.tipo === "veneno" ? "el veneno" : "las quemaduras"}.`);
          if (objetivo instanceof Enemigo) {
            restaurarCorduraPorEnemigoDerrotado(objetivo);
            actualizarFormacionVisualEnemigos();
          } else {
            await mostrarMuertePersonaje(objetivo);
          }
        }
      }
      if (efecto.turnosRestantes > 0) restantes.push(efecto);
    }
    if (restantes.length > 0 && estaVivoCombatiente(objetivo)) {
      efectosEstadoEncuentro.set(objetivo.id, restantes);
    } else {
      efectosEstadoEncuentro.delete(objetivo.id);
    }
    if (objetivo instanceof Enemigo) actualizarEstadoEnemigoPanel(objetivo);
    return paralizado || !estaVivoCombatiente(objetivo);
  }

  async function mostrarMuertePersonaje(personaje) {
    juego.finalizarPartida?.();
    juego.actualizarRecursosTarjeta(personaje.id);
    juego.actualizarBonificacionesGrupales?.();
    window.setTimeout(() => juego.sonidos?.reproducir("muerteAliado"), 160);
    characterDeathDescription.textContent = `Tu personaje ${personaje.nombre} ha muerto.`;
    if (!characterDeathDialog.open) characterDeathDialog.showModal();
    await new Promise((resolve) => {
      characterDeathDialog.addEventListener("close", resolve, { once: true });
    });
  }

  async function recibirDanioExploracion(personaje, danioBase, origen = "una trampa") {
    if (!juego.personajes.includes(personaje) || !estaVivoCombatiente(personaje)) return false;
    const resistencia = personaje.resistenciaFisicaCombate ?? personaje.resistenciaFisica ?? 0;
    const vidaAntes = personaje.vida.actual;
    const danioCalculado = Math.max(1, Math.floor(Number(danioBase) - resistencia));
    const danio = Math.min(danioCalculado, Math.max(0, vidaAntes - 5));
    personaje.vida.actual = vidaAntes - danio;
    juego.actualizarRecursosTarjeta(personaje.id);
    if (danio > 0) {
      registrarSuceso(`${origen} hiere a ${personaje.nombre} y le quita ${danio} puntos de vida (${personaje.vida.actual}/${personaje.vida.maxima} PV).`);
    } else {
      registrarSuceso(`${origen} alcanza a ${personaje.nombre}, que consigue resistir con ${personaje.vida.actual} PV.`);
    }
    return true;
  }

  function restaurarCorduraPorEnemigoDerrotado(enemigo) {
    const recuperaciones = grupoDelEncuentro
      .filter((personaje) => estaVivoCombatiente(personaje) && !fugitivosDelEncuentro.has(personaje))
      .map((personaje) => {
        const corduraAntes = personaje.cordura.actual;
        personaje.cordura.actual = Math.min(
          personaje.cordura.maxima,
          corduraAntes + CORDURA_POR_ENEMIGO_DERROTADO,
        );
        const recuperada = personaje.cordura.actual - corduraAntes;
        if (recuperada > 0) juego.actualizarRecursosTarjeta(personaje.id);
        return recuperada > 0 ? `${personaje.nombre} +${recuperada} cordura` : null;
      })
      .filter(Boolean);

    if (recuperaciones.length > 0) {
      registrarSuceso(
        `La caída de ${enemigo.nombre} levanta el ánimo del grupo: ${recuperaciones.join(", ")}.`,
      );
    }
  }

  function restaurarCorduraTrasCombate(grupo) {
    grupo.filter((personaje) => estaVivoCombatiente(personaje)).forEach((personaje) => {
      const corduraAntes = personaje.cordura.actual;
      const recuperacion = Math.ceil(personaje.cordura.maxima * RECUPERACION_CORDURA_FIN_COMBATE);
      personaje.cordura.actual = Math.min(personaje.cordura.maxima, corduraAntes + recuperacion);
      const recuperada = personaje.cordura.actual - corduraAntes;
      if (recuperada <= 0) return;
      juego.actualizarRecursosTarjeta(personaje.id);
      registrarSuceso(
        `${personaje.nombre} recupera ${recuperada} de cordura tras el combate (${personaje.cordura.actual}/${personaje.cordura.maxima}).`,
      );
    });
  }

  function obtenerAlcanceAtaque(combatiente) {
    return Math.min(3, combatiente.equipo?.arma?.alcance ?? 1);
  }

  function obtenerDeterioroMental(combatiente) {
    if (combatiente instanceof Enemigo && combatiente.esJefe) return 0;
    return 100 * (1 - combatiente.estabilidadMental.actual / combatiente.estabilidadMental.maxima);
  }

  function obtenerAliadosActivos(grupo, fugitivos) {
    return grupo.filter((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje));
  }

  function actualizarEstadoTrasHuida(personaje) {
    juego.actualizarRecursosTarjeta(personaje.id);
  }

  function registrarResurreccionEnEncuentro(personaje, grupo, participantes = null, danioPorPersonaje = null) {
    if (!grupo.includes(personaje)) grupo.push(personaje);
    if (participantes && !participantes.includes(personaje)) participantes.push(personaje);
    if (danioPorPersonaje && !danioPorPersonaje.has(personaje.id)) danioPorPersonaje.set(personaje.id, 0);
    juego.actualizarBonificacionesGrupales?.();
  }

  function evaluarInicioTurno(combatiente, fugitivos, grupo = null) {
    // En la versión móvil la cordura afecta gradualmente las estadísticas,
    // pero nunca quita el control del personaje al jugador.
    if (combatiente instanceof juego.Personaje) return true;
    const deterioro = obtenerDeterioroMental(combatiente);
    if (deterioro >= 50) {
      const probabilidadMiedo = Math.min(70, 50 + Math.floor((deterioro - 50) / 10) * 5);
      if (Math.random() * 100 < probabilidadMiedo) {
        registrarSuceso(`${combatiente.nombre} queda paralizado por el miedo y pierde su turno (${probabilidadMiedo} %).`);
        return false;
      }
    } else if (deterioro >= 30 && Math.random() < 0.5) {
      registrarSuceso(`${combatiente.nombre} se paraliza por el miedo y pierde su turno.`);
      return false;
    } else if (deterioro >= 10 && Math.random() < 0.25) {
      registrarSuceso(`${combatiente.nombre} pierde su turno por el deterioro de su moral o cordura.`);
      return false;
    }
    return true;
  }

  function puedeErrarAtaque(combatiente) {
    if (combatiente instanceof juego.Personaje) return false;
    const deterioro = obtenerDeterioroMental(combatiente);
    if (deterioro < 10) return false;
    const probabilidadFallo = Math.min(0.5, 0.1 + Math.floor((deterioro - 10) / 20) * 0.1);
    return Math.random() < probabilidadFallo;
  }

  function crearOpcionAtaque(tipo, texto, objetivoId = null, deshabilitado = false, hechizoId = null) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.attackType = tipo;
    if (hechizoId) button.dataset.spellId = hechizoId;
    if (objetivoId) {
      button.dataset.targetId = objetivoId;
    }
    button.textContent = texto;
    button.disabled = deshabilitado;
    actionOptions.append(button);
  }

  function obtenerObjetivosEnRango(atacante, grupo, enemigos, fugitivos, alcance = obtenerAlcanceAtaque(atacante)) {
    const aliadosActivos = obtenerAliadosActivos(grupo, fugitivos);
    if (atacante instanceof juego.Personaje) {
      const alcanceEnemigo = Math.min(3, alcance);
      return enemigos
        .filter((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))
        .filter((enemigo) => obtenerPosicionFormacionEnemigo(enemigo, enemigos, fugitivos) <= alcanceEnemigo);
    }
    return aliadosActivos;
  }

  function costePuntosAccion(tipo, arma = personajeEnTurno?.equipo.arma, perfil = null) {
    if (tipo === "habilidad") return 0;
    if (["cubrirse", "revivir"].includes(tipo)) return 1;
    if (tipo === "consumible") return 2;
    if (tipo === "equipar") return 2;
    if (tipo === "hechizoRestauracion") return perfil?.costePA ?? 3;
    if (tipo === "area") return arma?.ataquesEspeciales?.area?.costePA ?? 4;
    if (tipo === "dirigido") return arma?.ataquesEspeciales?.dirigido?.costePA ?? 3;
    if (tipo === "basico") return arma?.costePABasico ?? 2;
    return 0;
  }

  function probabilidadCriticoEnCombate(personaje) {
    const bonificacionAsesino = aliadosConCriticoAsesinoPendiente.has(personaje.id) ? 0.10 : 0;
    return Math.min(1, personaje.probabilidadCritico + bonificacionAsesino);
  }

  function obtenerDescripcionHabilidadEspecial(personaje) {
    if (personaje.id === "caballero-maldito") return { nombre: "Guardia férrea", descripcion: "Mitiga 15 % del daño del grupo durante una ronda de enemigos." };
    if (personaje.id === "bruja") return { nombre: "Pulso vital", descripcion: "Restaura hasta 50 de vida al grupo." };
    if (personaje.id === "sacerdote-condenado") return { nombre: "Consuelo sagrado", descripcion: "Restaura hasta 50 de cordura al grupo." };
    if (personaje.id === "asesino") return { nombre: "Instinto letal", descripcion: "Da +10 puntos porcentuales de crítico a los demás aliados por un turno cada uno." };
    return null;
  }

  function puedeActivarHabilidadEspecial(personaje) {
    if (!personaje || personaje.habilidadEspecialAgotada) return false;
    const aliados = grupoDelEncuentro.filter((aliado) => estaVivoCombatiente(aliado)
      && !fugitivosDelEncuentro.has(aliado));
    if (personaje.id === "caballero-maldito") return enemigosDelEncuentro.some(estaVivoCombatiente);
    if (personaje.id === "bruja") return aliados.some((aliado) => aliado.vida.actual < aliado.vida.maxima);
    if (personaje.id === "sacerdote-condenado") return aliados.some((aliado) => aliado.cordura.actual < aliado.cordura.maxima);
    if (personaje.id === "asesino") return aliados.some((aliado) => aliado !== personaje);
    return false;
  }

  function activarHabilidadEspecial(personaje) {
    if (!puedeActivarHabilidadEspecial(personaje)) return false;
    const aliados = grupoDelEncuentro.filter((aliado) => estaVivoCombatiente(aliado)
      && !fugitivosDelEncuentro.has(aliado));
    personaje.habilidadEspecialAgotada = true;

    if (personaje.id === "caballero-maldito") {
      mitigacionCaballeroFasesEnemigas = 1;
      registrarSuceso("Caballero activa Guardia férrea: el grupo mitigará 15 % del daño durante la próxima ronda enemiga.");
    } else if (personaje.id === "bruja") {
      let total = 0;
      aliados.forEach((aliado) => {
        const antes = aliado.vida.actual;
        aliado.vida.actual = Math.min(aliado.vida.maxima, antes + 50);
        const curado = aliado.vida.actual - antes;
        total += curado;
        if (curado > 0) juego.actualizarRecursosTarjeta(aliado.id);
      });
      registrarSuceso(`Bruja activa Pulso vital y restaura ${total} puntos de vida al grupo.`);
    } else if (personaje.id === "sacerdote-condenado") {
      let total = 0;
      aliados.forEach((aliado) => {
        const antes = aliado.cordura.actual;
        aliado.cordura.actual = Math.min(aliado.cordura.maxima, antes + 50);
        const restaurada = aliado.cordura.actual - antes;
        total += restaurada;
        if (restaurada > 0) juego.actualizarRecursosTarjeta(aliado.id);
      });
      registrarSuceso(`Sacerdote activa Consuelo sagrado y restaura ${total} puntos de cordura al grupo.`);
    } else if (personaje.id === "asesino") {
      aliadosConCriticoAsesinoPendiente = new Set(aliados
        .filter((aliado) => aliado !== personaje)
        .map((aliado) => aliado.id));
      registrarSuceso("Asesino activa Instinto letal: los demás aliados reciben +10 puntos porcentuales de crítico durante su próximo turno.");
    }
    return true;
  }

  function obtenerBonificacionContra(arma, objetivo) {
    if (!(objetivo instanceof Enemigo)) return 0;
    const bonificaciones = arma?.bonificacionesContra ?? {};
    const tieneArmadura = objetivo.equipo?.armadura?.categoria === "armadura";
    return (tieneArmadura ? bonificaciones.blindado ?? 0 : 0)
      + (objetivo.maldito ? bonificaciones.maldito ?? 0 : 0);
  }

  function estimarDanioAccion(personaje, arma, perfil, objetivo) {
    const ataque = personaje.fuerzaEfectiva + (arma?.ataque ?? 0);
    const esMagico = Boolean(perfil?.tipoDanio === "magico" || (perfil && arma?.magico));
    const resistencia = esMagico
      ? objetivo.resistenciaMagicaCombate
      : objetivo.resistencia ?? objetivo.resistenciaFisicaCombate;
    const potenciaPerfil = Number.isFinite(perfil?.danio) ? perfil.danio : ataque;
    const danioBase = Math.max(1, potenciaPerfil - resistencia);
    const multiplicador = Number.isFinite(perfil?.danio) ? 1 : perfil?.multiplicadorDanio ?? 0.5;
    const danioSinVentaja = Math.max(1, Math.floor(danioBase * multiplicador) + (arma?.danioElemental ?? 0));
    const bonificacionContra = obtenerBonificacionContra(arma, objetivo);
    return Math.max(1, Math.floor((danioSinVentaja + Math.round(danioSinVentaja * bonificacionContra))
      * (arma?.eficaciaEstado ?? 1)));
  }

  function obtenerPenalizacionFalloPorDistancia(atacante, objetivo) {
    if (!(atacante instanceof juego.Personaje)) return 0;
    const posicion = obtenerPosicionFormacionEnemigo(objetivo) - 1;
    if (posicion <= 0) return 0;
    return Math.min(PENALIZACION_FALLO_DISTANCIA_MAXIMA, posicion * PENALIZACION_FALLO_POR_POSICION);
  }

  function crearOpcionEquipo(personaje) {
    const inventario = window.inventarioGrupo?.items;
    if (!Array.isArray(inventario)) return;
    inventario.forEach((item, index) => {
      if (!item || !["arma", "armadura", "especial"].includes(item.categoria)
        || !itemPuedeEquiparAutomaticamente(personaje, item)) return;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.attackType = "equipar";
      button.dataset.inventorySlot = String(index + 1);
      button.textContent = `Equipar → ${item.nombre}`;
      actionOptions.append(button);
    });
  }

  function objetivoPuedeRecibirHechizo(objetivo, hechizo) {
    if (!estaVivoCombatiente(objetivo) || fugitivosDelEncuentro.has(objetivo)) return false;
    if (hechizo.efecto === "curacion") return objetivo.vida.actual < objetivo.vida.maxima;
    if (hechizo.efecto === "cordura") return objetivo.cordura.actual < objetivo.cordura.maxima;
    return (proteccionesMagicas.get(objetivo.id)?.porcentaje ?? 0) < hechizo.porcentaje;
  }

  function objetivosHechizoRestauracion(hechizo) {
    const aliados = grupoDelEncuentro.filter((objetivo) => estaVivoCombatiente(objetivo)
      && !fugitivosDelEncuentro.has(objetivo));
    return hechizo.objetivo === "grupo"
      ? (aliados.some((objetivo) => objetivoPuedeRecibirHechizo(objetivo, hechizo)) ? aliados : [])
      : aliados.filter((objetivo) => objetivoPuedeRecibirHechizo(objetivo, hechizo));
  }

  function crearOpcionesHechizosRestauracion(personaje, arma) {
    arma.hechizosRestauracion.forEach((hechizo) => {
      const objetivos = objetivosHechizoRestauracion(hechizo);
      if (objetivos.length === 0) return;
      const costePA = costePuntosAccion("hechizoRestauracion", arma, hechizo);
      const deshabilitado = personaje.puntosAccionTurno < costePA || personaje.poder.actual < hechizo.costePoder;
      const resultado = hechizo.efecto === "curacion" ? `Cura ${hechizo.curacion} PV`
        : hechizo.efecto === "cordura" ? `Restaura ${hechizo.restauracion} Cordura`
          : `Mitiga ${Math.round(hechizo.porcentaje * 100)} %`;
      if (hechizo.objetivo === "grupo") {
        const etiquetaObjetivo = grupoDelEncuentro.length <= 1 ? "Tú" : "Grupo";
        crearOpcionAtaque("hechizoRestauracion", `${hechizo.nombre} - ${etiquetaObjetivo} - ${resultado} - ${costePA} PA - Poder ${hechizo.costePoder}`, null, deshabilitado, hechizo.id);
      } else {
        objetivos.forEach((objetivo) => crearOpcionAtaque(
          "hechizoRestauracion",
          `${hechizo.nombre} - ${objetivo.nombre} - ${resultado} - ${costePA} PA - Poder ${hechizo.costePoder}`,
          objetivo.id,
          deshabilitado,
          hechizo.id,
        ));
      }
    });
  }

  function abrirMenuAcciones(personaje) {
    if (personaje !== personajeEnTurno || !resolverAccionTurno || actionDialog.open) {
      return;
    }
    actionTitle.textContent = `Turno de ${personaje.nombre}`;
    actionStatus.textContent = `PA disponibles: ${personaje.puntosAccionTurno}/${personaje.puntosAccionMaximos} · Poder: ${personaje.poder.actual}/${personaje.poder.maximo}`;
    actionOptions.replaceChildren();
    const objetivosBasicos = obtenerObjetivosEnRango(
      personaje,
      grupoDelEncuentro,
      enemigosDelEncuentro,
      fugitivosDelEncuentro,
      obtenerAlcanceAtaque(personaje),
    );
    objetivosBasicos.forEach((objetivo) => {
      const danio = estimarDanioAccion(personaje, personaje.equipo.arma, null, objetivo);
      const costeBasico = costePuntosAccion("basico", personaje.equipo.arma);
      crearOpcionAtaque(
        "basico",
        `${personaje.equipo.arma ? "Ataque básico" : "Puñetazo"} - ${objetivo.nombre} - DA ~${danio} - PA: ${costeBasico} · Poder: 0`,
        objetivo.id,
        personaje.puntosAccionTurno < costeBasico,
      );
    });

    const arma = personaje.equipo.arma;
    if (arma) {
      if (arma.hechizosRestauracion?.length) {
        crearOpcionesHechizosRestauracion(personaje, arma);
      } else {
      const dirigido = arma.ataquesEspeciales.dirigido;
      const area = arma.ataquesEspeciales.area;
      const costeDirigido = obtenerCostePoder(personaje, arma, dirigido);
      const costeArea = obtenerCostePoder(personaje, arma, area);
      const objetivosDirigidos = !personajePuedeUsarPerfilAtaque(personaje, arma, dirigido)
        ? []
        : dirigido.efecto === "curacion"
        ? grupoDelEncuentro.filter((objetivo) => estaVivoCombatiente(objetivo)
          && objetivo.vida.actual < objetivo.vida.maxima
          && !fugitivosDelEncuentro.has(objetivo))
        : obtenerObjetivosEnRango(
          personaje,
          grupoDelEncuentro,
          enemigosDelEncuentro,
          fugitivosDelEncuentro,
          dirigido.alcance ?? arma.alcance,
        );
      objetivosDirigidos.forEach((objetivo) => {
        const resultado = dirigido.efecto === "curacion"
          ? `Cura ${dirigido.curacion} PV`
          : `DA ~${estimarDanioAccion(personaje, arma, dirigido, objetivo)}`;
        crearOpcionAtaque(
          "dirigido",
          `${dirigido.nombre} - ${objetivo.nombre} - ${resultado} - PA: ${costePuntosAccion("dirigido", arma)} · Poder: ${costeDirigido}`,
          objetivo.id,
          personaje.poder.actual < costeDirigido || personaje.puntosAccionTurno < costePuntosAccion("dirigido", arma),
        );
      });
      const objetivosArea = !personajePuedeUsarPerfilAtaque(personaje, arma, area)
        ? []
        : area.efecto === "curacion"
        ? grupoDelEncuentro.filter((objetivo) => estaVivoCombatiente(objetivo)
          && objetivo.vida.actual < objetivo.vida.maxima
          && !fugitivosDelEncuentro.has(objetivo)).slice(0, area.objetivosMaximos)
        : obtenerObjetivosEnRango(
          personaje,
          grupoDelEncuentro,
          enemigosDelEncuentro,
          fugitivosDelEncuentro,
          area.alcance ?? arma.alcance,
        ).slice(0, area.objetivosMaximos);
      if (objetivosArea.length > 0) {
        const objetivos = objetivosArea.map((objetivo) => objetivo.nombre).join(", ");
        const daniosEstimados = area.efecto === "curacion"
          ? []
          : objetivosArea.map((objetivo) => estimarDanioAccion(personaje, arma, area, objetivo));
        const resultado = area.efecto === "curacion"
          ? `Cura ${area.curacion} PV c/u`
          : `DA ~${Math.min(...daniosEstimados)}${Math.min(...daniosEstimados) === Math.max(...daniosEstimados)
            ? ""
            : `-${Math.max(...daniosEstimados)}`} c/u`;
        crearOpcionAtaque(
          "area",
          `${area.nombre} - ${objetivos} - ${resultado} - PA: ${costePuntosAccion("area", arma)} · Poder: ${costeArea}`,
          null,
          personaje.poder.actual < costeArea || personaje.puntosAccionTurno < costePuntosAccion("area", arma),
        );
      }
      }
    }

    crearOpcionEquipo(personaje);
    const habilidadEspecial = obtenerDescripcionHabilidadEspecial(personaje);
    if (habilidadEspecial) {
      const agotada = personaje.habilidadEspecialAgotada;
      crearOpcionAtaque(
        "habilidad",
        agotada ? `${habilidadEspecial.nombre} · Agotada (se recarga al descansar)` : `${habilidadEspecial.nombre} · ${habilidadEspecial.descripcion} · Consume el turno`,
        null,
        agotada || !puedeActivarHabilidadEspecial(personaje),
      );
    }
    [...actionOptions.querySelectorAll('[data-attack-type="equipar"]')]
      .forEach((button) => { button.disabled = personaje.puntosAccionTurno < 2; });
    crearOpcionAtaque("cubrirse", "Cubrirse (1 PA)", null, personaje.puntosAccionTurno < 1);

    if (objetivosDelTurno.length === 0 && !grupoDelEncuentro.some((objetivo) => estaVivoCombatiente(objetivo))) {
      actionStatus.textContent = "No hay enemigos al alcance. Puedes usar otra habilidad cuando esté disponible o pasar el turno.";
    }
    crearOpcionAtaque("saltar", "Terminar turno");
    actionDialog.showModal();
  }

  function esperarAccionDelJugador(personaje, objetivosDisponibles, grupo, enemigos) {
    personajeEnTurno = personaje;
    objetivosDelTurno = objetivosDisponibles;
    grupoDelEncuentro = grupo;
    enemigosDelEncuentro = enemigos;
    marcarTurnoActual(personaje);
    return new Promise((resolve) => {
      resolverAccionTurno = resolve;
    });
  }

  function obtenerEstadoConsumible(item) {
    const esRevivir = Boolean(item.revivir);
    if (!combatInProgress) {
      return { enCurso: false, disponible: true, esRevivir, personajeEnTurno: null };
    }
    const puedeUsarseDuranteCombateAutomatico = juego.combateAutomatico && combatInProgress;
    if (!personajeEnTurno || (!resolverAccionTurno && !puedeUsarseDuranteCombateAutomatico)) {
      return {
        enCurso: true,
        disponible: false,
        esRevivir,
        personajeEnTurno: null,
        motivo: "Los consumibles solo se pueden usar durante el turno de un personaje.",
      };
    }
    if (!esRevivir && consumiblesUsadosEsteTurno.has(personajeEnTurno.id)) {
      return {
        enCurso: true,
        disponible: false,
        esRevivir,
        personajeEnTurno,
        motivo: `${personajeEnTurno.nombre} ya usó una poción durante este turno.`,
      };
    }
    if (personajeEnTurno.puntosAccionTurno < (item.revivir ? costePuntosAccion("revivir") : costePuntosAccion("consumible"))) {
      return {
        enCurso: true,
        disponible: false,
        esRevivir,
        personajeEnTurno,
        motivo: "No quedan puntos de acción para usar un consumible.",
      };
    }

    const clase = personajeEnTurno.clase.toLowerCase();
    const claseMagica = ["bruja", "sacerdote"].includes(clase);
    const clasePermitida = item.clasesPermitidas.includes("todas")
      || item.clasesPermitidas.includes(clase);
    if ((item.magico && !claseMagica) || !clasePermitida) {
      return {
        enCurso: true,
        disponible: false,
        esRevivir,
        personajeEnTurno,
        motivo: item.magico
          ? "Este objeto mágico solo puede ser usado por la Bruja o el Sacerdote."
          : "Este personaje no puede usar ese consumible.",
      };
    }

    return { enCurso: true, disponible: true, esRevivir, personajeEnTurno };
  }

  function usarConsumibleEnTurno(numeroEspacio, objetivoId) {
    const objetosInventario = window.inventarioGrupo?.items;
    if (!Array.isArray(objetosInventario) || !Number.isInteger(numeroEspacio)
      || numeroEspacio < 1 || numeroEspacio > objetosInventario.length) {
      throw new RangeError("El espacio del inventario seleccionado no es válido.");
    }
    const consumoDirectoAutomatico = juego.combateAutomatico && combatInProgress && !resolverAccionTurno;
    if (!combatInProgress || !personajeEnTurno || (!resolverAccionTurno && !consumoDirectoAutomatico)) {
      throw new Error("No hay un turno de personaje activo para usar un consumible.");
    }

    const item = objetosInventario[numeroEspacio - 1];
    if (!item || item.categoria !== "consumible") {
      throw new TypeError("El objeto seleccionado ya no es un consumible.");
    }
    if (!item.revivir && consumiblesUsadosEsteTurno.has(personajeEnTurno.id)) {
      throw new Error(`${personajeEnTurno.nombre} ya usó una poción durante este turno.`);
    }
    const estado = obtenerEstadoConsumible(item);
    if (!estado.disponible) {
      throw new Error(estado.motivo);
    }

    const objetivo = juego.personajes.find((personaje) => personaje.id === objetivoId);
    if (!objetivo || (item.revivir ? estaVivoCombatiente(objetivo) : !estaVivoCombatiente(objetivo))
      || (!item.revivir && fugitivosDelEncuentro.has(objetivo))) {
      throw new Error("El objetivo del consumible no está disponible para combatir.");
    }
    const costePA = item.revivir ? costePuntosAccion("revivir") : costePuntosAccion("consumible");
    if (personajeEnTurno.puntosAccionTurno < costePA) {
      throw new Error(`Se necesitan ${costePA} PA para usar ${item.nombre}.`);
    }

    const itemUsado = juego.equipo.usarConsumible(
      numeroEspacio,
      objetivo.id,
      personajeEnTurno.id,
    );
    if (!item.revivir) consumiblesUsadosEsteTurno.add(personajeEnTurno.id);
    if (item.revivir) {
      registrarResurreccionEnEncuentro(
        objetivo,
        grupoDelEncuentro,
        participantesEncuentro,
        danioPorPersonajeEncuentro,
      );
    }
    const eleccion = {
      tipo: "consumible",
      item: itemUsado,
      objetivo,
      usuario: personajeEnTurno,
      costePA,
    };
    const resolver = resolverAccionTurno;
    resolverAccionTurno = null;
    if (resolver) {
      resolver(eleccion);
    } else {
      personajeEnTurno.puntosAccionTurno -= costePA;
      juego.actualizarRecursosTarjeta(personajeEnTurno.id);
    }
  }

  playerBar.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !personajeEnTurno || !resolverAccionTurno) {
      return;
    }
    const card = event.target.closest(".player-card");
    if (!card) {
      return;
    }
    const weaponSlot = event.target.closest('.player-equipment-slot[data-equipment-slot="arma"]');
    if (card.dataset.characterId === personajeEnTurno.id && weaponSlot) {
      event.preventDefault();
      event.stopImmediatePropagation();
      abrirMenuAcciones(personajeEnTurno);
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  function elegirAtaqueEnemigo(enemigo, grupo, enemigos, fugitivos) {
    const arma = enemigo.equipo.arma;
    const perfiles = enemigo.ataques.length > 0
      ? enemigo.ataques.map((perfil) => ({ tipo: "especial-enemigo", perfil }))
      : [
        { tipo: "basico", perfil: null },
        ...(arma ? ["dirigido", "area"].map((tipo) => ({ tipo, perfil: arma.ataquesEspeciales[tipo] })) : []),
      ];
    const ataquesDisponibles = perfiles.flatMap(({ tipo, perfil }) => {
      const alcance = perfil?.alcance ?? arma?.alcance ?? 1;
      const objetivos = obtenerObjetivosEnRango(enemigo, grupo, enemigos, fugitivos, alcance);
      if (objetivos.length === 0 || enemigo.poder.actual < (perfil?.costePoder ?? 0)) return [];
      return [{ tipo, perfil, objetivos }];
    });
    if (ataquesDisponibles.length === 0) return null;

    const tipoPreferido = ataquesDisponibles.some(({ tipo, objetivos, perfil }) =>
      tipo === "area" && objetivos.length >= 2 && perfil.efecto !== "curacion")
      ? "area"
      : ataquesDisponibles.some(({ tipo }) => tipo === "dirigido")
        ? "dirigido"
        : null;
    const deterioro = obtenerDeterioroMental(enemigo);
    const probabilidadMalaDecision = deterioro >= 50 ? 0.75
      : deterioro >= 30 ? 0.5
        : deterioro >= 10 ? 0.25
          : 0;
    if (tipoPreferido && Math.random() >= probabilidadMalaDecision) {
      return ataquesDisponibles.find(({ tipo }) => tipo === tipoPreferido);
    }
    if (ataquesDisponibles.length > 1) {
      const alternativas = ataquesDisponibles.filter(({ tipo }) => tipo !== tipoPreferido);
      if (alternativas.length === 0) return ataquesDisponibles[0];
      return alternativas[Math.floor(Math.random() * alternativas.length)];
    }
    return ataquesDisponibles[0];
  }

  function recibirAtaque(
    atacante,
    objetivo,
    ataque,
    resistencia,
    probabilidadCritico,
    multiplicadorDanio = 1,
    multiplicadorEvasion = 1,
    forzarCritico = false,
    eficaciaArma = 1,
    penalizacionFalloDistancia = 0,
    perfilAtaque = null,
  ) {
    const limiteEsquiva = objetivo instanceof juego.Personaje ? 0.20 : 0.35;
    const probabilidadEsquiva = Math.min(
      limiteEsquiva,
      objetivo.probabilidadEsquivar * multiplicadorEvasion,
    );
    const probabilidadFallo = Math.min(
      PROBABILIDAD_MAXIMA_FALLO_ATAQUE,
      probabilidadEsquiva + penalizacionFalloDistancia,
    );
    const tiradaImpacto = Math.random();
    if (tiradaImpacto < probabilidadFallo) {
      return {
        evadido: true,
        falloDistancia: tiradaImpacto >= probabilidadEsquiva,
        critico: false,
        murio: false,
        danio: 0,
        danioMoral: 0,
        danioCordura: 0,
        danioAgilidad: 0,
        danioPoder: 0,
      };
    }

    const critico = forzarCritico || Math.random() < probabilidadCritico;
    const armaAtacante = atacante.equipo?.arma;
    const eficaciaArmaJugador = atacante instanceof juego.Personaje
      ? eficaciaArma
      : 1;
    const potenciaPerfil = Number.isFinite(perfilAtaque?.danio) ? perfilAtaque.danio : ataque;
    const multiplicadorPerfil = Number.isFinite(perfilAtaque?.danio) ? 1 : multiplicadorDanio;
    const danioBase = Math.max(1, potenciaPerfil - resistencia);
    const danioElemental = armaAtacante?.danioElemental ?? 0;
    const danioSinVentaja = Math.max(1, Math.floor(danioBase * multiplicadorPerfil)) + danioElemental;
    const bonificacionContra = obtenerBonificacionContra(armaAtacante, objetivo);
    const danioConTipo = danioSinVentaja + Math.round(danioSinVentaja * bonificacionContra);
    const danioCritico = critico ? danioConTipo * 2 : danioConTipo;
    const danioCalculado = Math.max(1, Math.floor(danioCritico * eficaciaArmaJugador));
    const seCubre = objetivo instanceof juego.Personaje && personajesCubiertos.has(objetivo.id);
    const danioTrasCobertura = seCubre
      ? Math.max(1, Math.floor(danioCalculado / 2))
      : danioCalculado;
    if (seCubre) personajesCubiertos.delete(objetivo.id);
    const proteccionMagica = objetivo instanceof juego.Personaje ? proteccionesMagicas.get(objetivo.id) : null;
    const danioTrasProteccionMagica = proteccionMagica
      ? Math.max(0, Math.floor(danioTrasCobertura * (1 - proteccionMagica.porcentaje)))
      : danioTrasCobertura;
    const danioMitigadoProteccionMagica = danioTrasCobertura - danioTrasProteccionMagica;
    const caballero = objetivo instanceof juego.Personaje
      ? grupoDelEncuentro.find((personaje) => personaje.id === "caballero-maldito" && estaVivoCombatiente(personaje))
      : null;
    const reduccionGrupalCaballero = mitigacionCaballeroFasesEnemigas > 0
      ? 0.15
      : caballero?.mitigacionDanioGrupo ?? 0;
    const danioMitigadoCaballero = Math.round(danioTrasProteccionMagica * reduccionGrupalCaballero);
    const danioMitigado = danioCalculado - danioTrasProteccionMagica + danioMitigadoCaballero;
    const danio = Math.min(objetivo.vida.actual, Math.max(0, danioTrasProteccionMagica - danioMitigadoCaballero));
    const vidaAntesDelGolpe = objetivo.vida.actual;
    objetivo.vida.actual -= danio;
    const murio = vidaAntesDelGolpe > 0 && objetivo.vida.actual <= 0;
    if (murio && objetivo instanceof juego.Personaje) {
      caidosDuranteCombate.add(objetivo.id);
    }
    if (objetivo instanceof Enemigo) {
      actualizarEstadoEnemigoPanel(objetivo);
      if (danio > 0) animarEnemigo(objetivo, "is-taking-damage");
    }

    const reduccionAgilidad = agilidadReducidaEncuentro.get(objetivo.id) ?? 0;
    const agilidadBaseObjetivo = objetivo instanceof juego.Personaje
      ? objetivo.agilidadEfectiva
      : objetivo.agilidadBase;
    const danioAgilidad = Math.min(
      Math.floor((armaAtacante?.danioAgilidad ?? 0) * eficaciaArmaJugador),
      Math.max(0, agilidadBaseObjetivo - reduccionAgilidad),
    );
    if (danioAgilidad > 0) {
      agilidadReducidaEncuentro.set(objetivo.id, (agilidadReducidaEncuentro.get(objetivo.id) ?? 0) + danioAgilidad);
      objetivo.agilidadReducidaCombate = agilidadReducidaEncuentro.get(objetivo.id);
    }
    const danioPoder = Math.min(
      Math.floor((armaAtacante?.danioPoder ?? 0) * eficaciaArmaJugador),
      objetivo.poder.actual,
    );
    objetivo.poder.actual = Math.max(0, objetivo.poder.actual - danioPoder);

    let danioMoral = 0;
    let moralActual = null;
    let moralProtegida = 0;
    if (objetivo.moral && !(objetivo instanceof Enemigo && objetivo.esJefe) && atacante instanceof juego.Personaje) {
      const moralAntes = objetivo.moral.actual;
      const bonificacionEquipo = ["arma", "especial"]
        .reduce((total, slot) => {
          const item = atacante.equipo[slot];
          const eficacia = item?.categoria === "arma" ? eficaciaArmaJugador : 1;
          return total + (item?.danioMoral ?? 0) * eficacia;
        }, 0);
      const potenciaMoral = atacante.danioMoral + bonificacionEquipo + (critico ? 5 : 0);
      const proteccionMoral = objetivo instanceof juego.Personaje
        ? objetivo.equipo.especial?.proteccionMoral ?? 0
        : 0;
      moralProtegida = Math.min(potenciaMoral, proteccionMoral, moralAntes);
      objetivo.moral.actual = Math.max(0, moralAntes - Math.max(0, potenciaMoral - proteccionMoral));
      danioMoral = moralAntes - objetivo.moral.actual;
      moralActual = objetivo.moral.actual;
    } else if (objetivo.moral && !(objetivo instanceof Enemigo && objetivo.esJefe) && atacante instanceof Enemigo) {
      const moralAntes = objetivo.moral.actual;
      const potenciaMoral = atacante.danioMoralPorGolpe + (critico ? 5 : 0);
      const proteccionMoral = objetivo instanceof juego.Personaje
        ? objetivo.equipo.especial?.proteccionMoral ?? 0
        : 0;
      moralProtegida = Math.min(potenciaMoral, proteccionMoral, moralAntes);
      objetivo.moral.actual = Math.max(0, moralAntes - Math.max(0, potenciaMoral - proteccionMoral));
      danioMoral = moralAntes - objetivo.moral.actual;
      moralActual = objetivo.moral.actual;
    }

    let danioCordura = 0;
    let corduraProtegida = 0;
    if (objetivo instanceof juego.Personaje) {
      if (atacante instanceof Enemigo && atacante.maldito) {
        const corduraAntes = objetivo.cordura.actual;
        const proteccionCordura = objetivo.equipo.especial?.proteccionCordura ?? 0;
        corduraProtegida = Math.min(
          atacante.danioCorduraPorGolpe,
          proteccionCordura,
          corduraAntes,
        );
        objetivo.cordura.actual = Math.max(
          0,
          corduraAntes - Math.max(0, atacante.danioCorduraPorGolpe - proteccionCordura),
        );
        danioCordura = corduraAntes - objetivo.cordura.actual;
      }
      juego.actualizarRecursosTarjeta(objetivo.id);
      if (danio > 0 || danioAgilidad > 0 || danioPoder > 0) {
        animarTarjeta(objetivo, "is-taking-damage");
      }
    }
    return {
      evadido: false,
      critico,
      murio,
      danio,
      danioMoral,
      moralActual,
      moralProtegida,
      danioCordura,
      corduraProtegida,
      danioPoder,
      danioAgilidad,
      danioMitigado: Math.min(danioMitigado, danioCalculado),
      danioMitigadoProteccionMagica,
      nombreProteccionMagica: proteccionMagica?.nombre ?? null,
      seCubre,
    };
  }

  async function registrarAtaque(atacante, objetivo, resultado, etiquetaAtaque) {
    if (resultado.evadido) {
      registrarSuceso(resultado.falloDistancia
        ? `${atacante.nombre} falla el ataque contra ${objetivo.nombre}: la distancia dificulta acertar.`
        : `${objetivo.nombre} esquiva el ataque de ${atacante.nombre}.`);
      return;
    }

    const golpe = resultado.critico ? " ¡Golpe crítico!" : "";
    const unidadVida = resultado.danio === 1 ? "punto" : "puntos";
    const nombreEstabilidad = objetivo instanceof juego.Personaje ? "cordura" : "moral";
    const efectoMoral = resultado.danioMoral > 0
      ? ` Reduce su ${nombreEstabilidad} en ${resultado.danioMoral} ${resultado.danioMoral === 1 ? "punto" : "puntos"} (${resultado.moralActual}/${objetivo.estabilidadMental.maxima}).`
      : "";
    const proteccionMoral = resultado.moralProtegida > 0
      ? ` El equipo protege ${resultado.moralProtegida} ${resultado.moralProtegida === 1 ? "punto" : "puntos"} de ${nombreEstabilidad}.`
      : "";
    const efectoCordura = resultado.danioCordura > 0
      ? ` El ataque maldito le quita ${resultado.danioCordura} ${resultado.danioCordura === 1 ? "punto" : "puntos"} de cordura.`
      : "";
    const efectoAgilidad = resultado.danioAgilidad > 0
      ? ` Reduce su agilidad en ${resultado.danioAgilidad} durante el combate.`
      : "";
    const efectoPoder = resultado.danioPoder > 0
      ? ` Reduce su poder en ${resultado.danioPoder}.`
      : "";
    const proteccionCordura = resultado.corduraProtegida > 0
      ? ` El equipo protege ${resultado.corduraProtegida} ${resultado.corduraProtegida === 1 ? "punto" : "puntos"} de cordura.`
      : "";
    const mitigacionCaballero = resultado.danioMitigado > 0
      ? ` La defensa mitiga ${resultado.danioMitigado} ${resultado.danioMitigado === 1 ? "punto" : "puntos"} de daño.`
      : "";
    const mitigacionCobertura = resultado.seCubre
      ? " La cobertura reduce a la mitad este golpe."
      : "";
    const mitigacionMagica = resultado.danioMitigadoProteccionMagica > 0
      ? ` ${resultado.nombreProteccionMagica} mitiga ${resultado.danioMitigadoProteccionMagica} de daño.`
      : "";
    if (resultado.murio && !(objetivo instanceof juego.Personaje)) {
      const sonidoMuerte = objetivo instanceof juego.Personaje
        ? "muerteAliado"
        : objetivo.tipo === "criatura"
          ? "muerteCriatura"
          : "muerteHumano";
      window.setTimeout(() => juego.sonidos?.reproducir(sonidoMuerte), 160);
    }
    registrarSuceso(
      `${etiquetaAtaque ? `${etiquetaAtaque}: ` : ""}${atacante.nombre} golpea a ${objetivo.nombre} y le quita ${resultado.danio} ${unidadVida} de vida.${golpe} (${objetivo.vida.actual}/${objetivo.vida.maxima} PV).${mitigacionCobertura}${mitigacionMagica}${mitigacionCaballero}${efectoMoral}${proteccionMoral}${efectoCordura}${proteccionCordura}${efectoAgilidad}${efectoPoder}`,
    );
    if (resultado.murio && objetivo instanceof Enemigo) {
      restaurarCorduraPorEnemigoDerrotado(objetivo);
      actualizarFormacionVisualEnemigos();
    }
    if (resultado.murio && objetivo instanceof juego.Personaje) {
      await mostrarMuertePersonaje(objetivo);
    }
  }

  function reproducirSonidoGolpe(atacante) {
    const arma = atacante.equipo?.arma;
    const sonidoGolpe = !arma
      ? "golpePuno"
      : arma.magico
        ? "magiaAtaque"
        : arma.tipo.toLowerCase().includes("arco")
          ? "flecha"
          : "espada";
    juego.sonidos?.reproducir(sonidoGolpe);
  }

  function distribuirExperienciaContribucion(participantes, danioPorPersonaje, cantidad) {
    const contribuidores = participantes
      .map((personaje, orden) => ({
        personaje,
        orden,
        danio: danioPorPersonaje.get(personaje.id) ?? 0,
      }))
      .filter((contribuidor) => contribuidor.danio > 0
        && estaVivoCombatiente(contribuidor.personaje)
        && !caidosDuranteCombate.has(contribuidor.personaje.id));
    const danioTotal = contribuidores.reduce((total, contribuidor) => total + contribuidor.danio, 0);
    if (danioTotal === 0) {
      return [];
    }

    let experienciaRepartida = 0;
    const repartos = contribuidores.map((contribuidor) => {
      const cuotaExacta = (cantidad * contribuidor.danio) / danioTotal;
      const experiencia = Math.floor(cuotaExacta);
      experienciaRepartida += experiencia;
      return {
        ...contribuidor,
        experiencia,
        resto: cuotaExacta - experiencia,
      };
    });

    repartos
      .slice()
      .sort((a, b) => b.resto - a.resto || a.orden - b.orden)
      .slice(0, cantidad - experienciaRepartida)
      .forEach((reparto) => {
        reparto.experiencia += 1;
      });

    return repartos;
  }

  function otorgarExperiencia(participantes, enemigo, danioPorPersonaje) {
    const multiplicadorJefe = enemigo.esJefe ? 3 : 1;
    const experienciaBase = 8 * enemigo.nivel * multiplicadorJefe;
    const experienciaContribucion = 4 * enemigo.nivel * multiplicadorJefe;
    const repartosContribucion = distribuirExperienciaContribucion(
      participantes,
      danioPorPersonaje,
      experienciaContribucion,
    );
    const experienciaPorPersonaje = new Map(
      repartosContribucion.map(({ personaje, experiencia }) => [personaje.id, experiencia]),
    );

    registrarSuceso(`Experiencia por victoria: ${experienciaBase} XP para cada integrante superviviente.`);
    participantes
      .filter((personaje) => estaVivoCombatiente(personaje) && !caidosDuranteCombate.has(personaje.id))
      .forEach((personaje) => {
      const experienciaAdicional = experienciaPorPersonaje.get(personaje.id) ?? 0;
      const totalExperiencia = experienciaBase + experienciaAdicional;
      const progresionAnterior = {
        nivel: personaje.nivel,
      };
      const progresion = juego.ganarExperiencia(personaje.id, totalExperiencia);
      const detalleContribucion = experienciaAdicional > 0
        ? ` (incluye ${experienciaAdicional} XP por contribución)`
        : "";
      registrarSuceso(`${personaje.nombre} recibe ${totalExperiencia} XP${detalleContribucion}.`);

      if (progresion.nivel > progresionAnterior.nivel) {
        const nivelesGanados = progresion.nivel - progresionAnterior.nivel;
        registrarSuceso(
          `${personaje.nombre} sube ${nivelesGanados === 1 ? "al nivel" : `${nivelesGanados} niveles`} ${progresion.nivel}: +${nivelesGanados * 10} de vida y Poder máximos.`,
        );
      }
      });
  }

  async function ejecutarTurnosEnemigos(grupo, enemigos, fugitivos) {
    for (const enemigo of enemigos) {
      quitarMarcaTurno();
      if (!estaVivoCombatiente(enemigo) || fugitivos.has(enemigo)
        || !grupo.some((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje))) {
        continue;
      }
      if (await procesarEfectosEstadoInicioTurno(enemigo)) {
        await esperarTurno();
        continue;
      }
      if (!evaluarInicioTurno(enemigo, fugitivos)) {
        await esperarTurno();
        continue;
      }
      const eleccion = elegirAtaqueEnemigo(enemigo, grupo, enemigos, fugitivos);
      if (!eleccion) {
        registrarSuceso(`${enemigo.nombre} no logra alcanzar al grupo desde su posición.`);
        await esperarTurno();
        continue;
      }
      const objetivos = eleccion.tipo === "area"
        ? eleccion.objetivos.slice(0, eleccion.perfil.objetivosMaximos)
        : [eleccion.objetivos[Math.floor(Math.random() * eleccion.objetivos.length)]];
      if (eleccion.perfil) {
        enemigo.poder.actual -= eleccion.perfil.costePoder ?? 0;
      }
      if (puedeErrarAtaque(enemigo)) {
        registrarSuceso(`${enemigo.nombre} falla su ataque por el deterioro de su moral o cordura.`);
        await esperarTurno();
        continue;
      }
      animarEnemigo(enemigo, "is-attacking");
      let sonidoGolpeReproducido = false;
      for (const objetivo of objetivos) {
        if (!estaVivoCombatiente(objetivo) || fugitivos.has(objetivo)) {
          continue;
        }
        const resultado = recibirAtaque(
          enemigo,
          objetivo,
          enemigo.ataque,
          eleccion.perfil?.tipoDanio === "magico"
            || (eleccion.tipo !== "basico" && enemigo.equipo.arma?.magico)
            ? objetivo.resistenciaMagicaCombate
            : objetivo.resistenciaFisicaCombate,
          enemigo.probabilidadCritico,
          eleccion.perfil?.multiplicadorDanio ?? 0.5,
          eleccion.tipo === "area" ? MULTIPLICADOR_EVASION_ATAQUE_AREA : 1,
          false,
          1,
          obtenerPenalizacionFalloPorDistancia(enemigo, objetivo),
        );
        if (!resultado.evadido && !sonidoGolpeReproducido) {
          reproducirSonidoGolpe(enemigo);
          sonidoGolpeReproducido = true;
        }
        juego.actualizarRecursosTarjeta(objetivo.id);
          await registrarAtaque(
          enemigo,
          objetivo,
          resultado,
              eleccion.tipo === "basico"
                ? (enemigo.equipo.arma ? "Ataque básico" : "Puñetazo")
                : eleccion.perfil.nombre,
        );
        if (!resultado.evadido && contraataquesPreparados.has(objetivo.id)
          && estaVivoCombatiente(objetivo) && estaVivoCombatiente(enemigo)) {
          contraataquesPreparados.delete(objetivo.id);
          animarTarjeta(objetivo, "is-attacking");
          const contraataque = recibirAtaque(
            objetivo,
            enemigo,
            objetivo.fuerzaEfectiva,
            enemigo.resistencia,
            probabilidadCriticoEnCombate(objetivo),
            0.5,
          );
          if (!contraataque.evadido) reproducirSonidoGolpe(objetivo);
          await registrarAtaque(objetivo, enemigo, contraataque, "Contraataque básico");
        }
        const efectoGolpe = enemigo.efectoGolpe;
        if (!resultado.evadido && estaVivoCombatiente(objetivo) && efectoGolpe
          && (efectoGolpe.activacion !== "critico" || resultado.critico)
          && Math.random() < efectoGolpe.probabilidad) {
          aplicarEfectoEstado(objetivo, efectoGolpe, enemigo.nombre);
        }
      }
      await esperarTurno();
    }
    if (mitigacionCaballeroFasesEnemigas > 0) mitigacionCaballeroFasesEnemigas -= 1;
    proteccionesMagicas.clear();
  }

  function itemPuedeEquiparAutomaticamente(personaje, item) {
    const clase = personaje.clase.toLowerCase();
    const tipoArma = item.tipo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const tipoArmadura = item.categoria === "armadura"
      ? item.tipo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? ""
      : "";
    const esFocoMagico = item.categoria === "arma" && ["baston", "varita", "libro"].includes(tipoArma);
    if (["caballero", "asesino"].includes(clase) && esFocoMagico) return false;
    if (clase === "caballero" && item.categoria === "armadura" && !tipoArmadura.startsWith("pesada")) return false;
    const esEquipoMagicoPermitido = item.magico
      && ["arma", "armadura", "especial"].includes(item.categoria)
      && ["caballero", "asesino"].includes(clase);
    const clasePuedeUsarMagia = ["bruja", "sacerdote"].includes(clase) || esEquipoMagicoPermitido;
    return (!item.magico || clasePuedeUsarMagia)
      && (item.clasesPermitidas.includes("todas")
        || item.clasesPermitidas.includes(clase)
        || esEquipoMagicoPermitido);
  }

  function puntuarEquipo(item, slot) {
    if (!item) return 0;
    const bonificaciones = item.bonificaciones ?? {};
    const eficaciaEstado = item.eficaciaEstado ?? 1;
    if (slot === "arma") {
      const perfiles = Object.values(item.ataquesEspeciales ?? {});
      const tienePerfilOfensivo = perfiles.some((perfil) => perfil.efecto !== "curacion");
      if (!tienePerfilOfensivo) return 0;
      const dirigido = item.ataquesEspeciales?.dirigido?.multiplicadorDanio ?? 0;
      const area = item.ataquesEspeciales?.area?.multiplicadorDanio ?? 0;
      return (item.ataque * 10 + item.alcance * 8 + dirigido * 2 + area) * eficaciaEstado
        + (bonificaciones.fuerza ?? 0) + (bonificaciones.agilidad ?? 0);
    }
    if (slot === "especial") {
      return (item.danioMoral ?? 0) * 2
        + (item.proteccionMoral ?? 0) * 4
        + (item.proteccionCordura ?? 0) * 4
        + (bonificaciones.resistenciaFisica ?? 0) * 5
        + (bonificaciones.resistenciaCordura ?? 0) * 4
        + (bonificaciones.resistenciaMagica ?? 0) * 5
        + (bonificaciones.cordura ?? 0) * 1.5
        + (bonificaciones.vida ?? 0) * 2
        + (bonificaciones.agilidad ?? 0) * 3
        + (bonificaciones.fuerza ?? 0) * 2
        + (bonificaciones.poder ?? 0) * 2
        + (bonificaciones.puntosAccion ?? 0) * 30
        + (bonificaciones.danioFisico ?? 0) * 5
        + (bonificaciones.danioMagico ?? 0) * 5
        + (bonificaciones.bonificacionCritico ?? 0) * 100;
    }
    return ((bonificaciones.resistenciaFisica ?? 0) * 5
      + (bonificaciones.resistenciaCordura ?? 0) * 4) * eficaciaEstado
      + (bonificaciones.agilidad ?? 0) * 3
      + (bonificaciones.fuerza ?? 0) * 2
      + (bonificaciones.poder ?? 0) * 2;
  }

  function equiparMejorEquipoAutomaticamente(grupo) {
    const inventario = window.inventarioGrupo?.items;
    if (!juego.combateAutomatico || !Array.isArray(inventario) || !juego.equipo) return;

    grupo.forEach((personaje) => {
      ["arma", "armadura", "especial"].forEach((slot) => {
        const categoria = slot;
        const actual = personaje.equipo[slot];
        const puntuacionActual = puntuarEquipo(actual, slot);
        let mejor = null;
        inventario.forEach((item, index) => {
          if (!item || item.categoria !== categoria || !itemPuedeEquiparAutomaticamente(personaje, item)) return;
          const puntuacion = puntuarEquipo(item, slot);
          if (puntuacion > puntuacionActual && (!mejor || puntuacion > mejor.puntuacion)) {
            mejor = { index, item, puntuacion };
          }
        });
        if (mejor) {
          juego.equipo.equiparDesdeInventario(mejor.index + 1, personaje.id);
          registrarSuceso(`${personaje.nombre} se equipa ${mejor.item.nombre}.`);
        }
      });
    });
  }

  function buscarArmaDeApoyo(personaje, esCurativa) {
    const inventario = window.inventarioGrupo?.items;
    if (!Array.isArray(inventario)) return null;
    const elegibles = inventario
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item?.categoria === "arma"
        && itemPuedeEquiparAutomaticamente(personaje, item)
        && (esCurativa && item.hechizosRestauracion?.some((hechizo) => hechizo.efecto === "curacion")
          || Object.values(item.ataquesEspeciales ?? {}).some((perfil) =>
          personajePuedeUsarPerfilAtaque(personaje, item, perfil)
          && (perfil.efecto === "curacion") === esCurativa)));
    if (elegibles.length === 0) return null;
    return elegibles.reduce((mejor, actual) => {
      const puntuacion = esCurativa
        ? (actual.item.hechizosRestauracion?.reduce((total, hechizo) => total + (hechizo.curacion ?? 0), 0) ?? 0)
          + Object.values(actual.item.ataquesEspeciales)
          .filter((perfil) => personajePuedeUsarPerfilAtaque(personaje, actual.item, perfil))
          .reduce((suma, perfil) => suma + (perfil.curacion ?? 0), 0)
        : puntuarEquipo(actual.item, "arma");
      return !mejor || puntuacion > mejor.puntuacion ? { ...actual, puntuacion } : mejor;
    }, null);
  }

  function aliadosNecesitanCuracion(grupo, fugitivos, limiteVida) {
    return grupo.filter((aliado) => estaVivoCombatiente(aliado)
      && !fugitivos.has(aliado)
      && aliado.vida.actual / aliado.vida.maxima <= limiteVida);
  }

  function elegirCambioArmaAutomatico(personaje, grupo, fugitivos) {
    if (!juego.combateAutomatico || !juego.equipo) return null;
    const armaActual = personaje.equipo.arma;
    const esCurativaActual = Boolean(armaActual?.hechizosRestauracion?.length) || Object.values(armaActual?.ataquesEspeciales ?? {})
      .some((perfil) => personajePuedeUsarPerfilAtaque(personaje, armaActual, perfil)
        && perfil.efecto === "curacion");
    const aliadosHeridos = aliadosNecesitanCuracion(grupo, fugitivos, esCurativaActual ? 0.85 : 0.7);
    const necesitaCuracion = aliadosHeridos.some((aliado) => aliado.vida.actual < aliado.vida.maxima);
    if (necesitaCuracion && !esCurativaActual) {
      const curativa = buscarArmaDeApoyo(personaje, true);
      if (curativa) return { tipo: "equipar", inventarioSlot: curativa.index + 1, item: curativa.item };
    }
    if (!necesitaCuracion && esCurativaActual) {
      const ofensiva = buscarArmaDeApoyo(personaje, false);
      if (ofensiva && puntuarEquipo(ofensiva.item, "arma") > 0) {
        return { tipo: "equipar", inventarioSlot: ofensiva.index + 1, item: ofensiva.item };
      }
    }
    return null;
  }

  function esVidaCritica(personaje) {
    return personaje.vida.actual / personaje.vida.maxima <= 0.1;
  }

  function usarCuracionAutomatica(personaje) {
    if (consumiblesUsadosEsteTurno.has(personaje.id)) return false;
    const inventario = window.inventarioGrupo?.items;
    if (!Array.isArray(inventario) || !juego.equipo) return false;
    const pociones = inventario
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item?.categoria === "consumible"
        && item.tipo.toLowerCase() === "pocion"
        && (item.bonificacion.vida ?? 0) > 0);
    let objetivo = null;
    let objeto = null;
    if (esVidaCritica(personaje)) {
      objetivo = personaje;
      objeto = pociones[0];
    } else if (pociones.length > 0) {
      objetivo = juego.personajes.find((aliado) => aliado !== personaje
        && estaVivoCombatiente(aliado)
        && !fugitivosDelEncuentro.has(aliado)
        && esVidaCritica(aliado));
      objeto = objetivo ? pociones[0] : null;
    }
    if (!objetivo || !objeto) return false;
    if (personaje.puntosAccionTurno < 2) return false;

    juego.combate.usarConsumibleEnTurno(objeto.index + 1, objetivo.id);
    return true;
  }

  function estimarDanioUtilAtaque(personaje, objetivo, perfil, tipo) {
    const arma = personaje.equipo.arma;
    const esMagico = Boolean(perfil && (perfil.tipoDanio === "magico" || arma?.magico));
    const bonificacionDanio = personaje.equipo.especial?.bonificaciones?.[
      esMagico ? "danioMagico" : "danioFisico"
    ] ?? 0;
    const ataque = personaje.fuerzaEfectiva + (arma?.ataque ?? 0) + bonificacionDanio;
    const resistencia = esMagico ? objetivo.resistenciaMagicaCombate : objetivo.resistencia;
    const potencia = Number.isFinite(perfil?.danio) ? perfil.danio : ataque;
    const multiplicador = Number.isFinite(perfil?.danio) ? 1 : perfil?.multiplicadorDanio ?? 0.5;
    const danioBase = Math.max(1, potencia - resistencia);
    const danioSinVentaja = Math.max(1, Math.floor(danioBase * multiplicador)) + (arma?.danioElemental ?? 0);
    const danioConVentaja = danioSinVentaja
      + Math.round(danioSinVentaja * obtenerBonificacionContra(arma, objetivo));
    const danioCriticoEsperado = danioConVentaja * (1 + probabilidadCriticoEnCombate(personaje));
    const eficacia = arma?.eficaciaEstado ?? 1;
    const danioEsperado = danioCriticoEsperado * eficacia;
    const multiplicadorEvasion = tipo === "area" ? MULTIPLICADOR_EVASION_ATAQUE_AREA : 1;
    const probabilidadFallo = Math.min(
      PROBABILIDAD_MAXIMA_FALLO_ATAQUE,
      Math.min(0.35, objetivo.probabilidadEsquivar * multiplicadorEvasion)
        + obtenerPenalizacionFalloPorDistancia(personaje, objetivo),
    );
    const danioUtil = Math.min(objetivo.vida.actual, danioEsperado * (1 - probabilidadFallo));
    const puedeRematar = danioEsperado >= objetivo.vida.actual && probabilidadFallo < 0.5;
    return danioUtil + (puedeRematar ? 2 : 0);
  }

  function elegirAccionAutomatica(personaje, objetivos) {
    const arma = personaje.equipo.arma;
    if (arma?.hechizosRestauracion?.length) {
      const enemigosVivos = objetivos.filter(estaVivoCombatiente).length;
      for (const hechizo of arma.hechizosRestauracion) {
        const costePA = costePuntosAccion("hechizoRestauracion", arma, hechizo);
        if (personaje.puntosAccionTurno < costePA || personaje.poder.actual < hechizo.costePoder) continue;
        const candidatos = objetivosHechizoRestauracion(hechizo);
        if (candidatos.length === 0) continue;
        let debeUsar = false;
        let objetivo = null;
        if (hechizo.efecto === "curacion") {
          objetivo = hechizo.objetivo === "grupo" ? null : candidatos
            .filter((aliado) => aliado.vida.maxima - aliado.vida.actual >= Math.max(8, hechizo.curacion * 0.6))
            .sort((a, b) => (b.vida.maxima - b.vida.actual) - (a.vida.maxima - a.vida.actual))[0];
          debeUsar = hechizo.objetivo === "grupo"
            ? candidatos.length > 0 && candidatos.some((aliado) => aliado.vida.maxima - aliado.vida.actual >= Math.max(8, hechizo.curacion * 0.7))
            : Boolean(objetivo);
        } else if (hechizo.efecto === "cordura") {
          objetivo = hechizo.objetivo === "grupo" ? null : candidatos
            .filter((aliado) => aliado.cordura.actual <= aliado.cordura.maxima * 0.7)
            .sort((a, b) => a.cordura.actual - b.cordura.actual)[0];
          debeUsar = hechizo.objetivo === "grupo"
            ? candidatos.some((aliado) => aliado.cordura.actual <= aliado.cordura.maxima * 0.7)
            : Boolean(objetivo);
        } else {
          debeUsar = enemigosVivos >= 2 && candidatos.length > 0;
          if (hechizo.objetivo !== "grupo") objetivo = candidatos[0] ?? null;
        }
        if (debeUsar) return { tipo: "hechizoRestauracion", hechizoId: hechizo.id, objetivoId: objetivo?.id ?? null };
      }
    }
    const esLibroRestaurativo = Boolean(arma?.hechizosRestauracion?.length);
    const dirigidoPermitido = arma && !esLibroRestaurativo && personajePuedeUsarPerfilAtaque(personaje, arma, arma.ataquesEspeciales.dirigido);
    const areaPermitida = arma && !esLibroRestaurativo && personajePuedeUsarPerfilAtaque(personaje, arma, arma.ataquesEspeciales.area);
    const aliadosHeridos = aliadosNecesitanCuracion(grupoDelEncuentro, fugitivosDelEncuentro, 0.99);
    if (puedeActivarHabilidadEspecial(personaje)) {
      const aliadosActivos = grupoDelEncuentro.filter((aliado) => estaVivoCombatiente(aliado)
        && !fugitivosDelEncuentro.has(aliado));
      const vidaFaltante = aliadosActivos.reduce((total, aliado) => total + aliado.vida.maxima - aliado.vida.actual, 0);
      const corduraFaltante = aliadosActivos.reduce((total, aliado) => total + aliado.cordura.maxima - aliado.cordura.actual, 0);
      const enemigosActivos = objetivos.filter(estaVivoCombatiente).length;
      const usarHabilidad = (personaje.id === "bruja" && vidaFaltante >= 50)
        || (personaje.id === "sacerdote-condenado" && corduraFaltante >= 50)
        || (personaje.id === "caballero-maldito" && enemigosActivos > 0
          && (enemigosActivos >= 2 || aliadosActivos.some((aliado) => aliado.vida.actual <= aliado.vida.maxima * 0.75)))
        || (personaje.id === "asesino" && enemigosActivos > 0
          && aliadosActivos.some((aliado) => aliado !== personaje));
      if (usarHabilidad) return { tipo: "habilidad" };
    }
    if (arma) {
      const area = arma.ataquesEspeciales.area;
      const dirigido = arma.ataquesEspeciales.dirigido;
      const curacionArea = areaPermitida && area.efecto === "curacion" ? aliadosHeridos : [];
      const costeArea = obtenerCostePoder(personaje, arma, area);
      if (curacionArea.length >= 2 && personaje.puntosAccionTurno >= costePuntosAccion("area", arma) && personaje.poder.actual >= costeArea) {
        return { tipo: "area" };
      }
      const objetivoCuracion = dirigidoPermitido && dirigido.efecto === "curacion"
        ? aliadosHeridos.sort((a, b) => (b.vida.maxima - b.vida.actual) - (a.vida.maxima - a.vida.actual))[0]
        : null;
      const costeDirigido = obtenerCostePoder(personaje, arma, dirigido);
      if (objetivoCuracion && personaje.puntosAccionTurno >= costePuntosAccion("dirigido", arma) && personaje.poder.actual >= costeDirigido) {
        return { tipo: "dirigido", objetivoId: objetivoCuracion.id };
      }
    }
    const opciones = [];
    const objetivosBasicos = obtenerObjetivosEnRango(
      personaje, grupoDelEncuentro, objetivos, fugitivosDelEncuentro, obtenerAlcanceAtaque(personaje),
    );
    const costeBasicoPA = costePuntosAccion("basico", arma);
    if (personaje.puntosAccionTurno >= costeBasicoPA) {
      objetivosBasicos.forEach((objetivo) => opciones.push({
        tipo: "basico",
        objetivoId: objetivo.id,
        objetivos: [objetivo],
        perfil: null,
        costePA: costeBasicoPA,
        costePoder: 0,
      }));
    }

    if (arma && dirigidoPermitido) {
      const perfil = arma.ataquesEspeciales.dirigido;
      const costePA = costePuntosAccion("dirigido", arma);
      const costePoder = obtenerCostePoder(personaje, arma, perfil);
      const objetivosDirigidos = perfil.efecto === "curacion" ? [] : obtenerObjetivosEnRango(
        personaje, grupoDelEncuentro, objetivos, fugitivosDelEncuentro, perfil.alcance ?? arma.alcance,
      );
      if (personaje.puntosAccionTurno >= costePA && personaje.poder.actual >= costePoder) {
        objetivosDirigidos.forEach((objetivo) => opciones.push({
          tipo: "dirigido", objetivoId: objetivo.id, objetivos: [objetivo], perfil, costePA, costePoder,
        }));
      }
    }

    if (arma && areaPermitida) {
      const perfil = arma.ataquesEspeciales.area;
      const costePA = costePuntosAccion("area", arma);
      const costePoder = obtenerCostePoder(personaje, arma, perfil);
      const objetivosArea = perfil.efecto === "curacion" ? [] : obtenerObjetivosEnRango(
        personaje, grupoDelEncuentro, objetivos, fugitivosDelEncuentro, perfil.alcance ?? arma.alcance,
      ).slice(0, Math.max(1, perfil.objetivosMaximos ?? 1));
      if (objetivosArea.length > 0 && personaje.puntosAccionTurno >= costePA
        && personaje.poder.actual >= costePoder) {
        opciones.push({ tipo: "area", objetivos: objetivosArea, perfil, costePA, costePoder });
      }
    }

    if (opciones.length === 0) return { tipo: "saltar" };
    const puntuar = (opcion) => {
      const danoUtil = opcion.objetivos.reduce(
        (total, objetivo) => total + estimarDanioUtilAtaque(personaje, objetivo, opcion.perfil, opcion.tipo),
        0,
      );
      return danoUtil / opcion.costePA - opcion.costePoder * 0.01;
    };
    opciones.sort((a, b) => puntuar(b) - puntuar(a));
    return { tipo: opciones[0].tipo, objetivoId: opciones[0].objetivoId };
  }

  async function ejecutarEncuentro() {
    if (combatInProgress) {
      return;
    }

    if (!encuentroPreparado) {
      const requiereConfirmacion = forzarInicioManual;
      forzarInicioManual = false;
      if (botinPendiente.length > 0) {
        registrarSuceso("Recoge el botín pendiente antes de iniciar otro encuentro.");
        renderizarBotinDesdePendiente();
        return;
      }
      const grupo = obtenerGrupoEnOrden();
      if (!grupo.some(estaVivoCombatiente)) {
        registrarSuceso("El grupo no puede combatir: todos sus integrantes están fuera de combate.");
        return;
      }
      equiparMejorEquipoAutomaticamente(grupo);
      const basesForzadas = grupoEncuentroForzado;
      grupoEncuentroForzado = null;
      const poolEnemigosAleatorios = juego.poolEncuentros.filter((enemigo) => !enemigo.esJefe);
      if (!basesForzadas && poolEnemigosAleatorios.length === 0) {
        throw new Error("No hay enemigos registrados para generar un encuentro.");
      }
      contadorEncuentros += 1;
      const cantidadEnemigos = basesForzadas?.length ?? (Math.floor(Math.random() * 4) + 1);
      const aparicionesPorTipo = new Map();
      const enemigos = Array.from({ length: cantidadEnemigos }, (_, index) => {
        const base = basesForzadas?.[index]
          ?? poolEnemigosAleatorios[Math.floor(Math.random() * poolEnemigosAleatorios.length)];
        const aparicion = (aparicionesPorTipo.get(base.id) ?? 0) + 1;
        aparicionesPorTipo.set(base.id, aparicion);
        const enemigo = crearEnemigoParaEncuentro(base, contadorEncuentros, index + 1);
        if (aparicion > 1) enemigo.nombre = `${base.nombre} ${aparicion}`;
        return enemigo;
      });
      asignarFormacionEnemiga(enemigos);
      renderizarGrupoEnemigo(enemigos);
      if (requiereConfirmacion) encounterEnemies.hidden = true;
      registrarSuceso(`El grupo se enfrenta a: ${enemigos.filter(estaVivoCombatiente).map((enemigo) => enemigo.nombre).join(", ")}.`);
      const grupoPrimero = prepararIniciativa(grupo, enemigos);
      encuentroPreparado = {
        grupo,
        enemigos,
        grupoPrimero,
        emboscada: emboscadaPendiente,
      };
      notificarExploracion("preparado");
      startButton.textContent = "Comenzar encuentro";
      startButton.hidden = false;
      if (!requiereConfirmacion) {
        return ejecutarEncuentro();
      }
      return;
    }

    const { grupo, enemigos, grupoPrimero, emboscada } = encuentroPreparado;
    encuentroPreparado = null;
    equiparMejorEquipoAutomaticamente(grupo);
    grupoDelEncuentro = grupo;
    enemigosDelEncuentro = enemigos;
    const participantes = [...grupo];
    participantesEncuentro = participantes;
    equipoUsadoEncuentro = new Set();
    caidosDuranteCombate = new Set();
    efectosEstadoEncuentro = new Map();
    proteccionesMagicas = new Map();
    personajesCubiertos = new Set();
    contraataquesPreparados = new Set();
    mitigacionCaballeroFasesEnemigas = 0;
    aliadosConCriticoAsesinoPendiente = new Set();
    grupo.filter(estaVivoCombatiente).forEach(registrarEquipoUsado);
    const danioPorPersonaje = new Map(participantes.map((personaje) => [personaje.id, 0]));
    danioPorPersonajeEncuentro = danioPorPersonaje;
    const fugitivos = new Set();
    fugitivosDelEncuentro = fugitivos;
    let resultadoEncuentro = "interrumpido";
    let combateConcluido = false;
    emboscadaPendiente = emboscada;

    combatInProgress = true;
    consumiblesUsadosEsteTurno.clear();
    notificarExploracion("combate-iniciado");
    startButton.disabled = true;
    startButton.hidden = true;
    startButton.textContent = "Combate en curso...";
    renderizarGrupoEnemigo(enemigos, fugitivos);
    registrarSuceso(`¡Comienza el combate contra ${enemigos.filter(estaVivoCombatiente).map((enemigo) => enemigo.nombre).join(", ")}!`);

    try {
      let ronda = 0;
      while (enemigos.some((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))
      && grupo.some((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje))
        && ronda < MAX_ROUNDS) {
        ronda += 1;
        registrarSuceso(`Ronda ${ronda}.`);
        await esperarTurno();

        if (ronda === 1 && !grupoPrimero) {
          await ejecutarTurnosEnemigos(grupo, enemigos, fugitivos);
        }

        for (const personaje of [...grupo]) {
        if (!estaVivoCombatiente(personaje) || fugitivos.has(personaje)
          || !enemigos.some((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))) {
          aliadosConCriticoAsesinoPendiente.delete(personaje.id);
          continue;
        }

        marcarTurnoActual(personaje);
        if (await procesarEfectosEstadoInicioTurno(personaje)) {
          await esperarTurno();
          quitarMarcaTurno();
          aliadosConCriticoAsesinoPendiente.delete(personaje.id);
          continue;
        }
        if (!evaluarInicioTurno(personaje, fugitivos, grupo)) {
          await esperarTurno();
          quitarMarcaTurno();
          aliadosConCriticoAsesinoPendiente.delete(personaje.id);
          continue;
        }
        personaje.puntosAccionTurno = personaje.puntosAccionMaximos;
        consumiblesUsadosEsteTurno.delete(personaje.id);
        juego.actualizarRecursosTarjeta(personaje.id);
        while (personaje.puntosAccionTurno > 0
          && enemigos.some((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))) {
        registrarSuceso(
          juego.combateAutomatico
            ? `Turno de ${personaje.nombre}. El grupo decide automáticamente.`
            : `Turno de ${personaje.nombre}. Haz clic en ${personaje.equipo.arma ? "el icono del arma" : "el icono de los puños"} para elegir una acción.`,
        );
        const objetivosDisponibles = enemigos.filter((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo));
        const puedeAtacarAlguien = obtenerObjetivosEnRango(
          personaje, grupo, enemigos, fugitivos, obtenerAlcanceAtaque(personaje),
        ).length > 0 || Object.values(personaje.equipo.arma?.ataquesEspeciales ?? {}).some((perfil) =>
          personajePuedeUsarPerfilAtaque(personaje, personaje.equipo.arma, perfil)
          && perfil.efecto !== "curacion"
          && personaje.poder.actual >= obtenerCostePoder(personaje, personaje.equipo.arma, perfil)
          && obtenerObjetivosEnRango(
            personaje, grupo, enemigos, fugitivos, perfil.alcance ?? personaje.equipo.arma.alcance,
          ).length > 0);
        if (juego.combateAutomatico && usarCuracionAutomatica(personaje)) {
          registrarSuceso(`${personaje.nombre} usa una curación automática (2 PA).`);
          await esperarTurno();
          continue;
        }
        const cambioArma = elegirCambioArmaAutomatico(personaje, grupo, fugitivos);
        if (cambioArma && personaje.puntosAccionTurno >= 2) {
          juego.equipo.equiparDesdeInventario(cambioArma.inventarioSlot, personaje.id);
          registrarEquipoUsado(personaje);
          personaje.puntosAccionTurno -= 2;
          juego.actualizarRecursosTarjeta(personaje.id);
          registrarSuceso(`${personaje.nombre} cambia a ${cambioArma.item.nombre} (2 PA).`);
          await esperarTurno();
          continue;
        }
        const puedeCurarSinAlcance = personaje.equipo.arma
          && Object.entries(personaje.equipo.arma.ataquesEspeciales).some(([tipo, perfil]) => {
            if (!personajePuedeUsarPerfilAtaque(personaje, personaje.equipo.arma, perfil)) return false;
            if (perfil.efecto !== "curacion") return false;
            const coste = obtenerCostePoder(personaje, personaje.equipo.arma, perfil);
            const hayAliadoHerido = aliadosNecesitanCuracion(grupo, fugitivos, 0.99).length > 0;
            const hayObjetivosSuficientes = tipo === "area"
              ? aliadosNecesitanCuracion(grupo, fugitivos, 0.99).length > 0
              : hayAliadoHerido;
            return hayObjetivosSuficientes && personaje.poder.actual >= coste;
          });
        const puedeUsarHechizoRestaurativo = (personaje.equipo.arma?.hechizosRestauracion ?? []).some((hechizo) =>
          personaje.puntosAccionTurno >= costePuntosAccion("hechizoRestauracion", personaje.equipo.arma, hechizo)
          && personaje.poder.actual >= hechizo.costePoder
          && objetivosHechizoRestauracion(hechizo).length > 0);
        if (!puedeAtacarAlguien && !puedeCurarSinAlcance && !puedeUsarHechizoRestaurativo) {
          const alcance = obtenerAlcanceAtaque(personaje);
          registrarSuceso(
            personaje.equipo.arma
              ? `${personaje.nombre} no tiene enemigos dentro del alcance de su arma (${alcance} ${alcance === 1 ? "posición" : "posiciones"}).`
              : `${personaje.nombre} no tiene enemigos en la primera posición para atacar con los puños.`,
          );
        }

        const eleccion = juego.combateAutomatico
          ? elegirAccionAutomatica(personaje, objetivosDisponibles)
          : await esperarAccionDelJugador(personaje, objetivosDisponibles, grupo, enemigos);
        const hechizoSeleccionado = eleccion.tipo === "hechizoRestauracion"
          ? personaje.equipo.arma?.hechizosRestauracion?.find((hechizo) => hechizo.id === eleccion.hechizoId)
          : null;
        const costeAccion = costePuntosAccion(eleccion.tipo, personaje.equipo.arma, hechizoSeleccionado);
        if (costeAccion > personaje.puntosAccionTurno) {
          registrarSuceso(`${personaje.nombre} no tiene suficientes puntos de acción; termina su turno.`);
          break;
        }
        personaje.puntosAccionTurno -= costeAccion;
        juego.actualizarRecursosTarjeta(personaje.id);
        if (eleccion.tipo === "hechizoRestauracion") {
          if (!hechizoSeleccionado || personaje.poder.actual < hechizoSeleccionado.costePoder) {
            registrarSuceso(`${personaje.nombre} no puede lanzar ese hechizo restaurativo ahora.`);
            await esperarTurno();
            continue;
          }
          personaje.poder.actual -= hechizoSeleccionado.costePoder;
          juego.actualizarRecursosTarjeta(personaje.id);
          const objetivosHechizo = hechizoSeleccionado.objetivo === "grupo"
            ? grupo.filter((aliado) => objetivoPuedeRecibirHechizo(aliado, hechizoSeleccionado))
            : [grupo.find((aliado) => aliado.id === eleccion.objetivoId && objetivoPuedeRecibirHechizo(aliado, hechizoSeleccionado))].filter(Boolean);
          if (objetivosHechizo.length === 0) {
            registrarSuceso(`${hechizoSeleccionado.nombre} ya no tiene un objetivo válido.`);
          } else if (puedeErrarAtaque(personaje) || Math.random() < PROBABILIDAD_FALLO_HECHIZO_RESTAURATIVO) {
            registrarSuceso(`${personaje.nombre} falla ${hechizoSeleccionado.nombre}; el hechizo no produce efecto.`);
          } else {
            juego.sonidos?.reproducir("magiaCurativa");
            objetivosHechizo.forEach((objetivo) => {
              if (hechizoSeleccionado.efecto === "curacion") {
                const multiplicador = personaje.id === "sacerdote-condenado" ? 1.1 : 1;
                const antes = objetivo.vida.actual;
                objetivo.vida.actual = Math.min(objetivo.vida.maxima, antes + Math.round(hechizoSeleccionado.curacion * multiplicador));
                registrarSuceso(`${personaje.nombre} usa ${hechizoSeleccionado.nombre} sobre ${objetivo.nombre} y restaura ${objetivo.vida.actual - antes} PV.`);
              } else if (hechizoSeleccionado.efecto === "cordura") {
                const antes = objetivo.cordura.actual;
                objetivo.cordura.actual = Math.min(objetivo.cordura.maxima, antes + hechizoSeleccionado.restauracion);
                registrarSuceso(`${personaje.nombre} usa ${hechizoSeleccionado.nombre} sobre ${objetivo.nombre} y restaura ${objetivo.cordura.actual - antes} de Cordura.`);
              } else {
                const proteccionAnterior = proteccionesMagicas.get(objetivo.id);
                if (!proteccionAnterior || hechizoSeleccionado.porcentaje > proteccionAnterior.porcentaje) {
                  proteccionesMagicas.set(objetivo.id, { porcentaje: hechizoSeleccionado.porcentaje, nombre: hechizoSeleccionado.nombre });
                  registrarSuceso(`${objetivo.nombre} queda protegido por ${hechizoSeleccionado.nombre} durante la próxima fase enemiga.`);
                } else registrarSuceso(`${objetivo.nombre} ya tiene una protección igual o más fuerte.`);
              }
              juego.actualizarRecursosTarjeta(objetivo.id);
            });
          }
          await esperarTurno();
          continue;
        }
        if (eleccion.tipo === "revivir") {
          const item = window.inventarioGrupo?.items?.[eleccion.inventarioSlot - 1];
          const aliado = juego.personajes.find((entry) => entry.id === eleccion.objetivoId);
          if (!item?.revivir || !aliado || aliado.vida.actual > 0) {
            throw new Error("La selecciÃ³n de aliado para revivir ya no es vÃ¡lida.");
          }
          juego.equipo.usarConsumible(eleccion.inventarioSlot, aliado.id, personaje.id);
          registrarResurreccionEnEncuentro(aliado, grupo, participantes, danioPorPersonaje);
          await esperarTurno();
          continue;
        }
        if (eleccion.tipo === "consumible") {
          personaje.puntosAccionTurno -= eleccion.costePA ?? costePuntosAccion("consumible");
          juego.actualizarRecursosTarjeta(personaje.id);
          await esperarTurno();
          continue;
        }
        if (eleccion.tipo === "habilidad") {
          if (!activarHabilidadEspecial(personaje)) {
            registrarSuceso(`${personaje.nombre} no puede activar su habilidad especial ahora.`);
          }
          personaje.puntosAccionTurno = 0;
          juego.actualizarRecursosTarjeta(personaje.id);
          await esperarTurno();
          continue;
        }
        if (eleccion.tipo === "saltar") {
          if (personaje.puntosAccionTurno > 0 && personajesCubiertos.has(personaje.id)) {
            contraataquesPreparados.add(personaje.id);
            registrarSuceso(`${personaje.nombre} guarda ${personaje.puntosAccionTurno} PA para contraatacar al primer enemigo que le acierte.`);
          }
          personaje.puntosAccionTurno = 0;
          juego.actualizarRecursosTarjeta(personaje.id);
          registrarSuceso(`${personaje.nombre} termina su turno.`);
          await esperarTurno();
          continue;
        }
        if (eleccion.tipo === "cubrirse") {
          personajesCubiertos.add(personaje.id);
          registrarSuceso(`${personaje.nombre} se cubre (1 PA) y reducirá a la mitad el próximo golpe que reciba.`);
          await esperarTurno();
          continue;
        }
        if (eleccion.tipo === "equipar") {
          const item = window.inventarioGrupo?.items?.[eleccion.inventarioSlot - 1];
          if (!item || !["arma", "armadura", "especial"].includes(item.categoria)) {
            throw new Error("El objeto de equipo seleccionado ya no está disponible.");
          }
          juego.equipo.equiparDesdeInventario(eleccion.inventarioSlot, personaje.id);
          registrarEquipoUsado(personaje);
          registrarSuceso(`${personaje.nombre} se equipa ${item.nombre} (2 PA).`);
          await esperarTurno();
          continue;
        }
        const perfil = eleccion.tipo === "basico"
          ? null
          : personaje.equipo.arma.ataquesEspeciales[eleccion.tipo];
        const aliadosVivos = grupo.filter((objetivo) => estaVivoCombatiente(objetivo)
          && objetivo.vida.actual < objetivo.vida.maxima
          && !fugitivos.has(objetivo));
        const alcanceAccion = perfil?.alcance ?? personaje.equipo.arma?.alcance ?? 1;
        const objetivosDisponiblesAtaque = perfil?.efecto === "curacion"
          ? aliadosVivos
          : obtenerObjetivosEnRango(personaje, grupo, enemigos, fugitivos, alcanceAccion);
        const objetivos = eleccion.tipo === "area"
          ? objetivosDisponiblesAtaque.slice(0, perfil.objetivosMaximos)
          : [objetivosDisponiblesAtaque.find((objetivo) => objetivo.id === eleccion.objetivoId)];
        if (objetivos.some((objetivo) => !objetivo)) {
          throw new Error(`La selección de ataque de ${personaje.nombre} apunta a un objetivo inválido.`);
        }
        if (perfil) {
          personaje.poder.actual -= obtenerCostePoder(personaje, personaje.equipo.arma, perfil);
        }
        juego.actualizarRecursosTarjeta(personaje.id);
        const esAtaqueMagico = Boolean(perfil && (
          perfil.tipoDanio === "magico" || personaje.equipo.arma?.magico
        ));
        const bonificacionDanioEspecial = personaje.equipo.especial?.bonificaciones?.[
          esAtaqueMagico ? "danioMagico" : "danioFisico"
        ] ?? 0;
        const ataque = personaje.fuerzaEfectiva
          + (personaje.equipo.arma?.ataque ?? 0)
          + bonificacionDanioEspecial;
        const multiplicadorDanio = perfil?.multiplicadorDanio ?? 0.5;
        animarTarjeta(personaje, "is-attacking");
        const falloPorEstado = puedeErrarAtaque(personaje);
        const falloCuracion = perfil?.efecto === "curacion" && Math.random() < PROBABILIDAD_FALLO_CURACION;
        if (falloPorEstado || falloCuracion) {
          registrarSuceso(falloCuracion && !falloPorEstado
            ? `${personaje.nombre} falla el hechizo de curación; no restaura vida.`
            : `${personaje.nombre} falla su acción.`);
        } else if (perfil?.efecto === "curacion") {
          let sonidoCurativoReproducido = false;
          for (const objetivo of objetivos) {
            const bonificacionSacerdote = personaje.id === "sacerdote-condenado" ? 1.1 : 1;
            const curacion = Math.max(
              1,
              Math.round(perfil.curacion * bonificacionSacerdote),
            );
            const vidaAntes = objetivo.vida.actual;
            objetivo.vida.actual = Math.min(objetivo.vida.maxima, objetivo.vida.actual + curacion);
            const vidaRestaurada = objetivo.vida.actual - vidaAntes;
            if (vidaRestaurada > 0 && !sonidoCurativoReproducido) {
              juego.sonidos?.reproducir("magiaCurativa");
              sonidoCurativoReproducido = true;
            }
            juego.actualizarRecursosTarjeta(objetivo.id);
            registrarSuceso(
              vidaRestaurada > 0
                ? `${personaje.nombre} usa ${perfil.nombre} sobre ${objetivo.nombre} y restaura ${vidaRestaurada} de vida (${objetivo.vida.actual}/${objetivo.vida.maxima}).`
                : `${personaje.nombre} usa ${perfil.nombre} sobre ${objetivo.nombre}, pero ya tiene toda su vida.`,
            );
          }
        } else {
          let sonidoGolpeReproducido = false;
          for (const objetivo of objetivos) {
            if (!estaVivoCombatiente(objetivo) || fugitivos.has(objetivo)) {
              continue;
            }
            const resultado = recibirAtaque(
              personaje,
              objetivo,
              ataque,
              perfil?.tipoDanio === "magico"
                || (perfil && personaje.equipo.arma?.magico)
                ? objetivo.resistenciaMagicaCombate
                : objetivo.resistencia,
              probabilidadCriticoEnCombate(personaje),
              multiplicadorDanio,
              eleccion.tipo === "area" ? MULTIPLICADOR_EVASION_ATAQUE_AREA : 1,
              emboscadaPendiente,
              personaje.equipo.arma?.eficaciaEstado ?? 1,
              obtenerPenalizacionFalloPorDistancia(personaje, objetivo),
          perfil,
            );
            if (!resultado.evadido && !sonidoGolpeReproducido) {
              reproducirSonidoGolpe(personaje);
              sonidoGolpeReproducido = true;
            }
            if (emboscadaPendiente && !resultado.evadido) {
              emboscadaPendiente = false;
            }
            if (!resultado.evadido) {
              danioPorPersonaje.set(
                personaje.id,
                danioPorPersonaje.get(personaje.id) + resultado.danio,
              );
            }
            await registrarAtaque(
              personaje,
              objetivo,
              resultado,
              eleccion.tipo === "basico"
                ? (personaje.equipo.arma ? "Ataque básico" : "Puñetazo")
                : perfil.nombre,
            );
            if (!resultado.evadido && objetivo instanceof Enemigo && !objetivo.esJefe
              && objetivo.moral?.actual <= 0 && estaVivoCombatiente(objetivo)) {
              fugitivos.add(objetivo);
              registrarSuceso(`${objetivo.nombre} pierde toda su voluntad y huye del combate.`);
              renderizarGrupoEnemigo(enemigos, fugitivos);
            }
            if (!resultado.evadido && estaVivoCombatiente(objetivo)) {
              aplicarEfectoEstado(objetivo, perfil?.efectoEstado, personaje.nombre);
              if (resultado.critico) {
                aplicarEfectoEstado(objetivo, personaje.equipo.arma?.efectoCritico, personaje.nombre);
              }
            }
          }
        }
        registrarSuceso(`${personaje.nombre}: ${personaje.puntosAccionTurno}/${personaje.puntosAccionMaximos} PA restantes.`);
        await esperarTurno();
        }
        quitarMarcaTurno();
        aliadosConCriticoAsesinoPendiente.delete(personaje.id);
        personaje.puntosAccionTurno = null;
        juego.actualizarRecursosTarjeta(personaje.id);
      }
      if (!(ronda === 1 && !grupoPrimero)) {
        await ejecutarTurnosEnemigos(grupo, enemigos, fugitivos);
      }
    }

    const enemigosEnPie = enemigos.filter((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo));
    const grupoEnPie = grupo.filter((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje));
    const enemigosDerrotados = enemigos.filter((enemigo) => !estaVivoCombatiente(enemigo));
    if (enemigosEnPie.length === 0 && grupoEnPie.length > 0
      && enemigosDerrotados.length === 0 && fugitivos.size > 0) {
      resultadoEncuentro = "huida_enemiga";
      registrarSuceso("Todos los enemigos huyeron. El encuentro termina sin botín.");
      renderizarGrupoEnemigo([]);
    } else if (enemigosEnPie.length === 0 && grupoEnPie.length > 0) {
      resultadoEncuentro = "victoria";
      enemigosDerrotados.forEach((enemigo) => registrarSuceso(`${enemigo.nombre} ha sido derrotado.`));
      enemigosDerrotados.forEach((enemigo) => otorgarExperiencia(participantes, enemigo, danioPorPersonaje));
      if (enemigosDerrotados.length > 0) {
        window.inventarioGrupo?.agregarRaciones(enemigosDerrotados.length);
        registrarSuceso(
          `Recoges ${enemigosDerrotados.length} ${enemigosDerrotados.length === 1 ? "ración" : "raciones"} de los enemigos derrotados.`,
        );
      }
      renderizarBotin(enemigosDerrotados);
      if (botinPendiente.length > 0) {
        registrarSuceso("Elige una recompensa y envíala al inventario.");
      } else {
        registrarSuceso("No hay objetos disponibles para el nivel de este encuentro.");
        renderizarGrupoEnemigo([]);
      }
    } else if (grupoEnPie.length === 0) {
      resultadoEncuentro = "derrota";
      registrarSuceso("El grupo ha sido derrotado.");
      renderizarGrupoEnemigo([]);
    } else {
      registrarSuceso("El combate se detuvo tras alcanzar el límite de rondas.");
      renderizarGrupoEnemigo([]);
    }
    restaurarCorduraTrasCombate(grupo);
    restaurarPoderTrasCombate(grupo);
    combateConcluido = true;
    } catch (error) {
      console.error("Se interrumpió el combate por un error:", error);
      resultadoEncuentro = "interrumpido";
      renderizarGrupoEnemigo([]);
      registrarSuceso("El combate se interrumpió por un error. El encuentro sigue pendiente.");
    } finally {
      quitarMarcaTurno();
      combatInProgress = false;
      fugitivosDelEncuentro = new Set();
      participantesEncuentro = [];
      danioPorPersonajeEncuentro = null;
      enemigosDelEncuentro = [];
      startButton.disabled = false;
      startButton.hidden = true;
      startButton.textContent = "Comenzar encuentro";
      if (combateConcluido) deteriorarEquipoUsado();
      juego.personajes.forEach((personaje) => {
        juego.actualizarRecursosTarjeta(personaje.id);
      });
      agilidadReducidaEncuentro.forEach((_, id) => {
        const combatiente = [...juego.personajes, ...enemigos].find((entry) => entry.id === id);
        if (combatiente) {
          delete combatiente.agilidadReducidaCombate;
          if (combatiente instanceof juego.Personaje) {
            juego.actualizarRecursosTarjeta(combatiente.id);
          }
        }
      });
      agilidadReducidaEncuentro = new Map();
      efectosEstadoEncuentro = new Map();
      proteccionesMagicas = new Map();
      personajesCubiertos = new Set();
      contraataquesPreparados = new Set();
      notificarExploracion("finalizado", {
        resultado: resultadoEncuentro,
        enemigos: resultadoEncuentro === "victoria" ? null : enemigos,
      });
    }
  }

  juego.combate = {
    get enCurso() {
      return combatInProgress || Boolean(encuentroPreparado);
    },
    get puedeExplorar() {
      return !combatInProgress && !encuentroPreparado && botinPendiente.length === 0;
    },
    iniciarEncuentro(bases) {
      if (!Array.isArray(bases) || bases.length === 0 || !this.puedeExplorar
        || !juego.personajes.some((personaje) => personaje.vida.actual > 0)) return false;
      grupoEncuentroForzado = [...bases];
      void ejecutarEncuentro();
      return true;
    },
    prepararEncuentro(bases) {
      if (!Array.isArray(bases) || bases.length === 0 || !this.puedeExplorar
        || !juego.personajes.some((personaje) => personaje.vida.actual > 0)) return false;
      grupoEncuentroForzado = [...bases];
      forzarInicioManual = true;
      void ejecutarEncuentro();
      return true;
    },
    iniciarEmboscada() {
      if (!this.puedeExplorar || juego.poolEncuentros.length === 0
        || !juego.personajes.some(estaVivoCombatiente)) return false;
      grupoEncuentroForzado = null;
      forzarInicioManual = false;
      emboscadaEnemigaForzada = true;
      void ejecutarEncuentro();
      return true;
    },
    crearInstanciaBotin,
    recibirDanioExploracion,
    obtenerEstadoConsumible,
    usarConsumibleEnTurno,
  };

  startButton.addEventListener("click", ejecutarEncuentro);
})();
