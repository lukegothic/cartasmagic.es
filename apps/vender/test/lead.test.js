const test = require('node:test');
const assert = require('node:assert/strict');
const { validarLead, validarLeadMazo } = require('../lib/lead');

const base = { nombre: 'Jordi', email: 'jordi@correo.com', volumen: '500-1000' };

test('un lead con lo minimo es valido: nombre, correo y volumen', () => {
  const { error, lead } = validarLead(base);
  assert.equal(error, undefined);
  assert.equal(lead.nombre, 'Jordi');
  assert.equal(lead.direccion, null);
});

// La direccion es lo que permite mandar la etiqueta en el primer correo, pero exigirla
// espantaria a quien todavia se lo esta pensando.
test('la direccion es opcional y no bloquea el envio', () => {
  assert.equal(validarLead(base).error, undefined);
  const { lead } = validarLead({ ...base, direccion: 'Gran Via 3, 28013 Madrid' });
  assert.match(lead.direccion.texto, /Gran Via/);
});

test('sin nombre no hay lead', () => {
  assert.equal(validarLead({ ...base, nombre: '  ' }).error, 'CAMPOS_OBLIGATORIOS');
});

test('un correo mal escrito se rechaza, que es la unica via de respuesta', () => {
  assert.equal(validarLead({ ...base, email: 'jordi-arroba-nada' }).error, 'EMAIL_NO_VALIDO');
});

test('el volumen tiene que ser una de las opciones del desplegable', () => {
  assert.equal(validarLead({ ...base, volumen: 'lo-que-sea' }).error, 'OPCION_NO_VALIDA');
});

// Ya no se preguntan: la provincia va dentro de la direccion y lo que tiene lo cuenta
// mejor el campo libre. Si vuelven a llegar por un formulario cacheado, se ignoran.
test('provincia y tipo ya no se piden ni se exigen', () => {
  assert.equal(validarLead({ ...base, provincia: '', tipo: '' }).error, undefined);
});

// Lo que se devuelve al formulario tras un error tiene que estar ya recortado: si no, la
// casilla se repuebla con un texto que el backend va a cortar de todas formas.
test('un lead rechazado devuelve los valores ya limpios para repintar el formulario', () => {
  const { error, valores } = validarLead({
    nombre: 'A'.repeat(500),
    email: '  malo  ',
    volumen: 'ni-idea',
    mensaje: 'B'.repeat(5000),
    direccion: '  Calle Mayor 1  '
  });

  assert.strictEqual(error, 'EMAIL_NO_VALIDO');
  assert.strictEqual(valores.nombre.length, 100);
  assert.strictEqual(valores.email, 'malo');
  assert.strictEqual(valores.mensaje.length, 2000);
  assert.strictEqual(valores.direccion, 'Calle Mayor 1');
  assert.strictEqual(valores.volumen, 'ni-idea');
});

test('un lead de mazo rechazado devuelve los valores ya limpios', () => {
  const { error, valores } = validarLeadMazo({
    nombre: 'A'.repeat(500),
    email: 'ana@correo.es',
    url: 'no-es-un-enlace'
  });

  assert.strictEqual(error, 'ENLACE_NO_VALIDO');
  assert.strictEqual(valores.nombre.length, 100);
  assert.strictEqual(valores.url, 'no-es-un-enlace');
});
