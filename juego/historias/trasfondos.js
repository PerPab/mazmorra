(function crearTrasfondos() {
  window.juego = window.juego ?? {};

  // Contenido narrativo independiente de los datos de combate de cada personaje.
  // Agrega aquí secciones con texto e imágenes usando el id del personaje.
  // Ejemplo:
  // "caballero-maldito": [
  //   { titulo: "Antes de la caída", texto: "Primer párrafo...\n\nSegundo párrafo..." },
  //   {
  //     texto: "El caballero regresó a las ruinas...",
  //     imagen: "recursos/imagen/historias/caballero-ruinas.png",
  //     alt: "El caballero frente a las ruinas",
  //     pie: "Las ruinas de su antiguo hogar."
  //   }
  // ],


 window.juego.trasfondos = {
  "caballero-maldito": [
    {
      imagen: "recursos/imagen/historia/caballero_hist/Man_in_Armor.png",
      alt: "Caballero",
      pie: ""
    },
    
    {
      titulo: "",
      texto: "Desde que tengo memoria, mi vida ha estado ligada a la violencia de los campos de batalla. Primero fui paje, después escudero y, finalmente, tuve el honor de ser nombrado caballero. He participado en más batallas de las que puedo recordar y he arrebatado más vidas de las que me atrevo a contar. Durante años cumplí con mi deber sin cuestionarlo. Pero llegó el día en que ya no pude soportarlo. Renuncié a mi juramento y me alejé de todo aquello que alguna vez había dado sentido a mi vida. Creí que lejos de la guerra encontraría la paz.\nMe equivocaba."
    },

    {
      imagen: "recursos/imagen/historia/caballero_hist/Melted_Figure.png",
      alt: "Los muertos regresan",
      pie: ""
    },
    {
      texto: "En mis sueños regresan los muertos. Los hombres que asesiné se arrastran hacia mí con sus miembros torcidos, la carne putrefacta y los ojos hinchados, rebosantes de un odio que ni siquiera la muerte ha podido apagar. Nunca hablan. Nunca apartan la mirada. Se limitan a señalar hacia el este. Allí se alza una montaña negra, tan alta que su cima se pierde entre las nubes y tan profunda que sus entrañas descienden hasta las puertas del infierno. Ya no puedo soportarlo. Siento que la razón me abandona.\nHace quince días emprendí el viaje hacia el este."
    },
    {
      imagen: "recursos/imagen/historia/caballero_hist/Montana_bg.png",
      alt: "Montaña maldita",
      pie: ""
    },
    {
      texto: "Hoy, al caer la tarde, la he visto por primera vez. Su silueta se recortaba contra el horizonte, negra como la noche, teñida de rojo por los últimos rayos del sol. Parecía observarme desde la distancia. Ante aquella montaña, he sentido un miedo que ninguna batalla me había inspirado jamás.\nQue Dios se apiade de mi alma."
    },
  ]
,
bruja: [],

"sacerdote-condenado": [
  {
    imagen: "recursos/imagen/historia/sacerdote_hist/High_Priest.png",
    alt: "Sacerdote",
    pie: ""
  },
  {
    titulo: "",
    texto: "Hubo un tiempo en que fui un hombre de fe. También fui un hombre poderoso. Los pobres acudían a mí en busca de consuelo, aferrándose a mis palabras como náufragos a un madero. Los ricos, en cambio, venían buscando el perdón que sus riquezas no podían comprar. Durante años creí ser un servidor de Dios, hasta que el poder corrompió mi espíritu y convirtió mi fe en una máscara tras la que ocultar mis pecados. Y Dios es testigo de que... las cosas que hice... no admiten perdón."
  },
  {
    imagen: "recursos/imagen/historia/sacerdote_hist/Tentacle.png",
    alt: "Dios negro",
    pie: ""
  },
  {
    titulo: "",
    texto: "Supe que mi alma estaba condenada cuando Xal'goroth, el dios oscuro de la podredumbre, comenzó a visitarme en sueños. Su colosal figura se cernía sobre mí, aplastando mi espíritu bajo un peso insoportable. Sus ojos rojos penetraban hasta lo más profundo de mi ser, como si contemplaran cada uno de mis pecados. Entonces, de entre las sombras de su cuerpo, emergían sus horrendos tentáculos y señalaban hacia el oeste. No pronunciaba palabra alguna. No le hacía falta. Yo comprendía su voluntad, y temblaba."
  },
  {
    imagen: "recursos/imagen/historia/sacerdote_hist/Entrada_r.png",
    alt: "Entrada a la cueva",
    pie: ""
  },
  {
    titulo: "",
    texto: "Quizá haya perdido la razón. No recuerdo cuántos días llevo caminando, ni cuántas noches he pasado huyendo de mis propios pensamientos. Solo sé que, al fin, he llegado. Frente a mí se abre la entrada que Xal'goroth me mostró en sueños, una herida oscura en la ladera de la Montaña Negra. De sus entrañas emana un hedor insoportable, una mezcla de carne podrida, tierra húmeda y algo más antiguo, algo que no encuentro palabras para describir."
  }
],
    asesino: [],
  };
})();
