const test = require('node:test');
const assert = require('node:assert/strict');
const { componerCorreo } = require('../lib/lead');

const base = {
  nombre: 'Jordi', email: 'jordi@correo.com', provincia: 'Valencia',
  tipo: 'mazos-albumes', volumen: '500-1200', mensaje: 'varios mazos de Commander'
};

test('el asunto identifica al cliente y su provincia', () => {
  const c = componerCorreo(base);
  assert.match(c.subject, /Jordi/);
  assert.match(c.subject, /Valencia/);
});

test('el correo va listo para reenviar: replyTo al cliente y cuerpo html', () => {
  const c = componerCorreo(base);
  assert.equal(c.replyTo, 'jordi@correo.com');
  assert.match(c.html, /<html/i);
  assert.match(c.html, /Hola Jordi/);
});

test('explica el proceso y pide la direccion, que es lo que bloquea la etiqueta', () => {
  const { html } = componerCorreo(base);
  assert.match(html, /direcci[oó]n/i);
  assert.match(html, /devoluci[oó]n/i);
});

test('lleva los limites del paquete, para que no se pase de peso', () => {
  const { html } = componerCorreo(base);
  assert.match(html, /2\s*kg/i);
  assert.match(html, /30 x 20 x 20/);
});

test('deja claro que la devolucion la paga quien rechaza', () => {
  const { html } = componerCorreo(base);
  assert.match(html, /11,90|coste/i);
});

test('lo que dijo el cliente va en las notas internas, no en el cuerpo', () => {
  const { html } = componerCorreo(base);
  const marca = html.indexOf('id="notas-internas"');
  assert.ok(marca > 0);
  assert.ok(html.indexOf('varios mazos de Commander') > marca);
  assert.ok(html.indexOf('Mazos montados') > marca, 'el desplegable es informacion para ti');
});

test('sigue habiendo texto plano con lo esencial', () => {
  const c = componerCorreo(base);
  assert.match(c.text, /Jordi/);
  assert.match(c.text, /direcci/i);
});

test('sin mensaje del cliente no se rompe', () => {
  const { html } = componerCorreo({ ...base, mensaje: '' });
  assert.match(html, /Hola Jordi/);
});
