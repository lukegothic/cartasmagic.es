const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');
const { eleccionVigente, serializarEleccion } = require('../public/consentimiento');

const layout = fs.readFileSync(path.join(__dirname, '../views/layout.ejs'), 'utf8');
const avisoLegal = fs.readFileSync(path.join(__dirname, '../views/aviso-legal.ejs'), 'utf8');

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

// Lo guardado en el navegador lo puede tocar cualquiera. Ante la duda se pregunta otra
// vez: suponer un consentimiento que no se dio es justo lo que no se puede hacer.
test('una eleccion ilegible no cuenta como consentimiento', () => {
  assert.equal(eleccionVigente('{roto', AHORA), null);
  assert.equal(eleccionVigente(JSON.stringify({ eleccion: 'si', fecha: AHORA }), AHORA), null);
  assert.equal(eleccionVigente(JSON.stringify({ eleccion: 'aceptar' }), AHORA), null);
});

// Una fecha futura no caducaria nunca.
test('una eleccion con fecha futura no cuenta', () => {
  assert.equal(eleccionVigente(serializarEleccion('aceptar', AHORA + DIA), AHORA), null);
});

test('el layout no carga Google Analytics por su cuenta', () => {
  assert.doesNotMatch(layout, /<script[^>]+googletagmanager\.com/);
  assert.match(layout, /<script src="\/consentimiento\.js" data-ga="G-6PJYPF57RF"/);
});

// La AEPD no admite que rechazar cueste mas que aceptar: mismo boton para los dos.
test('aceptar y rechazar se pintan iguales', () => {
  const botones = layout.match(/<button[^>]*data-consentimiento="(aceptar|rechazar)"[^>]*>/g);
  assert.equal(botones.length, 2);
  const clases = botones.map((boton) => boton.match(/class="([^"]+)"/)[1]);
  assert.equal(clases[0], clases[1]);
});

// El hub enlaza aqui desde su aviso, asi que esta seccion es la unica que lo explica.
test('el aviso legal explica el aviso de cookies en los dos dominios', () => {
  assert.match(avisoLegal, /id="cookies"/);
  assert.match(avisoLegal, /vendercartasmagic\.es y para cartasmagic\.es/);
  assert.match(avisoLegal, /12 meses/);
  assert.match(avisoLegal, /textos\.PIE\.cookies/);
});

const pintarLayout = (clarityId) =>
  ejs.render(layout, { ...meta.INDEX, ld_json: '{}', textos, body: '', clarityId }, { filename: path.join(__dirname, '../views/layout.ejs') });

// El ID de Clarity sale del entorno. Sin la variable no se pinta, y sin el no hay nada
// que cargar aunque el visitante acepte.
test('el layout pasa el proyecto de Clarity solo si existe la variable', () => {
  assert.match(pintarLayout('z5e32uoxej'), /<script src="\/consentimiento\.js" data-ga="G-6PJYPF57RF" data-clarity="z5e32uoxej"><\/script>/);
  assert.match(pintarLayout(undefined), /<script src="\/consentimiento\.js" data-ga="G-6PJYPF57RF"><\/script>/);
});

test('el aviso legal nombra Microsoft Clarity', () => {
  assert.match(avisoLegal, /Microsoft Clarity/);
});
