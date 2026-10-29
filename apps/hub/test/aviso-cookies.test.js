const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { eleccionVigente, serializarEleccion } = require('../public/consentimiento');

const layout = fs.readFileSync(path.join(__dirname, '../views/layout.ejs'), 'utf8');

const AHORA = Date.UTC(2026, 9, 29);
const DIA = 24 * 60 * 60 * 1000;

test('sin eleccion guardada el aviso pregunta', () => {
  assert.equal(eleccionVigente(null, AHORA), null);
});

test('la eleccion guardada vale mientras no pasen 12 meses', () => {
  assert.equal(eleccionVigente(serializarEleccion('aceptar', AHORA - 364 * DIA), AHORA), 'aceptar');
  assert.equal(eleccionVigente(serializarEleccion('rechazar', AHORA), AHORA), 'rechazar');
});

test('pasados 12 meses el aviso vuelve a preguntar', () => {
  assert.equal(eleccionVigente(serializarEleccion('aceptar', AHORA - 366 * DIA), AHORA), null);
});

test('una eleccion ilegible no cuenta como consentimiento', () => {
  assert.equal(eleccionVigente('{roto', AHORA), null);
  assert.equal(eleccionVigente(JSON.stringify({ eleccion: 'si', fecha: AHORA }), AHORA), null);
  assert.equal(eleccionVigente(JSON.stringify({ eleccion: 'aceptar' }), AHORA), null);
});

test('una eleccion con fecha futura no cuenta', () => {
  assert.equal(eleccionVigente(serializarEleccion('aceptar', AHORA + DIA), AHORA), null);
});

test('el layout no carga Google Analytics por su cuenta', () => {
  assert.doesNotMatch(layout, /<script[^>]+googletagmanager\.com/);
  assert.match(layout, /<script src="\/consentimiento\.js" data-ga="G-F2JK45VQS3"><\/script>/);
});

// La AEPD no admite que rechazar cueste mas que aceptar: mismo boton para los dos.
test('aceptar y rechazar se pintan iguales', () => {
  const botones = layout.match(/<button[^>]*data-consentimiento="(aceptar|rechazar)"[^>]*>/g);
  assert.equal(botones.length, 2);
  const clases = botones.map((boton) => boton.match(/class="([^"]+)"/)[1]);
  assert.equal(clases[0], clases[1]);
});
