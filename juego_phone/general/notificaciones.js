(function inicializarNotificacionesMoviles() {
  const juego = window.juego = window.juego ?? {};
  const notice = document.querySelector(".phone-notice");
  if (!(notice instanceof HTMLElement)) return;

  const DURACION_AVISO_MS = 3000;
  let temporizadorAviso = null;
  let versionAviso = 0;

  juego.mostrarAviso = (mensaje) => {
    if (typeof mensaje !== "string" || !mensaje.trim()) return;
    versionAviso += 1;
    const versionActual = versionAviso;
    if (temporizadorAviso !== null) window.clearTimeout(temporizadorAviso);
    notice.textContent = mensaje;
    notice.hidden = false;
    temporizadorAviso = window.setTimeout(() => {
      if (versionActual !== versionAviso) return;
      notice.hidden = true;
      notice.textContent = "";
      temporizadorAviso = null;
    }, DURACION_AVISO_MS);
  };
})();
