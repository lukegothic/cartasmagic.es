// Copy de interfaz de vender. Las vistas no llevan texto suelto: lo piden aqui, asi que
// cambiar una frase no obliga a abrir la plantilla ni a recordar en que .ejs vivia.
//
// Que NO vive aqui:
//   - los metadatos de cada pagina (title, description, og, schema.org) -> metadatos.js
//   - la prosa de los correos que se mandan al cliente -> textos-correo.js
//   - el aviso legal, que es un documento continuo y se lee entero -> views/aviso-legal.ejs

const MARCA = {
  logoAlt: 'Magic: The Gathering Logo',
  correo: 'contacto@vendercartasmagic.es'
};

const PIE = {
  certificadoTitulo: 'Certificado Professional Seller de Cardmarket',
  certificadoAlt: 'Certified Professional Seller',
  perfil: 'Ver perfil en Cardmarket',
  guias: {
    antes: '¿Quieres saber cómo se calcula el precio de una carta? Lee las',
    enlace: 'guías sobre el valor de las cartas Magic',
    despues: 'en CartasMagic.es'
  },
  titular: 'Iván Pérez &middot; NIF 72808254Y &middot; Pamplona (Navarra)',
  avisoLegal: 'Aviso legal y condiciones'
};

// Las preguntas se pintan en la portada y ademas alimentan el FAQPage de schema.org, que
// las lee de aqui: una sola fuente para que la respuesta visible y la indexada no se
// separen al editar una.
const PROCESO_FAQ = [
  {
    q: '¿Cómo vendo mi colección de cartas Magic?',
    a: 'Rellenas el formulario en un minuto: nombre, correo y cuántas cartas son. Te mandamos una etiqueta de Correos que pagamos nosotros, envías el paquete y un día laborable después de que llegue recibes un precio por correo. Si lo aceptas, cobras por transferencia en 24 horas. No hay listados que preparar ni negociación.'
  },
  {
    q: '¿Tengo que hacer un listado de mis cartas?',
    a: 'No. No hace falta ordenar, clasificar ni contar nada. Metes los mazos y los álbumes en una caja de magics y los envías. De eso se trata: el trabajo lo hacemos nosotros.'
  },
  {
    q: '¿Cuánto tardáis en valorar la colección?',
    a: 'Un día laborable desde que el paquete llega. Recibes un precio definitivo por correo, sin condiciones ni letra pequeña.'
  },
  {
    q: '¿Quién paga el envío?',
    a: 'El envío de ida lo pagamos nosotros: te mandamos una etiqueta de Correos prepagada. No hace falta ni imprimirla, la enseñas en el móvil en cualquier oficina.'
  },
  {
    q: '¿Y si no me gusta el precio?',
    a: 'Se te devuelve la colección entera. La devolución cuesta 11,90 €, que es lo que suman el envío de ida y el de vuelta, y los paga quien rechaza la oferta. Si la colección no es lo que esperábamos por nuestra parte o decidimos no valorarla, la devolución la pagamos nosotros.'
  },
  {
    q: '¿Qué colecciones compráis?',
    a: 'Mazos montados, álbumes y colecciones completas de Magic: The Gathering, en cualquier idioma y en cualquier estado. El bulk que venga dentro de una colección se paga como parte del lote. Lo que no compramos es una caja que sea solo comunes sin nada más, ni cartas de otros juegos ni falsificaciones.'
  },
  {
    q: '¿Cuánto valen mis cartas Magic?',
    a: 'Depende del estado, de la antigüedad de los sets y de si hay cartas de formatos que se juegan hoy. Valoramos con los precios de Cardmarket del día que llega el paquete.'
  },
  {
    q: '¿Cuándo cobro?',
    a: 'Por transferencia bancaria, dentro de las 24 horas siguientes a que aceptes el precio.'
  }
];

const PORTADA = {
  h1: 'Vende tus cartas Magic sin listar, fotografiar ni negociar',
  reclamo: 'Compramos en cualquier idioma y en cualquier estado. Metes los mazos y los álbumes en una caja de magics, la mandas con la etiqueta que pagamos nosotros y un día laborable después tienes un precio definitivo. Aceptas y cobras por transferencia.',
  llamadaPrincipal: 'Saber cuánto vale mi colección',
  notaMinuto: 'Se tarda un minuto &middot; sin compromiso &middot; el envío es gratis, lo pagamos nosotros',
  notaCardmarket: 'Vendedor en Cardmarket desde 2011 &middot; más de 3.200 valoraciones positivas',
  comoFunciona: {
    titulo: 'Cómo funciona',
    pasos: [
      { titulo: 'Nos cuentas qué tienes', cuerpo: 'Son cuatro palabras y no te compromete a nada. Si nos mandas tu dirección, la etiqueta te llega en el primer correo.' },
      { titulo: 'Envías el paquete', cuerpo: 'Pegas la etiqueta y la dejas en cualquier oficina de Correos. No adelantas nada.' },
      { titulo: 'Cobras el dinero', cuerpo: 'Un precio definitivo en un día laborable y la transferencia dentro de las 24 horas siguientes.' }
    ]
  },
  llamadaEtiqueta: 'Pedir mi etiqueta de envío',
  sinTienda: {
    titulo: 'Vender cartas Magic sin montar una tienda',
    parrafos: [
      'Lo dejaste hace unos meses o hace unos años. La colección sigue ahí, ocupando sitio, y cada vez que piensas en venderla te acuerdas de lo que costaría hacerlo bien: abrir cuenta en Cardmarket, fotografiar, mirar carta por carta de qué set es y en qué estado está, listarlas una a una, esperar meses a que se vendan las buenas mientras la mayoría no se vende nunca, y bajar a Correos cada vez que alguien te compra una carta de dos euros.',
      'Eso son semanas de trabajo repartidas en meses. Si te apetece hacerlo, hazlo: sacarás más dinero y es la opción honesta para quien disfruta del proceso. Si lo que quieres es que la caja de magics deje de estar ahí y cobrar por ella, nosotros somos esa opción.'
    ]
  },
  queCompramos: {
    titulo: 'Qué compramos y qué no',
    etiquetaSi: 'Sí:',
    etiquetaNo: 'No:',
    etiquetaSube: 'Sube el precio',
    si: 'mazos montados, álbumes, carpetas de clasificadores y colecciones completas de Magic: The Gathering, de cualquier época, en cualquier idioma y en cualquier estado. No hace falta ordenar nada.',
    no: 'cajas que sean solo comunes y nada más, cartas de otros juegos (Pokémon, Yu-Gi-Oh y demás) y falsificaciones.',
    sube: 'el buen estado, los sets antiguos y las cartas de formatos que se juegan hoy. Lo baja el desgaste, las cartas dobladas y el volumen de comunes modernas.',
    nota: 'La etiqueta cubre hasta 2 kg y 30x20x20 cm, que son unas 1.000 cartas. Si tienes más, dilo en el formulario y te preparamos otra: no mandes un paquete más grande sin avisar, porque se queda a medias en Correos.'
  },
  antesNoDespues: {
    titulo: 'Lo que hay que decir antes, no después',
    puntos: [
      { destacado: 'El precio se da después de ver las cartas.', resto: 'No damos cifras por teléfono ni por foto, porque el estado real y los sets solo se ven con la carta en la mano. Valoramos con los precios de Cardmarket del día que llega el paquete.' },
      { destacado: 'Es un precio, no una negociación.', resto: 'Se manda un número por el lote entero y se acepta o se rechaza. No hay contraoferta ni regateo: esa es justo la parte que te queremos ahorrar.' },
      { destacado: 'Si rechazas, la devolución cuesta 11,90 €.', resto: 'Es lo que suman el envío de ida y el de vuelta, y lo paga quien rechaza. Se abona por transferencia antes de devolver el paquete.' },
      { destacado: 'Salvo que el fallo sea nuestro.', resto: 'Si decidimos no valorar tu colección, o si no es lo que esperábamos por nuestra parte, la devolución la pagamos nosotros y no te cuesta nada.' }
    ]
  },
  faqTitulo: 'Preguntas frecuentes',
  notaSinCompromiso: 'Pedirla no te obliga a vender. Si el precio no te encaja, se te devuelve todo.',
  enlaceComparativa: 'Antes de decidir: las cuatro formas de vender cartas Magic en España'
};

// Etiquetas y textos de los dos formularios. Los campos comunes no se duplican: la vista
// de manabox usa los mismos que la de valoracion.
const FORMULARIO = {
  nombre: { label: 'Nombre', placeholder: 'ej. Juan García' },
  email: { label: 'Correo electrónico', placeholder: 'ej. nombre@correo.com' },
  mensaje: {
    label: '¿Algo más que debamos saber? (opcional)',
    placeholderValoracion: 'ej. lo dejé en 2018, tengo cuatro mazos de Commander y dos álbumes llenos',
    placeholderManabox: 'ej. tengo también dos mazos de Commander en Manabox, y algunas cartas están usadas'
  },
  volumen: {
    label: '¿Cuántas cartas, más o menos?',
    vacia: 'Elige una opción',
    opciones: [
      { valor: 'menos-500', texto: 'Menos de 500' },
      { valor: '500-1000', texto: 'Entre 500 y 1.000' },
      { valor: 'mas-1000', texto: 'Más de 1.000' },
      { valor: 'ni-idea', texto: 'Ni idea' }
    ]
  },
  url: { label: 'Enlace del mazo en ManaBox', placeholder: 'ej. https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' },
  direccion: {
    label: 'Dirección para mandarte la etiqueta',
    placeholder: 'ej. Calle Mayor 1, 3º B&#10;28001 Madrid (Madrid)',
    nota: 'Si la dejas, te mando la etiqueta ya en el primer correo. Si prefieres no darla todavía, déjala en blanco y te contesto igual'
  },
  legal: {
    antes: 'Al enviar aceptas que tratemos tus datos para responderte. No se ceden a nadie ni se usan para otra cosa. Puedes pedir que se borren escribiendo a contacto@vendercartasmagic.es. Más detalle en el',
    enlace: 'aviso legal'
  },
  recibido: 'Recibido'
};

const VALORACION = {
  h1: '¿Cuánto vale tu colección de cartas Magic?',
  intro: 'Cuéntanos qué tienes en cuatro palabras. Te mandamos la etiqueta de envío, ya pagada, y un día laborable después de que llegue el paquete recibes un precio definitivo en el correo.',
  boton: 'Enviar y recibir la etiqueta',
  notaEnvio: 'Sin compromiso: recibir la etiqueta no te obliga a vender',
  // Lo pinta el partial de feedback cuando el envio sale bien.
  textoRecibido: 'Te escribimos a tu correo con la etiqueta de envío y la dirección. Si no lo ves en unas horas, mira la carpeta de spam.',
  despues: {
    titulo: 'Qué pasa después de darle a enviar',
    pasos: [
      'Te contestamos con la etiqueta de Correos, ya pagada',
      'Dejas el paquete en cualquier oficina y lo valoramos en un día laborable desde que llega',
      'Recibes un precio definitivo y, si lo aceptas, cobras por transferencia en 24 horas'
    ],
    nota: 'Todo por escrito y por correo, para que quede constancia de la oferta y de lo que enviaste.'
  },
  condiciones: {
    titulo: 'Las condiciones, sin letra pequeña',
    puntos: [
      'El envío de ida lo pagamos nosotros.',
      'El precio es una cifra definitiva por el lote entero. No hay negociación ni contraoferta.',
      'Si rechazas el precio, la devolución cuesta 11,90 € y la paga quien rechaza, por transferencia, antes de devolver el paquete.',
      'Si decidimos no valorar tu colección, la devolución la pagamos nosotros.',
      'Compramos mazos, álbumes y colecciones en cualquier idioma y estado. No compramos cajas que sean solo comunes, otros juegos ni falsificaciones.',
      'Hasta 2 kg por paquete. Si tienes más, avísanos antes de enviar.'
    ],
    enlace: 'Leer las condiciones completas'
  },
  escribir: {
    antes: '¿Prefieres escribir directamente?',
    asunto: 'Quiero%20vender%20mi%20coleccion%20de%20cartas%20Magic'
  }
};

const MANABOX = {
  h1: 'Presupuesto al momento con tu lista de ManaBox',
  intro: 'Si tienes la colección en ManaBox, pega el enlace del mazo y te mandamos un presupuesto por correo en unos minutos. Sin fotos, sin contar cartas y sin esperar a que llegue el paquete.',
  boton: 'Pedir presupuesto',
  notaEnvio: 'Sin compromiso: pedir el presupuesto no te obliga a vender',
  textoRecibido: 'Ya tenemos tu lista. Te llegará el presupuesto al correo en unos minutos. Si no lo ves, mira la carpeta de spam.',
  sinManabox: {
    antes: '¿No usas ManaBox?',
    enlace: 'Mándanos la colección sin tener que listar nada'
  },
  comoSacarEnlace: {
    titulo: 'Cómo sacar el enlace en ManaBox',
    pasos: [
      'Abre el mazo o la colección que quieras vender en la app de ManaBox',
      'Dale a compartir y copia el enlace que empieza por manabox.app/decks/',
      'Pégalo aquí arriba con tu correo y recibes el presupuesto en unos minutos'
    ],
    nota: 'El enlace tiene que ser público. Si está en privado no podemos leer la lista.'
  }
};

// El atajo se pinta dentro de la vista de valoracion para desviar a quien ya tiene la
// coleccion en ManaBox y puede tener el presupuesto sin enviar nada.
const ATAJO_MANABOX = {
  titulo: '¿Tienes la colección en ManaBox?',
  nota: 'Pega el enlace de tu lista y recibes el presupuesto por correo en unos minutos, antes de enviar nada',
  boton: 'Usar mi lista'
};

const COMPARATIVA = {
  h1: 'Cómo vender cartas Magic en España',
  intro: 'Hay cuatro formas razonables de vender una colección de Magic en España. Ninguna es la mejor para todo el mundo: depende de cuánto tiempo estés dispuesto a meterle y de cuánto valga lo que tienes. Debajo están las cuatro con sus números reales, y la nuestra es solo una de ellas.',
  opciones: [
    {
      titulo: '1. Cardmarket, carta por carta',
      parrafos: [
        'Es donde más dinero se saca, sin discusión. También es donde más trabajo hay. Tienes que abrir cuenta, identificar cada carta con su set y su idioma, evaluar el estado de cada una, listarlas, y luego ir enviando pedidos a medida que se venden.',
        'La parte que casi nadie calcula: en una colección normal, la mayor parte del volumen son comunes y no comunes que no se venden nunca, o se venden a céntimos. Las veinte o treinta cartas que valen de verdad se venden pronto; el resto se queda listado durante años. Y cada pedido de dos euros implica sobre, sello y viaje a Correos.'
      ],
      conviene: 'tienes tiempo, la colección es grande y valiosa, y no te importa que esto dure meses.'
    },
    {
      titulo: '2. Tu tienda de siempre',
      parrafos: [
        'Muchas tiendas de juegos compran colecciones. Es rápido y es en persona, que a mucha gente le da tranquilidad. A cambio, la tienda tiene que revender con margen y en su zona, así que la oferta suele ser conservadora, sobre todo con el volumen que no tiene salida en su vitrina.'
      ],
      conviene: 'tienes una tienda de confianza cerca y prefieres cerrar el asunto cara a cara.'
    },
    {
      titulo: '3. Wallapop, eBay o grupos de compraventa',
      parrafos: [
        'Vender el lote entero de golpe a un particular. Se puede sacar un precio decente si aciertas con el comprador, pero hay que aguantar el proceso: fotos, mensajes, gente que pregunta y desaparece, ofertas de la mitad, y quedar con desconocidos o arriesgarse con el envío.'
      ],
      conviene: 'no tienes prisa y no te importa gestionar conversaciones.'
    },
    {
      titulo: '4. Vender la colección entera a un comprador especializado',
      parrafos: [
        'Es lo que hacemos nosotros. Mandas la colección, se valora y recibes un precio definitivo por el lote entero. Cobras en días, no en meses, y no tocas una sola carta más allá de meterlas en una caja de magics.',
        'La contrapartida es honesta: por el lote entero se paga menos que vendiendo carta por carta durante un año. Lo que compras es no tener que hacerlo.'
      ],
      conviene: 'quieres que la caja de magics deje de estar en el armario, cobrar de una vez, y el trabajo de las otras tres opciones te da pereza solo de leerlo.'
    }
  ],
  convieneEtiqueta: 'Te conviene si:',
  proceso: {
    titulo: 'Cómo funciona con nosotros, paso a paso',
    pasos: [
      { destacado: 'Rellenas el formulario contando qué tienes.', resto: 'Nombre, correo y cuántas cartas son, más o menos. Si dejas también la dirección, la etiqueta te llega en el primer correo.' },
      { destacado: 'Te mandamos una etiqueta de Correos, ya pagada.', resto: 'El envío de ida lo pagamos nosotros. No adelantas dinero.' },
      { destacado: 'Envías el paquete.', resto: 'Hasta 2 kg y 30x20x20 cm, que son unas 1.000 cartas. Si tienes más, avisa antes y lo organizamos.' },
      { destacado: 'Un día laborable después de que llegue, recibes el precio.', resto: 'Una cifra definitiva por el lote, por correo, sin condiciones añadidas.' },
      { destacado: 'Aceptas y cobras por transferencia en 24 horas.', resto: 'O rechazas y se te devuelve todo: la devolución cuesta 11,90 €, el envío de ida más el de vuelta, y la paga quien rechaza.' }
    ]
  },
  antesDeVender: {
    titulo: 'Antes de vender, tres cosas que conviene saber',
    puntos: [
      { destacado: 'No hace falta que ordenes nada.', resto: 'Si vendes a un comprador especializado, clasificar las cartas antes no sube el precio: es trabajo que se iba a hacer igual. Guarda ese tiempo.' },
      { destacado: 'El estado importa más de lo que parece.', resto: 'Una carta antigua muy jugada puede valer una fracción de la misma carta bien conservada. Por eso nadie serio da un precio por fotos.' },
      { destacado: 'Las cartas antiguas no valen por antiguas.', resto: 'Valen por ser jugables hoy o por ser escasas. Hay cartas de 1995 que valen céntimos y cartas de hace tres años que valen cien euros.' }
    ]
  },
  llamada: 'Pedir la etiqueta de envío',
  notaLlamada: 'Se tarda un minuto y no te obliga a vender'
};

const AVISO_LEGAL = {
  h1: 'Aviso legal y condiciones del servicio',
  llamada: 'Quiero vender mi colección'
};

// El texto de cada error de validacion. La vista solo pide el mensaje por su codigo, asi
// que anadir una validacion nueva no obliga a tocar cada formulario. La funcion que los
// resuelve vive en mensajes-error.js.
const ERRORES = {
  CAMPOS_OBLIGATORIOS: 'Faltan campos por rellenar',
  EMAIL_NO_VALIDO: 'El correo no es válido',
  OPCION_NO_VALIDA: 'Elige una opción en las dos listas',
  ENLACE_NO_VALIDO: 'El enlace no es de un mazo de ManaBox. Tiene que empezar por manabox.app/decks/',
  MAZO_NO_ACCESIBLE: 'No se ha podido abrir el mazo. Comprueba que el enlace es público y vuelve a probar',
  MAZO_NO_LEIBLE: 'No se ha podido leer la lista de cartas. Comprueba que el enlace es público y vuelve a probar',
  MAZO_VACIO: 'Ese mazo no tiene cartas',
  DEMASIADOS_INTENTOS: 'Has pedido varios presupuestos seguidos. Espera un rato y vuelve a probar',
  ENVIO_FALLIDO: 'No se ha podido enviar. Prueba otra vez o escribe a contacto@vendercartasmagic.es'
};

// Un codigo sin mensaje pintaba un recuadro vacio, asi que el visitante no sabia ni que
// habia fallado ni por donde seguir. El generico al menos le da una salida.
const ERROR_GENERICO = 'No se ha podido completar la operación. Prueba otra vez o escribe a contacto@vendercartasmagic.es';

module.exports = {
  MARCA, PIE, PROCESO_FAQ, PORTADA, FORMULARIO, VALORACION, MANABOX,
  ATAJO_MANABOX, COMPARATIVA, AVISO_LEGAL, ERRORES, ERROR_GENERICO
};
