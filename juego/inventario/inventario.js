// El inventario es compartido por el grupo y reserva 18 espacios individuales.
const inventario = Array(18).fill(null);
let monedas = 0;
let raciones = 0;
const inventoryGrid = document.querySelector(".inventory-grid");
const currencyDisplay = document.querySelector(".inventory-currency");
const provisionsDisplay = document.querySelector(".inventory-provisions");

if (!(inventoryGrid instanceof HTMLOListElement)) {
  throw new Error('No se encontró la grilla ".inventory-grid".');
}

// Dibuja cada espacio usando el contenido actual del array.
function renderizarInventario() {
  if (currencyDisplay) currencyDisplay.textContent = `Monedas: ${monedas} \u{1FA99}`;
  if (provisionsDisplay) provisionsDisplay.textContent = `Raciones: ${raciones}`;
  inventoryGrid.replaceChildren();

  inventario.forEach((item, index) => {
    const slot = document.createElement("li");
    slot.className = "inventory-slot";
    slot.setAttribute(
      "aria-label",
      item ? `Espacio ${index + 1}: ${item.nombre}` : `Espacio ${index + 1}, vacío`,
    );

    if (item) {
      const itemButton = document.createElement("button");
      itemButton.className = "inventory-item-button";
      itemButton.type = "button";
      itemButton.dataset.inventorySlot = String(index + 1);
      itemButton.setAttribute("aria-label", `Opciones para ${item.nombre}, espacio ${index + 1}`);
      itemButton.title = item.nombre;

      if (item.imagen) {
        const itemImage = document.createElement("img");
        itemImage.src = item.imagen;
        itemImage.alt = "";
        itemImage.setAttribute("aria-hidden", "true");
        itemButton.append(itemImage);
      } else {
        const itemIcon = document.createElement("span");
        itemIcon.className = "inventory-item-icon";
        itemIcon.setAttribute("aria-hidden", "true");
        itemIcon.textContent = item.icono;
        itemButton.append(itemIcon);
      }

      const itemName = document.createElement("span");
      itemName.className = "inventory-slot-name";
      itemName.textContent = item.nombre;
      itemButton.append(itemName);
      slot.append(itemButton);
    } else {
      const slotNumber = document.createElement("span");
      slotNumber.className = "inventory-slot-index";
      slotNumber.textContent = String(index + 1);
      slot.append(slotNumber);
    }

    inventoryGrid.append(slot);
  });
}

// Agrega un objeto en el primer espacio libre y devuelve su número de espacio.
function agregarItem(item) {
  if (typeof item !== "object" || item === null || typeof item.nombre !== "string" || item.nombre.trim() === "") {
    throw new TypeError("El objeto debe tener un nombre no vacío.");
  }

  const index = inventario.findIndex((slot) => slot === null);
  if (index === -1) {
    throw new Error("El inventario está lleno.");
  }

  inventario[index] = item;
  renderizarInventario();
  return index + 1;
}

// Retira un objeto por su número de espacio; sirve para consumo, equipamiento o descarte.
function retirarItem(numeroEspacio) {
  if (!Number.isInteger(numeroEspacio) || numeroEspacio < 1 || numeroEspacio > inventario.length) {
    throw new RangeError(`El espacio debe ser un número entre 1 y ${inventario.length}.`);
  }

  const index = numeroEspacio - 1;
  const item = inventario[index];
  if (item === null) {
    throw new Error(`El espacio ${numeroEspacio} está vacío.`);
  }

  inventario[index] = null;
  renderizarInventario();
  return item;
}

// Expone la lista y sus operaciones para que otros scripts puedan administrar el inventario.
window.inventarioGrupo = {
  items: inventario,
  get monedas() { return monedas; },
  get raciones() { return raciones; },
  agregarRaciones(cantidad) {
    if (!Number.isInteger(cantidad) || cantidad < 0) throw new RangeError("Las raciones deben ser un entero no negativo.");
    raciones += cantidad;
    renderizarInventario();
    return raciones;
  },
  consumirRacion() {
    if (raciones <= 0) return false;
    raciones -= 1;
    renderizarInventario();
    return true;
  },
  iniciarPartida() {
    raciones = 10;
    renderizarInventario();
    return raciones;
  },
  agregarMonedas(cantidad) {
    if (!Number.isInteger(cantidad) || cantidad < 0) throw new RangeError("Las monedas deben ser un entero no negativo.");
    monedas += cantidad;
    renderizarInventario();
    return monedas;
  },
  gastarMonedas(cantidad) {
    if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > monedas) return false;
    monedas -= cantidad;
    renderizarInventario();
    return true;
  },
  agregarItem,
  retirarItem,
  actualizar: renderizarInventario,
};

renderizarInventario();
