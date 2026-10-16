// El inventario es compartido por el grupo y reserva 18 espacios individuales.
const inventario = Array(18).fill(null);
let monedas = 0;
let raciones = 0;
const claveCofreCompartido = "juego_phone.cofreCompartido.v1";
let cofreCompartido = cargarCofreCompartido();
const inventoryGrid = document.querySelector(".inventory-grid");
const currencyDisplay = document.querySelector(".inventory-currency");
const provisionsDisplay = document.querySelector(".inventory-provisions");
const restButton = document.querySelector(".inventory-rest");
const restConfirmDialog = document.querySelector(".rest-confirm-dialog");

if (!(inventoryGrid instanceof HTMLOListElement)) {
  throw new Error('No se encontró la grilla ".inventory-grid".');
}

// Dibuja cada espacio usando el contenido actual del array.
function renderizarInventario() {
  if (currencyDisplay) currencyDisplay.textContent = `Monedas: ${monedas} \u{1FA99}`;
  if (provisionsDisplay) provisionsDisplay.textContent = `Raciones: ${raciones}`;
  if (restButton instanceof HTMLButtonElement) {
    const combateEnCurso = window.juego.combate?.enCurso === true;
    restButton.disabled = raciones < 10 || combateEnCurso;
    restButton.textContent = "Descansar";
    restButton.title = combateEnCurso ? "No se puede descansar durante un combate."
      : raciones < 10 ? "Se necesitan 10 raciones para descansar."
        : "Recupera los recursos del grupo consumiendo 10 raciones.";
  }
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

function cargarCofreCompartido() {
  try {
    const objetos = JSON.parse(window.localStorage.getItem(claveCofreCompartido) || "[]");
    return Array.isArray(objetos) ? objetos : [];
  } catch {
    return [];
  }
}

function guardarCofreCompartido() {
  window.localStorage.setItem(claveCofreCompartido, JSON.stringify(cofreCompartido));
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
  get cofreCompartido() { return cofreCompartido; },
  guardarEnCofre(numeroEspacio) {
    const item = inventario[numeroEspacio - 1];
    if (!item) throw new Error("Ese espacio del inventario está vacío.");
    cofreCompartido.push(item);
    try {
      guardarCofreCompartido();
      retirarItem(numeroEspacio);
    } catch (error) {
      cofreCompartido.pop();
      throw error;
    }
    return cofreCompartido.length;
  },
  retirarDelCofre(indice) {
    if (!Number.isInteger(indice) || indice < 0 || indice >= cofreCompartido.length) return null;
    if (!inventario.includes(null)) return null;
    const [itemGuardado] = cofreCompartido.splice(indice, 1);
    const item = itemGuardado instanceof window.juego.Item
      ? itemGuardado
      : new window.juego.Item(itemGuardado);
    try {
      agregarItem(item);
      guardarCofreCompartido();
      return item;
    } catch (error) {
      cofreCompartido.splice(indice, 0, item);
      throw error;
    }
  },
  descansar() {
    if (raciones < 10 || window.juego.combate?.enCurso === true) return false;
    raciones -= 10;
    window.juego.personajes
      .filter((personaje) => personaje.vida.actual > 0)
      .forEach((personaje) => {
        personaje.vida.actual = personaje.vida.maxima;
        personaje.cordura.actual = personaje.cordura.maxima;
        personaje.poder.actual = personaje.poder.maximo;
        personaje.puntosAccionTurno = personaje.puntosAccionMaximos;
        window.juego.actualizarRecursosTarjeta(personaje.id);
      });
    (window.juego.personajesCatalogo ?? window.juego.personajes).forEach((personaje) => {
      personaje.habilidadEspecialAgotada = false;
    });
    window.juego.mazmorra?.reiniciarFatigaExploracion?.();
    renderizarInventario();
    return true;
  },
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
    (window.juego.personajesCatalogo ?? window.juego.personajes).forEach((personaje) => {
      personaje.habilidadEspecialAgotada = false;
    });
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

restButton?.addEventListener("click", () => restConfirmDialog?.showModal());
restConfirmDialog?.querySelector(".rest-confirm-cancel")?.addEventListener("click", () => {
  restConfirmDialog.close();
});
restConfirmDialog?.querySelector(".rest-confirm-accept")?.addEventListener("click", () => {
  if (!window.inventarioGrupo.descansar()) {
    restConfirmDialog.close();
    return;
  }
  restConfirmDialog.close();
  window.juego.registrarNovedad?.("El grupo acampa: recupera toda su vida, cordura y poder a cambio de 10 raciones.");
  window.juego.sonidos?.reproducir("inventario");
});
restConfirmDialog?.addEventListener("click", (event) => {
  if (event.target === restConfirmDialog) restConfirmDialog.close();
});
window.addEventListener("juego:estado-encuentro", renderizarInventario);

renderizarInventario();
