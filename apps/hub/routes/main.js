const path = require('node:path');
const { leerEntradas } = require('../lib/contenido');
const { enlaceVender, VENDER, VALORACION } = require('../lib/enlaces');

// El contenido solo cambia al desplegar, asi que se lee al arrancar y no en cada
// peticion.
const ENTRADAS = leerEntradas(path.join(__dirname, '..', 'content'));
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

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index', {
      title: 'CartasMagic.es | Cuánto valen tus cartas Magic y cómo venderlas',
      description:
        'Guías sobre el valor de las cartas Magic: The Gathering en España. Qué determina el precio de una carta, qué colecciones valen dinero y cómo vender la tuya sin listarla.',
      keywords:
        'cartas magic, cuanto valen mis cartas magic, valor cartas magic, vender cartas magic, vender coleccion cartas magic, magic the gathering españa',
      canonical: `${PORTADA}/`,
      og_title: 'CartasMagic.es | Cuánto valen tus cartas Magic y cómo venderlas',
      og_description:
        'Qué determina el precio de una carta Magic, qué colecciones valen dinero y cómo vender la tuya sin listarla.',
      conNav: false,
      ld_json: grafo(),
      entradas: ENTRADAS,
      cta: enlaceVender(VALORACION, 'home-cta'),
      comoFunciona: enlaceVender(VENDER, 'home-proceso')
    });
  });

  app.get('/blog', (req, res) => {
    res.render('blog', {
      title: 'Guías sobre el valor de las cartas Magic | CartasMagic.es',
      description:
        'Cómo se calcula el precio de una carta Magic: edición, estado, idioma y demanda. Guías escritas por quien compra colecciones a diario.',
      keywords:
        'valor cartas magic, cuanto valen mis cartas magic, precio cartas magic, guia cartas magic',
      canonical: `${PORTADA}/blog`,
      og_title: 'Guías sobre el valor de las cartas Magic',
      og_description: 'Cómo se calcula el precio de una carta Magic, explicado sin tecnicismos.',
      conNav: true,
      ld_json: grafo({
        '@type': 'CollectionPage',
        name: 'Guías sobre el valor de las cartas Magic',
        url: `${PORTADA}/blog`,
        isPartOf: { '@id': 'https://cartasmagic.es/#web' }
      }),
      entradas: ENTRADAS,
      cta: enlaceVender(VALORACION, 'blog-indice'),
      comoFunciona: enlaceVender(VENDER, 'blog-indice-proceso')
    });
  });

  app.get('/blog/:slug', (req, res, next) => {
    const entrada = ENTRADAS.find(({ slug }) => slug === req.params.slug);
    if (!entrada) return next();

    const url = `${PORTADA}/blog/${entrada.slug}`;

    res.render('articulo', {
      title: `${entrada.titulo} | CartasMagic.es`,
      description: entrada.descripcion,
      keywords: entrada.keywords || '',
      canonical: url,
      og_title: entrada.titulo,
      og_description: entrada.descripcion,
      og_type: 'article',
      conNav: true,
      ld_json: grafo({
        '@type': 'Article',
        headline: entrada.titulo,
        description: entrada.descripcion,
        datePublished: entrada.fecha,
        inLanguage: 'es-ES',
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: { '@id': 'https://cartasmagic.es/#organizacion' },
        publisher: { '@id': 'https://cartasmagic.es/#organizacion' }
      }),
      entrada,
      cta: enlaceVender(VALORACION, `articulo-${entrada.slug}`)
    });
  });

  // Va antes del catch-all de 404, que si no lo captura y el healthcheck del contenedor
  // da el sitio por caido.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // El sitemap se genera del contenido real: una entrada nueva no obliga a tocarlo.
  app.get('/sitemap.xml', (req, res) => {
    const urls = [
      { loc: `${PORTADA}/`, priority: '1.0' },
      { loc: `${PORTADA}/blog`, priority: '0.8' },
      ...ENTRADAS.map(({ slug, fecha }) => ({
        loc: `${PORTADA}/blog/${slug}`,
        priority: '0.7',
        lastmod: fecha
      }))
    ];

    const cuerpo = urls
      .map(({ loc, priority, lastmod }) =>
        [
          '  <url>',
          `    <loc>${loc}</loc>`,
          lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
          `    <priority>${priority}</priority>`,
          '  </url>'
        ]
          .filter(Boolean)
          .join('\n')
      )
      .join('\n');

    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cuerpo}\n</urlset>\n`
    );
  });

  app.use((req, res) => {
    res.status(404).render('404', {
      title: 'Página no encontrada | CartasMagic.es',
      description: 'La página que buscas no existe.',
      keywords: '',
      canonical: `${PORTADA}/`,
      og_title: 'Página no encontrada',
      og_description: 'La página que buscas no existe.',
      conNav: true,
      noindex: true,
      ld_json: grafo(),
      cta: enlaceVender(VALORACION, '404')
    });
  });
};
