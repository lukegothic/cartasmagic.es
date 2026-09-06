// Metadatos de cada pagina: lo que leen los buscadores y las redes, no lo que lee el
// visitante. Separado de textos.js a proposito, porque se edita por otros motivos y con
// otro criterio (longitud, keywords) que la copy de la interfaz.

const PORTADA = 'https://cartasmagic.es';

const ORGANIZACION = {
  '@type': 'Organization',
  '@id': 'https://cartasmagic.es/#organizacion',
  name: 'CartasMagic',
  url: PORTADA,
  email: 'contacto@vendercartasmagic.es',
  telephone: '+34644154365',
  founder: { '@type': 'Person', name: 'Iván Pérez' },
  foundingDate: '2011',
  areaServed: { '@type': 'Country', name: 'España' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Calle Manuel Iribarren 10',
    postalCode: '31008',
    addressLocality: 'Pamplona',
    addressRegion: 'Navarra',
    addressCountry: 'ES'
  },
  description:
    'Compramos colecciones de cartas Magic: The Gathering en toda España y publicamos guías sobre el valor de las cartas.',
  knowsAbout: [
    'Magic: The Gathering',
    'Valoración de cartas coleccionables',
    'Mercado de cartas Magic de segunda mano en España'
  ],
  subOrganization: { '@id': 'https://vendercartasmagic.es/#negocio' },
  sameAs: [
    'https://vendercartasmagic.es',
    'https://www.cardmarket.com/es/Magic/Users/ivan-the-seller'
  ]
};

const SITIO = {
  '@type': 'WebSite',
  '@id': 'https://cartasmagic.es/#web',
  url: PORTADA,
  name: 'CartasMagic.es',
  inLanguage: 'es-ES',
  publisher: { '@id': 'https://cartasmagic.es/#organizacion' }
};

const grafo = (...nodos) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORGANIZACION, SITIO, ...nodos] });

const INDEX = {
  title: 'CartasMagic.es | Cuánto valen tus cartas Magic',
  description:
    'Guías sobre el valor de las cartas Magic: The Gathering en España. Qué determina el precio de una carta, qué colecciones valen dinero y cómo vender la tuya sin listarla.',
  keywords: 'valor cartas magic, valorar cartas magic, tasar cartas magic, precio cartas magic antiguas',
  canonical: `${PORTADA}/`,
  og_title: 'CartasMagic.es | Cuánto valen tus cartas Magic',
  og_description:
    'Qué determina el precio de una carta Magic, qué colecciones valen dinero y cómo vender la tuya sin listarla.'
};

const BLOG = {
  title: 'Guías sobre el valor de las cartas Magic | CartasMagic.es',
  description:
    'Cómo se calcula el precio de una carta Magic: edición, estado, idioma y demanda. Guías escritas por quien compra colecciones a diario.',
  keywords: 'guia cartas magic, guias valor cartas magic, aprender a valorar cartas magic',
  canonical: `${PORTADA}/blog`,
  og_title: 'Guías sobre el valor de las cartas Magic',
  og_description: 'Cómo se calcula el precio de una carta Magic, explicado sin tecnicismos.'
};

const NO_ENCONTRADA = {
  title: 'Página no encontrada | CartasMagic.es',
  description: 'La página que buscas no existe.',
  keywords: '',
  canonical: `${PORTADA}/`,
  og_title: 'Página no encontrada',
  og_description: 'La página que buscas no existe.'
};

const urlArticulo = (entrada) => `${PORTADA}/blog/${entrada.slug}`;

// El articulo saca sus metadatos del propio contenido, asi que no hay constantes que
// centralizar: solo la forma de componerlos.
const articulo = (entrada) => ({
  title: `${entrada.titulo} | CartasMagic.es`,
  description: entrada.descripcion,
  keywords: entrada.keywords || '',
  canonical: urlArticulo(entrada),
  og_title: entrada.titulo,
  og_description: entrada.descripcion,
  og_type: 'article'
});

const coleccionBlog = () => ({
  '@type': 'CollectionPage',
  name: 'Guías sobre el valor de las cartas Magic',
  url: `${PORTADA}/blog`,
  isPartOf: { '@id': 'https://cartasmagic.es/#web' }
});

const articuloSchema = (entrada) => ({
  '@type': 'Article',
  headline: entrada.titulo,
  description: entrada.descripcion,
  datePublished: entrada.fecha,
  inLanguage: 'es-ES',
  mainEntityOfPage: { '@type': 'WebPage', '@id': urlArticulo(entrada) },
  author: { '@id': 'https://cartasmagic.es/#organizacion' },
  publisher: { '@id': 'https://cartasmagic.es/#organizacion' }
});

module.exports = {
  PORTADA, grafo, urlArticulo,
  INDEX, BLOG, NO_ENCONTRADA, articulo, coleccionBlog, articuloSchema
};
