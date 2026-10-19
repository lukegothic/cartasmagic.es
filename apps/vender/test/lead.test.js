const test = require('node:test');
const assert = require('node:assert/strict');
const { validarLead, validarLeadMazo } = require('../lib/lead');

const baseMazo = { nombre: 'Ana', email: 'ana@correo.es', codigoPostal: '28001', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' };
const base = { nombre: 'Jordi', email: 'jordi@correo.com', codigoPostal: '46110 Godella', volumen: '500-1000' };

test('un lead con lo minimo es valido: nombre, correo, codigo postal y volumen', () => {
  const { error, lead } = validarLead(base);
  assert.equal(error, undefined);
  assert.equal(lead.nombre, 'Jordi');
  assert.equal(lead.direccion, null);
});

// La direccion es lo que permite mandar la etiqueta en el primer correo, pero exigirla
// espantaria a quien todavia se lo esta pensando.
test('la direccion es opcional y no bloquea el envio', () => {
  assert.equal(validarLead(base).error, undefined);
  const { lead } = validarLead({ ...base, direccion: 'Gran Via 3' });
  assert.match(lead.direccion.texto, /Gran Via/);
});

// Sin codigo postal no se sabe ni de donde sale el paquete. Es lo minimo para valorar el
// envio aunque todavia no se de la direccion entera.
test('el codigo postal es obligatorio', () => {
  assert.equal(validarLead({ ...base, codigoPostal: '  ' }).error, 'CAMPOS_OBLIGATORIOS');
  assert.equal(validarLeadMazo({ ...baseMazo, codigoPostal: undefined }).error, 'CAMPOS_OBLIGATORIOS');
});

test('un codigo postal que no es español se rechaza', () => {
  assert.equal(validarLead({ ...base, codigoPostal: 'Godella' }).error, 'CODIGO_POSTAL_NO_VALIDO');
  assert.equal(validarLeadMazo({ ...baseMazo, codigoPostal: '99001' }).error, 'CODIGO_POSTAL_NO_VALIDO');
});

test('el lead lleva el codigo postal y su localidad', () => {
  assert.deepEqual(validarLead(base).lead.codigoPostal, { codigo: '46110', localidad: 'Godella' });
  assert.deepEqual(validarLeadMazo(baseMazo).lead.codigoPostal, { codigo: '28001', localidad: 'Madrid' });
});

// La etiqueta se genera copiando la direccion de las notas: sin la linea del codigo postal
// saldria incompleta.
test('la direccion se completa con el codigo postal del campo propio', () => {
  const { lead } = validarLead({ ...base, direccion: 'Calle Mayor 1' });
  assert.equal(lead.direccion.texto, 'Calle Mayor 1\n46110 Godella');
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
    codigoPostal: '  46110 Godella  ',
    direccion: '  Calle Mayor 1  '
  });

  assert.strictEqual(error, 'EMAIL_NO_VALIDO');
  assert.strictEqual(valores.nombre.length, 100);
  assert.strictEqual(valores.email, 'malo');
  assert.strictEqual(valores.mensaje.length, 2000);
  assert.strictEqual(valores.direccion, 'Calle Mayor 1');
  assert.strictEqual(valores.codigoPostal, '46110 Godella');
  assert.strictEqual(valores.volumen, 'ni-idea');
});

test('un lead de mazo rechazado devuelve los valores ya limpios', () => {
  const { error, valores } = validarLeadMazo({
    nombre: 'A'.repeat(500),
    email: 'ana@correo.es',
    codigoPostal: '28001',
    url: 'no-es-un-enlace'
  });

  assert.strictEqual(error, 'ENLACE_NO_VALIDO');
  assert.strictEqual(valores.nombre.length, 100);
  assert.strictEqual(valores.url, 'no-es-un-enlace');
  assert.strictEqual(valores.codigoPostal, '28001');
});
