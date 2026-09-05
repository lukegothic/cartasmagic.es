const { test } = require('node:test');
const assert = require('node:assert');

const { enlaceVender, VENDER, VALORACION } = require('../lib/enlaces');

test('anade los parametros de medicion al enlace de valoracion', () => {
  const url = new URL(enlaceVender(VALORACION, 'home-cta'));

  assert.equal(url.origin + url.pathname, 'https://vendercartasmagic.es/valoracion-cartas-magic');
  assert.equal(url.searchParams.get('utm_source'), 'cartasmagic');
  assert.equal(url.searchParams.get('utm_medium'), 'hub');
  assert.equal(url.searchParams.get('utm_campaign'), 'home-cta');
});

test('permite enlazar a la portada de vender', () => {
  const url = new URL(enlaceVender(VENDER, 'blog-intro'));

  assert.equal(url.origin + url.pathname, 'https://vendercartasmagic.es/');
  assert.equal(url.searchParams.get('utm_campaign'), 'blog-intro');
});

// La campana identifica que pieza del hub trajo la visita: sin ella no se puede saber
// si convierte el articulo o la portada.
test('exige una campana', () => {
  assert.throws(() => enlaceVender(VALORACION, ''), /campaña/);
  assert.throws(() => enlaceVender(VALORACION), /campaña/);
});

test('rechaza campanas con caracteres que rompen la analitica', () => {
  assert.throws(() => enlaceVender(VALORACION, 'con espacios'), /campaña/);
  assert.throws(() => enlaceVender(VALORACION, 'MAYUSCULAS'), /campaña/);
});

test('no duplica parametros si la ruta ya trae query', () => {
  const url = new URL(enlaceVender('/valoracion-cartas-magic?ya=1', 'articulo-valor'));

  assert.equal(url.searchParams.get('ya'), '1');
  assert.equal(url.searchParams.get('utm_campaign'), 'articulo-valor');
  assert.equal(url.searchParams.getAll('utm_source').length, 1);
});
