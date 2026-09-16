const test = require('node:test');
const assert = require('node:assert/strict');
const { comprobarAcceso } = require('../lib/acceso-privado');

const cabecera = (usuario, clave) => `Basic ${Buffer.from(`${usuario}:${clave}`).toString('base64')}`;

test('comprobarAcceso acepta la clave configurada sea cual sea el usuario', () => {
  assert.equal(comprobarAcceso(cabecera('lo-que-sea', 'secreta'), 'secreta'), true);
  assert.equal(comprobarAcceso(cabecera('', 'secreta'), 'secreta'), true);
});

test('comprobarAcceso rechaza una clave diferente', () => {
  assert.equal(comprobarAcceso(cabecera('admin', 'otra'), 'secreta'), false);
});

test('comprobarAcceso rechaza una clave con el prefijo correcto pero mas larga', () => {
  assert.equal(comprobarAcceso(cabecera('admin', 'secretaXL'), 'secreta'), false);
});

test('comprobarAcceso rechaza si no hay cabecera o no es Basic', () => {
  assert.equal(comprobarAcceso(undefined, 'secreta'), false);
  assert.equal(comprobarAcceso('', 'secreta'), false);
  assert.equal(comprobarAcceso('Bearer secreta', 'secreta'), false);
  assert.equal(comprobarAcceso('Basic no-es-base64-valido!!', 'secreta'), false);
});

test('comprobarAcceso rechaza siempre si no hay clave configurada', () => {
  assert.equal(comprobarAcceso(cabecera('admin', ''), ''), false);
  assert.equal(comprobarAcceso(cabecera('admin', 'loquesea'), undefined), false);
});

test('la clave puede llevar dos puntos, que solo separan el primer campo', () => {
  assert.equal(comprobarAcceso(cabecera('admin', 'a:b:c'), 'a:b:c'), true);
});
