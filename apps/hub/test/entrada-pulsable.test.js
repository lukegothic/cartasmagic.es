const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Normalizado para que un selector de varias lineas se busque igual venga el fichero con
// CRLF o con LF, que es lo unico que cambia de una maquina a otra.
const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8').replace(/\r\n/g, '\n');

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

// El resumen se sube por encima de la capa para poder seleccionarlo, y al subirlo se queda
// tambien por delante para el raton: se tragaba el clic en casi toda la tarjeta, que es
// justo donde se pulsa. En la portada se nota mas que en el indice, porque alli la tarjeta
// no lleva fecha y el resumen ocupa todo lo que hay debajo del titulo.
test('el resumen deja pasar el clic a la capa que lleva al articulo', () => {
  const texto = bloque('.entrada p,\n.entrada time');

  assert.match(texto, /position:\s*relative/);
  assert.match(texto, /pointer-events:\s*none/);
});

// Con pointer-events en none el texto tampoco se puede arrastrar para copiarlo, asi que hay
// que devolverselo: lo que sobra es que intercepte el clic, no que se pueda seleccionar.
test('el resumen se sigue pudiendo seleccionar', () => {
  assert.match(bloque('.entrada p::selection,\n.entrada time::selection'), /pointer-events:\s*auto/);
});
