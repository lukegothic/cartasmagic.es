const test = require('node:test');
const assert = require('node:assert/strict');
const { crearLimitador } = require('../lib/limite');

test('deja pasar hasta el maximo de intentos', () => {
  const permitido = crearLimitador({ maximo: 3, ventanaMs: 60000 });
  assert.equal(permitido('1.1.1.1'), true);
  assert.equal(permitido('1.1.1.1'), true);
  assert.equal(permitido('1.1.1.1'), true);
  assert.equal(permitido('1.1.1.1'), false);
});

test('cada origen lleva su propia cuenta', () => {
  const permitido = crearLimitador({ maximo: 1, ventanaMs: 60000 });
  assert.equal(permitido('1.1.1.1'), true);
  assert.equal(permitido('2.2.2.2'), true);
  assert.equal(permitido('1.1.1.1'), false);
});

test('la cuenta se reinicia al pasar la ventana', () => {
  let ahora = 0;
  const permitido = crearLimitador({ maximo: 1, ventanaMs: 1000, reloj: () => ahora });
  assert.equal(permitido('1.1.1.1'), true);
  assert.equal(permitido('1.1.1.1'), false);
  ahora = 1001;
  assert.equal(permitido('1.1.1.1'), true);
});

test('no acumula origenes caducados en memoria', () => {
  let ahora = 0;
  const permitido = crearLimitador({ maximo: 1, ventanaMs: 1000, reloj: () => ahora, tamanoMaximo: 2 });
  permitido('1.1.1.1');
  permitido('2.2.2.2');
  ahora = 1001;
  permitido('3.3.3.3');
  assert.equal(permitido('1.1.1.1'), true, 'el origen caducado debe haberse olvidado');
});

test('un origen sin identificar no comparte cubo con los demas', () => {
  // Si Express esta expuesto directo, req.ip es el mismo valor para todos los visitantes.
  // Cayendo al cubo compartido, cinco envios dejarian la pagina bloqueada para todo el mundo.
  const permitido = crearLimitador({ maximo: 2, ventanaMs: 60000 });
  assert.equal(permitido(undefined), true);
  assert.equal(permitido(undefined), true);
  assert.equal(permitido(undefined), true, 'sin origen fiable no se puede limitar por origen');
});

test('el mismo mazo no se puede presupuestar en bucle', () => {
  const permitido = crearLimitador({ maximo: 2, ventanaMs: 60000 });
  assert.equal(permitido('mazo:ABC'), true);
  assert.equal(permitido('mazo:ABC'), true);
  assert.equal(permitido('mazo:ABC'), false);
  assert.equal(permitido('mazo:OTRO'), true, 'otro mazo lleva su propia cuenta');
});
