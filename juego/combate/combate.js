(function inicializarCombate() {
  const juego = window.juego;
  const startButton = document.querySelector(".encounter-start");
  const eventLog = document.querySelector(".event-log");
  const playerBar = document.querySelector(".player-bar");
  const characterDeathDialog = document.querySelector(".character-death-dialog");
  const characterDeathDescription = characterDeathDialog?.querySelector(".character-death-description");
  const characterDeathClose = characterDeathDialog?.querySelector(".character-death-close");
  const encounterEnemies = document.querySelector(".encounter-enemies");
  const actionDialog = document.querySelector(".combat-action-dialog");
  const fleeButton = document.querySelector(".encounter-flee");
  const Enemigo = juego?.Enemigo;
  const actionTitle = actionDialog?.querySelector("#combat-action-title");
  const actionStatus = actionDialog?.querySelector(".combat-action-status");
  const actionOptions = actionDialog?.querySelector(".combat-action-options");

  if (!(startButton instanceof HTMLButtonElement)
    || !(eventLog instanceof HTMLElement)
    || !(playerBar instanceof HTMLElement)
    || !(characterDeathDialog instanceof HTMLDialogElement)
    || !(characterDeathDescription instanceof HTMLElement)
    || !(characterDeathClose instanceof HTMLButtonElement)
    || !(encounterEnemies instanceof HTMLElement)
    || !(actionDialog instanceof HTMLDialogElement)
    || !(actionTitle instanceof HTMLElement)
    || !(actionStatus instanceof HTMLElement)
    || !(actionOptions instanceof HTMLElement)
    || !(fleeButton instanceof HTMLButtonElement)
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
  const MAX_FORMATION_RANK = 4;
  const MULTIPLICADOR_EVASION_ATAQUE_AREA = 0.5;
  const BONIFICACION_HUIDA_ASESINO = 0.08;
  const PROBABILIDAD_FALLO_CURACION = 0.1;
  const CORDURA_POR_ENEMIGO_DERROTADO = 5;
  let combatInProgress = false;
  let personajeEnTurno = null;
  let objetivosDelTurno = [];
  let grupoDelEncuentro = [];
  let resolverAccionTurno = null;
  let fugitivosDelEncuentro = new Set();
  let agilidadReducidaEncuentro = new Map();
  let emboscadaPendiente = false;
  let sePuedeIntentarHuir = false;
  let encuentroHuye = false;
  let encuentroPreparado = null;
  let contadorEncuentros = 0;
  let botinPendiente = [];
  let grupoEncuentroForzado = null;
  let forzarInicioManual = false;
  let emboscadaEnemigaForzada = false;
  let equipoUsadoEncuentro = new Set();
  let caidosDuranteCombate = new Set();
  let efectosEstadoEncuentro = new Map();

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

  function crearInstanciaBotin(item) {
    const equipo = ["arma", "armadura"].includes(item.categoria);
    return new juego.Item({
      ...item,
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
    return new Promise((resolve) => window.setTimeout(resolve, DELAY_MS));
  }

  function intentarHuirDelEncuentro() {
    if (!encuentroPreparado || !sePuedeIntentarHuir) return false;
    sePuedeIntentarHuir = false;
    fleeButton.hidden = true;
    if (Math.random() < BONIFICACION_HUIDA_ASESINO) {
      encuentroPreparado = null;
      startButton.hidden = true;
      registrarSuceso("El Asesino encuentra una salida y el grupo evita el combate.");
      notificarExploracion("finalizado", { resultado: "huida" });
      return true;
    }
    registrarSuceso("El intento de huida falla. El combate continúa.");
    return false;
  }

  function registrarSuceso(mensaje) {
    const entry = document.createElement("p");
    entry.textContent = mensaje;
    eventLog.append(entry);
    eventLog.scrollTop = eventLog.scrollHeight;
  }
  juego.registrarNovedad = registrarSuceso;

  function renderizarGrupoEnemigo(enemigos, fugitivos = new Set()) {
    encounterEnemies.replaceChildren();
    encounterEnemies.setAttribute("aria-label", "Enemigos del encuentro");
    enemigos.forEach((enemigo) => {
      const card = document.createElement("figure");
      card.className = "encounter-enemy-card";
      card.setAttribute("role", "listitem");
      card.dataset.enemyId = enemigo.id;

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

      card.append(health, image, name, status);
      encounterEnemies.append(card);
      actualizarEstadoEnemigoPanel(enemigo, fugitivos);
    });
    encounterEnemies.hidden = enemigos.length === 0;
  }

  function calcularTablaBotin(enemigos) {
    if (enemigos.length === 0) return [];
    const nivelGrupo = Math.max(1, Math.round(
      enemigos.reduce((total, enemigo) => total + enemigo.nivel, 0) / enemigos.length,
    ));
    const nivelMaximoBotin = nivelGrupo + (enemigos.length >= 3 ? 1 : 0);
    const cantidadOpciones = enemigos.length >= 4 ? 3 : enemigos.length >= 2 ? 2 : 1;
    const candidatos = (juego.itemsBase ?? []).filter((item) =>
      !item.esObjetoMision && item.nivel <= nivelMaximoBotin);
    const disponibles = [...candidatos];
    const recompensas = [];
    while (recompensas.length < cantidadOpciones && disponibles.length > 0) {
      const index = Math.floor(Math.random() * disponibles.length);
      recompensas.push(disponibles.splice(index, 1)[0]);
    }
    return recompensas.map(crearInstanciaBotin);
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
      details.textContent = `${item.categoria} · nivel ${item.nivel}${estadoBotin}`;
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
    return [...playerBar.querySelectorAll(".player-card")].map((card) => {
      const personaje = juego.personajes.find((entry) => entry.id === card.dataset.characterId);
      if (!personaje) {
        throw new Error(`No se encontró el personaje de la tarjeta "${card.dataset.characterId}".`);
      }
      return personaje;
    }).filter((personaje) => estaVivoCombatiente(personaje));
  }

  function crearEnemigoParaEncuentro(base, numeroEncuentro, posicion) {
    return new Enemigo({
      id: `${base.id}-encuentro-${numeroEncuentro}-${posicion}`,
      nombre: base.nombre,
      tipo: base.tipo,
      imagen: base.imagen,
      nivel: base.nivel,
      vidaMaxima: base.vida.maxima,
      corduraMaxima: base.cordura.maxima,
      poderMaximo: base.poder.maximo,
      ataqueBase: base.ataqueBase,
      resistenciaBase: base.resistenciaBase,
      agilidad: base.agilidad,
      bonificacionCritico: base.bonificacionCritico,
      maldito: base.maldito,
      danioCorduraPorGolpe: base.danioCorduraPorGolpe,
      danioMoralPorGolpe: base.danioMoralPorGolpe,
      efectoGolpe: base.efectoGolpe ? { ...base.efectoGolpe } : null,
      equipo: { ...base.equipo },
      descripcion: base.descripcion,
    });
  }
  function obtenerCostePoder(personaje, arma, perfil) {
    const pasivaCaballero = personaje.id === "caballero-maldito";
    const pasivaBruja = personaje.id === "bruja" && arma.magico && perfil.efecto !== "curacion";
    return pasivaCaballero || pasivaBruja ? Math.ceil(perfil.costePoder / 2) : perfil.costePoder;
  }

  function calcularIniciativa(combatiente) {
    const dado = Math.floor(Math.random() * 20) + 1;
    const agilidad = combatiente instanceof juego.Personaje
      ? combatiente.agilidadCombate
      : combatiente.agilidad;
    return { dado, total: dado + agilidad + Math.round(combatiente.bonificacionCritico * 100) };
  }

  function prepararIniciativa(grupo, enemigos) {
    const lider = grupo.find(estaVivoCombatiente) ?? grupo[0];
    const enemigoEnPunta = enemigos[0];
    const iniciativaGrupo = calcularIniciativa(lider);
    const iniciativaEnemigo = calcularIniciativa(enemigoEnPunta);
    const enemigosEmboscan = emboscadaEnemigaForzada;
    const grupoPrimero = !enemigosEmboscan && iniciativaGrupo.total >= iniciativaEnemigo.total;
    emboscadaEnemigaForzada = false;
    const asesinoAlFrente = grupo[0]?.id === "asesino" && estaVivoCombatiente(grupo[0]);
    emboscadaPendiente = grupoPrimero && asesinoAlFrente;
    sePuedeIntentarHuir = emboscadaPendiente;
    if (fleeButton instanceof HTMLButtonElement) {
      fleeButton.hidden = !sePuedeIntentarHuir;
    }
    registrarSuceso(
      `Iniciativa: grupo ${iniciativaGrupo.dado} + ${iniciativaGrupo.total - iniciativaGrupo.dado} = ${iniciativaGrupo.total}; `
      + `${enemigoEnPunta.nombre} ${iniciativaEnemigo.dado} + ${iniciativaEnemigo.total - iniciativaEnemigo.dado} = ${iniciativaEnemigo.total}. `
      + `${grupoPrimero ? "El grupo toma la iniciativa." : `${enemigoEnPunta.nombre} toma la iniciativa.`}`,
    );
    if (emboscadaPendiente) {
      registrarSuceso("El Asesino lidera la emboscada: el primer golpe conectado del grupo será crítico.");
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
    juego.actualizarRecursosTarjeta(personaje.id);
    juego.actualizarBonificacionesFormacion?.();
    window.setTimeout(() => juego.sonidos?.reproducir("muerteAliado"), 160);
    characterDeathDescription.textContent = `${personaje.nombre} ha muerto.`;
    if (!characterDeathDialog.open) characterDeathDialog.showModal();
    await new Promise((resolve) => {
      characterDeathDialog.addEventListener("close", resolve, { once: true });
    });
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

  function obtenerAlcanceAtaque(combatiente) {
    return combatiente.equipo?.arma?.alcance ?? 1;
  }

  function obtenerDeterioroMental(combatiente) {
    return 100 * (1 - combatiente.estabilidadMental.actual / combatiente.estabilidadMental.maxima);
  }

  function obtenerFormacionActiva(grupo, fugitivos) {
    return grupo.filter((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje));
  }

  function actualizarFormacionTrasHuida(personaje, grupo) {
    const indice = grupo.indexOf(personaje);
    if (indice < 0) return;
    grupo.splice(indice, 1);
    grupo.push(personaje);
    const tarjeta = playerBar.querySelector(`[data-character-id="${personaje.id}"]`);
    if (tarjeta instanceof HTMLElement) playerBar.append(tarjeta);
    juego.actualizarRecursosTarjeta(personaje.id);
    juego.actualizarControlesFormacion?.();
    juego.actualizarBonificacionesFormacion?.();
  }

  function actualizarFormacionTrasResurreccion(personaje, grupo, participantes = null, danioPorPersonaje = null) {
    const indice = grupo.indexOf(personaje);
    if (indice >= 0) {
      grupo.splice(indice, 1);
    }
    grupo.push(personaje);
    if (participantes && !participantes.includes(personaje)) participantes.push(personaje);
    if (danioPorPersonaje && !danioPorPersonaje.has(personaje.id)) danioPorPersonaje.set(personaje.id, 0);
    juego.actualizarControlesFormacion?.();
    juego.actualizarBonificacionesFormacion?.();
  }

  function evaluarInicioTurno(combatiente, fugitivos, grupo = null) {
    const deterioro = obtenerDeterioroMental(combatiente);
    if (deterioro >= 50) {
      const probabilidadHuida = Math.min(60, 10 + Math.floor((deterioro - 50) / 10) * 10);
      if (Math.random() * 100 < probabilidadHuida) {
        fugitivos.add(combatiente);
        if (combatiente instanceof Enemigo) {
          actualizarEstadoEnemigoPanel(combatiente, fugitivos);
        }
        if (combatiente instanceof juego.Personaje && Array.isArray(grupo)) {
          actualizarFormacionTrasHuida(combatiente, grupo);
          registrarSuceso(`${combatiente.nombre} se retira a la retaguardia; el resto del grupo avanza.`);
        }
        registrarSuceso(
          `${combatiente.nombre} huye del combate (probabilidad de huida: ${probabilidadHuida} %).`,
        );
        return false;
      }
    } else if (deterioro >= 30 && Math.random() < 0.5) {
      registrarSuceso(`${combatiente.nombre} pierde su turno por el deterioro de su moral o cordura.`);
      return false;
    } else if (deterioro >= 10 && Math.random() < 0.25) {
      registrarSuceso(`${combatiente.nombre} pierde su turno por el deterioro de su moral o cordura.`);
      return false;
    }
    return true;
  }

  function puedeErrarAtaque(combatiente) {
    const deterioro = obtenerDeterioroMental(combatiente);
    return deterioro >= 10 && Math.random() < 0.1;
  }

  function crearOpcionAtaque(tipo, texto, objetivoId = null, deshabilitado = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.attackType = tipo;
    if (objetivoId) {
      button.dataset.targetId = objetivoId;
    }
    button.textContent = texto;
    button.disabled = deshabilitado;
    actionOptions.append(button);
  }

  function obtenerObjetivosEnRango(atacante, grupo, enemigos, fugitivos) {
    const alcance = obtenerAlcanceAtaque(atacante);
    const formacionActiva = obtenerFormacionActiva(grupo, fugitivos);
    if (atacante instanceof juego.Personaje) {
      const rango = formacionActiva.indexOf(atacante) + 1;
      return rango <= alcance
        ? enemigos.filter((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))
        : [];
    }
    return formacionActiva.filter((personaje, index) => index + 1 <= alcance);
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
      button.textContent = `Equiparse: ${item.nombre} · consume el turno`;
      actionOptions.append(button);
    });
  }

  function crearOpcionesPocionResurreccion() {
    const inventario = window.inventarioGrupo?.items;
    if (!Array.isArray(inventario)) return;
    const aliadosCaidos = juego.personajes.filter((aliado) => aliado.vida.actual <= 0);
    if (aliadosCaidos.length === 0) return;
    inventario.forEach((item, index) => {
      if (!item?.revivir) return;
      aliadosCaidos.forEach((aliado) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.attackType = "revivir";
        button.dataset.targetId = aliado.id;
        button.dataset.inventorySlot = String(index + 1);
        button.textContent = `${item.nombre} \u2192 ${aliado.nombre}`;
        actionOptions.append(button);
      });
    });
  }

  function abrirMenuAcciones(personaje) {
    if (personaje !== personajeEnTurno || !resolverAccionTurno || actionDialog.open) {
      return;
    }
    actionTitle.textContent = `Turno de ${personaje.nombre}`;
    actionStatus.textContent = `Poder: ${personaje.poder.actual}/${personaje.poder.maximo}`;
    actionOptions.replaceChildren();
    objetivosDelTurno.forEach((objetivo) => {
      crearOpcionAtaque("basico", `Puñetazo → ${objetivo.nombre} · sin coste`, objetivo.id);
    });

    const arma = personaje.equipo.arma;
    if (arma) {
      const dirigido = arma.ataquesEspeciales.dirigido;
      const area = arma.ataquesEspeciales.area;
      const costeDirigido = obtenerCostePoder(personaje, arma, dirigido);
      const costeArea = obtenerCostePoder(personaje, arma, area);
      const objetivosDirigidos = dirigido.efecto === "curacion"
        ? grupoDelEncuentro.filter((objetivo) => estaVivoCombatiente(objetivo)
          && objetivo.vida.actual < objetivo.vida.maxima
          && !fugitivosDelEncuentro.has(objetivo))
        : objetivosDelTurno;
      objetivosDirigidos.forEach((objetivo) => {
        crearOpcionAtaque(
          "dirigido",
          `${dirigido.nombre} → ${objetivo.nombre} · ${dirigido.efecto === "curacion" ? `cura ${dirigido.curacion} · ` : ""}${costeDirigido} poder`,
          objetivo.id,
          personaje.poder.actual < costeDirigido,
        );
      });
      const hayObjetivosArea = area.efecto === "curacion"
        ? grupoDelEncuentro.some((objetivo) => estaVivoCombatiente(objetivo)
          && objetivo.vida.actual < objetivo.vida.maxima
          && !fugitivosDelEncuentro.has(objetivo))
        : objetivosDelTurno.length > 0;
      if (hayObjetivosArea) {
        crearOpcionAtaque(
          "area",
          `${area.nombre} → ${area.efecto === "curacion" ? `grupo · cura ${area.curacion}` : `hasta ${area.objetivosMaximos} objetivos`} · ${costeArea} poder`,
          null,
          personaje.poder.actual < costeArea,
        );
      }
    }

    crearOpcionEquipo(personaje);
    crearOpcionesPocionResurreccion();

    if (objetivosDelTurno.length === 0 && !grupoDelEncuentro.some((objetivo) => estaVivoCombatiente(objetivo))) {
      actionStatus.textContent = "No hay enemigos al alcance. Puedes usar otra habilidad cuando esté disponible o pasar el turno.";
    }
    crearOpcionAtaque("saltar", "Pasar turno");
    actionDialog.showModal();
  }

  function esperarAccionDelJugador(personaje, objetivosDisponibles, grupo) {
    personajeEnTurno = personaje;
    objetivosDelTurno = objetivosDisponibles;
    grupoDelEncuentro = grupo;
    marcarTurnoActual(personaje);
    return new Promise((resolve) => {
      resolverAccionTurno = resolve;
    });
  }

  function obtenerEstadoConsumible(item) {
    const esGrimorio = item.tipo.toLowerCase() === "grimorio";
    const esRevivir = Boolean(item.revivir);
    const esAplicacionArma = Boolean(item.efectoEstado);
    if (!combatInProgress) {
      return { enCurso: false, disponible: true, esGrimorio, esRevivir, esAplicacionArma, personajeEnTurno: null };
    }
    if (!personajeEnTurno || !resolverAccionTurno) {
      return {
        enCurso: true,
        disponible: false,
        esGrimorio,
        esRevivir,
        esAplicacionArma,
        personajeEnTurno: null,
        motivo: "Los consumibles solo se pueden usar durante el turno de un personaje.",
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
        esGrimorio,
        esRevivir,
        esAplicacionArma,
        personajeEnTurno,
        motivo: item.magico
          ? "Este objeto mágico solo puede ser usado por la Bruja o el Sacerdote."
          : "Este personaje no puede usar ese consumible.",
      };
    }

    if (esAplicacionArma && !juego.equipo?.puedeAplicarEfectoArma(personajeEnTurno, item)) {
      return {
        enCurso: true,
        disponible: false,
        esGrimorio,
        esRevivir,
        esAplicacionArma,
        personajeEnTurno,
        motivo: "Necesitas un arma convencional equipada y sin otro efecto preparado.",
      };
    }

    return { enCurso: true, disponible: true, esGrimorio, esRevivir, esAplicacionArma, personajeEnTurno };
  }

  function usarConsumibleEnTurno(numeroEspacio, objetivoId) {
    const objetosInventario = window.inventarioGrupo?.items;
    if (!Array.isArray(objetosInventario) || !Number.isInteger(numeroEspacio)
      || numeroEspacio < 1 || numeroEspacio > objetosInventario.length) {
      throw new RangeError("El espacio del inventario seleccionado no es válido.");
    }
    if (!combatInProgress || !personajeEnTurno || !resolverAccionTurno) {
      throw new Error("No hay un turno de personaje activo para usar un consumible.");
    }

    const item = objetosInventario[numeroEspacio - 1];
    if (!item || item.categoria !== "consumible") {
      throw new TypeError("El objeto seleccionado ya no es un consumible.");
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
    if (!estado.esGrimorio && !estado.esRevivir && objetivo !== personajeEnTurno) {
      throw new Error("Los consumibles comunes solo pueden aplicarse al personaje en turno.");
    }

    const itemUsado = juego.equipo.usarConsumible(
      numeroEspacio,
      objetivo.id,
      personajeEnTurno.id,
    );
    if (item.revivir) actualizarFormacionTrasResurreccion(objetivo, grupoDelEncuentro);
    const eleccion = {
      tipo: "consumible",
      item: itemUsado,
      objetivo,
      usuario: personajeEnTurno,
    };
    const resolver = resolverAccionTurno;
    resolverAccionTurno = null;
    resolver(eleccion);
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

  function elegirAtaqueEnemigo(enemigo, cantidadObjetivos) {
    const ataquesDisponibles = [{ tipo: "basico", perfil: null }];
    const arma = enemigo.equipo.arma;
    if (arma) {
      ["dirigido", "area"].forEach((tipo) => {
        const perfil = arma.ataquesEspeciales[tipo];
        if (enemigo.poder.actual >= perfil.costePoder) {
          ataquesDisponibles.push({ tipo, perfil });
        }
      });
    }

    const tipoPreferido = cantidadObjetivos >= 2 && ataquesDisponibles.some(({ tipo }) => tipo === "area")
      ? "area"
      : ataquesDisponibles.some(({ tipo }) => tipo === "dirigido")
        ? "dirigido"
        : "basico";
    const deterioro = obtenerDeterioroMental(enemigo);
    const probabilidadMalaDecision = deterioro >= 50 ? 0.75
      : deterioro >= 30 ? 0.5
        : deterioro >= 10 ? 0.25
          : 0;
    if (ataquesDisponibles.length > 1 && Math.random() < probabilidadMalaDecision) {
      const alternativas = ataquesDisponibles.filter(({ tipo }) => tipo !== tipoPreferido);
      return alternativas[Math.floor(Math.random() * alternativas.length)];
    }
    return ataquesDisponibles.find(({ tipo }) => tipo === tipoPreferido);
  }

  function obtenerNombreLinea(rango) {
    return rango === 1 ? "liderando"
      : rango === MAX_FORMATION_RANK ? "retaguardia"
        : "segunda línea";
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
  ) {
    const probabilidadEsquiva = Math.min(
      objetivo instanceof juego.Personaje ? 0.15 : 0.35,
      objetivo.probabilidadEsquivar * multiplicadorEvasion,
    );
    if (Math.random() < probabilidadEsquiva) {
      return { evadido: true, critico: false, murio: false, danio: 0, danioMoral: 0, danioCordura: 0, danioAgilidad: 0, danioPoder: 0 };
    }

    const critico = forzarCritico || Math.random() < probabilidadCritico;
    const armaAtacante = atacante.equipo?.arma;
    const eficaciaArmaJugador = atacante instanceof juego.Personaje
      ? eficaciaArma
      : 1;
    const danioBase = Math.max(1, ataque - resistencia);
    const danioConTipo = Math.max(1, Math.floor(danioBase * multiplicadorDanio));
    const danioCritico = critico ? danioConTipo * 2 : danioConTipo;
    const danioCalculado = Math.max(1, Math.floor(danioCritico * eficaciaArmaJugador));
    const grupo = objetivo instanceof juego.Personaje ? obtenerGrupoEnOrden() : [];
    const indiceObjetivo = grupo.indexOf(objetivo);
    const caballero = grupo.find((personaje) => personaje.id === "caballero-maldito");
    const indiceCaballero = caballero && estaVivoCombatiente(caballero)
      ? grupo.indexOf(caballero)
      : -1;
    const distanciaProteccion = indiceObjetivo - indiceCaballero;
    const reduccionPorPosicion = indiceCaballero >= 0 && distanciaProteccion > 0
      ? ([0, 0.15, 0.10, 0.05][distanciaProteccion] ?? 0)
      : 0;
    const danioMitigado = Math.round(danioCalculado * reduccionPorPosicion);
    const danio = Math.min(objetivo.vida.actual, Math.max(0, danioCalculado - danioMitigado));
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
    if (objetivo.moral && atacante instanceof juego.Personaje) {
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
    } else if (objetivo.moral && atacante instanceof Enemigo) {
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
    };
  }

  async function registrarAtaque(atacante, objetivo, resultado, etiquetaAtaque) {
    if (resultado.evadido) {
      registrarSuceso(`${objetivo.nombre} esquiva el ataque de ${atacante.nombre}.`);
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
      ? ` El Caballero mitiga ${resultado.danioMitigado} ${resultado.danioMitigado === 1 ? "punto" : "puntos"} de daño.`
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
      `${etiquetaAtaque ? `${etiquetaAtaque}: ` : ""}${atacante.nombre} golpea a ${objetivo.nombre} y le quita ${resultado.danio} ${unidadVida} de vida.${golpe} (${objetivo.vida.actual}/${objetivo.vida.maxima} PV).${mitigacionCaballero}${efectoMoral}${proteccionMoral}${efectoCordura}${proteccionCordura}${efectoAgilidad}${efectoPoder}`,
    );
    if (resultado.murio && objetivo instanceof Enemigo) {
      restaurarCorduraPorEnemigoDerrotado(objetivo);
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
    const experienciaBase = 20 * enemigo.nivel;
    const experienciaContribucion = 20 * enemigo.nivel;
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
        puntosHabilidad: personaje.puntosHabilidad,
      };
      const progresion = juego.ganarExperiencia(personaje.id, totalExperiencia);
      const detalleContribucion = experienciaAdicional > 0
        ? ` (incluye ${experienciaAdicional} XP por contribución)`
        : "";
      registrarSuceso(`${personaje.nombre} recibe ${totalExperiencia} XP${detalleContribucion}.`);

      if (progresion.nivel > progresionAnterior.nivel) {
        const nivelesGanados = progresion.nivel - progresionAnterior.nivel;
        const puntosHabilidadGanados = progresion.puntosHabilidad - progresionAnterior.puntosHabilidad;
        const textoPuntosHabilidad = puntosHabilidadGanados === 1 ? "punto" : "puntos";
        registrarSuceso(
          `${personaje.nombre} sube ${nivelesGanados === 1 ? "al nivel" : `${nivelesGanados} niveles`} ${progresion.nivel} y obtiene ${puntosHabilidadGanados} ${textoPuntosHabilidad} de habilidad.`,
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
      const objetivosDisponibles = obtenerObjetivosEnRango(enemigo, grupo, enemigos, fugitivos);
      if (objetivosDisponibles.length === 0) {
        registrarSuceso(`${enemigo.nombre} no logra alcanzar al grupo desde su posición.`);
        await esperarTurno();
        continue;
      }

      const eleccion = elegirAtaqueEnemigo(enemigo, objetivosDisponibles.length);
      const objetivos = eleccion.tipo === "area"
        ? objetivosDisponibles.slice(0, eleccion.perfil.objetivosMaximos)
        : [objetivosDisponibles[Math.floor(Math.random() * objetivosDisponibles.length)]];
      if (eleccion.perfil) {
        enemigo.poder.actual -= eleccion.perfil.costePoder;
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
          objetivo.resistenciaFisicaCombate,
          enemigo.probabilidadCritico,
          eleccion.perfil?.multiplicadorDanio ?? 0.5,
          eleccion.tipo === "area" ? MULTIPLICADOR_EVASION_ATAQUE_AREA : 1,
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
          eleccion.tipo === "basico" ? "Ataque básico" : eleccion.perfil.nombre,
        );
        const efectoGolpe = enemigo.efectoGolpe;
        if (!resultado.evadido && estaVivoCombatiente(objetivo) && efectoGolpe
          && Math.random() < efectoGolpe.probabilidad) {
          aplicarEfectoEstado(objetivo, efectoGolpe, enemigo.nombre);
        }
      }
      await esperarTurno();
      if (encuentroHuye) return;
    }
  }

  function itemPuedeEquiparAutomaticamente(personaje, item) {
    const clase = personaje.clase.toLowerCase();
    const esClaseMagica = ["bruja", "sacerdote"].includes(clase);
    return (!item.magico || esClaseMagica)
      && (item.clasesPermitidas.includes("todas") || item.clasesPermitidas.includes(clase));
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
        + (bonificaciones.agilidad ?? 0) * 3
        + (bonificaciones.fuerza ?? 0) * 2
        + (bonificaciones.poder ?? 0) * 2;
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
        && Object.values(item.ataquesEspeciales ?? {}).some((perfil) => (perfil.efecto === "curacion") === esCurativa));
    if (elegibles.length === 0) return null;
    return elegibles.reduce((mejor, actual) => {
      const puntuacion = esCurativa
        ? Object.values(actual.item.ataquesEspeciales)
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
    const esCurativaActual = Object.values(armaActual?.ataquesEspeciales ?? {})
      .some((perfil) => perfil.efecto === "curacion");
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
    const inventario = window.inventarioGrupo?.items;
    if (!Array.isArray(inventario) || !juego.equipo) return false;
    const clase = personaje.clase.toLowerCase();
    const esClaseMagica = ["bruja", "sacerdote"].includes(clase);
    const pociones = inventario
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item?.categoria === "consumible"
        && item.tipo.toLowerCase() === "pocion"
        && (item.bonificacion.vida ?? 0) > 0);
    const grimorios = inventario
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item?.categoria === "consumible"
        && item.tipo.toLowerCase() === "grimorio"
        && item.magico
        && (item.bonificacion.vida ?? 0) > 0
        && itemPuedeEquiparAutomaticamente(personaje, item));

    let objetivo = null;
    let objeto = null;
    if (esVidaCritica(personaje)) {
      objetivo = personaje;
      objeto = pociones[0] ?? (esClaseMagica ? grimorios[0] : null);
    } else if (pociones.length === 0 && esClaseMagica) {
      objetivo = juego.personajes.find((aliado) => aliado !== personaje
        && estaVivoCombatiente(aliado)
        && !fugitivosDelEncuentro.has(aliado)
        && esVidaCritica(aliado));
      objeto = objetivo ? grimorios[0] : null;
    }
    if (!objetivo || !objeto) return false;

    juego.equipo.usarConsumible(objeto.index + 1, objetivo.id, personaje.id);
    return true;
  }

  function elegirAccionAutomatica(personaje, objetivos) {
    const arma = personaje.equipo.arma;
    const aliadosHeridos = aliadosNecesitanCuracion(grupoDelEncuentro, fugitivosDelEncuentro, 0.99);
    if (arma) {
      const area = arma.ataquesEspeciales.area;
      const dirigido = arma.ataquesEspeciales.dirigido;
      const curacionArea = area.efecto === "curacion" ? aliadosHeridos : [];
      const costeArea = obtenerCostePoder(personaje, arma, area);
      if (curacionArea.length >= 2 && personaje.poder.actual >= costeArea) {
        return { tipo: "area" };
      }
      const objetivoCuracion = dirigido.efecto === "curacion"
        ? aliadosHeridos.sort((a, b) => (b.vida.maxima - b.vida.actual) - (a.vida.maxima - a.vida.actual))[0]
        : null;
      const costeDirigido = obtenerCostePoder(personaje, arma, dirigido);
      if (objetivoCuracion && personaje.poder.actual >= costeDirigido) {
        return { tipo: "dirigido", objetivoId: objetivoCuracion.id };
      }
    }
    if (objetivos.length === 0) return { tipo: "saltar" };
    if (!arma) return { tipo: "basico", objetivoId: objetivos[0].id };

    const dirigido = arma.ataquesEspeciales.dirigido;
    const area = arma.ataquesEspeciales.area;
    const costeDirigido = obtenerCostePoder(personaje, arma, dirigido);
    const costeArea = obtenerCostePoder(personaje, arma, area);
    if (objetivos.length > 1 && area.efecto !== "curacion" && personaje.poder.actual >= costeArea) {
      return { tipo: "area" };
    }
    if (dirigido.efecto !== "curacion" && personaje.poder.actual >= costeDirigido) {
      return { tipo: "dirigido", objetivoId: objetivos[0].id };
    }
    return { tipo: "basico", objetivoId: objetivos[0].id };
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
      if (!basesForzadas && juego.poolEncuentros.length === 0) {
        throw new Error("No hay enemigos registrados para generar un encuentro.");
      }
      contadorEncuentros += 1;
      const cantidadEnemigos = basesForzadas?.length ?? (Math.floor(Math.random() * 4) + 1);
      const aparicionesPorTipo = new Map();
      const enemigos = Array.from({ length: cantidadEnemigos }, (_, index) => {
        const base = basesForzadas?.[index]
          ?? juego.poolEncuentros[Math.floor(Math.random() * juego.poolEncuentros.length)];
        const aparicion = (aparicionesPorTipo.get(base.id) ?? 0) + 1;
        aparicionesPorTipo.set(base.id, aparicion);
        const enemigo = crearEnemigoParaEncuentro(base, contadorEncuentros, index + 1);
        if (aparicion > 1) enemigo.nombre = `${base.nombre} ${aparicion}`;
        return enemigo;
      });
      eventLog.querySelector(".event-log-placeholder")?.remove();
      renderizarGrupoEnemigo(enemigos);
      if (requiereConfirmacion) encounterEnemies.hidden = true;
      registrarSuceso(`El grupo se enfrenta a: ${enemigos.map((enemigo) => enemigo.nombre).join(", ")}.`);
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
      if (!requiereConfirmacion && !sePuedeIntentarHuir) {
        return ejecutarEncuentro();
      }
      return;
    }

    const { grupo, enemigos, grupoPrimero, emboscada } = encuentroPreparado;
    encuentroPreparado = null;
    equiparMejorEquipoAutomaticamente(grupo);
    grupoDelEncuentro = grupo;
    const participantes = [...grupo];
    equipoUsadoEncuentro = new Set();
    caidosDuranteCombate = new Set();
    efectosEstadoEncuentro = new Map();
    grupo.filter(estaVivoCombatiente).forEach(registrarEquipoUsado);
    const danioPorPersonaje = new Map(participantes.map((personaje) => [personaje.id, 0]));
    const fugitivos = new Set();
    fugitivosDelEncuentro = fugitivos;
    encuentroHuye = false;
    let resultadoEncuentro = "interrumpido";
    let combateConcluido = false;
    sePuedeIntentarHuir = false;
    emboscadaPendiente = emboscada;
    fleeButton.hidden = true;

    combatInProgress = true;
    notificarExploracion("combate-iniciado");
    startButton.disabled = true;
    startButton.hidden = true;
    startButton.textContent = "Combate en curso...";
    renderizarGrupoEnemigo(enemigos, fugitivos);
    registrarSuceso(`¡Comienza el combate contra ${enemigos.map((enemigo) => enemigo.nombre).join(", ")}!`);

    try {
      let ronda = 0;
      while (!encuentroHuye
        && enemigos.some((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))
      && grupo.some((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje))
        && ronda < MAX_ROUNDS) {
        ronda += 1;
        registrarSuceso(`Ronda ${ronda}.`);
        await esperarTurno();

        if (ronda === 1 && !grupoPrimero) {
          await ejecutarTurnosEnemigos(grupo, enemigos, fugitivos);
          if (encuentroHuye) break;
        }

        for (const personaje of [...grupo]) {
        if (!estaVivoCombatiente(personaje) || fugitivos.has(personaje)
          || !enemigos.some((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo))) {
          continue;
        }

        marcarTurnoActual(personaje);
        if (await procesarEfectosEstadoInicioTurno(personaje)) {
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        if (!evaluarInicioTurno(personaje, fugitivos, grupo)) {
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        registrarSuceso(
          juego.combateAutomatico
            ? `Turno de ${personaje.nombre}. El grupo decide automáticamente.`
            : `Turno de ${personaje.nombre}. Haz clic en ${personaje.equipo.arma ? "el icono del arma" : "el icono de los puños"} para elegir una acción.`,
        );
        const objetivosDisponibles = obtenerObjetivosEnRango(personaje, grupo, enemigos, fugitivos);
        if (juego.combateAutomatico && usarCuracionAutomatica(personaje)) {
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        const cambioArma = elegirCambioArmaAutomatico(personaje, grupo, fugitivos);
        if (cambioArma) {
          juego.equipo.equiparDesdeInventario(cambioArma.inventarioSlot, personaje.id);
          registrarEquipoUsado(personaje);
          registrarSuceso(`${personaje.nombre} cambia a ${cambioArma.item.nombre}; consume su turno para prepararse.`);
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        const puedeCurarSinAlcance = personaje.equipo.arma
          && Object.entries(personaje.equipo.arma.ataquesEspeciales).some(([tipo, perfil]) => {
            if (perfil.efecto !== "curacion") return false;
            const coste = obtenerCostePoder(personaje, personaje.equipo.arma, perfil);
            const hayAliadoHerido = aliadosNecesitanCuracion(grupo, fugitivos, 0.99).length > 0;
            const hayObjetivosSuficientes = tipo === "area"
              ? aliadosNecesitanCuracion(grupo, fugitivos, 0.99).length > 0
              : hayAliadoHerido;
            return hayObjetivosSuficientes && personaje.poder.actual >= coste;
          });
        if (objetivosDisponibles.length === 0 && !puedeCurarSinAlcance) {
          const rango = obtenerFormacionActiva(grupo, fugitivos).indexOf(personaje) + 1;
          const alcance = obtenerAlcanceAtaque(personaje);
          registrarSuceso(
            personaje.equipo.arma
              ? `${personaje.nombre} no puede atacar desde la ${obtenerNombreLinea(rango)}: su arma solo alcanza ${alcance} ${alcance === 1 ? "línea" : "líneas"}.`
              : `${personaje.nombre} no puede atacar desde la ${obtenerNombreLinea(rango)}: sin arma, su ataque básico solo alcanza una línea.`,
          );
        }

        const eleccion = juego.combateAutomatico
          ? elegirAccionAutomatica(personaje, objetivosDisponibles)
          : await esperarAccionDelJugador(personaje, objetivosDisponibles, grupo);
        if (encuentroHuye) {
          break;
        }
        if (eleccion.tipo === "revivir") {
          const item = window.inventarioGrupo?.items?.[eleccion.inventarioSlot - 1];
          const aliado = juego.personajes.find((entry) => entry.id === eleccion.objetivoId);
          if (!item?.revivir || !aliado || aliado.vida.actual > 0) {
            throw new Error("La selecciÃ³n de aliado para revivir ya no es vÃ¡lida.");
          }
          juego.equipo.usarConsumible(eleccion.inventarioSlot, aliado.id, personaje.id);
          actualizarFormacionTrasResurreccion(aliado, grupo, participantes, danioPorPersonaje);
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        if (eleccion.tipo === "consumible") {
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        if (eleccion.tipo === "saltar") {
          registrarSuceso(`${personaje.nombre} pasa su turno.`);
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        if (eleccion.tipo === "equipar") {
          const item = window.inventarioGrupo?.items?.[eleccion.inventarioSlot - 1];
          if (!item || !["arma", "armadura", "especial"].includes(item.categoria)) {
            throw new Error("El objeto de equipo seleccionado ya no está disponible.");
          }
          juego.equipo.equiparDesdeInventario(eleccion.inventarioSlot, personaje.id);
          registrarEquipoUsado(personaje);
          registrarSuceso(`${personaje.nombre} se equipa ${item.nombre}; consume su turno.`);
          await esperarTurno();
          quitarMarcaTurno();
          continue;
        }
        const perfil = eleccion.tipo === "basico"
          ? null
          : personaje.equipo.arma.ataquesEspeciales[eleccion.tipo];
        const aliadosVivos = grupo.filter((objetivo) => estaVivoCombatiente(objetivo)
          && objetivo.vida.actual < objetivo.vida.maxima
          && !fugitivos.has(objetivo));
        const objetivosDisponiblesAtaque = perfil?.efecto === "curacion" ? aliadosVivos : objetivosDisponibles;
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
        const ataque = personaje.fuerzaEfectiva
          + (eleccion.tipo === "basico"
            ? 0
            : personaje.equipo.arma?.ataque ?? 0);
        const multiplicadorDanio = perfil?.multiplicadorDanio ?? 0.5;
        animarTarjeta(personaje, "is-attacking");
        const falloPorEstado = puedeErrarAtaque(personaje);
        const falloCuracion = perfil?.efecto === "curacion" && Math.random() < PROBABILIDAD_FALLO_CURACION;
        if (falloPorEstado || falloCuracion) {
          registrarSuceso(falloCuracion && !falloPorEstado
            ? `${personaje.nombre} falla el hechizo de curación; no restaura vida.`
            : `${personaje.nombre} falla su acción por el deterioro de su cordura.`);
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
              objetivo.resistencia,
              personaje.probabilidadCritico,
              multiplicadorDanio,
              eleccion.tipo === "area" ? MULTIPLICADOR_EVASION_ATAQUE_AREA : 1,
              emboscadaPendiente,
              personaje.equipo.arma?.eficaciaEstado ?? 1,
            );
            if (!resultado.evadido && !sonidoGolpeReproducido) {
              reproducirSonidoGolpe(personaje);
              sonidoGolpeReproducido = true;
            }
            if (emboscadaPendiente && !resultado.evadido) {
              emboscadaPendiente = false;
            }
            const efectoPreparado = eleccion.tipo === "basico"
              ? null
              : personaje.equipo.arma?.efectoPreparado;
            if (!resultado.evadido) {
              if (efectoPreparado) delete personaje.equipo.arma.efectoPreparado;
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
              eleccion.tipo === "basico" ? "Puñetazo" : perfil.nombre,
            );
            if (!resultado.evadido && estaVivoCombatiente(objetivo)) {
              aplicarEfectoEstado(objetivo, efectoPreparado, personaje.nombre);
              aplicarEfectoEstado(objetivo, perfil?.efectoEstado, personaje.nombre);
            }
          }
        }
        await esperarTurno();
        quitarMarcaTurno();
      }
      if (!encuentroHuye && !(ronda === 1 && !grupoPrimero)) {
        await ejecutarTurnosEnemigos(grupo, enemigos, fugitivos);
      }
    }

    const enemigosEnPie = enemigos.filter((enemigo) => estaVivoCombatiente(enemigo) && !fugitivos.has(enemigo));
    const grupoEnPie = grupo.filter((personaje) => estaVivoCombatiente(personaje) && !fugitivos.has(personaje));
    if (encuentroHuye) {
      resultadoEncuentro = "huida";
      registrarSuceso("El grupo logra escapar del combate.");
      renderizarGrupoEnemigo([]);
    } else if (enemigosEnPie.length === 0 && grupoEnPie.length > 0) {
      resultadoEncuentro = "victoria";
      const enemigosDerrotados = enemigos.filter((enemigo) => !estaVivoCombatiente(enemigo));
      enemigosDerrotados.forEach((enemigo) => registrarSuceso(`${enemigo.nombre} ha sido derrotado.`));
      enemigosDerrotados.forEach((enemigo) => otorgarExperiencia(participantes, enemigo, danioPorPersonaje));
      if (enemigosDerrotados.length === 0) {
        registrarSuceso("Los enemigos huyeron. El grupo no obtiene experiencia por este combate.");
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
      registrarSuceso(
        grupo.every((personaje) => !estaVivoCombatiente(personaje))
          ? "El grupo ha sido derrotado."
          : "El grupo ha huido del combate.",
      );
      renderizarGrupoEnemigo([]);
    } else {
      registrarSuceso("El combate se detuvo tras alcanzar el límite de rondas.");
      renderizarGrupoEnemigo([]);
    }
    combateConcluido = true;
    } finally {
      quitarMarcaTurno();
      combatInProgress = false;
      fugitivosDelEncuentro = new Set();
      startButton.disabled = false;
      startButton.hidden = true;
      startButton.textContent = "Comenzar encuentro";
      if (fleeButton instanceof HTMLButtonElement) fleeButton.hidden = true;
      sePuedeIntentarHuir = false;
      if (combateConcluido) deteriorarEquipoUsado();
      juego.personajes.forEach((personaje) => {
        juego.actualizarRecursosTarjeta(personaje.id);
        personaje.poder.actual = personaje.poder.maximo;
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
      juego.actualizarControlesFormacion?.();
      notificarExploracion("finalizado", { resultado: resultadoEncuentro });
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
    obtenerEstadoConsumible,
    usarConsumibleEnTurno,
  };

  fleeButton.addEventListener("click", () => {
    intentarHuirDelEncuentro();
  });

  startButton.addEventListener("click", ejecutarEncuentro);
})();
