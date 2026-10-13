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
    detenerReintento();
    elemento.pause();
    elemento.removeAttribute("src");
    elemento.load();
  }

  // Reproduce una pista en loop. Si la ruta es vacía o igual a la actual en
  // curso, evita reiniciarla. Devuelve true si arrancó (o ya estaba) la pista.
  function reproducir(ruta, volumen = 0.35) {
    if (!ruta || typeof ruta !== "string") {
      detener();
      return false;
    }
    const cambioRuta = elemento.getAttribute("src") !== ruta;
    if (!cambioRuta && rutaActual === ruta) return true;
    detenerReintento();
    elemento.volume = Math.max(0, Math.min(1, volumen));
    elemento.src = ruta;
    elemento.currentTime = 0;
    rutaActual = ruta;
    intentarReproducir();
    return true;
  }

  juego.musica = { reproducir, detener, get ruta() { return rutaActual; } };
  window.juego = juego;
})();
