(function inicializarVendedor() {
  const juego = window.juego;
  const dialog = document.querySelector(".merchant-dialog");
  const storageDialog = document.querySelector(".storage-dialog");
  const stockElement = dialog?.querySelector(".merchant-stock");
  const inventoryElement = dialog?.querySelector(".merchant-inventory");
  const backpackElement = storageDialog?.querySelector(".storage-backpack");
  const storedItemsElement = storageDialog?.querySelector(".storage-items");
  const balanceElement = dialog?.querySelector(".merchant-balance");
  const messageElement = dialog?.querySelector(".merchant-message");
  const closeButton = dialog?.querySelector(".merchant-close");
  const closeStorageButton = storageDialog?.querySelector(".storage-close");
  if (!juego || !(dialog instanceof HTMLDialogElement) || !(stockElement instanceof HTMLElement)
    || !(inventoryElement instanceof HTMLElement) || !(balanceElement instanceof HTMLElement)
    || !(storageDialog instanceof HTMLDialogElement) || !(backpackElement instanceof HTMLElement)
    || !(storedItemsElement instanceof HTMLElement) || !(messageElement instanceof HTMLElement)
    || !(closeButton instanceof HTMLButtonElement)
    || !(closeStorageButton instanceof HTMLButtonElement)) return;

  let stock = [];
  let stockPaquetesRaciones = 0;
  let vendedorActivo = null;
  let onClose = null;
  const PRECIO_PAQUETE_RACIONES = 20;
  const RACIONES_POR_PAQUETE = 5;

  function precioVentaDelGrupo(item) {
    return Math.max(1, Math.ceil(item.valor / 3));
  }

  function precioCompraDelGrupo(item) {
    return precioVentaDelGrupo(item) * 3;
  }

  function crearInstancia(item) {
    return new juego.Item({
      ...item,
      durabilidad: undefined,
      ...(["arma", "armadura"].includes(item.categoria) ? { estado: "optimo" } : {}),
      bonificaciones: item.bonificaciones ? { ...item.bonificaciones } : {},
      bonificacion: item.bonificacion ? { ...item.bonificacion } : undefined,
      ataquesEspeciales: item.ataquesEspeciales ? structuredClone(item.ataquesEspeciales) : undefined,
      hechizosRestauracion: item.hechizosRestauracion ? structuredClone(item.hechizosRestauracion) : [],
      efectoEstado: item.efectoEstado ? { ...item.efectoEstado } : undefined,
      efectoCritico: item.efectoCritico ? { ...item.efectoCritico } : undefined,
    });
  }

  function actualizarSaldo() {
    balanceElement.textContent = `Monedas: ${window.inventarioGrupo.monedas} \u{1FA99} · Raciones: ${window.inventarioGrupo.raciones}`;
  }

  function crearEntrada(item, detalle, accion, disabled, click) {
    const row = document.createElement("article");
    row.className = "merchant-entry";
    const description = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.nombre;
    const info = document.createElement("p");
    info.textContent = detalle;
    description.append(name, info);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = accion;
    button.disabled = disabled;
    button.addEventListener("click", click);
    row.append(description, button);
    return row;
  }

  function renderizar() {
    stockElement.replaceChildren();
    inventoryElement.replaceChildren();
    actualizarSaldo();
    stockElement.append(crearEntrada(
      { nombre: "Paquete de raciones" },
      `${RACIONES_POR_PAQUETE} unidades de comida · ${PRECIO_PAQUETE_RACIONES} monedas · Paquetes: ${stockPaquetesRaciones}`,
      "Comprar",
      stockPaquetesRaciones <= 0 || window.inventarioGrupo.monedas < PRECIO_PAQUETE_RACIONES,
      () => {
        if (stockPaquetesRaciones <= 0 || window.inventarioGrupo.monedas < PRECIO_PAQUETE_RACIONES) return;
        window.inventarioGrupo.gastarMonedas(PRECIO_PAQUETE_RACIONES);
        window.inventarioGrupo.agregarRaciones(RACIONES_POR_PAQUETE);
        stockPaquetesRaciones -= 1;
        if (vendedorActivo) vendedorActivo.stockRaciones = stockPaquetesRaciones;
        messageElement.textContent = `Compraste ${RACIONES_POR_PAQUETE} raciones por ${PRECIO_PAQUETE_RACIONES} monedas.`;
        juego.sonidos?.reproducir("inventario");
        juego.registrarNovedad?.(`El grupo compró ${RACIONES_POR_PAQUETE} raciones de comida por ${PRECIO_PAQUETE_RACIONES} monedas.`);
        renderizar();
      },
    ));
    stock.forEach((entry, index) => {
      const item = entry.item;
      const precio = precioCompraDelGrupo(item);
      stockElement.append(crearEntrada(
        item,
        `${item.descripcion} · ${precio} monedas · Unidades: ${entry.cantidad}`,
        "Comprar",
        entry.cantidad <= 0 || window.inventarioGrupo.monedas < precio || !window.inventarioGrupo.items.includes(null),
        () => {
          if (entry.cantidad <= 0 || window.inventarioGrupo.monedas < precio
            || !window.inventarioGrupo.items.includes(null)) return;
          window.inventarioGrupo.gastarMonedas(precio);
          window.inventarioGrupo.agregarItem(crearInstancia(item));
          entry.cantidad -= 1;
          messageElement.textContent = `Compraste ${item.nombre}.`;
          juego.sonidos?.reproducir("inventario");
          juego.registrarNovedad?.(`El grupo compró ${item.nombre} por ${precio} monedas.`);
          renderizar();
        },
      ));
    });
    window.inventarioGrupo.items.forEach((item, slotIndex) => {
      if (!item) return;
      if (item.esObjetoMision) return;
      const precioVenta = precioVentaDelGrupo(item);
      inventoryElement.append(crearEntrada(
        item,
        `${item.descripcion} · Venta: ${precioVenta} monedas`,
        "Vender",
        false,
        () => {
          const actual = window.inventarioGrupo.items[slotIndex];
          if (actual !== item) return;
          window.inventarioGrupo.retirarItem(slotIndex + 1);
          window.inventarioGrupo.agregarMonedas(precioVenta);
          messageElement.textContent = `Vendiste ${item.nombre} por ${precioVenta} monedas.`;
          juego.sonidos?.reproducir("inventario");
          juego.registrarNovedad?.(`El grupo vendió ${item.nombre} por ${precioVenta} monedas.`);
          renderizar();
        },
      ));
    });
    if (stockElement.childElementCount === 0) stockElement.textContent = "El vendedor se quedó sin mercancía.";
    if (inventoryElement.childElementCount === 0) inventoryElement.textContent = "No hay objetos para vender.";
  }

  function renderizarCofre() {
    backpackElement.replaceChildren();
    storedItemsElement.replaceChildren();
    window.inventarioGrupo.items.forEach((item, slotIndex) => {
      if (!item) return;
      backpackElement.append(crearEntrada(
        item,
        item.esObjetoMision ? "Objeto de misión" : "Guardar gratis entre niveles",
        "Guardar",
        false,
        () => {
          window.inventarioGrupo.guardarEnCofre(slotIndex + 1);
          juego.sonidos?.reproducir("inventario");
          renderizar();
          renderizarCofre();
        },
      ));
    });
    window.inventarioGrupo.cofreCompartido.forEach((item, index) => {
      storedItemsElement.append(crearEntrada(
        item,
        "Guardado entre niveles · sin costo",
        "Retirar",
        !window.inventarioGrupo.items.includes(null),
        () => {
          const recuperado = window.inventarioGrupo.retirarDelCofre(index);
          if (!recuperado) messageElement.textContent = "No hay espacio libre en el inventario del grupo.";
          juego.sonidos?.reproducir("inventario");
          renderizar();
          renderizarCofre();
        },
      ));
    });
    if (backpackElement.childElementCount === 0) backpackElement.textContent = "La mochila está vacía.";
    if (storedItemsElement.childElementCount === 0) storedItemsElement.textContent = "El cofre está vacío.";
  }

  function abrir(poi, cerrarPoi) {
    if (!Number.isInteger(poi.stockRaciones)) poi.stockRaciones = 3;
    vendedorActivo = poi;
    stockPaquetesRaciones = poi.stockRaciones;
    if (!Array.isArray(poi.stockVendedor)) {
      const ids = Array.isArray(poi.mercancia) ? poi.mercancia : [];
      poi.stockVendedor = ids.map((id) => juego.itemsBase.find((item) => item.id === id))
        .filter(Boolean)
        .map((item) => ({ item, cantidad: 3 }));
    }
    stock = poi.stockVendedor;
    onClose = cerrarPoi;
    messageElement.textContent = "Revisa la mercancía o vende objetos de la mochila del grupo.";
    renderizar();
    if (!dialog.open) dialog.showModal();
  }

  closeButton.addEventListener("click", () => dialog.close());
  closeStorageButton.addEventListener("click", () => storageDialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  storageDialog.addEventListener("click", (event) => { if (event.target === storageDialog) storageDialog.close(); });
  dialog.addEventListener("close", () => {
    const callback = onClose;
    onClose = null;
    vendedorActivo = null;
    callback?.();
  });
  window.addEventListener("juego:inventario-actualizado", () => {
    renderizar();
    if (storageDialog.open) renderizarCofre();
  });
  function abrirCofre() {
    renderizarCofre();
    if (!storageDialog.open) storageDialog.showModal();
  }

  juego.vendedor = { abrir, abrirCofre };
})();
