// Reordena la formación mediante flechas laterales en cada tarjeta.
const playerBar = document.querySelector(".player-bar");

if (!(playerBar instanceof HTMLElement)) {
  throw new Error('No se encontró el contenedor ".player-bar".');
}

let isAnimating = false;

function puedeReordenarFormacion() {
  return !isAnimating && !window.juego?.combate?.enCurso;
}

function actualizarPosicionesFormacion() {
  const positionLabels = ["[Liderando]", "[Segunda línea]", "[Segunda línea]", "[Retaguardia]"];
  const cards = [...playerBar.querySelectorAll(".player-card")];
  const vivos = cards.filter((card) => !card.classList.contains("is-dead"));
  const ocupadoEnCombate = Boolean(window.juego?.combate?.enCurso);

  cards.forEach((card, index) => {
    const label = card.querySelector(".player-position");
    const name = card.querySelector(".character-open")?.textContent.trim() || "Aliado";
    const muerto = card.classList.contains("is-dead");
    const rangoVivo = vivos.indexOf(card);
    const position = muerto ? "[Caído]" : positionLabels[rangoVivo] ?? positionLabels.at(-1);
    label.textContent = position;
    label.dataset.formationRank = muerto ? "" : String(rangoVivo + 1);
    label.setAttribute("aria-label", muerto
      ? "Fuera de combate"
      : `Posición en el grupo: ${position.slice(1, -1)}`);

    card.setAttribute("aria-label", muerto
      ? `${name}, fuera de combate.`
      : `${name}, ${position.slice(1, -1)}.`);
    card.setAttribute("aria-posinset", String(index + 1));
    card.setAttribute("aria-setsize", String(vivos.length));

    card.querySelectorAll(".move-button").forEach((button) => {
      const moverIzquierda = button.dataset.move === "left";
      button.disabled = muerto || ocupadoEnCombate || isAnimating
        || (moverIzquierda ? rangoVivo <= 0 : rangoVivo >= vivos.length - 1);
      button.setAttribute("aria-label", `Mover ${name} ${moverIzquierda ? "a la izquierda" : "a la derecha"}`);
    });
  });
}

function destacarTarjetaMovida(card) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  isAnimating = true;
  actualizarPosicionesFormacion();
  card.classList.remove("is-moving");
  void card.offsetWidth;
  card.classList.add("is-moving");
}

function finalizarAnimacion(event) {
  if (!(event.target instanceof HTMLElement) || !event.target.classList.contains("is-moving")) return;
  event.target.classList.remove("is-moving");
  isAnimating = false;
  actualizarPosicionesFormacion();
}

playerBar.addEventListener("animationend", finalizarAnimacion);
playerBar.addEventListener("animationcancel", finalizarAnimacion);

function cambiarPosicion(card, direccion) {
  if (!puedeReordenarFormacion() || card.classList.contains("is-dead")) return;
  const vivos = [...playerBar.querySelectorAll(".player-card:not(.is-dead)")];
  const indice = vivos.indexOf(card);
  const vecino = vivos[indice + (direccion === "left" ? -1 : 1)];
  if (!vecino) return;

  const ordenAnterior = vivos.map((entry) => entry.dataset.characterId).join("|");
  if (direccion === "left") playerBar.insertBefore(card, vecino);
  else playerBar.insertBefore(vecino, card);

  const caidos = [...playerBar.querySelectorAll(".player-card.is-dead")];
  playerBar.append(...caidos);
  const ordenActual = [...playerBar.querySelectorAll(".player-card:not(.is-dead)")]
    .map((entry) => entry.dataset.characterId)
    .join("|");
  if (ordenActual === ordenAnterior) return;

  window.juego?.sonidos?.reproducir("pasos");
  actualizarPosicionesFormacion();
  window.juego?.actualizarBonificacionesFormacion?.();
  destacarTarjetaMovida(card);
}

playerBar.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest(".move-button");
  const card = button?.closest(".player-card");
  if (!(button instanceof HTMLButtonElement) || button.disabled || !(card instanceof HTMLElement)) return;
  cambiarPosicion(card, button.dataset.move);
});

actualizarPosicionesFormacion();

// El combate usa este refresco cuando alguien huye o cae.
window.juego = window.juego ?? {};
window.juego.actualizarControlesFormacion = actualizarPosicionesFormacion;
