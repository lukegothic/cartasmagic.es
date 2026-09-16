// Los enlaces de los correos son los unicos del proyecto que se leen fuera del navegador,
// asi que sin parametros de medicion la visita que traen llega como trafico directo. Estos
// tests estan para que un cambio de prosa no se lleve por delante la medicion sin avisar.
const test = require('node:test');
const assert = require('node:assert/strict');
const { componerCorreoMazo } = require('../lib/correo-manabox');
const { componerCorreoPostal } = require('../lib/correo-postal');

const mazo = {
  lead: { nombre: 'Pepe', email: 'pepe@correo.com', url: 'https://manabox.app/decks/AZ7', idMazo: 'AZ7', mensaje: '' },
  mazo: { nombre: 'Venta', formato: 'Commander' },
  cartas: [{ nombre: 'Sol Ring', cantidad: 1, esFoil: false, set: 'C21', rareza: 'Uncommon', precio: 1.5 }]
};

const postal = { nombre: 'Ana', email: 'ana@correo.com', mensaje: '', volumen: { corto: '1 caja', largo: 'una caja' } };

const enlaces = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => new URL(m[1]));

test('todos los enlaces del correo de manabox van medidos', () => {
  const urls = enlaces(componerCorreoMazo(mazo).html);

  assert.ok(urls.length >= 3);
  for (const url of urls) {
    assert.equal(url.searchParams.get('utm_source'), 'correo');
    assert.equal(url.searchParams.get('utm_medium'), 'email');
    assert.match(url.searchParams.get('utm_campaign') ?? '', /^correo-manabox-/);
  }
});

test('cada enlace de manabox lleva su propia campana', () => {
  const campanas = enlaces(componerCorreoMazo(mazo).html).map((u) => u.searchParams.get('utm_campaign'));

  assert.deepEqual(new Set(campanas), new Set(['correo-manabox-estados', 'correo-manabox-valor', 'correo-manabox-firma']));
});

test('la firma del correo postal va medida y no se confunde con la de manabox', () => {
  const urls = enlaces(componerCorreoPostal(postal).html);

  assert.equal(urls.length, 1);
  assert.equal(urls[0].searchParams.get('utm_campaign'), 'correo-postal-firma');
});

// La version de texto plano imprime las urls enteras, asi que tambien tienen que medirse:
// mucha gente lee el correo ahi y el enlace que copia es ese.
test('los enlaces del texto plano de manabox tambien van medidos', () => {
  const { text } = componerCorreoMazo(mazo);

  assert.match(text, /utm_campaign=correo-manabox-estados/);
  assert.match(text, /utm_campaign=correo-manabox-valor/);
});
