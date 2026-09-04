const test = require('node:test');
const assert = require('node:assert/strict');
const { descargarMazo } = require('../lib/manabox-fetch');

const conFetch = async (impostor, ejecutar) => {
  const original = globalThis.fetch;
  globalThis.fetch = impostor;
  try { return await ejecutar(); } finally { globalThis.fetch = original; }
};

test('descargarMazo pide la url canónica construida a partir del id', async () => {
  const props = JSON.stringify({ deck: [0, { name: [0, 'Venta'], format: [0, 'Commander'], cards: [1, [[0, {
    name: [0, 'Sol Ring'], quantity: [0, 1], variant: [0, 'Normal'], setName: [0, 'C21'], rarity: [0, 'Uncommon'],
    pricing: [0, { cardmarket: [0, { value: [0, 1.5] }] }]
  }]]] }] }).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  let pedida;
  const mazo = await conFetch(async (url) => {
    pedida = url;
    return { ok: true, text: async () => `<astro-island props="${props}"></astro-island>` };
  }, () => descargarMazo('AZ7lfIfhflqh2vgQaCEtkg'));

  assert.equal(pedida, 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg');
  assert.equal(mazo.cartas[0].nombre, 'Sol Ring');
});

test('descargarMazo avisa si manabox no responde correctamente', async () => {
  await assert.rejects(
    conFetch(async () => ({ ok: false, status: 404 }), () => descargarMazo('ABC123')),
    { code: 'MAZO_NO_ACCESIBLE' }
  );
});

test('descargarMazo avisa si la red falla o se agota el tiempo', async () => {
  await assert.rejects(
    conFetch(async () => { throw new Error('timeout'); }, () => descargarMazo('ABC123')),
    { code: 'MAZO_NO_ACCESIBLE' }
  );
});
