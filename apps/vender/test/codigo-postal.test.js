const test = require('node:test');
const assert = require('node:assert/strict');
const { leerCodigoPostal, buscarCodigosPostales } = require('../lib/codigo-postal');

test('sin nada escrito no hay codigo postal', () => {
  assert.equal(leerCodigoPostal(''), null);
  assert.equal(leerCodigoPostal('   '), null);
  assert.equal(leerCodigoPostal(undefined), null);
});

test('se rechaza lo que no puede ser un codigo postal español', () => {
  assert.equal(leerCodigoPostal('Madrid'), null);
  assert.equal(leerCodigoPostal('2800'), null);
  assert.equal(leerCodigoPostal('99001'), null);
  assert.equal(leerCodigoPostal('00001'), null);
  assert.equal(leerCodigoPostal('280011'), null);
});

test('un codigo suelto toma la localidad del listado', () => {
  assert.deepEqual(leerCodigoPostal('28001'), { codigo: '28001', localidad: 'Madrid' });
});

// El 46110 es de Godella y de Campo Olivar: elegir una a ciegas pondria en el asunto un
// pueblo que quiza no es el del cliente.
test('un codigo de varias localidades no se queda con una al azar', () => {
  assert.deepEqual(leerCodigoPostal('46110'), { codigo: '46110', localidad: null });
});

test('la localidad elegida entre las del codigo se respeta', () => {
  assert.deepEqual(leerCodigoPostal('46110 Godella'), { codigo: '46110', localidad: 'Godella' });
  assert.deepEqual(leerCodigoPostal('  46110 - Godella  '), { codigo: '46110', localidad: 'Godella' });
});

// La localidad acaba en la etiqueta de Correos, asi que se escribe como la trae el listado.
test('la localidad tecleada se reconoce sin tildes ni mayusculas', () => {
  assert.deepEqual(leerCodigoPostal('46110 godella'), { codigo: '46110', localidad: 'Godella' });
  assert.deepEqual(leerCodigoPostal('28801 alcalá de henares'), { codigo: '28801', localidad: 'Alcala De Henares' });
});

// Una localidad que no es del codigo acabaria en la etiqueta con el codigo de otro sitio.
test('una localidad que no corresponde al codigo no se acepta como tal', () => {
  assert.deepEqual(leerCodigoPostal('28001 Barcelona'), { codigo: '28001', localidad: 'Madrid' });
  assert.deepEqual(leerCodigoPostal('46110 Valencia'), { codigo: '46110', localidad: null });
});

// Sin el codigo en el listado no hay con que comparar: lo que escribio el cliente es lo unico.
test('la localidad de un codigo que no esta en el listado se respeta', () => {
  assert.deepEqual(leerCodigoPostal('52999 Melilla'), { codigo: '52999', localidad: 'Melilla' });
});

// El listado no tiene por que estar al dia: rechazar un codigo nuevo dejaria a ese cliente
// sin poder enviar el formulario.
test('un codigo con forma valida que no esta en el listado se acepta igual', () => {
  assert.deepEqual(leerCodigoPostal('52999'), { codigo: '52999', localidad: null });
});

test('se buscan los codigos que empiezan por lo tecleado', () => {
  const encontrados = buscarCodigosPostales('2800');
  assert.ok(encontrados.length > 0);
  assert.ok(encontrados.length <= 20);
  encontrados.forEach((s) => assert.match(s, /^2800\d /));
  assert.ok(encontrados.includes('28001 Madrid'));
});

test('se busca tambien por localidad, sin distinguir tildes ni mayusculas', () => {
  assert.ok(buscarCodigosPostales('godella').includes('46110 Godella'));
  assert.ok(buscarCodigosPostales('ALCALÁ DE').some((s) => s.startsWith('28801 ')));
});

test('se encuentra una localidad por cualquiera de sus palabras', () => {
  assert.ok(buscarCodigosPostales('henares').some((s) => s.startsWith('28801 ')));
});

test('con menos de dos caracteres no se busca nada', () => {
  assert.deepEqual(buscarCodigosPostales('2'), []);
  assert.deepEqual(buscarCodigosPostales(''), []);
  assert.deepEqual(buscarCodigosPostales(undefined), []);
});

// El desplegable del formulario se rellena con lo que devuelve esta ruta.
test('la ruta de sugerencias devuelve los codigos en json', async (t) => {
  const resuelto = require.resolve('../lib/mailer');
  require.cache[resuelto] = { id: resuelto, filename: resuelto, loaded: true, exports: { enviarAviso: async () => {} } };
  const express = require('express');
  const app = express();
  require('../routes/main')(app);
  const servidor = app.listen(0);
  t.after(() => servidor.close());
  await new Promise((resolve) => servidor.once('listening', resolve));
  const base = `http://127.0.0.1:${servidor.address().port}/codigos-postales`;

  const respuesta = await fetch(`${base}?q=godella`);
  assert.equal(respuesta.status, 200);
  assert.ok((await respuesta.json()).includes('46110 Godella'));
  assert.deepEqual(await (await fetch(base)).json(), []);
});
