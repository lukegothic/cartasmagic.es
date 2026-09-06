const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

const bloque = (selector) => {
  const i = css.indexOf(selector + ' {');
  assert.notEqual(i, -1, `falta la regla ${selector}`);
  return css.slice(i, css.indexOf('}', i));
};

// La tarjeta se aclaraba al pasar por encima pero solo respondia al titulo: el resto del
// bloque parecia pulsable y no lo era.
test('toda la tarjeta de una entrada lleva al articulo', () => {
  assert.match(bloque('.entrada'), /position:\s*relative/);

  const capa = bloque('.entrada h3 a::after');
  assert.match(capa, /content:\s*''/);
  assert.match(capa, /position:\s*absolute/);
  assert.match(capa, /inset:\s*0/);
});

// El area pulsable la pinta un pseudoelemento, que no recibe foco: sin marcar la tarjeta
// entera, quien navega con teclado no ve donde esta.
test('la tarjeta se marca cuando el enlace recibe el foco', () => {
  assert.ok(css.includes('.entrada:has(h3 a:focus-visible)'), 'falta el foco sobre la tarjeta');
});
