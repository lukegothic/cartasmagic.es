// Metadatos de cada pagina: lo que leen los buscadores y las redes, no lo que lee el
// visitante. Separado de textos.js a proposito, porque se edita por otros motivos y con
// otro criterio (longitud, keywords) que la copy de la interfaz.

const { PROCESO_FAQ } = require('./textos');

const DOMINIO = 'https://vendercartasmagic.es';

const NEGOCIO = {
  '@type': 'Organization',
  '@id': 'https://vendercartasmagic.es/#negocio',
  name: 'VenderCartasMagic',
  url: DOMINIO,
  email: 'contacto@vendercartasmagic.es',
  telephone: '+34644154365',
  founder: { '@type': 'Person', name: 'Iván Pérez' },
  foundingDate: '2011',
  areaServed: { '@type': 'Country', name: 'España' },
  description: 'Compramos colecciones de cartas Magic: The Gathering en toda España. Envío pagado, valoración en 24 horas y pago por transferencia.'
};

// Las preguntas salen de textos.js, que es donde se editan: aqui solo se les da la forma
// que espera schema.org.
const faqSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a }
  }))
});

const grafo = (...nodos) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': [NEGOCIO, ...nodos] });

const INDEX = {
  title: 'Vender cartas Magic: mándalas y cobra sin listar nada | VenderCartasMagic.es',
  description: 'Compramos tu colección de cartas Magic en cualquier idioma y estado. Pides la etiqueta en un minuto, la mandas gratis y cobras por transferencia. Sin listados ni negociación.',
  keywords: 'vender cartas magic, vender cartas, venta cartas magic, vendo cartas magic, compra venta cartas magic, vender coleccion cartas magic, vender cartas magic españa, comprar colecciones magic',
  canonical: DOMINIO,
  og_title: 'Vender cartas Magic: mándalas y cobra sin listar nada',
  og_description: 'Compramos tu colección de cartas Magic en cualquier idioma y estado. Envío pagado, valoración en 24 horas y pago por transferencia.',
  og_url: DOMINIO
};

const indexLdJson = () =>
  grafo(
    {
      '@type': 'Service',
      name: 'Compra de colecciones de cartas Magic',
      provider: { '@id': 'https://vendercartasmagic.es/#negocio' },
      areaServed: { '@type': 'Country', name: 'España' },
      serviceType: 'Compra de colecciones de cartas coleccionables'
    },
    faqSchema(PROCESO_FAQ)
  );

const COMPARATIVA = {
  title: 'Cómo vender cartas Magic en España: las 4 opciones reales | VenderCartasMagic.es',
  description: 'Tiendas, Cardmarket, Wallapop o venderla entera de una vez. Qué cuesta cada opción en tiempo y en dinero, y cuál conviene según lo que tengas.',
  keywords: 'como vender cartas magic, donde vender cartas magic, vender cartas magic online, vender coleccion magic',
  canonical: `${DOMINIO}/como-vender-cartas-magic`,
  og_title: 'Cómo vender cartas Magic en España: las 4 opciones reales',
  og_description: 'Tiendas, Cardmarket, Wallapop o venderla entera. Qué cuesta cada una en tiempo y en dinero.',
  og_url: `${DOMINIO}/como-vender-cartas-magic`
};

const comparativaLdJson = () =>
  grafo({
    '@type': 'HowTo',
    name: 'Cómo vender una colección de cartas Magic',
    description: 'Proceso para vender una colección de cartas Magic sin prepararla ni listarla.',
    totalTime: 'P3D',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Cuenta qué tienes', text: 'Rellenas el formulario: nombre, correo y cuántas cartas son. Si dejas también la dirección, la etiqueta llega en el primer correo.' },
      { '@type': 'HowToStep', position: 2, name: 'Recibe la etiqueta', text: 'Te mandamos una etiqueta de Correos prepagada. El envío lo pagamos nosotros.' },
      { '@type': 'HowToStep', position: 3, name: 'Envía la caja', text: 'Metes las cartas en una caja, pegas la etiqueta y la dejas en una oficina de Correos.' },
      { '@type': 'HowToStep', position: 4, name: 'Recibe el precio', text: 'En un día laborable desde que llega el paquete recibes un precio definitivo por correo.' },
      { '@type': 'HowToStep', position: 5, name: 'Cobra', text: 'Si aceptas, cobras por transferencia en 24 horas.' }
    ]
  });

const VALORACION = {
  title: 'Cuánto vale mi colección de cartas Magic | Valoración en 24 horas',
  description: 'Te decimos cuánto vale tu colección de cartas Magic un día laborable después de que llegue. Envío pagado, precio definitivo y pago por transferencia.',
  keywords: 'cuanto valen mis cartas magic, valorar coleccion cartas magic, valoracion cartas magic, tasacion cartas magic',
  canonical: `${DOMINIO}/valoracion-cartas-magic`,
  og_title: 'Cuánto vale mi colección de cartas Magic',
  og_description: 'Valoración en 24 horas desde que llega el paquete. Envío pagado y pago por transferencia.',
  og_url: `${DOMINIO}/valoracion-cartas-magic`
};

const valoracionLdJson = () =>
  grafo({
    '@type': 'ContactPage',
    name: 'Valorar una colección de cartas Magic',
    url: `${DOMINIO}/valoracion-cartas-magic`,
    mainEntity: { '@id': 'https://vendercartasmagic.es/#negocio' }
  });

const MANABOX = {
  title: 'Presupuesto con tu lista de ManaBox | VenderCartasMagic.es',
  description: 'Pega el enlace de tu mazo de ManaBox y recibe un presupuesto por correo en unos minutos. Sin fotos ni listados a mano.',
  keywords: 'vender coleccion manabox, presupuesto cartas magic manabox, vender mazo magic online',
  canonical: `${DOMINIO}/presupuesto-manabox`,
  og_title: 'Presupuesto con tu lista de ManaBox',
  og_description: 'Pega el enlace de tu mazo de ManaBox y recibe un presupuesto por correo en unos minutos.',
  og_url: `${DOMINIO}/presupuesto-manabox`
};

const manaboxLdJson = () =>
  grafo({
    '@type': 'ContactPage',
    name: 'Presupuesto a partir de una lista de ManaBox',
    url: `${DOMINIO}/presupuesto-manabox`,
    mainEntity: { '@id': 'https://vendercartasmagic.es/#negocio' }
  });

const AVISO_LEGAL = {
  title: 'Aviso legal y condiciones del servicio | VenderCartasMagic.es',
  description: 'Datos identificativos, condiciones de compra de colecciones, plazos, devoluciones y política de privacidad.',
  keywords: 'aviso legal vendercartasmagic, condiciones venta cartas magic',
  canonical: `${DOMINIO}/aviso-legal`,
  og_title: 'Aviso legal y condiciones del servicio',
  og_description: 'Datos identificativos, condiciones de compra, plazos y devoluciones.',
  og_url: `${DOMINIO}/aviso-legal`
};

const avisoLegalLdJson = () =>
  JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Aviso legal' });

module.exports = {
  INDEX, indexLdJson,
  COMPARATIVA, comparativaLdJson,
  VALORACION, valoracionLdJson,
  MANABOX, manaboxLdJson,
  AVISO_LEGAL, avisoLegalLdJson
};
