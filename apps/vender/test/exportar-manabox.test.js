const test = require('node:test');
const assert = require('node:assert/strict');
const { componerManaboxCsv } = require('../lib/exportar-manabox');

const AHORA = new Date('2026-09-27T08:41:24.382Z');

const csv = (cartas) => componerManaboxCsv(cartas, AHORA);

const carta = (extra = {}) => ({
  nombre: 'Undead Warchief',
  cantidad: 1,
  esFoil: false,
  set: 'Scourge',
  rareza: 'Uncommon',
  precio: 5.59,
  codigoSet: 'scg',
  numero: '78',
  scryfallId: 'e6b3bcfe-be82-458b-ba59-ecb84436d747',
  ...extra
});

test('la cabecera es la que exporta manabox, para poder importarlo tal cual', () => {
  const [cabecera] = csv([carta()]).split('\r\n');
  assert.equal(cabecera, 'Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Signed,Condition,Language,Proxy,Purchase price currency,Added');
});

test('cada carta sale como la escribiria manabox, en near_mint e ingles', () => {
  const [, fila] = csv([carta({ cantidad: 3 })]).split('\r\n');
  assert.equal(fila, 'Undead Warchief,SCG,Scourge,78,normal,uncommon,3,,e6b3bcfe-be82-458b-ba59-ecb84436d747,5.59,false,false,false,near_mint,en,false,EUR,2026-09-27T08:41:24.382Z');
});

test('las foil se marcan como foil', () => {
  const [, fila] = csv([carta({ esFoil: true })]).split('\r\n');
  assert.match(fila, /,78,foil,/);
});

test('un nombre con coma va entre comillas', () => {
  const [, fila] = csv([carta({ nombre: 'Ertai, Wizard Adept', set: 'Exodus' })]).split('\r\n');
  assert.match(fila, /^"Ertai, Wizard Adept",SCG,Exodus,/);
});

test('un nombre que empieza por igual no se ejecuta al abrir la hoja', () => {
  const [, fila] = csv([carta({ nombre: '=HYPERLINK("x")' })]).split('\r\n');
  assert.match(fila, /^"'=HYPERLINK\(""x""\)",/);
});
