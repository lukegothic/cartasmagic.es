const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const CONTENIDO = path.join(__dirname, '..', 'content');
const PUBLICO = path.join(__dirname, '..', 'public');
const PENDIENTES = path.join(__dirname, '..', '..', '..', 'docs', 'fotos-pendientes.md');

const IMAGEN = /!\[[^\]]*\]\((\/blog\/[^)\s]+)\)/g;

// Las fotos que aun no estan hechas se dan de alta en la lista de la guia de rodaje.
// Cualquier ruta que falte sin estar en esa lista es una errata, no un hueco.
//
// Solo cuentan las lineas de tarea, no cualquier ruta que aparezca en el documento: una
// ruta citada de pasada en un parrafo daria por buena una foto que en realidad falta.
const PENDIENTE = /^- \[ \] `(\/blog\/[^`]+)`/gm;

const rutasPendientes = () => {
  if (!fs.existsSync(PENDIENTES)) return new Set();
  const texto = fs.readFileSync(PENDIENTES, 'utf8');
  return new Set([...texto.matchAll(PENDIENTE)].map((coincidencia) => coincidencia[1]));
};

const imagenesDeLosArticulos = () =>
  fs
    .readdirSync(CONTENIDO)
    .filter((fichero) => fichero.endsWith('.md'))
    .flatMap((fichero) => {
      const texto = fs.readFileSync(path.join(CONTENIDO, fichero), 'utf8');
      return [...texto.matchAll(IMAGEN)].map((coincidencia) => ({
        fichero,
        ruta: coincidencia[1]
      }));
    });

// Una ruta mal escrita deja un hueco roto en la pagina y no la ve nadie hasta que un
// lector se la encuentra. El unico modo de que no llegue a produccion es comprobarla.
test('cada foto referenciada en un articulo existe o esta dada de alta como pendiente', () => {
  const pendientes = rutasPendientes();

  const rotas = imagenesDeLosArticulos()
    .filter(({ ruta }) => !fs.existsSync(path.join(PUBLICO, ruta)))
    .filter(({ ruta }) => !pendientes.has(ruta));

  assert.deepEqual(
    rotas.map(({ fichero, ruta }) => `${fichero}: ${ruta}`),
    []
  );
});

// El texto alternativo es lo unico que lee quien navega con un lector de pantalla, y
// tambien lo que Google usa para entender la foto. Un alt vacio desaprovecha las dos.
test('ninguna foto se queda sin texto alternativo', () => {
  const sinAlt = fs
    .readdirSync(CONTENIDO)
    .filter((fichero) => fichero.endsWith('.md'))
    .flatMap((fichero) => {
      const texto = fs.readFileSync(path.join(CONTENIDO, fichero), 'utf8');
      return [...texto.matchAll(/!\[([^\]]*)\]\((\/blog\/[^)\s]+)\)/g)]
        .filter((coincidencia) => coincidencia[1].trim() === '')
        .map((coincidencia) => `${fichero}: ${coincidencia[2]}`);
    });

  assert.deepEqual(sinAlt, []);
});

// Las fotos pendientes solo pueden estar en la lista mientras sigan referenciadas por
// un articulo. Una entrada que sobra es una foto que alguien va a hacer para nada.
//
// Mientras la foto no existe, el articulo no enlaza el JPEG que la lista anota sino el
// marcador que ocupa su sitio, que es el mismo nombre acabado en .pendiente.svg. Cuentan
// los dos:
// lo que se comprueba es que alguien sigue pidiendo esa foto, no con que extension.
test('la lista de pendientes no arrastra fotos que ya no pide ningun articulo', () => {
  const referenciadas = new Set(imagenesDeLosArticulos().map(({ ruta }) => ruta));

  const sobran = [...rutasPendientes()].filter(
    (ruta) =>
      !referenciadas.has(ruta) && !referenciadas.has(ruta.replace(/\.jpg$/, '.pendiente.svg'))
  );

  assert.deepEqual(sobran, []);
});

// Una foto metida entre dos puntos de una lista numerada la parte en dos: markdown cierra
// la lista al llegar a la imagen y los puntos siguientes salen como texto suelto, con su
// numero a la vista. Se ve en la pagina, pero no en el markdown.
test('ninguna foto parte una lista numerada por la mitad', () => {
  const { leerEntradas } = require('../lib/contenido');

  const rotas = leerEntradas(CONTENIDO)
    .filter(({ html }) => /<p[^>]*>[^<]*\n\d+\.\s/.test(html))
    .map(({ slug }) => slug);

  assert.deepEqual(rotas, []);
});
