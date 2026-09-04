const test = require('node:test');
const assert = require('node:assert/strict');
const { leerDireccion } = require('../lib/direccion');

test('sin la casilla marcada no hay direccion, aunque venga texto', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1' }), null);
  assert.equal(leerDireccion({ decidido: '', direccion: 'Calle Mayor 1' }), null);
});

test('con la casilla marcada se recoge la direccion', () => {
  const d = leerDireccion({ decidido: 'on', direccion: 'Calle Baron de Santa Barbara 17, puerta 4, 46110 Godella (Valencia)' });
  assert.match(d.texto, /Godella/);
  assert.equal(d.pareceIncompleta, false);
});

test('una direccion con codigo postal y numero se da por completa', () => {
  assert.equal(leerDireccion({ decidido: 'on', direccion: 'Gran Via 3, 4 izq, 28013 Madrid' }).pareceIncompleta, false);
});

test('se marca como dudosa la que se queda corta o no trae codigo postal', () => {
  assert.equal(leerDireccion({ decidido: 'on', direccion: 'Madrid' }).pareceIncompleta, true);
  assert.equal(leerDireccion({ decidido: 'on', direccion: 'Calle Mayor sin numero ni cp' }).pareceIncompleta, true);
});

test('marcar la casilla sin escribir nada no cuenta como direccion', () => {
  assert.equal(leerDireccion({ decidido: 'on', direccion: '   ' }), null);
});

test('la direccion se recorta, que es un campo abierto', () => {
  const largo = 'x'.repeat(500);
  assert.ok(leerDireccion({ decidido: 'on', direccion: largo }).texto.length <= 300);
});

test('se respetan los saltos de linea, que la gente escribe la direccion en varias lineas', () => {
  const d = leerDireccion({ decidido: 'on', direccion: 'Calle Mayor 1\n46110 Godella\nValencia' });
  assert.match(d.texto, /\n/);
});
