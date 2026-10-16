// Gestor de música de fondo. Mantiene un único audio en loop para que la
// pista del menú y la del mapa no se solapen. Soporta el bloqueo de autoplay
// del navegador reintentando en la primera interacción del usuario.
(function inicializarMusica() {
  const juego = window.juego ?? {};

  const elemento = new Audio();
  elemento.loop = true;
  elemento.preload = "auto";
  elemento.volume = 0.35;

  let rutaActual = null;
  let listaActual = null;
  let indiceLista = -1;
  let reintentoPendiente = null;

  function detenerReintento() {
    if (!reintentoPendiente) return;
    const eventos = reintentoPendiente;
    window.removeEventListener("pointerdown", eventos);
    window.removeEventListener("keydown", eventos);
    window.removeEventListener("touchstart", eventos);
    reintentoPendiente = null;
  }

  function intentarReproducir() {
    const reproduccion = elemento.play();
    if (reproduccion && typeof reproduccion.catch === "function") {
      reproduccion.catch(() => {
        // El navegador bloqueó el autoplay: reintenta con la primera interacción.
        if (!reintentoPendiente && rutaActual) {
          reintentoPendiente = () => {
            detenerReintento();
            if (rutaActual) intentarReproducir();
          };
          window.addEventListener("pointerdown", reintentoPendiente, { once: true });
          window.addEventListener("keydown", reintentoPendiente, { once: true });
          window.addEventListener("touchstart", reintentoPendiente, { once: true });
        }
      });
    }
  }

  function detener() {
    rutaActual = null;
    listaActual = null;
    indiceLista = -1;
    detenerReintento();
    elemento.onended = null;
    elemento.pause();
    elemento.removeAttribute("src");
    elemento.load();
  }

  function reproducirRuta(ruta, volumen = 0.35) {
    if (!ruta || typeof ruta !== "string") {
      detener();
      return false;
    }
    const cambioRuta = elemento.getAttribute("src") !== ruta;
    if (!cambioRuta && rutaActual === ruta && !elemento.paused) return true;
    detenerReintento();
    elemento.volume = Math.max(0, Math.min(1, volumen));
    elemento.loop = !listaActual;
    elemento.src = ruta;
    elemento.currentTime = 0;
    rutaActual = ruta;
    intentarReproducir();
    return true;
  }

  // Reproduce una pista en loop o alterna una lista sin reiniciarla cuando
  // cambia de pantalla y se vuelve a aplicar el mismo contexto.
  function reproducir(ruta, volumen = 0.35) {
    if (Array.isArray(ruta)) return reproducirLista(ruta, volumen);
    listaActual = null;
    indiceLista = -1;
    elemento.onended = null;
    return reproducirRuta(ruta, volumen);
  }

  function reproducirLista(rutas, volumen = 0.35) {
    const lista = [...new Set((rutas ?? []).filter((ruta) => typeof ruta === "string" && ruta))];
    if (!lista.length) {
      detener();
      return false;
    }
    const mismaLista = listaActual?.length === lista.length
      && listaActual.every((ruta, indice) => ruta === lista[indice]);
    if (mismaLista && rutaActual && !elemento.paused) return true;
    listaActual = lista;
    indiceLista = 0;
    elemento.loop = false;
    elemento.onended = () => {
      if (!listaActual?.length) return;
      indiceLista = (indiceLista + 1) % listaActual.length;
      reproducirRuta(listaActual[indiceLista], volumen);
    };
    return reproducirRuta(listaActual[indiceLista], volumen);
  }

  juego.musica = { reproducir, reproducirLista, detener, get ruta() { return rutaActual; } };
  window.juego = juego;
})();
