const test = require('node:test');
const assert = require('node:assert/strict');
const { leerDireccion } = require('../lib/direccion');

const GODELLA = { codigo: '46110', localidad: 'Godella' };

test('sin escribir nada no hay direccion', () => {
  assert.equal(leerDireccion({}, GODELLA), null);
  assert.equal(leerDireccion({ direccion: '   ' }, GODELLA), null);
});

test('la direccion se recoge por si sola, sin casilla que la habilite', () => {
  const d = leerDireccion({ direccion: 'Calle Baron de Santa Barbara 17, puerta 4' }, GODELLA);
  assert.match(d.texto, /Santa Barbara/);
  assert.equal(d.pareceIncompleta, false);
});

// El codigo postal va en su propio campo, pero la etiqueta se genera copiando la direccion
// entera de las notas.
test('la direccion se completa con la linea del codigo postal', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1' }, GODELLA).texto, 'Calle Mayor 1\n46110 Godella');
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1' }, { codigo: '46110', localidad: null }).texto, 'Calle Mayor 1\n46110');
});

// Hay quien escribe la direccion entera por costumbre, con el codigo postal incluido.
test('no se repite el codigo postal si ya va escrito en la direccion', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1, 46110 Godella' }, GODELLA).texto, 'Calle Mayor 1, 46110 Godella');
});

test('una direccion con numero se da por completa', () => {
  assert.equal(leerDireccion({ direccion: 'Gran Via 3, 4 izq' }, GODELLA).pareceIncompleta, false);
  assert.equal(leerDireccion({ direccion: 'Plaza Mayor s/n' }, GODELLA).pareceIncompleta, false);
});

test('se marca como dudosa la que no trae numero', () => {
  assert.equal(leerDireccion({ direccion: 'Madrid' }, GODELLA).pareceIncompleta, true);
  assert.equal(leerDireccion({ direccion: 'Calle Mayor sin numero' }, GODELLA).pareceIncompleta, true);
});

test('el codigo postal escrito en la direccion no la da por completa', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor, 46110 Godella' }, GODELLA).pareceIncompleta, true);
});

// Si el codigo escrito en la direccion no es el del campo, la etiqueta llevaria dos codigos
// distintos y no se sabe cual es el bueno.
test('se avisa cuando la direccion trae otro codigo postal', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1, 28002 Madrid' }, GODELLA).tieneOtroCodigoPostal, true);
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1, 46110 Godella' }, GODELLA).tieneOtroCodigoPostal, false);
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1' }, GODELLA).tieneOtroCodigoPostal, false);
});

test('la direccion se recorta, que es un campo abierto', () => {
  const largo = 'x'.repeat(500);
  assert.ok(leerDireccion({ direccion: largo }, GODELLA).texto.length <= 300 + '\n46110 Godella'.length);
});

test('se respetan los saltos de linea, que la gente escribe la direccion en varias lineas', () => {
  const d = leerDireccion({ direccion: 'Calle Mayor 1\nPiso 3' }, GODELLA);
  assert.equal(d.texto, 'Calle Mayor 1\nPiso 3\n46110 Godella');
});
