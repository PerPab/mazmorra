(function crearArmasBase() {
  const Item = window.juego?.Item;
  if (typeof Item !== "function") {
    throw new Error("No se cargó la clase Item para definir las armas.");
  }

  window.juego.armasBase = [
    new Item({
      id: "espada-larga-oxidada",
      categoria: "arma",
      tipo: "espada",
      subtipo: "espada-larga",
      nombre: "Espada larga oxidada",
      descripcion: "Una espada larga con la hoja cubierta de óxido.",
      nivel: 1,
      ataque: 1,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Estocada precisa",
          multiplicadorDanio: 1.5,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Barrido amplio",
          multiplicadorDanio: 0.5,
          costePoder: 15,
          objetivosMaximos: 2,
        },
      },
      clasesPermitidas: ["caballero", "bruja"],
      magico: false,
      imagen: "recursos/imagen/armas/croc-sword.png",
      icono: "⚔️",
    }),
  ];

  window.juego.armasBase.push(
    new Item({
      id: "arco-corto-recuperado",
      categoria: "arma",
      tipo: "arco",
      subtipo: "arco-corto",
      nombre: "Arco corto recuperado",
      descripcion: "Un viejo arco que apenas se mantiene entero.",
      nivel: 1,
      ataque: 1,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Disparo apuntado",
          multiplicadorDanio: 1.5,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Lluvia de flechas",
          multiplicadorDanio: 0.5,
          costePoder: 15,
          objetivosMaximos: 2,
        },
      },
      clasesPermitidas: ["bruja", "asesino"],
      magico: false,
      imagen: "recursos/imagen/armas/high-shot.png",
      icono: "??",
    }),
  );

    window.juego.armasBase.push(
    new Item({
      id: "baston-mistico-agotado",
      categoria: "arma",
      tipo: "baston",
      subtipo: "baston-de-mago",
      nombre: "Bastón místico agotado",
      descripcion: "Un bastón místico que ha perdido casi todo su poder mágico.",
      nivel: 1,
      ataque: 1,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      bonificacionesContra: { maldito: 0.30 },
      ataquesEspeciales: {
        dirigido: {
          nombre: "Bola de fuego",
          multiplicadorDanio: 1.5,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Estallido ígneo",
          multiplicadorDanio: 0.5,
          costePoder: 15,
          objetivosMaximos: 2,
        },
      },
      clasesPermitidas: ["sacerdote"],
      magico: true,
      imagen: "recursos/imagen/armas/crystal-wand.png",
      icono: "??",
    }),
  );

    window.juego.armasBase.push(
    new Item({
      id: "daga-sin-filo",
      categoria: "arma",
      tipo: "espada",
      subtipo: "punal",
      nombre: "Daga sin filo",
      descripcion: "Una daga sin filo, utilizada seguramente en algunos robos.",
      nivel: 1,
      ataque: 1,
      alcance: 1,
      costePABasico: 2,
      bonificaciones: { bonificacionCritico: 0.15 },
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      ataquesEspeciales: {
        dirigido: {
          nombre: "Puñalada rápida",
          multiplicadorDanio: 2,
          costePoder: 10,
          objetivosMaximos: 1,
        },
        area: {
          nombre: "Corte de lado",
          multiplicadorDanio: 1,
          costePoder: 15,
          objetivosMaximos: 1,
        },
      },
      clasesPermitidas: ["todas"],
      magico: false,
      imagen: "recursos/imagen/armas/stiletto.png",
      icono: "??",
    }),
  );

  window.juego.armasBase.push(
    new Item({
      id: "Libro-restaurativo-basico",
      categoria: "arma",
      tipo: "libro",
      subtipo: "libro-restaurativo",
      nombre: "Libro de curandero básico",
      descripcion: "Un viejo libro con un hechizo restaurativo básico. Su contenido se determina al encontrarlo.",
      nivel: 1,
      ataque: 1,
      alcance: 3,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      hechizosRestauracion: window.juego.generarHechizosRestauracion(1),
      ataquesEspeciales: {
        dirigido: {
          nombre: "Hechizo restaurativo",
          efecto: "curacion", curacion: 1, costePoder: 0, objetivosMaximos: 1,
        },
        area: {
          nombre: "Hechizo restaurativo grupal",
          efecto: "curacion", curacion: 1, costePoder: 0, objetivosMaximos: 4,
        },
      },
      clasesPermitidas: ["bruja","sacerdote"],
      magico: true,
      imagen: "recursos/imagen/armas/enlightenment.png",
      icono: "??",
    }),
  );

  [
    { id: "libro-sanador-medio", nombre: "Libro de sanador medio", nivel: 4 },
    { id: "libro-mago-restaurador", nombre: "Libro de mago restaurador", nivel: 7 },
  ].forEach((libro) => window.juego.armasBase.push(new Item({
    id: libro.id, categoria: "arma", tipo: "libro", subtipo: "libro-restaurativo",
    nombre: libro.nombre,
    descripcion: `Un libro restaurativo de rango ${libro.nivel === 4 ? "medio" : "avanzado"}. Sus hechizos se determinan al encontrarlo.`,
    nivel: libro.nivel, ataque: libro.nivel, alcance: 3, danioMoral: 0, danioAgilidad: 0, danioPoder: 0,
    hechizosRestauracion: window.juego.generarHechizosRestauracion(libro.nivel),
    ataquesEspeciales: {
      dirigido: { nombre: "Hechizo restaurativo", efecto: "curacion", curacion: 1, costePoder: 0, objetivosMaximos: 1 },
      area: { nombre: "Hechizo restaurativo grupal", efecto: "curacion", curacion: 1, costePoder: 0, objetivosMaximos: 4 },
    },
    clasesPermitidas: ["bruja", "sacerdote"], magico: true,
    imagen: "recursos/imagen/armas/enlightenment.png", icono: "📖",
  })));

  window.juego.armasBase.push(
    new Item({
      id: "Libro-hechiceria-basico",
      categoria: "arma",
      tipo: "libro",
      nombre: "Libro de hechicería básico",
      descripcion: "Un libro con un par de hechizos de principiante.",
      nivel: 1,
      ataque: 1,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      bonificacionesContra: { maldito: 0.30 },
      ataquesEspeciales: {
        dirigido: {
          nombre: "Bola de fuego",
          efecto: "danio",
          danio: 15,
          costePoder: 20,
          objetivosMaximos: 1,
          alcance: 2,
          tipoDanio: "magico",
        },
        area: {
          nombre: "Círculo de fuego",
          efecto: "danio",
          danio: 8,
          costePoder: 25,
          objetivosMaximos: 3,
          alcance: 2,
          tipoDanio: "magico",
        },
      },
      clasesPermitidas: ["bruja", "sacerdote"],
      magico: true,
      imagen: "recursos/imagen/armas/spell-book.png",
      icono: "📖",
    }),
  );

  window.juego.armasBase.push(
    new Item({
      id: "espada-jefe-bandido",
      categoria: "arma",
      tipo: "espada",
      nombre: "Espada de jefe bandido",
      descripcion: "Una espada de hoja robusta, templada con un leve poder ígneo. Sus golpes críticos pueden causar quemaduras.",
      nivel: 2,
      ataque: 2,
      alcance: 2,
      danioMoral: 0,
      danioAgilidad: 0,
      danioPoder: 0,
      danioElemental: 1,
      elemento: "fuego",
      efectoCritico: { tipo: "quemadura", danioPorTurno: 1, duracion: 2 },
      ataquesEspeciales: {
        dirigido: { nombre: "Tajo ígneo", multiplicadorDanio: 1.5, costePoder: 10, objetivosMaximos: 1 },
        area: { nombre: "Barrido ardiente", multiplicadorDanio: 0.5, costePoder: 15, objetivosMaximos: 2 },
      },
      clasesPermitidas: ["caballero", "bruja"],
      magico: false,
      imagen: "recursos/imagen/armas/croc-sword.png",
      icono: "⚔️",
    }),
  );

  // Las variantes comunes comparten alcance y coste por arquetipo. Cada nivel
  // aumenta en 1 el ataque (o la curación del libro restaurativo).
  const perfilesMarciales = (nombre, alcance, objetivosArea = 2) => ({
    dirigido: {
      nombre: `${nombre} dirigido`, multiplicadorDanio: 1.5, costePoder: 10,
      costePA: 3, objetivosMaximos: 1, alcance,
    },
    area: {
      nombre: `${nombre} de área`, multiplicadorDanio: 0.5, costePoder: 15,
      costePA: 4, objetivosMaximos: objetivosArea, alcance,
    },
  });
  const perfilesMagicos = (dirigido, alcanceDirigido, area, alcanceArea, objetivosArea) => ({
    dirigido: {
      nombre: dirigido, multiplicadorDanio: 1.5, costePoder: 10, costePA: 3,
      objetivosMaximos: 1, alcance: alcanceDirigido, tipoDanio: "magico",
    },
    area: {
      nombre: area, multiplicadorDanio: 0.5, costePoder: 15, costePA: 4,
      objetivosMaximos: objetivosArea, alcance: alcanceArea, tipoDanio: "magico",
    },
  });
  const familiasNuevas = [
    { id: "espada-corta", nombre: "Espada corta", tipo: "espada", subtipo: "espada-corta", ataque: 2, alcance: 1, coste: 2, imagen: "croc-sword.png", icono: "⚔️", critico: 0.05, clases: ["asesino", "bruja"] },
    { id: "mandoble", nombre: "Mandoble", tipo: "espada", subtipo: "mandoble", ataque: 4, alcance: 3, coste: 4, imagen: "two-handed-sword.png", icono: "⚔️", clases: ["caballero"] },
    { id: "arco-largo", nombre: "Arco largo", tipo: "arco", subtipo: "arco-largo", ataque: 2, alcance: 3, coste: 3, imagen: "high-shot.png", icono: "🏹", clases: ["asesino"] },
    { id: "ballesta", nombre: "Ballesta", tipo: "arco", subtipo: "ballesta", ataque: 3, alcance: 3, coste: 3, imagen: "high-shot.png", icono: "🏹", clases: ["asesino"] },
    { id: "lanza", nombre: "Lanza", tipo: "lanza", subtipo: "lanza", ataque: 2, alcance: 3, coste: 2, imagen: "trident.png", icono: "🔱", clases: ["caballero", "bruja"] },
    { id: "pica", nombre: "Pica", tipo: "lanza", subtipo: "pica", ataque: 3, alcance: 3, coste: 3, imagen: "trident.png", icono: "🔱", clases: ["caballero", "bruja"] },
    { id: "hacha-de-mano", nombre: "Hacha de mano", tipo: "hacha", subtipo: "hacha-de-mano", ataque: 3, alcance: 1, coste: 3, imagen: "battle-axe.png", icono: "🪓", clases: ["caballero"] },
    { id: "hacha-de-combate", nombre: "Hacha de combate", tipo: "hacha", subtipo: "hacha-de-combate", ataque: 4, alcance: 2, coste: 4, imagen: "battle-axe.png", icono: "🪓", bonificacionesContra: { blindado: 0.25 }, clases: ["caballero"] },
    { id: "varita", nombre: "Varita", tipo: "varita", subtipo: "varita", ataque: 1, alcance: 1, coste: 1, imagen: "crystal-wand.png", icono: "✨", magico: true, clases: ["bruja", "sacerdote"] },
    { id: "libro-ofensivo", nombre: "Libro de hechizos", tipo: "libro", subtipo: "libro-ofensivo", ataque: 1, alcance: 1, coste: 2, imagen: "spell-book.png", icono: "📖", magico: true, clases: ["bruja", "sacerdote"] },
  ];
  familiasNuevas.forEach((familia) => {
    for (let nivel = 1; nivel <= 3; nivel += 1) {
      const alcanceDirigido = familia.magico && familia.subtipo === "libro-ofensivo" ? 1 : familia.alcance;
      const alcanceArea = familia.magico && familia.subtipo === "libro-ofensivo" ? 3 : familia.alcance;
      const perfiles = familia.magico
        ? perfilesMagicos("Hechizo dirigido", alcanceDirigido, "Hechizo de área", alcanceArea, familia.subtipo === "libro-ofensivo" ? 4 : 2)
        : perfilesMarciales(familia.nombre, familia.alcance);
      window.juego.armasBase.push(new Item({
        id: `${familia.id}-nivel-${nivel}`,
        categoria: "arma",
        tipo: familia.tipo,
        subtipo: familia.subtipo,
        nombre: `${familia.nombre} (Nivel ${nivel})`,
        descripcion: `${familia.nombre} de nivel ${nivel}. Su atributo principal mejora en un punto por nivel.`,
        nivel,
        ataque: familia.ataque + nivel - 1,
        alcance: familia.alcance,
        costePABasico: familia.coste,
        bonificacionesContra: familia.bonificacionesContra ?? (familia.magico ? { maldito: 0.30 } : {}),
        bonificaciones: familia.critico ? { bonificacionCritico: familia.critico } : {},
        danioMoral: 0,
        danioAgilidad: 0,
        danioPoder: 0,
        ataquesEspeciales: perfiles,
        clasesPermitidas: familia.clases,
        magico: Boolean(familia.magico),
        imagen: `recursos/imagen/armas/${familia.imagen}`,
        icono: familia.icono,
      }));
    }
  });

  const progresionesExistentes = [
    { id: "daga-sin-filo", nombre: "Puñal", subtipo: "punal", ataque: 1, alcance: 1, coste: 2, imagen: "stiletto.png", icono: "🗡️", critico: 0.15, nivelesYaCreados: 1, magico: false, clases: ["todas"] },
    { id: "espada-larga-oxidada", nombre: "Espada larga", subtipo: "espada-larga", ataque: 1, alcance: 2, coste: 3, imagen: "croc-sword.png", icono: "⚔️", nivelesYaCreados: 1, magico: false, clases: ["caballero", "bruja"] },
    { id: "arco-corto-recuperado", nombre: "Arco corto", subtipo: "arco-corto", ataque: 1, alcance: 2, coste: 2, imagen: "high-shot.png", icono: "🏹", nivelesYaCreados: 1, magico: false, clases: ["bruja", "asesino"] },
    { id: "baston-mistico-agotado", nombre: "Bastón de mago", subtipo: "baston-de-mago", ataque: 1, alcance: 2, coste: 2, imagen: "crystal-wand.png", icono: "✨", nivelesYaCreados: 1, magico: true, clases: ["sacerdote"] },
  ];
  progresionesExistentes.forEach((familia) => {
    for (let nivel = familia.nivelesYaCreados + 1; nivel <= 3; nivel += 1) {
      const ataquesEspeciales = familia.curacionDirigida
        ? {
          dirigido: { nombre: "Curación dirigida", efecto: "curacion", curacion: familia.curacionDirigida + nivel - 1, costePoder: 20, costePA: 3, objetivosMaximos: 1, alcance: familia.alcance },
          area: { nombre: "Curación de grupo", efecto: "curacion", curacion: familia.curacionArea + nivel - 1, costePoder: 25, costePA: 4, objetivosMaximos: 3, alcance: 3 },
        }
        : familia.magico
          ? perfilesMagicos("Hechizo dirigido", familia.alcance, "Hechizo de área", familia.alcance, 2)
          : perfilesMarciales(familia.nombre, familia.alcance);
      window.juego.armasBase.push(new Item({
        id: `${familia.id}-nivel-${nivel}`,
        categoria: "arma",
        tipo: familia.id === "Libro-restaurativo-basico" ? "libro" : familia.id === "baston-mistico-agotado" ? "baston" : familia.id === "arco-corto-recuperado" ? "arco" : "espada",
        subtipo: familia.subtipo,
        nombre: `${familia.nombre} (Nivel ${nivel})`,
        descripcion: `${familia.nombre} de nivel ${nivel}. Su atributo principal mejora en un punto por nivel.`,
        nivel,
        ataque: familia.ataque + nivel - 1,
        alcance: familia.alcance,
        costePABasico: familia.coste,
        bonificacionesContra: familia.bonificacionesContra ?? (familia.magico ? { maldito: 0.30 } : {}),
        bonificaciones: familia.critico ? { bonificacionCritico: familia.critico } : {},
        danioMoral: 0,
        danioAgilidad: 0,
        danioPoder: 0,
        ataquesEspeciales,
      clasesPermitidas: familia.clases,
        magico: familia.magico,
        imagen: `recursos/imagen/armas/${familia.imagen}`,
        icono: familia.icono,
      }));
    }
  });

})();
