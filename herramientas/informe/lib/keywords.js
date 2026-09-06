const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

// Las keywords viven en dos sitios con formatos distintos: como opcion de render en los
// dos routes y como front matter en cada articulo del hub. El indice las lee de donde
// estan en vez de mantener una copia, que se quedaria desincronizada al primer articulo
// nuevo.
// Se ancla en el bloque de opciones de render, no en el app.get: dos paginas de vender
// se pintan desde una funcion auxiliar declarada antes de su ruta, y buscar hacia
// delante desde app.get no las encuentra nunca. El canonical va siempre en el mismo
// bloque que las keywords y ademas trae la URL real, que es lo que se compara con GSC.
const BLOQUE = /keywords:\s*\n?\s*'([^']*)'[\s\S]{0,400}?canonical:\s*(?:`([^`]*)`|'([^']*)')/g;

const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const separar = (linea) =>
  linea
    .split(',')
    .map(normalizar)
    .filter(Boolean);

const leerRoutes = (app, dominio) => {
  const fichero = path.join(RAIZ, 'apps', app, 'routes', 'main.js');
  const fuente = fs.readFileSync(fichero, 'utf8');
  const relativo = path.relative(RAIZ, fichero).replace(/\\/g, '/');

  return [...fuente.matchAll(BLOQUE)]
    .map((coincidencia) => {
      const [, linea, plantilla, literal] = coincidencia;
      const canonical = (plantilla || literal).replace('${PORTADA}', `https://${dominio}`);
      return {
        dominio,
        ruta: new URL(canonical).pathname || '/',
        keywords: separar(linea),
        fichero: relativo,
        // El informe cita fichero:linea para poder abrir el sitio exacto del cambio.
        numeroLinea: fuente.slice(0, coincidencia.index).split('\n').length
      };
    })
    .filter(({ keywords }) => keywords.length);
};

const leerArticulos = (dominio) => {
  const dir = path.join(RAIZ, 'apps', 'hub', 'content');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((nombre) => nombre.endsWith('.md'))
    .map((nombre) => {
      const fichero = path.join(dir, nombre);
      const contenido = fs.readFileSync(fichero, 'utf8');
      const frontMatter = contenido.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const linea = frontMatter?.[1].match(/^keywords:\s*(.+)$/m);
      const indice = linea ? contenido.indexOf(linea[0]) : -1;
      return {
        dominio,
        ruta: `/blog/${nombre.replace(/\.md$/, '')}`,
        keywords: linea ? separar(linea[1]) : [],
        fichero: path.relative(RAIZ, fichero).replace(/\\/g, '/'),
        numeroLinea: indice === -1 ? 1 : contenido.slice(0, indice).split('\n').length
      };
    })
    .filter(({ keywords }) => keywords.length);
};

// Devuelve un Map de keyword normalizada a las paginas que la reclaman. Que una keyword
// tenga mas de una pagina ya es una senal: dos paginas propias compitiendo por la misma
// busqueda.
const construirIndice = () => {
  const paginas = [
    ...leerRoutes('hub', 'cartasmagic.es'),
    ...leerArticulos('cartasmagic.es'),
    ...leerRoutes('vender', 'vendercartasmagic.es')
  ];

  const porKeyword = new Map();
  for (const pagina of paginas) {
    for (const keyword of pagina.keywords) {
      if (!porKeyword.has(keyword)) porKeyword.set(keyword, []);
      porKeyword.get(keyword).push(pagina);
    }
  }

  return { paginas, porKeyword };
};

// Los llm.txt de los dos sitios, para comprobar que responden a lo que se busca.
const leerLlms = () =>
  [
    { dominio: 'cartasmagic.es', relativo: 'apps/hub/public/llm.txt' },
    { dominio: 'vendercartasmagic.es', relativo: 'apps/vender/public/llm.txt' }
  ]
    .map(({ dominio, relativo }) => {
      const fichero = path.join(RAIZ, relativo);
      if (!fs.existsSync(fichero)) return null;
      return { dominio, fichero: relativo, texto: fs.readFileSync(fichero, 'utf8') };
    })
    .filter(Boolean);

module.exports = { construirIndice, normalizar, leerLlms };
