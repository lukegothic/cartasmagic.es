const test = require('node:test');
const assert = require('node:assert/strict');

const { porClave, comparar } = require('../lib/cambios');
const { componerMarkdown } = require('../lib/markdown');

const anuncio = (nombre, precio, fuente = 'crypt') => ({
  fuente, nombre, edicion: 'Revised', estado: 'Near Mint', precio, moneda: 'CAD', url: 'https://tienda/x'
});

const SIN_CAMBIOS = { nuevas: [], retiradas: [], movidas: [] };

test('distingue nueva de movida de retirada', () => {
  const ayer = porClave([anuncio('Tundra', 100), anuncio('Bayou', 50)]);
  const hoy = porClave([anuncio('Tundra', 130), anuncio('Mox Diamond', 400)]);

  const { nuevas, retiradas, movidas } = comparar(hoy, ayer);

  assert.deepEqual(nuevas.map(({ nombre }) => nombre), ['Mox Diamond']);
  assert.deepEqual(retiradas.map(({ nombre }) => nombre), ['Bayou']);
  assert.equal(movidas.length, 1);
  assert.equal(movidas[0].anuncio.nombre, 'Tundra');
  assert.equal(movidas[0].antes, 100);
  assert.equal(movidas[0].diferencia, 30);
});

// Un cambio de centimos es redondeo o tipo de cambio, y llenaria el informe de ruido.
test('el redondeo no cuenta como cambio', () => {
  const ayer = porClave([anuncio('Tundra', 100.0)]);
  const hoy = porClave([anuncio('Tundra', 100.02)]);

  assert.deepEqual(comparar(hoy, ayer).movidas, []);
});

// El primer dia no hay con que comparar: todo es nuevo y nada se ha retirado.
test('el primer dia todo es nuevo y nada se ha retirado', () => {
  const cambios = comparar(porClave([anuncio('Tundra', 100)]), {});

  assert.equal(cambios.nuevas.length, 1);
  assert.deepEqual(cambios.retiradas, []);
});

// La misma carta en dos tiendas son dos ofertas, no una repetida.
test('la misma carta en dos tiendas no se pisa', () => {
  const hoy = porClave([anuncio('Tundra', 100, 'crypt'), anuncio('Tundra', 90, 'cardmonster')]);

  assert.equal(Object.keys(hoy).length, 2);
});

test('el informe avisa de que los precios de fuera no son para copiarlos', () => {
  assert.match(componerMarkdown(SIN_CAMBIOS, 0, []), /no para copiarlos/);
});

// Callarlo haria leer su ausencia como que esa tienda no busca nada.
test('una fuente caida sale en el informe', () => {
  assert.match(componerMarkdown(SIN_CAMBIOS, 3, ['crypt: HTTP 503']), /crypt: HTTP 503/);
});

// La hotlist de SCG sigue sin leerse: si el informe no lo dijera, parecerian dos fuentes.
test('el informe recuerda que Star City Games sigue pendiente', () => {
  assert.match(componerMarkdown(SIN_CAMBIOS, 0, []), /Star City Games/);
});

test('las cifras del informe van en formato castellano', () => {
  const cambios = { nuevas: [anuncio('Black Lotus', 15000)], retiradas: [], movidas: [] };

  assert.match(componerMarkdown(cambios, 1, []), /15\.000,00 CAD/);
});

// El contenedor de Dokploy trae otros datos de ICU que Windows: con toLocaleDateString salia
// 8/9/2026 en el servidor y 08/09/2026 aqui, para el mismo dia.
test('la fecha se escribe igual corra donde corra', () => {
  const cabecera = componerMarkdown(SIN_CAMBIOS, 0, [], new Date('2026-09-08')).split('\n')[0];

  assert.match(cabecera, /08\/09\/2026/);
});
