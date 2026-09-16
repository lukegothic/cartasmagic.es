const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { marcadorDeFoto, MARCA_DE_MARCADOR } = require('../lib/marcador-de-foto');

const PUBLICO = path.join(__dirname, '..', 'public');
const BLOG = path.join(PUBLICO, 'blog');
const PENDIENTES = path.join(__dirname, '..', '..', '..', 'docs', 'fotos-pendientes.md');

const PENDIENTE = /^- \[ \] `(\/blog\/[^`]+)`/gm;

const rutasPendientes = () => {
  const texto = fs.readFileSync(PENDIENTES, 'utf8');
  return [...texto.matchAll(PENDIENTE)].map((coincidencia) => coincidencia[1]);
};

const marcadoresEscritos = () =>
  fs
    .readdirSync(BLOG, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .flatMap((carpeta) =>
      fs
        .readdirSync(path.join(BLOG, carpeta.name))
        .filter((fichero) => fichero.endsWith('.pendiente.svg'))
        .map((fichero) => path.join(BLOG, carpeta.name, fichero))
        .filter((ruta) => fs.readFileSync(ruta, 'utf8').includes(MARCA_DE_MARCADOR))
    );

// El marcador se sirve como fichero igual que los graficos, asi que necesita sus medidas y
// su viewBox: sin ellos el navegador no reserva el sitio y la pagina da saltos al cargar.
test('el marcador declara viewBox y medidas', () => {
  const svg = marcadorDeFoto({ ruta: '/blog/x/y.jpg', descripcion: 'una carta de perfil' });

  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /width="\d+"/);
  assert.match(svg, /height="\d+"/);
});

// Quien no ve la pagina tambien tiene que enterarse de que ahi falta una foto, no creerse
// que hay una imagen que no le estan describiendo.
test('el marcador se anuncia como pendiente en su titulo accesible', () => {
  const svg = marcadorDeFoto({ ruta: '/blog/x/y.jpg', descripcion: 'una carta de perfil' });

  assert.match(svg, /role="img"/);
  assert.match(svg, /<title id="titulo">Foto pendiente: [^<]+<\/title>/);
});

// Un marcador sin descripcion es un rectangulo vacio: no dice que foto falta y no sirve
// para revisar la maqueta.
test('el marcador exige la ruta y la descripcion', () => {
  assert.throws(() => marcadorDeFoto({ ruta: '/blog/x/y.jpg' }), /descripcion/);
  assert.throws(() => marcadorDeFoto({ descripcion: 'algo' }), /ruta/);
});

// La descripcion larga se parte en lineas, y una linea que se sale del lienzo no se ve.
test('el marcador parte la descripcion sin cortar palabras', () => {
  const descripcion =
    'las cuatro cartas en fila, de mejor a peor de izquierda a derecha, vistas desde arriba';
  const svg = marcadorDeFoto({ ruta: '/blog/x/y.jpg', descripcion });

  const lineas = [...svg.matchAll(/font-size="17"[^>]*>([^<]+)</g)].map((c) => c[1]);

  assert.ok(lineas.length > 1);
  assert.equal(lineas.join(' '), descripcion);
});

// Cada marcador escrito tiene que seguir respaldado por una linea de la guia de rodaje. Si
// se hace la foto y se borra su linea, el marcador que queda en disco es basura que acabaria
// publicada en lugar de la foto nueva.
test('no queda ningun marcador de una foto que ya no esta pendiente', () => {
  const esperados = new Set(
    rutasPendientes().map((ruta) => ruta.replace(/\.jpg$/, '.pendiente.svg'))
  );

  const sobran = marcadoresEscritos()
    .map((ruta) => `/${path.relative(PUBLICO, ruta).split(path.sep).join('/')}`)
    .filter((ruta) => !esperados.has(ruta));

  assert.deepEqual(sobran, []);
});

// Esta es la red de seguridad de todo el montaje. Lo que deja los marcadores fuera de
// produccion es la regla de .dockerignore, y la regla solo acierta mientras el nombre del
// fichero acabe como ella espera. Si alguien cambia el sufijo en el script y no toca la
// regla, los marcadores se publican sin que falle nada mas.
test('la regla de .dockerignore cubre el sufijo con el que se escriben los marcadores', () => {
  const reglas = fs.readFileSync(path.join(__dirname, '..', '.dockerignore'), 'utf8');

  assert.match(reglas, /^\*\*\/\*\.pendiente\.svg$/m);

  for (const ruta of marcadoresEscritos()) {
    assert.ok(
      ruta.endsWith('.pendiente.svg'),
      `${path.relative(PUBLICO, ruta)} no lleva el sufijo que .dockerignore deja fuera`
    );
  }
});

// Los graficos comparten carpeta con los marcadores y si la regla los cogiera tambien, la
// pagina publicada se quedaria sin ellos y nadie se enteraria hasta verla.
test('la regla no se lleva por delante los graficos de los articulos', () => {
  const graficos = fs
    .readdirSync(BLOG, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .flatMap((carpeta) =>
      fs
        .readdirSync(path.join(BLOG, carpeta.name))
        .filter((fichero) => fichero.endsWith('.svg') && !fichero.endsWith('.pendiente.svg'))
    );

  assert.ok(graficos.length > 0);
});
