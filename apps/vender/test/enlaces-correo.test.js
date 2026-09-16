const { test } = require('node:test');
const assert = require('node:assert');

const { enlaceCorreo } = require('../lib/enlaces-correo');

test('anade los parametros de medicion a un enlace del correo', () => {
  const url = new URL(enlaceCorreo('https://cartasmagic.es/blog/estado-de-la-carta-nm-ex-gd-lp', 'correo-manabox-estados'));

  assert.equal(url.origin + url.pathname, 'https://cartasmagic.es/blog/estado-de-la-carta-nm-ex-gd-lp');
  assert.equal(url.searchParams.get('utm_source'), 'correo');
  assert.equal(url.searchParams.get('utm_medium'), 'email');
  assert.equal(url.searchParams.get('utm_campaign'), 'correo-manabox-estados');
});

test('tambien mide el enlace de la firma, que va al propio dominio', () => {
  const url = new URL(enlaceCorreo('https://vendercartasmagic.es', 'correo-postal-firma'));

  assert.equal(url.origin + url.pathname, 'https://vendercartasmagic.es/');
  assert.equal(url.searchParams.get('utm_campaign'), 'correo-postal-firma');
});

// Sin campaña no se puede saber que correo trae la visita, que es justo lo que se mide.
test('exige una campana', () => {
  assert.throws(() => enlaceCorreo('https://cartasmagic.es/blog', ''), /campaña/);
  assert.throws(() => enlaceCorreo('https://cartasmagic.es/blog', 'Correo Postal'), /campaña/);
});

test('no duplica los parametros si la url ya traia alguno', () => {
  const url = new URL(enlaceCorreo('https://cartasmagic.es/blog?utm_source=viejo', 'correo-postal-firma'));

  assert.equal(url.searchParams.getAll('utm_source').length, 1);
  assert.equal(url.searchParams.get('utm_source'), 'correo');
});
