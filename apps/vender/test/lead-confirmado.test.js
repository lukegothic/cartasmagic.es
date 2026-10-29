const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { componerLeadConfirmado, rangoDeCartas } = require('../lib/lead-confirmado');
const { enviarEventoGa4 } = require('../lib/ga4-servidor');

// lead_confirmado es la fuente de verdad de leads por semana: lo manda el servidor, asi
// que no depende del aviso de cookies ni de los bloqueadores. Por eso mismo no puede
// llevar nada que identifique a la persona.
test('el evento lleva formulario, rango de cartas y provincia, y nada mas', () => {
  const cuerpo = componerLeadConfirmado({
    formulario: 'valoracion',
    rangoCartas: 'menos-500',
    codigoPostal: { codigo: '31001', localidad: 'Pamplona' },
    clientId: 'id-aleatorio'
  });

  assert.deepEqual(cuerpo, {
    client_id: 'id-aleatorio',
    events: [{
      name: 'lead_confirmado',
      params: { formulario: 'valoracion', rango_cartas: 'menos-500', provincia: 'Navarra' }
    }]
  });
});

test('la provincia sale de los dos primeros digitos del codigo postal', () => {
  const provincia = (codigo) => componerLeadConfirmado({
    formulario: 'manabox', rangoCartas: 'ni-idea', codigoPostal: { codigo, localidad: null }, clientId: 'x'
  }).events[0].params.provincia;

  assert.equal(provincia('01001'), 'Álava');
  assert.equal(provincia('28013'), 'Madrid');
  assert.equal(provincia('52001'), 'Melilla');
});

// El mazo de ManaBox no pasa por el desplegable de volumen: su rango se saca de las cartas
// que trae, con los mismos cortes para que los dos formularios se lean igual.
test('el rango de un mazo usa los mismos cortes que el desplegable de volumen', () => {
  assert.equal(rangoDeCartas(0), 'menos-500');
  assert.equal(rangoDeCartas(499), 'menos-500');
  assert.equal(rangoDeCartas(500), '500-1000');
  assert.equal(rangoDeCartas(1000), '500-1000');
  assert.equal(rangoDeCartas(1001), 'mas-1000');
});

const ENTORNO = { GA4_MEASUREMENT_ID: 'G-PRUEBA', GA4_API_SECRET: 'secreto' };

test('manda el evento al Measurement Protocol de GA4', async () => {
  const peticiones = [];
  const pedir = async (url, opciones) => { peticiones.push({ url, opciones }); return { ok: true }; };

  await enviarEventoGa4({ client_id: 'x', events: [] }, { entorno: ENTORNO, pedir });

  assert.equal(peticiones.length, 1);
  const url = new URL(peticiones[0].url);
  assert.equal(url.origin + url.pathname, 'https://www.google-analytics.com/mp/collect');
  assert.equal(url.searchParams.get('measurement_id'), 'G-PRUEBA');
  assert.equal(url.searchParams.get('api_secret'), 'secreto');
  assert.equal(peticiones[0].opciones.method, 'POST');
  assert.deepEqual(JSON.parse(peticiones[0].opciones.body), { client_id: 'x', events: [] });
});

test('sin las variables de entorno no manda nada', async () => {
  let llamadas = 0;
  const pedir = async () => { llamadas += 1; return { ok: true }; };

  await enviarEventoGa4({ client_id: 'x', events: [] }, { entorno: { GA4_MEASUREMENT_ID: 'G-PRUEBA' }, pedir });
  await enviarEventoGa4({ client_id: 'x', events: [] }, { entorno: { GA4_API_SECRET: 'secreto' }, pedir });

  assert.equal(llamadas, 0);
});

// El lead ya esta dentro y el correo ya ha salido: que GA4 falle no puede cambiar nada de
// lo que ve el visitante, solo dejar rastro en el log.
test('un fallo de GA4 se apunta en el log y no se propaga', async (t) => {
  const errores = t.mock.method(console, 'error', () => {});

  await enviarEventoGa4({ client_id: 'x', events: [] }, {
    entorno: ENTORNO,
    pedir: async () => { throw new Error('sin red'); }
  });
  await enviarEventoGa4({ client_id: 'x', events: [] }, {
    entorno: ENTORNO,
    pedir: async () => ({ ok: false, status: 500 })
  });

  assert.equal(errores.mock.callCount(), 2);
  assert.doesNotMatch(errores.mock.calls.map((c) => c.arguments.join(' ')).join('\n'), /secreto/);
});

// Rutas: el evento sale solo cuando el lead se acepta y el correo se ha mandado.
const stubModule = (relativePath, exports) => {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

const arrancar = async ({ enviarEvento }) => {
  stubModule('../lib/mailer', { enviarAviso: async () => {} });
  stubModule('../lib/manabox-fetch', {
    descargarMazo: async () => ({ nombre: 'Mazo', cartas: [{ nombre: 'Isla', cantidad: 600, precio: 0 }] })
  });
  stubModule('../lib/ga4-servidor', { enviarEventoGa4: enviarEvento });

  delete require.cache[require.resolve('../routes/main')];
  const express = require('express');
  const expressLayouts = require('express-ejs-layouts');

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.use(express.urlencoded({ extended: false }));
  require('../routes/main')(app);

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    cerrar: () => new Promise((resolve) => server.close(resolve))
  };
};

const enviar = (url, ruta, campos) =>
  fetch(`${url}${ruta}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos),
    redirect: 'manual'
  });

const FORMULARIOS = [
  {
    ruta: '/valoracion-cartas-magic',
    valido: { nombre: 'Iván Pérez', email: 'ivan@correo.com', codigoPostal: '28001', volumen: '500-1000' },
    invalido: { nombre: 'Iván Pérez', email: 'no-es-un-correo', codigoPostal: '28001', volumen: '500-1000' },
    params: { formulario: 'valoracion', rango_cartas: '500-1000', provincia: 'Madrid' }
  },
  {
    ruta: '/presupuesto-manabox',
    valido: { nombre: 'Ana Ruiz', email: 'ana@correo.com', codigoPostal: '31001', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' },
    invalido: { nombre: 'Ana Ruiz', email: 'ana@correo.com', codigoPostal: '31001', url: 'https://otra.web/mazo' },
    params: { formulario: 'manabox', rango_cartas: '500-1000', provincia: 'Navarra' }
  }
];

FORMULARIOS.forEach(({ ruta, valido, invalido, params }) => {
  test(`${ruta} manda un lead_confirmado al aceptar el lead`, async (t) => {
    const eventos = [];
    const { url, cerrar } = await arrancar({ enviarEvento: async (cuerpo) => { eventos.push(cuerpo); } });
    t.after(cerrar);

    const respuesta = await enviar(url, ruta, valido);

    assert.equal(respuesta.status, 303);
    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].events.length, 1);
    assert.equal(eventos[0].events[0].name, 'lead_confirmado');
    assert.deepEqual(eventos[0].events[0].params, params);
    assert.ok(eventos[0].client_id);
  });

  test(`${ruta} no manda nada si el envio se rechaza`, async (t) => {
    const eventos = [];
    const { url, cerrar } = await arrancar({ enviarEvento: async (cuerpo) => { eventos.push(cuerpo); } });
    t.after(cerrar);

    const respuesta = await enviar(url, ruta, invalido);

    assert.equal(respuesta.status, 400);
    assert.equal(eventos.length, 0);
  });

  // Si la respuesta esperase a GA4, un GA4 lento haria esperar al visitante.
  test(`${ruta} contesta sin esperar a GA4`, async (t) => {
    const { url, cerrar } = await arrancar({ enviarEvento: () => new Promise(() => {}) });
    t.after(cerrar);

    const respuesta = await enviar(url, ruta, valido);

    assert.equal(respuesta.status, 303);
  });
});

test('cada lead lleva un client_id distinto', async (t) => {
  const eventos = [];
  const { url, cerrar } = await arrancar({ enviarEvento: async (cuerpo) => { eventos.push(cuerpo); } });
  t.after(cerrar);

  await enviar(url, FORMULARIOS[0].ruta, FORMULARIOS[0].valido);
  await enviar(url, FORMULARIOS[0].ruta, { ...FORMULARIOS[0].valido, email: 'otra@correo.com' });

  assert.equal(eventos.length, 2);
  assert.notEqual(eventos[0].client_id, eventos[1].client_id);
});
