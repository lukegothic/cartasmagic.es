const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const { enlaceVender } = require('./enlaces');

// html: false escapa cualquier etiqueta que venga en el markdown. Las entradas las
// genera un proceso automatizado, asi que el cuerpo se trata como texto, no como HTML
// de confianza.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

// Los enlaces a vender escritos dentro del markdown salen medidos con la campana del
// articulo, para no depender de que quien escribe se acuerde de ponerlos.
const VENDER = 'https://vendercartasmagic.es';

const enlaceMedido = (md_, campana) => {
  const original =
    md_.renderer.rules.link_open ||
    ((tokens, i, opciones, env, self) => self.renderToken(tokens, i, opciones));

  return (tokens, i, opciones, env, self) => {
    const href = tokens[i].attrGet('href');
    if (href && href.startsWith(VENDER)) {
      tokens[i].attrSet('href', enlaceVender(href.slice(VENDER.length) || '/', campana));
      tokens[i].attrSet('rel', 'noopener');
    }
    return original(tokens, i, opciones, env, self);
  };
};

// El slug sale del nombre del fichero y acaba tal cual en la URL y en el canonical.
const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// YAML convierte una fecha sin comillas en un Date, pero entrecomillada llega como
// cadena. El pipeline genera las dos formas, asi que se admiten ambas y se normaliza a
// YYYY-MM-DD, que es lo que esperan el atributo datetime y el sitemap.
const normalizarFecha = (fecha) => {
  if (fecha instanceof Date) {
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString().slice(0, 10);
  }
  if (typeof fecha !== 'string' || Number.isNaN(Date.parse(fecha))) return null;
  return fecha.slice(0, 10);
};

const formatearFecha = (fecha) =>
  new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

// Devuelve null en vez de lanzar: una entrada a medio generar se descarta y el resto
// del blog sigue publicandose.
const leerEntrada = (directorio, fichero) => {
  const slug = path.basename(fichero, '.md');
  if (!SLUG_VALIDO.test(slug)) return null;

  let data;
  let content;
  try {
    ({ data, content } = matter(fs.readFileSync(path.join(directorio, fichero), 'utf8')));
  } catch (err) {
    console.error(`Frontmatter invalido en ${fichero}, se descarta:`, err.message);
    return null;
  }

  const { titulo, descripcion, borrador, keywords } = data;
  const fecha = normalizarFecha(data.fecha);

  if (borrador) return null;
  if (!titulo || !descripcion || !fecha) return null;

  return {
    slug,
    titulo,
    descripcion,
    fecha,
    fechaLegible: formatearFecha(fecha),
    keywords: keywords || '',
    html: renderizar(content, `articulo-${slug}`)
  };
};

// El renderizador se configura por articulo porque la campana cambia con el slug.
const renderizar = (texto, campana) => {
  const anterior = md.renderer.rules.link_open;
  md.renderer.rules.link_open = enlaceMedido(md, campana);
  const html = md.render(texto);
  md.renderer.rules.link_open = anterior;
  return html;
};

const leerEntradas = (directorio) => {
  if (!fs.existsSync(directorio)) return [];

  return fs
    .readdirSync(directorio)
    .filter((fichero) => fichero.endsWith('.md'))
    .map((fichero) => leerEntrada(directorio, fichero))
    .filter(Boolean)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
};

module.exports = { leerEntradas, formatearFecha };
