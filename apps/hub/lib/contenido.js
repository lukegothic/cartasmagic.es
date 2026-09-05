const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');

// html: false escapa cualquier etiqueta que venga en el markdown. Las entradas las
// genera un proceso automatizado, asi que el cuerpo se trata como texto, no como HTML
// de confianza.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

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
    html: md.render(content)
  };
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
