const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { mensajeDeError } = require('../lib/mensajes-error');
const { ERRORES } = require('../lib/textos');

test('cada codigo conocido tiene su mensaje', () => {
  assert.equal(mensajeDeError('EMAIL_NO_VALIDO'), ERRORES.EMAIL_NO_VALIDO);
  assert.ok(mensajeDeError('MAZO_VACIO').length > 0);
});

// El fallo real que se quiere evitar: un codigo sin mensaje pintaba un recuadro vacio y el
// visitante se quedaba sin saber que habia pasado.
test('un codigo desconocido devuelve el mensaje generico, nunca vacio', () => {
  ['CODIGO_QUE_NO_EXISTE', '', null, undefined].forEach((codigo) => {
    const mensaje = mensajeDeError(codigo);
    assert.ok(typeof mensaje === 'string' && mensaje.length > 0, `codigo ${codigo} deja el aviso vacio`);
  });
});

// Si una validacion nueva devuelve un codigo y nadie le escribe el mensaje, el visitante ve
// el generico en lugar del texto que le corresponde.
test('todos los codigos que devuelven las librerias estan mapeados', () => {
  const fuentes = ['lib/lead.js', 'lib/manabox.js', 'lib/manabox-fetch.js', 'routes/main.js']
    .map((f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))
    .join('\n');

  const codigos = new Set([
    ...[...fuentes.matchAll(/error: '([A-Z_]+)'/g)].map(([, c]) => c),
    ...[...fuentes.matchAll(/fallo\('([A-Z_]+)'\)/g)].map(([, c]) => c),
    ...[...fuentes.matchAll(/errorCode: '([A-Z_]+)'/g)].map(([, c]) => c)
  ]);

  assert.ok(codigos.size > 0, 'no se ha encontrado ningun codigo en las fuentes');
  codigos.forEach((codigo) => {
    assert.ok(ERRORES[codigo], `el codigo ${codigo} no tiene mensaje`);
  });
});
