(function inicializarSonidos() {
  const fuentes = {
    flecha: "recursos/sonidos/flecha.mp3",
    espada: "recursos/sonidos/espada.mp3",
    magiaAtaque: "recursos/sonidos/magia-ataque.mp3",
    magiaCurativa: "recursos/sonidos/magia-curativa.mp3",
    golpePuno: "recursos/sonidos/golpe-puño.mp3",
    muerteHumano: "recursos/sonidos/humano-muerte.mp3",
    muerteCriatura: "recursos/sonidos/criatura-muerte.mp3",
    inventario: "recursos/sonidos/inventario.mp3",
  };
  const audios = new Map();

  Object.entries(fuentes).forEach(([nombre, ruta]) => {
    const audio = new Audio(ruta);
    audio.preload = "auto";
    audio.volume = nombre.startsWith("muerte") ? 0.7 : 0.45;
    audios.set(nombre, audio);
  });

  function reproducir(nombre) {
    const audio = audios.get(nombre);
    if (!audio) return;
    audio.currentTime = 0;
    const reproduccion = audio.play();
    if (reproduccion && typeof reproduccion.catch === "function") {
      reproduccion.catch(() => {});
    }
  }

  window.juego = window.juego ?? {};
  window.juego.sonidos = { reproducir };
})();
