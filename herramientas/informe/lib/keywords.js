const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

// Las keywords viven en dos sitios con formatos distintos: como constantes de metadatos
// de cada aplicacion y como front matter en cada articulo del hub. El indice las lee de
// donde estan en vez de mantener una copia, que se quedaria desincronizada al primer
// articulo nuevo.
// Se ancla en el bloque que declara las keywords, no en la ruta que lo pinta: el
// canonical va siempre en ese mismo bloque y ademas trae la URL real, que es lo que se
// compara con GSC.
const BLOQUE = /keywords:\s*\n?\s*'([^']*)'[\s\S]{0,400}?canonical:\s*(?:`([^`]*)`|'([^']*)'|(\w+))/g;

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

const relativoARaiz = (fichero) => path.relative(RAIZ, fichero).replace(/\\/g, '/');

// Title y description van antes que las keywords en cada bloque de metadatos, asi que la
// ultima aparicion antes de ellas es la del propio bloque. El lookbehind deja fuera
// og_title y og_description.
const textoAnterior = (fuente, indice, campo) => {
  const antes = fuente.slice(Math.max(0, indice - 1000), indice);
  const aparicion = [...antes.matchAll(new RegExp(`(?<!\\w)${campo}:\\s*'((?:[^'\\\\]|\\\\.)*)'`, 'g'))].at(-1);
  return aparicion?.[1].replace(/\\'/g, "'") ?? '';
};

// El copy visible de una pagina de aplicacion sale de su vista y de los textos de la app.
// Los textos son comunes a todas las paginas, asi que tocarlos cuenta como cambio de todas:
// es el lado seguro, porque el informe no puede separar que parte de textos.js pinta cada vista.
const ficherosDeCopy = (app, ruta) => {
  const vista = ruta === '/' ? 'index' : ruta.slice(1);
  return [`apps/${app}/views/${vista}.ejs`, `apps/${app}/lib/textos.js`].filter((relativo) =>
    fs.existsSync(path.join(RAIZ, relativo))
  );
};

const leerCopy = (ficheros) =>
  ficheros.map((relativo) => fs.readFileSync(path.join(RAIZ, relativo), 'utf8')).join('\n');

const leerMetadatos = (app, dominio) => {
  const fichero = path.join(RAIZ, 'apps', app, 'lib', 'metadatos.js');
  const fuente = fs.readFileSync(fichero, 'utf8');
  const relativo = relativoARaiz(fichero);

  const paginas = [...fuente.matchAll(BLOQUE)]
    .map((coincidencia) => {
      const [, linea, plantilla, literal, constante] = coincidencia;
      // Cada aplicacion nombra su constante de dominio a su manera (PORTADA en el hub,
      // DOMINIO en vender), y la portada de vender la usa a secas en vez de interpolarla
      // dentro de una plantilla. Los dos casos se resuelven a la URL real.
      const raiz = `https://${dominio}`;
      const canonical = constante ? raiz : (plantilla || literal).replace(/\$\{\w+\}/, raiz);
      const ruta = new URL(canonical).pathname || '/';
      const ficherosCopy = ficherosDeCopy(app, ruta);
      return {
        dominio,
        ruta,
        keywords: separar(linea),
        texto: {
          title: textoAnterior(fuente, coincidencia.index, 'title'),
          description: textoAnterior(fuente, coincidencia.index, 'description'),
          copy: leerCopy(ficherosCopy)
        },
        ficherosCopy,
        fichero: relativo,
        // El informe cita fichero:linea para poder abrir el sitio exacto del cambio.
        numeroLinea: fuente.slice(0, coincidencia.index).split('\n').length
      };
    })
    .filter(({ keywords }) => keywords.length);

  // Un fichero que existe pero del que no sale ninguna pagina significa que los
  // metadatos han cambiado de sitio o de forma. Callarse aqui es lo que hizo que el
  // informe del 4 de septiembre de 2026 diera por huerfanas seis keywords declaradas.
  if (!paginas.length) {
    throw new Error(`No se ha leido ninguna keyword de ${relativo}: revisa si los metadatos han cambiado de forma.`);
  }

  return paginas;
};

const valorDeFrontMatter = (frontMatter = '', clave) => {
  const linea = frontMatter.match(new RegExp(`^${clave}:\\s*(.+)$`, 'm'));
  return linea?.[1].trim().replace(/^"(.*)"$/, '$1') ?? '';
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
      const fecha = frontMatter?.[1].match(/^fecha:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
      const indice = linea ? contenido.indexOf(linea[0]) : -1;
      const titulo = valorDeFrontMatter(frontMatter?.[1], 'titulo');
      return {
        dominio,
        ruta: `/blog/${nombre.replace(/\.md$/, '')}`,
        keywords: linea ? separar(linea[1]) : [],
        // El title lo compone la ruta del articulo igual que en apps/hub/lib/metadatos.js.
        texto: {
          title: `${titulo} | CartasMagic.es`,
          description: valorDeFrontMatter(frontMatter?.[1], 'descripcion'),
          copy: contenido.slice(frontMatter?.[0].length ?? 0).trim()
        },
        // Solo la traen los articulos. Los metadatos de las apps no declaran fecha porque
        // esas paginas existen desde el principio.
        fecha: fecha?.[1],
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
    ...leerMetadatos('hub', 'cartasmagic.es'),
    ...leerArticulos('cartasmagic.es'),
    ...leerMetadatos('vender', 'vendercartasmagic.es')
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
