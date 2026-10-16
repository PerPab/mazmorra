(function definirGeneradorMazmorra(global) {
  const DIRECCIONES = [
    { clave: "north", deltaFila: -1, deltaColumna: 0 },
    { clave: "east", deltaFila: 0, deltaColumna: 1 },
    { clave: "south", deltaFila: 1, deltaColumna: 0 },
    { clave: "west", deltaFila: 0, deltaColumna: -1 },
  ];
  const TIPOS_TRANSITABLES = new Set(["corridor", "room", "entrance", "exit"]);

  function normalizarSemilla(semilla) {
    if (Number.isFinite(Number(semilla))) return Number(semilla) >>> 0;
    if (typeof semilla === "string" && semilla.length > 0) {
      let hash = 2166136261;
      for (let index = 0; index < semilla.length; index += 1) {
        hash ^= semilla.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }
    const buffer = new Uint32Array(1);
    if (global.crypto?.getRandomValues) global.crypto.getRandomValues(buffer);
    else buffer[0] = Math.floor(Math.random() * 0xFFFFFFFF);
    return buffer[0] >>> 0;
  }

  function crearAleatorio(semilla) {
    let estado = semilla >>> 0;
    return function aleatorio() {
      estado += 0x6D2B79F5;
      let valor = estado;
      valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
      valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
      return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
    };
  }

  function validar(configuracion) {
    const errores = [];
    const celdas = configuracion?.celdas;
    if (!Array.isArray(celdas) || celdas.length < 3
      || !celdas.every((fila) => Array.isArray(fila) && fila.length === celdas[0].length)) {
      return { valido: false, errores: ["La grilla debe ser rectangular y tener al menos 3 filas."] };
    }
    const alto = celdas.length;
    const ancho = celdas[0].length;
    const enRango = (fila, columna) => fila >= 0 && fila < alto && columna >= 0 && columna < ancho;
    const transitable = (fila, columna) => enRango(fila, columna)
      && TIPOS_TRANSITABLES.has(celdas[fila][columna].tipo);
    const entrada = configuracion.entrada;
    const salida = configuracion.salida;
    if (!transitable(entrada?.fila, entrada?.columna)
      || celdas[entrada.fila][entrada.columna].tipo !== "entrance") {
      errores.push("La entrada no está marcada como transitable.");
    }
    if (!transitable(salida?.fila, salida?.columna)
      || celdas[salida.fila][salida.columna].tipo !== "exit") {
      errores.push("La salida no está marcada como transitable.");
    }

    const habitaciones = configuracion.habitaciones ?? [];
    if (habitaciones.length < configuracion.minHabitaciones
      || habitaciones.length > configuracion.maxHabitaciones) {
      errores.push("La cantidad de habitaciones está fuera del rango configurado.");
    }
    const idsHabitaciones = new Set();
    habitaciones.forEach((habitacion) => {
      if (idsHabitaciones.has(habitacion.id)) errores.push(`ID de habitación duplicado: ${habitacion.id}.`);
      idsHabitaciones.add(habitacion.id);
      let cantidadCeldas = 0;
      for (let fila = habitacion.fila; fila < habitacion.fila + habitacion.alto; fila += 1) {
        for (let columna = habitacion.columna; columna < habitacion.columna + habitacion.ancho; columna += 1) {
          if (enRango(fila, columna) && celdas[fila][columna].roomId === habitacion.id) cantidadCeldas += 1;
        }
      }
      if (habitacion.ancho !== 2 || habitacion.alto !== 2 || cantidadCeldas !== 4) {
        errores.push(`La habitación ${habitacion.id} no ocupa exactamente 2×2 celdas.`);
      }
    });

    const inicio = entrada ? `${entrada.fila},${entrada.columna}` : "";
    const distancias = new Map();
    if (transitable(entrada?.fila, entrada?.columna)) {
      distancias.set(inicio, 0);
      const cola = [{ fila: entrada.fila, columna: entrada.columna }];
      for (let indice = 0; indice < cola.length; indice += 1) {
        const actual = cola[indice];
        const distancia = distancias.get(`${actual.fila},${actual.columna}`);
        for (const direccion of DIRECCIONES) {
          const fila = actual.fila + direccion.deltaFila;
          const columna = actual.columna + direccion.deltaColumna;
          const clave = `${fila},${columna}`;
          if (!transitable(fila, columna) || distancias.has(clave)) continue;
          distancias.set(clave, distancia + 1);
          cola.push({ fila, columna });
        }
      }
    }
    const cantidadTransitable = celdas.flat().filter((celda) => TIPOS_TRANSITABLES.has(celda.tipo)).length;
    if (distancias.size !== cantidadTransitable) errores.push("Hay pasillos o habitaciones que no se alcanzan desde la entrada.");
    const distanciaSalida = distancias.get(`${salida?.fila},${salida?.columna}`) ?? -1;
    if (distanciaSalida < configuracion.distanciaMinimaSalida) {
      errores.push("La salida no está suficientemente lejos de la entrada según BFS.");
    }

    celdas.forEach((fila, filaIndex) => fila.forEach((celda, columnaIndex) => {
      if (!celda.conexiones) {
        errores.push(`Faltan conexiones en la celda ${filaIndex},${columnaIndex}.`);
        return;
      }
      DIRECCIONES.forEach((direccion) => {
        const deberiaConectar = transitable(
          filaIndex + direccion.deltaFila,
          columnaIndex + direccion.deltaColumna,
        );
        if (Boolean(celda.conexiones[direccion.clave]) !== deberiaConectar) {
          errores.push(`Conexión incorrecta en ${filaIndex},${columnaIndex} hacia ${direccion.clave}.`);
        }
      });
    }));
    return { valido: errores.length === 0, errores, distanciaSalida, celdasTransitables: cantidadTransitable };
  }

  function generar(opciones = {}) {
    let ultimoError = null;
    const semillaBase = opciones.semilla ?? opciones.seed;
    for (let intento = 0; intento < 8; intento += 1) {
      const opcionesIntento = intento === 0 || semillaBase === undefined || semillaBase === null
        ? opciones
        : {
          ...opciones,
          semilla: (normalizarSemilla(semillaBase) + Math.imul(intento, 0x9E3779B9)) >>> 0,
        };
      try {
        return generarUnaVez(opcionesIntento);
      } catch (error) {
        ultimoError = error;
      }
    }
    throw ultimoError ?? new Error("No se pudo generar una mazmorra válida.");
  }

  function generarUnaVez(opciones = {}) {
    const ancho = Math.max(15, Math.min(80, Math.floor(Number(opciones.ancho ?? opciones.width) || 30)));
    const alto = Math.max(15, Math.min(80, Math.floor(Number(opciones.alto ?? opciones.height) || 30)));
    const minHabitaciones = Math.max(1, Math.min(10, Math.floor(Number(opciones.minHabitaciones) || 6)));
    const maxHabitaciones = Math.max(minHabitaciones, Math.min(10, Math.floor(Number(opciones.maxHabitaciones) || 10)));
    const semilla = normalizarSemilla(opciones.semilla ?? opciones.seed);
    const aleatorio = crearAleatorio(semilla);
    const entero = (minimo, maximo) => minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
    const elegir = (lista) => lista[Math.floor(aleatorio() * lista.length)];
    const celdas = Array.from({ length: alto }, (_, fila) => Array.from({ length: ancho }, (_, columna) => ({
      fila,
      columna,
      tipo: "rock",
      roomId: null,
      conexiones: { north: false, east: false, south: false, west: false },
    })));
    const dentro = (fila, columna) => fila > 0 && fila < alto - 1 && columna > 0 && columna < ancho - 1;
    const transitable = (fila, columna) => {
      if (fila < 0 || fila >= alto || columna < 0 || columna >= ancho) return false;
      const celda = celdas[fila][columna];
      const esBorde = fila === 0 || fila === alto - 1 || columna === 0 || columna === ancho - 1;
      return TIPOS_TRANSITABLES.has(celda.tipo)
        && (!esBorde || celda.tipo === "entrance" || celda.tipo === "exit");
    };
    const puedeTallar = (fila, columna) => {
      if (!dentro(fila, columna)) return false;
      const celda = celdas[fila][columna];
      if (celda.tipo !== "rock") return true;
      for (let inicioFila = fila - 1; inicioFila <= fila; inicioFila += 1) {
        for (let inicioColumna = columna - 1; inicioColumna <= columna; inicioColumna += 1) {
          const bloque = [
            celdas[inicioFila]?.[inicioColumna],
            celdas[inicioFila]?.[inicioColumna + 1],
            celdas[inicioFila + 1]?.[inicioColumna],
            celdas[inicioFila + 1]?.[inicioColumna + 1],
          ];
          if (bloque.every((otraCelda) => otraCelda && (otraCelda === celda || otraCelda.tipo === "corridor"))) {
            return false;
          }
        }
      }
      return true;
    };
    const tallar = (fila, columna) => {
      if (!puedeTallar(fila, columna)) return false;
      const celda = celdas[fila][columna];
      if (celda.tipo === "rock") celda.tipo = "corridor";
      return true;
    };

    const cantidadHabitaciones = entero(minHabitaciones, maxHabitaciones);
    const habitaciones = [];
    const cabeHabitacion = (fila, columna) => {
      if (fila < 2 || columna < 2 || fila + 2 >= alto - 1 || columna + 2 >= ancho - 1) return false;
      return habitaciones.every((habitacion) => (
        fila + 3 <= habitacion.fila || habitacion.fila + 3 <= fila
        || columna + 3 <= habitacion.columna || habitacion.columna + 3 <= columna
      ));
    };
    let intentos = 0;
    while (habitaciones.length < cantidadHabitaciones && intentos < ancho * alto * 40) {
      intentos += 1;
      const fila = entero(2, alto - 4);
      const columna = entero(2, ancho - 4);
      if (!cabeHabitacion(fila, columna)) continue;
      const id = `room-${habitaciones.length + 1}`;
      const habitacion = { id, fila, columna, top: fila, left: columna, ancho: 2, alto: 2, entradas: [] };
      habitaciones.push(habitacion);
      for (let deltaFila = 0; deltaFila < 2; deltaFila += 1) {
        for (let deltaColumna = 0; deltaColumna < 2; deltaColumna += 1) {
          const celda = celdas[fila + deltaFila][columna + deltaColumna];
          celda.tipo = "room";
          celda.roomId = id;
        }
      }
    }
    if (habitaciones.length < minHabitaciones) {
      throw new Error(`No se pudieron ubicar ${minHabitaciones} habitaciones sin superponerlas en un mapa ${ancho}×${alto}.`);
    }

    const borde = elegir(["north", "east", "south", "west"]);
    let entrada;
    let celdaInterior;
    if (borde === "north" || borde === "south") {
      const columna = entero(2, ancho - 3);
      entrada = { fila: borde === "north" ? 0 : alto - 1, columna };
      celdaInterior = { fila: borde === "north" ? 1 : alto - 2, columna };
    } else {
      const fila = entero(2, alto - 3);
      entrada = { fila, columna: borde === "west" ? 0 : ancho - 1 };
      celdaInterior = { fila, columna: borde === "west" ? 1 : ancho - 2 };
    }
    celdas[entrada.fila][entrada.columna].tipo = "entrance";
    tallar(celdaInterior.fila, celdaInterior.columna);
    const obtenerWalkables = (excluirRoomId = null) => celdas.flat().filter((celda) => (
      TIPOS_TRANSITABLES.has(celda.tipo) && celda.roomId !== excluirRoomId
    ));
    function obtenerRedConectada() {
      const visitadas = new Set([`${entrada.fila},${entrada.columna}`]);
      const cola = [entrada];
      for (let indice = 0; indice < cola.length; indice += 1) {
        const actual = cola[indice];
        for (const direccion of DIRECCIONES) {
          const fila = actual.fila + direccion.deltaFila;
          const columna = actual.columna + direccion.deltaColumna;
          const clave = `${fila},${columna}`;
          if (!transitable(fila, columna) || visitadas.has(clave)) continue;
          visitadas.add(clave);
          cola.push({ fila, columna });
        }
      }
      return visitadas;
    }
    function rutaLateral(origen, objetivo) {
      const claveInicio = `${origen.fila},${origen.columna}`;
      const claveObjetivo = `${objetivo.fila},${objetivo.columna}`;
      const cola = [{ fila: origen.fila, columna: origen.columna }];
      const anteriores = new Map([[claveInicio, null]]);
      for (let indice = 0; indice < cola.length && !anteriores.has(claveObjetivo); indice += 1) {
        const actual = cola[indice];
        const vecinos = DIRECCIONES.map((direccion) => ({
          fila: actual.fila + direccion.deltaFila,
          columna: actual.columna + direccion.deltaColumna,
        })).filter((celda) => puedeTallar(celda.fila, celda.columna));
        vecinos.sort(() => aleatorio() - 0.5);
        for (const vecino of vecinos) {
          const clave = `${vecino.fila},${vecino.columna}`;
          if (anteriores.has(clave)) continue;
          anteriores.set(clave, `${actual.fila},${actual.columna}`);
          cola.push(vecino);
        }
      }
      if (!anteriores.has(claveObjetivo)) return false;
      const camino = [];
      for (let clave = claveObjetivo; clave !== null; clave = anteriores.get(clave)) camino.push(clave);
      camino.reverse().forEach((clave) => {
        const [fila, columna] = clave.split(",").map(Number);
        tallar(fila, columna);
      });
      return true;
    }
    function conectarConRed(inicio, excluirRoomId = null) {
      const alcanzables = obtenerRedConectada();
      const red = obtenerWalkables(excluirRoomId).filter((celda) => (
        celda.tipo === "corridor" && alcanzables.has(`${celda.fila},${celda.columna}`)
      ));
      if (red.some((celda) => celda.fila === inicio.fila && celda.columna === inicio.columna)) return;
      if (red.length === 0) {
        tallar(inicio.fila, inicio.columna);
        return;
      }
      let objetivo = red.reduce((mejor, celda) => (
        Math.abs(celda.fila - inicio.fila) + Math.abs(celda.columna - inicio.columna)
          < Math.abs(mejor.fila - inicio.fila) + Math.abs(mejor.columna - inicio.columna) ? celda : mejor
      ), red[0]);
      let actual = { ...inicio };
      const visitadas = new Set();
      const limite = ancho * alto * 3;
      for (let paso = 0; paso < limite; paso += 1) {
        const claveActual = `${actual.fila},${actual.columna}`;
        if (red.some((celda) => celda.fila === actual.fila && celda.columna === actual.columna)) return;
        visitadas.add(claveActual);
        tallar(actual.fila, actual.columna);
        const vecinos = DIRECCIONES.map((direccion) => ({
          fila: actual.fila + direccion.deltaFila,
          columna: actual.columna + direccion.deltaColumna,
        })).filter((celda) => dentro(celda.fila, celda.columna)
          && !visitadas.has(`${celda.fila},${celda.columna}`)
          && puedeTallar(celda.fila, celda.columna));
        const vecinoRed = vecinos.find((celda) => red.some((objetivoRed) => (
          objetivoRed.fila === celda.fila && objetivoRed.columna === celda.columna
        )));
        if (vecinoRed) {
          tallar(vecinoRed.fila, vecinoRed.columna);
          return;
        }
        if (vecinos.length === 0) break;
        const puntuados = vecinos.map((celda) => ({
          celda,
          peso: Math.abs(celda.fila - objetivo.fila) + Math.abs(celda.columna - objetivo.columna)
            < Math.abs(actual.fila - objetivo.fila) + Math.abs(actual.columna - objetivo.columna) ? 4 : 1,
        }));
        const pesoTotal = puntuados.reduce((suma, item) => suma + item.peso, 0);
        let tirada = aleatorio() * pesoTotal;
        let elegido = puntuados.at(-1).celda;
        for (const item of puntuados) {
          tirada -= item.peso;
          if (tirada <= 0) { elegido = item.celda; break; }
        }
        actual = elegido;
      }
      if (!rutaLateral(actual, objetivo)) throw new Error("No se pudo conectar una sala respetando pasillos de una celda.");
    }

    for (const habitacion of habitaciones) {
      const lados = elegir([
        ["north", -1, 0], ["east", 0, 1], ["south", 1, 0], ["west", 0, -1],
      ]);
      const indiceBorde = entero(0, 1);
      const filaCelda = habitacion.fila + (lados[1] === -1 ? 0 : lados[1] === 1 ? 1 : indiceBorde);
      const columnaCelda = habitacion.columna + (lados[2] === -1 ? 0 : lados[2] === 1 ? 1 : indiceBorde);
      const puerta = { fila: filaCelda + lados[1], columna: columnaCelda + lados[2] };
      habitacion.puerta = { row: puerta.fila, column: puerta.columna };
      habitacion.entradas.push(puerta);
      conectarConRed(puerta, habitacion.id);
    }

    const corredores = obtenerWalkables().filter((celda) => celda.tipo === "corridor");
    const cantidadCiclos = entero(2, 4);
    for (let ciclo = 0; ciclo < cantidadCiclos && corredores.length > 1; ciclo += 1) {
      const origen = elegir(corredores);
      const candidatos = corredores.filter((celda) => (
        Math.abs(celda.fila - origen.fila) + Math.abs(celda.columna - origen.columna) >= Math.floor((ancho + alto) / 5)
      ));
      if (candidatos.length === 0) continue;
      let actual = { fila: origen.fila, columna: origen.columna };
      const objetivo = elegir(candidatos);
      const visitadas = new Set([`${actual.fila},${actual.columna}`]);
      for (let paso = 0; paso < ancho * alto; paso += 1) {
        if (actual.fila === objetivo.fila && actual.columna === objetivo.columna) break;
        const vecinos = DIRECCIONES.map((direccion) => ({
          fila: actual.fila + direccion.deltaFila,
          columna: actual.columna + direccion.deltaColumna,
        })).filter((celda) => dentro(celda.fila, celda.columna)
          && !visitadas.has(`${celda.fila},${celda.columna}`)
          && puedeTallar(celda.fila, celda.columna));
        if (vecinos.length === 0) break;
        const peso = vecinos.map((celda) => ({
          celda,
          valor: Math.abs(celda.fila - objetivo.fila) + Math.abs(celda.columna - objetivo.columna)
            < Math.abs(actual.fila - objetivo.fila) + Math.abs(actual.columna - objetivo.columna) ? 5 : 1,
        }));
        const suma = peso.reduce((total, item) => total + item.valor, 0);
        let tirada = aleatorio() * suma;
        let elegido = peso.at(-1).celda;
        for (const item of peso) {
          tirada -= item.valor;
          if (tirada <= 0) { elegido = item.celda; break; }
        }
        actual = elegido;
        visitadas.add(`${actual.fila},${actual.columna}`);
        tallar(actual.fila, actual.columna);
      }
      rutaLateral(actual, objetivo);
    }

    const conexiones = () => celdas.forEach((fila, filaIndex) => fila.forEach((celda, columnaIndex) => {
      DIRECCIONES.forEach((direccion) => {
        celda.conexiones[direccion.clave] = transitable(
          filaIndex + direccion.deltaFila,
          columnaIndex + direccion.deltaColumna,
        );
      });
    }));
    conexiones();
    const mapaParcial = { celdas, habitaciones, entrada, salida: null, minHabitaciones, maxHabitaciones };
    const comprobacionInicial = validar({
      ...mapaParcial,
      salida: { fila: celdaInterior.fila, columna: celdaInterior.columna },
      distanciaMinimaSalida: 0,
    });
    if (comprobacionInicial.errores.some((error) => error.includes("no se alcanzan"))) {
      throw new Error("La generación dejó áreas inaccesibles; ajusta la semilla o vuelve a generar el mapa.");
    }
    const distancias = new Map([[`${entrada.fila},${entrada.columna}`, 0]]);
    const cola = [entrada];
    for (let indice = 0; indice < cola.length; indice += 1) {
      const actual = cola[indice];
      const distancia = distancias.get(`${actual.fila},${actual.columna}`);
      for (const direccion of DIRECCIONES) {
        if (!celdas[actual.fila][actual.columna].conexiones[direccion.clave]) continue;
        const fila = actual.fila + direccion.deltaFila;
        const columna = actual.columna + direccion.deltaColumna;
        const clave = `${fila},${columna}`;
        if (distancias.has(clave)) continue;
        distancias.set(clave, distancia + 1);
        cola.push({ fila, columna });
      }
    }
    const candidatosSalida = [...distancias.entries()]
      .map(([clave, distancia]) => ({ clave, distancia }))
      .filter((celda) => celda.clave !== `${entrada.fila},${entrada.columna}`)
      .sort((a, b) => b.distancia - a.distancia);
    const distanciaMinimaSalida = Math.max(8, Math.floor((ancho + alto) * 0.25));
    const elegidoSalida = candidatosSalida.find((celda) => celda.distancia >= distanciaMinimaSalida)
      ?? candidatosSalida[0];
    if (!elegidoSalida) throw new Error("No se encontró una salida accesible para el mapa.");
    const [filaSalida, columnaSalida] = elegidoSalida.clave.split(",").map(Number);
    const salida = { fila: filaSalida, columna: columnaSalida };
    celdas[salida.fila][salida.columna].tipo = "exit";
    conexiones();

    const resultado = {
      ancho,
      alto,
      semilla,
      entrada,
      salida,
      distanciaMinimaSalida,
      habitaciones,
      celdas,
      minHabitaciones,
      maxHabitaciones,
    };
    const validacion = validar(resultado);
    if (!validacion.valido) {
      throw new Error(`El mapa procedural no pasó la validación: ${validacion.errores.join(" ")}`);
    }
    resultado.validacion = validacion;
    return resultado;
  }

  global.GeneradorMazmorra = Object.freeze({ generar, validar });
})(window);
