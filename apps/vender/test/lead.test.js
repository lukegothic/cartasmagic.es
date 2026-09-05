const test = require('node:test');
const assert = require('node:assert/strict');
const { validarLead } = require('../lib/lead');

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
