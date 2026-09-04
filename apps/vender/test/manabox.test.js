const test = require('node:test');
const assert = require('node:assert/strict');
const { extraerIdMazo, parsearMazo } = require('../lib/manabox');

test('extraerIdMazo acepta la url canónica', () => {
  assert.equal(
    extraerIdMazo('https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg'),
    'AZ7lfIfhflqh2vgQaCEtkg'
  );
});

test('extraerIdMazo tolera www, barra final y parámetros', () => {
  assert.equal(extraerIdMazo('https://www.manabox.app/decks/ABC123def456/?utm_source=x'), 'ABC123def456');
  assert.equal(extraerIdMazo('  https://manabox.app/decks/ABC123def456  '), 'ABC123def456');
});

test('extraerIdMazo rechaza lo que no es un mazo de manabox', () => {
  assert.equal(extraerIdMazo('https://moxfield.com/decks/ABC123def456'), null);
  assert.equal(extraerIdMazo('https://manabox.app/decks/'), null);
  assert.equal(extraerIdMazo('no soy una url'), null);
  assert.equal(extraerIdMazo(''), null);
  assert.equal(extraerIdMazo(undefined), null);
});

test('extraerIdMazo no acepta un dominio que solo termina en manabox.app', () => {
  assert.equal(extraerIdMazo('https://evil-manabox.app/decks/ABC123def456'), null);
});

const htmlConProps = (deck) => {
  const escapar = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<html><body><astro-island props="${escapar(JSON.stringify({ deck }))}"></astro-island></body></html>`;
};

const carta = (extra = {}) => ({
  name: [0, 'Rhystic Study'],
  quantity: [0, 1],
  variant: [0, 'Normal'],
  setName: [0, 'Prophecy'],
  rarity: [0, 'Common'],
  pricing: [0, { cardmarket: [0, { value: [0, 34.38] }] }],
  ...extra
});

const mazo = (cartas) => [0, {
  name: [0, 'Venta'],
  format: [0, 'Commander'],
  cards: [1, cartas.map((c) => [0, c])]
}];

test('parsearMazo devuelve el nombre y las cartas con su precio de cardmarket', () => {
  const resultado = parsearMazo(htmlConProps(mazo([carta()])));

  assert.equal(resultado.nombre, 'Venta');
  assert.equal(resultado.formato, 'Commander');
  assert.deepEqual(resultado.cartas, [
    { nombre: 'Rhystic Study', cantidad: 1, esFoil: false, set: 'Prophecy', rareza: 'Common', precio: 34.38 }
  ]);
});

test('parsearMazo marca las foil y respeta la cantidad', () => {
  const { cartas } = parsearMazo(htmlConProps(mazo([
    carta({ variant: [0, 'Foil'], quantity: [0, 4] })
  ])));

  assert.equal(cartas[0].esFoil, true);
  assert.equal(cartas[0].cantidad, 4);
});

test('parsearMazo da precio cero a la carta sin precio de cardmarket', () => {
  const { cartas } = parsearMazo(htmlConProps(mazo([carta({ pricing: [0, {}] })])));
  assert.equal(cartas[0].precio, 0);
});

test('parsearMazo desescapa las entidades html del nombre', () => {
  const { cartas } = parsearMazo(htmlConProps(mazo([carta({ name: [0, 'Ach! Hans, Run! & "Fun"'] })])));
  assert.equal(cartas[0].nombre, 'Ach! Hans, Run! & "Fun"');
});

test('parsearMazo falla si el html no trae un mazo', () => {
  assert.throws(() => parsearMazo('<html><body>nada</body></html>'), { code: 'MAZO_NO_LEIBLE' });
  assert.throws(() => parsearMazo(htmlConProps([0, { name: [0, 'Venta'], cards: [1, []] }])), { code: 'MAZO_VACIO' });
});

test('parsearMazo limpia las entidades que manabox deja doblemente escapadas', () => {
  // ManaBox escapa el apóstrofo dentro del propio JSON, así que sobrevive al primer desescapado.
  const html = `<html><astro-island props="${JSON.stringify({
    deck: [0, { name: [0, 'Venta'], cards: [1, [[0, {
      name: [0, 'Smuggler&#39;s Surprise'],
      quantity: [0, 1], variant: [0, 'Normal'], setName: [0, 'OTJ'], rarity: [0, 'Rare'],
      pricing: [0, { cardmarket: [0, { value: [0, 4.72] }] }]
    }]]] }]
  }).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></astro-island></html>`;

  assert.equal(parsearMazo(html).cartas[0].nombre, "Smuggler's Surprise");
});
