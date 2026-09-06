const path = require('node:path');
const { leerEntradas } = require('../lib/contenido');
const { enlaceVender, VENDER, VALORACION } = require('../lib/enlaces');
const textos = require('../lib/textos');
const {
  PORTADA, grafo, urlArticulo, INDEX, BLOG, NO_ENCONTRADA, articulo, coleccionBlog, articuloSchema
} = require('../lib/metadatos');

// El contenido solo cambia al desplegar, asi que se lee al arrancar y no en cada
// peticion.
const ENTRADAS = leerEntradas(path.join(__dirname, '..', 'content'));

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index', {
      ...INDEX,
      conNav: false,
      ld_json: grafo(),
      textos,
      entradas: ENTRADAS,
      cta: enlaceVender(VALORACION, 'home-cta'),
      comoFunciona: enlaceVender(VENDER, 'home-proceso')
    });
  });

  app.get('/blog', (req, res) => {
    res.render('blog', {
      ...BLOG,
      conNav: true,
      ld_json: grafo(coleccionBlog()),
      textos,
      entradas: ENTRADAS,
      cta: enlaceVender(VALORACION, 'blog-indice'),
      comoFunciona: enlaceVender(VENDER, 'blog-indice-proceso')
    });
  });

  app.get('/blog/:slug', (req, res, next) => {
    const entrada = ENTRADAS.find(({ slug }) => slug === req.params.slug);
    if (!entrada) return next();

    res.render('articulo', {
      ...articulo(entrada),
      conNav: true,
      ld_json: grafo(articuloSchema(entrada)),
      textos,
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
      ...ENTRADAS.map((entrada) => ({
        loc: urlArticulo(entrada),
        priority: '0.7',
        lastmod: entrada.fecha
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
      ...NO_ENCONTRADA,
      conNav: true,
      noindex: true,
      ld_json: grafo(),
      textos,
      cta: enlaceVender(VALORACION, '404')
    });
  });
};
