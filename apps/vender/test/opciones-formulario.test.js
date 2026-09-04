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
  const tipos = valoresDe('tipo');
  const volumenes = valoresDe('volumen');
  assert.ok(tipos.length >= 4 && volumenes.length >= 4);

  tipos.forEach((tipo) => {
    volumenes.forEach((volumen) => {
      const { error } = validarLead({ nombre: 'X', email: 'x@y.es', provincia: 'P', tipo, volumen });
      assert.equal(error, undefined, `el validador rechaza tipo=${tipo} volumen=${volumen}`);
    });
  });
});
