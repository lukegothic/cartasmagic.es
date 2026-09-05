const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validarLead } = require('../lib/lead');

const vista = fs.readFileSync(path.join(__dirname, '../views/valoracion-cartas-magic.ejs'), 'utf8');

const valoresDe = (campo) => {
  const bloque = vista.slice(vista.indexOf(`name="${campo}"`));
  return [...bloque.slice(0, bloque.indexOf('</select>')).matchAll(/value="([^"]+)"/g)].map(([, v]) => v);
};

// Si el desplegable y el validador dejan de coincidir, el formulario rechaza envios buenos
// sin que se note hasta que alguien se queja.
test('todas las opciones del desplegable las acepta el validador', () => {
  const volumenes = valoresDe('volumen');
  assert.ok(volumenes.length >= 4);

  volumenes.forEach((volumen) => {
    const { error } = validarLead({ nombre: 'X', email: 'x@y.es', volumen });
    assert.equal(error, undefined, `el validador rechaza volumen=${volumen}`);
  });
});

// La direccion es el campo que ahorra un correo de ida y vuelta: si desaparece de la vista
// por un descuido, el flujo vuelve a costar dos correos sin que falle nada.
test('el formulario sigue ofreciendo el campo de direccion', () => {
  assert.match(vista + fs.readFileSync(path.join(__dirname, '../views/partials/atajo-envio.ejs'), 'utf8'), /name="direccion"/);
});

// Pedir de mas es lo que hacia abandonar el formulario a medias.
test('no se piden campos que no cambian ni el precio ni la etiqueta', () => {
  assert.doesNotMatch(vista, /name="provincia"/);
  assert.doesNotMatch(vista, /name="tipo"/);
});
