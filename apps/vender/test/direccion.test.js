const test = require('node:test');
const assert = require('node:assert/strict');
const { leerDireccion } = require('../lib/direccion');

test('sin escribir nada no hay direccion', () => {
  assert.equal(leerDireccion({}), null);
  assert.equal(leerDireccion({ direccion: '   ' }), null);
});

test('la direccion se recoge por si sola, sin casilla que la habilite', () => {
  const d = leerDireccion({ direccion: 'Calle Baron de Santa Barbara 17, puerta 4, 46110 Godella (Valencia)' });
  assert.match(d.texto, /Godella/);
  assert.equal(d.pareceIncompleta, false);
});

test('una direccion con codigo postal y numero se da por completa', () => {
  assert.equal(leerDireccion({ direccion: 'Gran Via 3, 4 izq, 28013 Madrid' }).pareceIncompleta, false);
});

test('se marca como dudosa la que se queda corta o no trae codigo postal', () => {
  assert.equal(leerDireccion({ direccion: 'Madrid' }).pareceIncompleta, true);
  assert.equal(leerDireccion({ direccion: 'Calle Mayor sin numero ni cp' }).pareceIncompleta, true);
});

test('la direccion se recorta, que es un campo abierto', () => {
  const largo = 'x'.repeat(500);
  assert.ok(leerDireccion({ direccion: largo }).texto.length <= 300);
});

test('se respetan los saltos de linea, que la gente escribe la direccion en varias lineas', () => {
  const d = leerDireccion({ direccion: 'Calle Mayor 1\n46110 Godella\nValencia' });
  assert.match(d.texto, /\n/);
});

// La localidad va al asunto del aviso, que es donde se decide si la etiqueta se manda ya.
test('se extrae la localidad de la linea del codigo postal', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1\n46110 Godella (Valencia)' }).localidad, 'Godella');
  assert.equal(leerDireccion({ direccion: 'Gran Via 3, 4 izq, 28013 Madrid' }).localidad, 'Madrid');
});

test('sin codigo postal no se inventa una localidad', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor sin numero' }).localidad, null);
});

// El codigo postal español empieza por el numero de provincia, del 01 al 52: sin ese tope,
// cualquier numero largo de un portal se colaba como codigo postal y arrastraba lo que venia
// detras hasta el asunto del aviso.
test('un numero largo que no es codigo postal no da localidad', () => {
  assert.equal(leerDireccion({ direccion: 'Avenida 28001 numero 5, 08015 Barcelona' }).localidad, 'Barcelona');
});

test('la localidad no se lleva por delante lo que venga despues', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1, 28001 Madrid España' }).localidad, 'Madrid');
  assert.equal(leerDireccion({ direccion: 'Calle Mayor 1, 28001 Madrid, España' }).localidad, 'Madrid');
});

test('una localidad de varias palabras se conserva entera', () => {
  assert.equal(leerDireccion({ direccion: 'Calle Real 2, 15300 Betanzos' }).localidad, 'Betanzos');
  assert.equal(leerDireccion({ direccion: 'Calle Real 2, 28801 Alcala de Henares' }).localidad, 'Alcala de Henares');
});
