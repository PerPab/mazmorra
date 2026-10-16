(function inicializarEditorRecursos() {
  const juego = window.juego;
  const dialog = document.querySelector(".resource-editor-dialog");
  const form = dialog?.querySelector(".resource-form");
  const fields = dialog?.querySelector(".resource-fields");
  const kindSelect = dialog?.querySelector(".resource-kind");
  const status = dialog?.querySelector(".resource-status");
  const openButton = document.querySelector(".options-resource-open");
  const closeButton = dialog?.querySelector(".resource-close");
  const storageKey = "juego_phone.recursosCreados.v1";
  let projectDirectoryHandle = null;
  let selectedImage = "";
  let selectedAudio = "";

  const classes = ["caballero", "bruja", "sacerdote", "asesino", "todas"];
  const bonusAttributes = [
    ["resistenciaFisica", "Resistencia física"],
    ["resistenciaCordura", "Resistencia a cordura"],
    ["fuerza", "Fuerza"],
    ["agilidad", "Agilidad"],
    ["poder", "Poder"],
  ];
  const specialBonusAttributes = [
    ...bonusAttributes,
    ["resistenciaMagica", "Resistencia mágica"],
    ["vida", "Vida máxima"],
    ["danioFisico", "Daño físico"],
    ["danioMagico", "Daño mágico"],
    ["bonificacionCritico", "Probabilidad de crítico (0 a 1)"],
  ];

  function field(name, label, type = "text", options = {}) {
    return { name, label, type, ...options };
  }

  const shared = [
    field("id", "ID (único; usa minúsculas y guiones)"),
    field("nombre", "Nombre"),
    field("descripcion", "Descripción", "textarea"),
    field("nivel", "Nivel", "number", { min: 1, value: 1 }),
    field("valor", "Valor en monedas", "number", { min: 0, value: 0 }),
    field("imagen", "Imagen", "image"),
    field("icono", "Icono (emoji o símbolo)", "text", { value: "✦" }),
  ];
  const itemFields = {
    arma: [
      field("spawnInventory", "Spawnear una copia en el inventario al iniciar cada partida", "checkbox"),
      field("tipo", "Tipo de arma", "text", { value: "espada", placeholder: "espada, arco, baston o libro" }),
      field("subtipo", "Variante del arma", "text", { placeholder: "puñal, espada corta, arco largo, pica..." }),
      field("estado", "Estado inicial", "select", { options: [["optimo", "Óptimo"], ["usado", "Usado"], ["dañado", "Dañado"]] }),
      field("ataque", "Ataque", "number", { min: 0, value: 1 }),
      field("alcance", "Alcance", "number", { min: 1, max: 3, value: 1 }),
      field("costePABasico", "PA del ataque básico", "number", { min: 1, value: 2 }),
      field("danioMoral", "Daño moral", "number", { min: 0, value: 0 }),
      field("danioAgilidad", "Daño a agilidad", "number", { min: 0, value: 0 }),
      field("danioPoder", "Daño a poder", "number", { min: 0, value: 0 }),
      field("danioElemental", "Daño elemental adicional", "number", { min: 0, value: 0 }),
      field("bonificacionContraBlindado", "Bonus de daño contra armadura (0.25 = 25 %)", "number", { min: 0, max: 1, step: 0.05, value: 0 }),
      field("bonificacionContraMaldito", "Bonus de daño contra malditos (0.30 = 30 %)", "number", { min: 0, max: 1, step: 0.05, value: 0 }),
      field("elemento", "Elemento (si hay daño elemental)", "text", { placeholder: "fuego, hielo, veneno..." }),
      field("efectoCritico_tipo", "Efecto de estado al hacer crítico", "select", { options: [["", "Ninguno"], ["veneno", "Veneno"], ["quemadura", "Quemadura"], ["paralisis", "Parálisis"]] }),
      field("efectoCritico_danio", "Daño por turno del efecto crítico", "number", { min: 0, value: 0 }),
      field("efectoCritico_duracion", "Turnos del efecto crítico", "number", { min: 1, value: 2 }),
      field("magico", "Es mágica", "checkbox"),
      field("clasesPermitidas", "Clases permitidas", "multiselect", { options: classes }),
      ...bonusAttributes.map(([name, label]) => field(`bonificacion_${name}`, `Bonificación: ${label}`, "number", { value: 0 })),
      field("dirigido_nombre", "Ataque dirigido: nombre", "text", { value: "Ataque dirigido" }),
      field("dirigido_efecto", "Ataque dirigido: efecto", "select", { options: [["danio", "Daño"], ["curacion", "Curación"]] }),
      field("dirigido_valor", "Dirigido: multiplicador de daño o curación", "number", { min: 0.1, step: 0.1, value: 1.5 }),
      field("dirigido_coste", "Dirigido: coste de poder", "number", { min: 0, value: 10 }),
      field("dirigido_pa", "Dirigido: coste de PA", "number", { min: 1, value: 3 }),
      field("dirigido_alcance", "Dirigido: alcance (vacío = alcance del arma)", "number", { min: 1, max: 3 }),
      field("area_nombre", "Ataque de área: nombre", "text", { value: "Ataque de área" }),
      field("area_efecto", "Ataque de área: efecto", "select", { options: [["danio", "Daño"], ["curacion", "Curación"]] }),
      field("area_valor", "Área: multiplicador de daño o curación", "number", { min: 0.1, step: 0.1, value: 0.5 }),
      field("area_coste", "Área: coste de poder", "number", { min: 0, value: 15 }),
      field("area_pa", "Área: coste de PA", "number", { min: 1, value: 4 }),
      field("area_objetivos", "Área: máximo de objetivos (1 a 4)", "number", { min: 1, max: 4, value: 2 }),
      field("area_alcance", "Área: alcance (vacío = alcance del arma)", "number", { min: 1, max: 3 }),
    ],
    armadura: [
      field("spawnInventory", "Spawnear una copia en el inventario al iniciar cada partida", "checkbox"),
      field("tipo", "Tipo de armadura", "text", { value: "ligera" }),
      field("estado", "Estado inicial", "select", { options: [["optimo", "Óptimo"], ["usado", "Usado"], ["dañado", "Dañado"]] }),
      field("magico", "Es mágica", "checkbox"),
      field("clasesPermitidas", "Clases permitidas", "multiselect", { options: classes }),
      ...bonusAttributes.map(([name, label]) => field(`bonificacion_${name}`, `Bonificación: ${label}`, "number", { value: 0 })),
    ],
    especial: [
      field("spawnInventory", "Spawnear una copia en el inventario al iniciar cada partida", "checkbox"),
      field("esObjetoMision", "Es un objeto único/de misión (no se puede vender ni descartar)", "checkbox"),
      field("tipo", "Tipo de objeto", "text", { value: "amuleto" }),
      field("danioMoral", "Daño moral", "number", { min: 0, value: 0 }),
      field("proteccionCordura", "Protección de cordura", "number", { min: 0, value: 0 }),
      field("proteccionMoral", "Protección de moral", "number", { min: 0, value: 0 }),
      ...specialBonusAttributes.map(([name, label]) => field(
        `bonificacion_${name}`,
        `Bonificación: ${label}`,
        "number",
        name === "bonificacionCritico" ? { min: 0, max: 1, step: 0.01, value: 0 } : { value: 0 },
      )),
      field("magico", "Es mágico", "checkbox"),
      field("clasesPermitidas", "Clases permitidas", "multiselect", { options: classes }),
    ],
    consumible: [
      field("spawnInventory", "Spawnear una copia en el inventario al iniciar cada partida", "checkbox"),
      field("tipo", "Tipo", "select", { options: [["pocion", "Poción"]] }),
      field("vida", "Restauración de vida", "number", { min: 0, value: 0 }),
      field("cordura", "Restauración de cordura", "number", { min: 0, value: 0 }),
      field("poder", "Restauración de poder", "number", { min: 0, value: 0 }),
    ],
  };
  const enemyFields = [
    field("id", "ID (único; usa minúsculas y guiones)"),
    field("nombre", "Nombre"),
    field("descripcion", "Descripción", "textarea"),
    field("imagen", "Imagen", "image"),
    field("nivel", "Nivel", "number", { min: 1, value: 1 }),
    field("vidaMaxima", "Vida máxima", "number", { min: 1, value: 30 }),
    field("corduraMaxima", "Cordura máxima", "number", { min: 1, value: 100 }),
    field("poderMaximo", "Poder máximo", "number", { min: 1, value: 100 }),
    field("ataqueBase", "Ataque base", "number", { min: 0, value: 3 }),
    field("resistenciaBase", "Resistencia base", "number", { min: 0, value: 1 }),
    field("resistenciaMagica", "Resistencia mágica", "number", { min: 0, value: 0 }),
    field("agilidad", "Agilidad", "number", { min: 0, value: 3 }),
    field("bonificacionCritico", "Bonificación crítica (0 a 1; 0.08 = 8%)", "number", { min: 0, max: 1, step: 0.01, value: 0 }),
    field("maldito", "Es maldito", "checkbox"),
    field("danioCorduraPorGolpe", "Daño de cordura por golpe", "number", { min: 0, value: 5 }),
    field("danioMoralPorGolpe", "Daño moral por golpe", "number", { min: 0, value: 1 }),
    field("ataque1Nombre", "Ataque especial 1 (opcional): nombre"),
    field("ataque1Alcance", "Ataque especial 1: alcance", "number", { min: 1, max: 4, value: 1 }),
    field("ataque1Multiplicador", "Ataque especial 1: multiplicador de daño", "number", { min: 0.1, step: 0.1, value: 1 }),
    field("ataque2Nombre", "Ataque especial 2 (opcional): nombre"),
    field("ataque2Alcance", "Ataque especial 2: alcance", "number", { min: 1, max: 4, value: 2 }),
    field("ataque2Multiplicador", "Ataque especial 2: multiplicador de daño", "number", { min: 0.1, step: 0.1, value: 0.75 }),
  ];
  const poiFields = [
    field("id", "ID único del POI (minúsculas y guiones)"),
    field("titulo", "Título del POI"),
    field("nivel", "Nivel mínimo del mapa", "number", { min: 1, value: 1 }),
    field("tipo", "Tipo de POI", "select", { options: [["historia", "Historia / escena"], ["tesoro", "Cofre"], ["vendedor", "Vendedor"], ["trampa", "Trampa"]] }),
    field("imagen", "Imagen", "image"),
    field("sonido", "Sonido al abrir el aviso", "audio"),
    field("texto", "Texto descriptivo", "textarea"),
    field("danio", "Daño si se activa la trampa", "number", { min: 1, value: 30 }),
    field("probabilidadDesactivacion", "Probabilidad base de desactivación (0 a 1)", "number", { min: 0, max: 1, step: 0.05, value: 0.35 }),
    field("lootId", "Botín opcional", "select", { options: [] }),
    field("objetoRequeridoId", "Objeto/llave necesario para abrir o investigar", "select", { options: [] }),
    field("consumirObjetoRequerido", "Consumir el objeto al completar la acción", "checkbox"),
    field("enemigoId", "Enemigo o boss opcional", "select", { options: [] }),
  ];
  const mapFields = [
    field("id", "ID único del mapa (minúsculas y guiones)"),
    field("nivel", "Nivel / dificultad", "number", { min: 1, value: 1 }),
    field("tamano", "Tamaño de cada lado (se ajusta a impar)", "number", { min: 9, max: 61, value: 15 }),
    field("cantidadEnemigos", "Cantidad de grupos enemigos", "number", { min: 0, value: 3 }),
    field("nivelEnemigos", "Nivel máximo de enemigos comunes", "number", { min: 1, value: 1 }),
    field("cantidadPOI", "Cantidad de POI personalizados", "number", { min: 0, value: 1 }),
    field("bossId", "Boss opcional", "select", { options: [] }),
    field("audio", "Música del mapa (opcional)", "audio"),
    field("usarAlIniciar", "Usar este mapa al iniciar una partida nueva", "checkbox", { checked: true }),
    field("mensajePasillo", "Mensajes de pasillo (uno por línea)", "textarea"),
    field("mensajeBifurcacion", "Mensajes de bifurcación (uno por línea)", "textarea"),
    field("mensajeTramo", "Mensajes de tramo estrecho (uno por línea)", "textarea"),
    field("mensajesEscena", "Mensajes con imagen (JSON opcional; reemplaza los campos anteriores)", "textarea", {
      placeholder: '{\n  "pasillo": [{ "texto": "Avanzas por un pasillo oscuro.", "imagen": "recursos/imagen/mapas/pasillo.png", "alt": "Pasillo de una caverna" }],\n  "bifurcacion": [{ "texto": "Llegas a una bifurcación.", "imagen": "recursos/imagen/mapas/bifurcacion.png", "alt": "Bifurcación" }],\n  "tramo": [{ "texto": "El corredor se estrecha.", "imagen": "recursos/imagen/mapas/tramo.png" }]\n}',
    }),
  ];

  function readSaved() {
    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function constructItem(record) {
    return new juego.Item(record.data);
  }

  function constructEnemy(record) {
    const data = { ...record.data };
    const baseItems = juego.itemsBase;
    if (record.kind === "humano") {
      data.tipo = "humano";
      data.equipo = {
        arma: baseItems.find((item) => item.id === data.armaId) ?? null,
        armadura: baseItems.find((item) => item.id === data.armaduraId) ?? null,
      };
      delete data.armaId;
      delete data.armaduraId;
      juego.enemigosBase.push(new juego.Enemigo(data));
      juego.poolEncuentros.push(juego.enemigosBase[juego.enemigosBase.length - 1]);
      return;
    }
    data.tipo = "criatura";
    delete data.armaId;
    delete data.armaduraId;
    juego.criaturasBase.push(new juego.Enemigo(data));
    juego.poolEncuentros.push(juego.criaturasBase[juego.criaturasBase.length - 1]);
  }

  function applyRecord(record) {
    if (record.kind === "poi") {
      juego.puntosInteresBase.push(record.data);
      return;
    }
    if (record.kind === "mapa") {
      juego.mapasBase.push(record.data);
      if (record.data.usarAlIniciar) juego.mapaActivoId = record.data.id;
      return;
    }
    if (["arma", "armadura", "especial", "consumible"].includes(record.kind)) {
      const item = constructItem(record);
      const collections = {
        arma: juego.armasBase,
        armadura: juego.armadurasBase,
        especial: juego.objetosEspecialesBase,
        consumible: juego.consumiblesBase,
      };
      collections[record.kind].push(item);
      juego.itemsBase.push(item);
      if (record.spawnInventory) {
        const agregarAlInventario = () => {
          window.inventarioGrupo?.agregarItem(new juego.Item({ ...record.data }));
        };
        if (window.inventarioGrupo) agregarAlInventario();
        else window.addEventListener("DOMContentLoaded", agregarAlInventario, { once: true });
      }
      return;
    }
    constructEnemy(record);
  }

  if (juego && typeof juego.Item === "function" && typeof juego.Enemigo === "function") {
    readSaved().forEach((record) => {
      try {
        applyRecord(record);
      } catch (error) {
        console.error(`No se pudo cargar el recurso guardado "${record?.data?.id ?? "sin-id"}".`, error);
      }
    });
  }

  function createControl(definition) {
    const wrapper = document.createElement("label");
    wrapper.className = "resource-field";
    const title = document.createElement("span");
    title.textContent = definition.label;
    wrapper.append(title);

    if (definition.type === "image") {
      const controls = document.createElement("div");
      controls.className = "resource-image-controls";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "resource-image-button";
      button.textContent = "Asignar imagen…";
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp";
      input.className = "resource-image-input";
      input.setAttribute("aria-label", "Elegir archivo de imagen");
      const preview = document.createElement("img");
      preview.className = "resource-image-preview";
      preview.alt = "Vista previa";
      preview.hidden = true;
      button.addEventListener("click", () => input.click());
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          status.textContent = "El archivo seleccionado no es una imagen.";
          return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          selectedImage = String(reader.result || "");
          preview.src = selectedImage;
          preview.hidden = false;
          button.textContent = file.name;
          status.textContent = "";
        });
        reader.addEventListener("error", () => { status.textContent = "No se pudo leer la imagen."; });
        reader.readAsDataURL(file);
      });
      controls.append(button, input, preview);
      wrapper.append(controls);
      return wrapper;
    }

    if (definition.type === "audio") {
      const controls = document.createElement("div");
      controls.className = "resource-audio-controls";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "resource-audio-button";
      button.textContent = "Asignar audio…";
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm";
      input.className = "resource-audio-input";
      input.setAttribute("aria-label", "Elegir archivo de audio");
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "resource-audio-clear";
      clearButton.textContent = "Quitar audio";
      clearButton.hidden = true;
      const preview = document.createElement("audio");
      preview.className = "resource-audio-preview";
      preview.controls = true;
      preview.hidden = true;
      button.addEventListener("click", () => input.click());
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          selectedAudio = String(reader.result || "");
          preview.src = selectedAudio;
          preview.hidden = false;
          clearButton.hidden = false;
          button.textContent = file.name;
          status.textContent = "";
        });
        reader.addEventListener("error", () => { status.textContent = "No se pudo leer el audio."; });
        reader.readAsDataURL(file);
      });
      clearButton.addEventListener("click", () => {
        selectedAudio = "";
        preview.removeAttribute("src");
        preview.hidden = true;
        clearButton.hidden = true;
        button.textContent = "Asignar audio…";
        input.value = "";
      });
      controls.append(button, clearButton, input, preview);
      wrapper.append(controls);
      return wrapper;
    }

    if (definition.type === "multiselect") {
      const choices = document.createElement("div");
      choices.className = "resource-checkboxes";
      definition.options.forEach((option) => {
        const choiceLabel = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = definition.name;
        checkbox.value = option;
        const text = document.createElement("span");
        text.textContent = option;
        choiceLabel.append(checkbox, text);
        choices.append(choiceLabel);
      });
      wrapper.append(choices);
      return wrapper;
    }

    let input;
    if (definition.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
      if (definition.placeholder) input.placeholder = definition.placeholder;
    } else if (definition.type === "select") {
      input = document.createElement("select");
      definition.options.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        input.append(option);
      });
    } else {
      input = document.createElement("input");
      input.type = definition.type;
    }
    input.name = definition.name;
    if (definition.type === "checkbox" && definition.checked !== undefined) {
      input.checked = Boolean(definition.checked);
    }
    if (definition.min !== undefined) input.min = String(definition.min);
    if (definition.max !== undefined) input.max = String(definition.max);
    if (definition.step !== undefined) input.step = String(definition.step);
    if (definition.value !== undefined) input.value = String(definition.value);
    wrapper.append(input);
    return wrapper;
  }

  function refreshEnemyEquipmentOptions() {
    fields.querySelectorAll("select[name='armaId'], select[name='armaduraId']").forEach((select) => {
      const selected = select.value;
      const category = select.name === "armaId" ? "arma" : "armadura";
      select.replaceChildren(new Option("Sin equipo", ""));
      juego.itemsBase.filter((item) => item.categoria === category).forEach((item) => {
        select.add(new Option(`${item.nombre} (Nv. ${item.nivel})`, item.id));
      });
      select.value = selected;
    });
    const refreshOptions = (selector, entries, emptyLabel, labelFor) => {
      fields.querySelectorAll(selector).forEach((select) => {
        if (!(select instanceof HTMLSelectElement)) return;
        const selected = select.value;
        select.replaceChildren(new Option(emptyLabel, ""));
        entries.forEach((entry) => select.add(new Option(labelFor(entry), entry.id)));
        select.value = selected;
      });
    };
    refreshOptions(
      "select[name='lootId']",
      juego.itemsBase,
      "Sin botín",
      (item) => `${item.nombre} (Nv. ${item.nivel})`,
    );
    refreshOptions(
      "select[name='objetoRequeridoId']",
      juego.itemsBase.filter((item) => item.esObjetoMision),
      "Sin requisito",
      (item) => item.nombre,
    );
    refreshOptions(
      "select[name='enemigoId'], select[name='bossId']",
      juego.poolEncuentros,
      "Sin enemigo",
      (enemy) => `${enemy.nombre} (Nv. ${enemy.nivel})`,
    );
  }

  function renderFields(preserveStatus = false) {
    fields.replaceChildren();
    selectedImage = "";
    selectedAudio = "";
    if (!preserveStatus) status.textContent = "";
    const kind = kindSelect.value;
    let definitions;
    if (itemFields[kind]) {
      definitions = [...shared, ...itemFields[kind]];
    } else if (kind === "poi") {
      definitions = poiFields;
    } else if (kind === "mapa") {
      definitions = mapFields;
    } else {
      definitions = [...enemyFields];
      if (kind === "humano") {
        definitions.push(field("armaId", "Arma disponible", "select", { options: [] }));
        definitions.push(field("armaduraId", "Armadura disponible", "select", { options: [] }));
      }
    }
    definitions.forEach((definition) => {
      const control = createControl(definition);
      if (definition.name === "armaId" || definition.name === "armaduraId") {
        const select = control.querySelector("select");
        select.name = definition.name;
      }
      fields.append(control);
    });
    refreshEnemyEquipmentOptions();
  }

  function getValue(name) {
    const input = form.elements.namedItem(name);
    if (input instanceof RadioNodeList) return input.value;
    return input;
  }

  function numberValue(name) {
    const input = getValue(name);
    return Number(input?.value ?? 0);
  }

  function optionalNumberValue(name) {
    const input = getValue(name);
    return input?.value.trim() ? Number(input.value) : undefined;
  }

  function collectItem(kind) {
    const data = {};
    ["id", "nombre", "descripcion", "icono", "tipo", "subtipo"].forEach((name) => {
      const input = getValue(name);
      if (input) data[name] = input.value.trim();
    });
    data.nivel = numberValue("nivel");
    data.valor = numberValue("valor");
    data.categoria = kind;
    data.imagen = selectedImage;
    if (["arma", "armadura"].includes(kind)) data.estado = getValue("estado").value;
    data.magico = Boolean(getValue("magico")?.checked);
    if (kind === "especial") data.esObjetoMision = Boolean(getValue("esObjetoMision")?.checked);
    const checkedClasses = [...form.querySelectorAll("input[name='clasesPermitidas']:checked")].map((input) => input.value);
    data.clasesPermitidas = checkedClasses;

    if (kind === "arma") {
      ["ataque", "alcance", "costePABasico", "danioMoral", "danioAgilidad", "danioPoder", "danioElemental"].forEach((name) => { data[name] = numberValue(name); });
      data.bonificacionesContra = {
        blindado: numberValue("bonificacionContraBlindado"),
        maldito: numberValue("bonificacionContraMaldito"),
      };
      data.elemento = data.danioElemental > 0 ? getValue("elemento").value.trim() : null;
      const tipoEfectoCritico = getValue("efectoCritico_tipo").value;
      data.efectoCritico = tipoEfectoCritico ? {
        tipo: tipoEfectoCritico,
        duracion: numberValue("efectoCritico_duracion"),
        ...(tipoEfectoCritico === "veneno" || tipoEfectoCritico === "quemadura"
          ? { danioPorTurno: numberValue("efectoCritico_danio") }
          : {}),
      } : null;
      data.bonificaciones = Object.fromEntries(bonusAttributes.map(([name]) => [name, numberValue(`bonificacion_${name}`)]));
      data.ataquesEspeciales = {};
      for (const attackType of ["dirigido", "area"]) {
        const effect = getValue(`${attackType}_efecto`).value;
        const profile = {
          nombre: getValue(`${attackType}_nombre`).value.trim(),
          efecto: effect,
          costePoder: numberValue(`${attackType}_coste`),
          costePA: numberValue(`${attackType}_pa`),
          objetivosMaximos: attackType === "dirigido" ? 1 : numberValue("area_objetivos"),
        };
        const alcance = optionalNumberValue(`${attackType}_alcance`);
        if (alcance !== undefined) profile.alcance = alcance;
        if (effect === "curacion") profile.curacion = numberValue(`${attackType}_valor`);
        else profile.multiplicadorDanio = numberValue(`${attackType}_valor`);
        data.ataquesEspeciales[attackType] = profile;
      }
    } else if (kind === "armadura") {
      data.bonificaciones = Object.fromEntries(bonusAttributes.map(([name]) => [name, numberValue(`bonificacion_${name}`)]));
    } else if (kind === "especial") {
      ["danioMoral", "proteccionCordura", "proteccionMoral"].forEach((name) => { data[name] = numberValue(name); });
      data.bonificaciones = Object.fromEntries(
        specialBonusAttributes.map(([name]) => [name, numberValue(`bonificacion_${name}`)]),
      );
    } else {
      data.bonificacion = Object.fromEntries(["vida", "cordura", "poder"].map((name) => [name, numberValue(name)]));
    }
    return data;
  }

  async function getProjectDirectory() {
    if (projectDirectoryHandle) {
      const permission = await projectDirectoryHandle.queryPermission({ mode: "readwrite" });
      if (permission === "granted") return projectDirectoryHandle;
      const requested = await projectDirectoryHandle.requestPermission({ mode: "readwrite" });
      if (requested === "granted") return projectDirectoryHandle;
    }
    if (typeof window.showDirectoryPicker !== "function") {
      throw new Error("Este navegador no permite escribir archivos desde la pantalla. Abre el juego en Chrome o Edge y vuelve a intentar.");
    }
    projectDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    return projectDirectoryHandle;
  }

  function codigoParaRegistro(record) {
    const data = JSON.stringify(record.data, null, 2).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    let code;
    if (record.kind === "poi") {
      code = `\n\n// POI agregado desde Opciones > Cargar POI.\nwindow.juego.puntosInteresBase.push(${data});`;
      return { relativePath: "datos/puntosInteresCreados.js", code };
    }
    if (record.kind === "mapa") {
      code = `\n\n// Mapa agregado desde Opciones > Cargar mapa.\nwindow.juego.mapasBase.push(${data});`;
      if (record.data.usarAlIniciar) {
        code += `\nwindow.juego.mapaActivoId = ${JSON.stringify(record.data.id)};`;
      }
      return { relativePath: "datos/mapasCreados.js", code };
    }
    if (["arma", "armadura", "especial", "consumible"].includes(record.kind)) {
      const collectionName = {
        arma: "armasBase",
        armadura: "armadurasBase",
        especial: "objetosEspecialesBase",
        consumible: "consumiblesBase",
      }[record.kind];
      code = `\n\n// Recurso agregado desde Opciones > Cargar recurso.\nwindow.juego.${collectionName}.push(new window.juego.Item(${data}));`;
      if (record.spawnInventory) {
        code += `\nwindow.addEventListener("DOMContentLoaded", () => { try { window.inventarioGrupo.agregarItem(new window.juego.Item(${data})); } catch (error) { console.warn("No se pudo agregar ${record.data.nombre} al inventario inicial.", error); } }, { once: true });`;
      }
      return { relativePath: `item/${collectionName}.js`, code };
    }

    if (record.kind === "criatura") {
      code = `\n\n// Criatura agregada desde Opciones > Cargar recurso.\n(function () {\n  const criatura = new window.juego.Enemigo({\n    ...${data},\n    tipo: "criatura",\n  });\n  window.juego.criaturasBase.push(criatura);\n})();`;
      return { relativePath: "enemigo/criaturasBase.js", code };
    }

    const armaId = JSON.stringify(record.data.armaId || "");
    const armaduraId = JSON.stringify(record.data.armaduraId || "");
    const enemyData = { ...record.data };
    delete enemyData.armaId;
    delete enemyData.armaduraId;
    const enemyJson = JSON.stringify(enemyData, null, 2).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    code = `\n\n// Enemigo humano agregado desde Opciones > Cargar recurso.\n(function () {\n  const items = window.juego.itemsBase;\n  const enemigo = new window.juego.Enemigo({\n    ...${enemyJson},\n    tipo: "humano",\n    equipo: {\n      arma: items.find((item) => item.id === ${armaId}) ?? null,\n      armadura: items.find((item) => item.id === ${armaduraId}) ?? null,\n    },\n  });\n  window.juego.enemigosBase.push(enemigo);\n  window.juego.poolEncuentros.push(enemigo);\n})();`;
    return { relativePath: "enemigo/enemigosBase.js", code };
  }

  async function saveImageAsProjectFile(root, record) {
    if (record.kind === "mapa") return;
    const match = /^data:image\/(avif|gif|jpeg|png|svg\+xml|webp);base64,([a-z0-9+/=]+)$/i.exec(record.data.imagen);
    if (!match) throw new Error("No se pudo reconocer la imagen. Selecciona un archivo PNG, JPG, GIF, SVG, AVIF o WEBP.");
    const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase() === "svg+xml" ? "svg" : match[1].toLowerCase();
    const imageDirectoryName = {
      arma: "armas",
      armadura: "armaduras",
      especial: "especiales",
      consumible: "consumibles",
      humano: "enemigos",
      criatura: "criaturas",
      poi: "poi",
    }[record.kind];
    const relativePath = `recursos/imagen/${imageDirectoryName}/${record.data.id}.${extension}`;
    let directory = root;
    for (const segment of relativePath.split("/").slice(0, -1)) {
      directory = await directory.getDirectoryHandle(segment, { create: true });
    }
    const imageHandle = await directory.getFileHandle(`${record.data.id}.${extension}`, { create: true });
    const binary = window.atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const writable = await imageHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
    record.data.imagen = relativePath;
  }

  // Escribe un audio (data URL) en recursos/sonidos/<nombreBase>.<ext> y
  // devuelve la ruta relativa resultante. La usan los campos de audio del editor.
  async function copiarAudioAProyecto(root, dataUrl, nombreBase) {
    const match = /^data:audio\/(mpeg|mp3|mp4|ogg|wav|webm|x-wav|aac);base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
    if (!match) throw new Error("No se pudo reconocer el audio. Selecciona un archivo MP3, OGG, WAV o WEBM.");
    const bruto = match[1].toLowerCase();
    const extension = (bruto === "mpeg" || bruto === "mp3" || bruto === "mp4") ? "mp3"
      : (bruto === "x-wav" || bruto === "wav") ? "wav"
      : bruto;
    const idSeguro = String(nombreBase || "audio").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "audio";
    const relativePath = `recursos/sonidos/${idSeguro}.${extension}`;
    let directory = root;
    for (const segment of relativePath.split("/").slice(0, -1)) {
      directory = await directory.getDirectoryHandle(segment, { create: true });
    }
    const audioHandle = await directory.getFileHandle(`${idSeguro}.${extension}`, { create: true });
    const binary = window.atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const writable = await audioHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
    return relativePath;
  }

  // Copia el audio del registro (sonido de POI o audio de mapa) al proyecto.
  async function saveAudioAsProjectFile(root, record) {
    const campo = record.kind === "mapa" ? "audio" : record.kind === "poi" ? "sonido" : null;
    if (!campo) return;
    const dataUrl = record.data[campo];
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return;
    record.data[campo] = await copiarAudioAProyecto(root, dataUrl, record.data.id);
  }

  async function saveRecordToProject(record, skipIfAlreadyRegistered = false) {
    const root = await getProjectDirectory();
    await saveImageAsProjectFile(root, record);
    await saveAudioAsProjectFile(root, record);
    const { relativePath, code } = codigoParaRegistro(record);
    const segments = relativePath.split("/");
    let directory = root;
    for (const segment of segments.slice(0, -1)) {
      directory = await directory.getDirectoryHandle(segment);
    }
    const fileHandle = await directory.getFileHandle(segments.at(-1), { create: false });
    const existing = await fileHandle.getFile();
    const contents = await existing.text();
    if (contents.includes(JSON.stringify(record.data.id))) {
      if (skipIfAlreadyRegistered) return;
      throw new Error(`El ID "${record.data.id}" ya aparece en ${relativePath}. Reinicia la página y comprueba el catálogo antes de volver a guardarlo.`);
    }
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(`${contents}${code}\n`);
      await writable.close();
    } catch (error) {
      await writable.abort();
      throw error;
    }
  }

  function collectEnemy(kind) {
    const data = {};
    ["id", "nombre", "descripcion"].forEach((name) => { data[name] = getValue(name).value.trim(); });
    ["nivel", "vidaMaxima", "corduraMaxima", "poderMaximo", "ataqueBase", "resistenciaBase", "resistenciaMagica", "agilidad", "danioCorduraPorGolpe", "danioMoralPorGolpe"].forEach((name) => {
      data[name] = numberValue(name);
    });
    data.bonificacionCritico = numberValue("bonificacionCritico");
    data.maldito = Boolean(getValue("maldito")?.checked);
    data.imagen = selectedImage;
    data.ataques = [1, 2].flatMap((numero) => {
      const nombre = getValue(`ataque${numero}Nombre`)?.value.trim();
      return nombre ? [{
        nombre,
        alcance: numberValue(`ataque${numero}Alcance`),
        multiplicadorDanio: numberValue(`ataque${numero}Multiplicador`),
      }] : [];
    });
    if (kind === "humano") {
      data.armaId = getValue("armaId").value;
      data.armaduraId = getValue("armaduraId").value;
    }
    return data;
  }

  function collectPOI() {
    return {
      id: getValue("id").value.trim(),
      titulo: getValue("titulo").value.trim(),
      nivel: numberValue("nivel"),
      tipo: getValue("tipo").value,
      imagen: selectedImage,
      sonido: selectedAudio,
      texto: getValue("texto").value.trim(),
      danio: numberValue("danio"),
      probabilidadDesactivacion: numberValue("probabilidadDesactivacion"),
      lootId: getValue("lootId").value,
      objetoRequeridoId: getValue("objetoRequeridoId").value,
      consumirObjetoRequerido: Boolean(getValue("consumirObjetoRequerido")?.checked),
      enemigoId: getValue("enemigoId").value,
    };
  }

  function collectMap() {
    const lines = (name) => getValue(name).value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const mensajesConEscena = getValue("mensajesEscena").value.trim();
    let mensajes = {
      pasillo: lines("mensajePasillo"),
      bifurcacion: lines("mensajeBifurcacion"),
      tramo: lines("mensajeTramo"),
    };
    if (mensajesConEscena) {
      try {
        mensajes = JSON.parse(mensajesConEscena);
      } catch {
        throw new Error("Los mensajes con imagen deben tener formato JSON válido.");
      }
      if (!mensajes || typeof mensajes !== "object" || Array.isArray(mensajes)) {
        throw new Error("Los mensajes con imagen deben ser un objeto con las categorías pasillo, bifurcacion y tramo.");
      }
      ["pasillo", "bifurcacion", "tramo"].forEach((categoria) => {
        if (mensajes[categoria] !== undefined && (!Array.isArray(mensajes[categoria])
          || mensajes[categoria].some((entrada) => typeof entrada !== "string"
            && (!entrada || typeof entrada !== "object" || Array.isArray(entrada)
              || typeof entrada.texto !== "string"
              || (entrada.imagen !== undefined && typeof entrada.imagen !== "string")
              || (entrada.alt !== undefined && typeof entrada.alt !== "string"))))) {
          throw new Error(`Revisa "${categoria}": usa una lista de textos o de objetos con la propiedad "texto".`);
        }
      });
    }
    return {
      id: getValue("id").value.trim(),
      nivel: numberValue("nivel"),
      tamano: numberValue("tamano"),
      cantidadEnemigos: numberValue("cantidadEnemigos"),
      nivelEnemigos: numberValue("nivelEnemigos"),
      cantidadPOI: numberValue("cantidadPOI"),
      bossId: getValue("bossId").value,
      audio: selectedAudio || null,
      usarAlIniciar: Boolean(getValue("usarAlIniciar").checked),
      mensajes,
    };
  }

  fields?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    if (event.target.name === "lootId" && event.target.value) getValue("enemigoId").value = "";
    if (event.target.name === "enemigoId" && event.target.value) getValue("lootId").value = "";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    const kind = kindSelect.value;
    const itemKind = Boolean(itemFields[kind]);
    const data = itemKind
      ? collectItem(kind)
      : kind === "poi"
        ? collectPOI()
        : kind === "mapa"
          ? collectMap()
          : collectEnemy(kind);
    const requiresImage = itemKind || kind === "humano" || kind === "criatura" || kind === "poi";
    if (requiresImage && !data.imagen) {
      status.textContent = "Asigna una imagen antes de guardar.";
      return;
    }
    const saved = readSaved();
    const existsInCatalog = [
      ...juego.itemsBase,
      ...juego.poolEncuentros,
      ...juego.puntosInteresBase,
      ...juego.mapasBase,
    ].some((entry) => entry.id === data.id);
    if (!data.id || existsInCatalog || saved.some((record) => record.data.id === data.id)) {
      status.textContent = "El ID está vacío o ya está en uso. Elige uno único.";
      return;
    }
    if (kind === "poi" && data.lootId && data.enemigoId) {
      status.textContent = "Elige un botín o un enemigo para el POI, no ambos.";
      return;
    }
    if (kind === "poi" && !data.texto) {
      status.textContent = "Escribe el texto descriptivo del POI.";
      return;
    }
    const record = { kind, data };
    try {
      if (itemKind) constructItem(record);
      else if (kind === "humano" || kind === "criatura") {
        const preview = { ...data, tipo: kind === "humano" ? "humano" : "criatura", equipo: {} };
        new juego.Enemigo(preview);
      }
      record.spawnInventory = itemKind && Boolean(getValue("spawnInventory")?.checked);
      for (const legacyRecord of saved) {
        await saveRecordToProject(legacyRecord, true);
      }
      if (saved.length) {
        try { window.localStorage.removeItem(storageKey); } catch { /* La copia en los archivos ya quedÃ³ guardada. */ }
      }
      await saveRecordToProject(record);
      applyRecord(record);
      const etiquetaRegistro = data.nombre ?? data.id;
      status.textContent = `${etiquetaRegistro} se agregó al catálogo del juego.`;
      form.reset();
      renderFields(true);
      status.textContent = `${etiquetaRegistro} quedó guardado en el archivo base del proyecto.`;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "No se pudo guardar el recurso.";
    }
  });

  if (dialog && form && fields && kindSelect && status && openButton && closeButton) {
    function openEditor(kind = "arma") {
      kindSelect.value = kind;
      renderFields();
      status.textContent = kind === "poi" || kind === "mapa"
        ? "Al guardar, elige la carpeta juego del proyecto para agregar este registro al archivo correspondiente."
        : "Al guardar, selecciona la carpeta juego del proyecto para escribir el recurso en su archivo base.";
      dialog.showModal();
    }

    juego.editorRecursos = { abrir: openEditor };
    kindSelect.addEventListener("change", renderFields);
    openButton.addEventListener("click", () => {
      openEditor(kindSelect.value || "arma");
    });
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    renderFields();
  }
})();
