const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// GA4 llego a contar 14 generate_lead sobre 10 intento_envio: el POST pintaba la vista con
// el lead confirmado, y recargar o ir atras y adelante volvia a disparar el evento y podia
// repetir el envio, que es un correo mas al negocio. El POST redirige a una pagina de
// confirmacion que solo pinta el lead una vez.
const sustituir = (relativa, exports) => {
  const ruta = require.resolve(relativa);
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

const arrancar = async () => {
  const correos = [];
  sustituir('../lib/mailer', { enviarAviso: async (correo) => { correos.push(correo); } });
  sustituir('../lib/manabox-fetch', { descargarMazo: async () => ({ nombre: 'Mazo', cartas: [] }) });

  delete require.cache[require.resolve('../routes/main')];
  const express = require('express');
  const expressLayouts = require('express-ejs-layouts');

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.use(express.urlencoded({ extended: false }));
  require('../routes/main')(app);

  const servidor = app.listen(0);
  await new Promise((listo) => servidor.once('listening', listo));

  return {
    correos,
    url: `http://127.0.0.1:${servidor.address().port}`,
    cerrar: () => new Promise((listo) => servidor.close(listo))
  };
};

const FORMULARIOS = [
  {
    ruta: '/valoracion-cartas-magic',
    datos: { nombre: 'Iván Pérez', email: 'ivan@correo.com', volumen: 'menos-500' },
    invalidos: { nombre: 'Iván Pérez', email: 'no-es-un-correo', volumen: 'menos-500' }
  },
  {
    ruta: '/presupuesto-manabox',
    datos: { nombre: 'Ana Ruiz', email: 'ana@correo.com', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' },
    invalidos: { nombre: 'Ana Ruiz', email: 'no-es-un-correo', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' }
  }
];

const enviar = (url, ruta, datos) =>
  fetch(`${url}${ruta}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(datos),
    redirect: 'manual'
  });

// fetch no guarda cookies: se devuelve a mano lo que el POST dejo, como haria el navegador.
const cookieDe = (respuesta) => respuesta.headers.get('set-cookie').split(';')[0];

const visitar = (url, ruta, cookie) =>
  fetch(`${url}${ruta}`, { headers: cookie ? { cookie } : {}, redirect: 'manual' });

FORMULARIOS.forEach(({ ruta, datos, invalidos }) => {
  test(`${ruta} responde al envio correcto con un 303 a la confirmacion`, async (t) => {
    const { url, correos, cerrar } = await arrancar();
    t.after(cerrar);

    const respuesta = await enviar(url, ruta, datos);

    assert.equal(respuesta.status, 303);
    assert.equal(respuesta.headers.get('location'), `${ruta}/recibido`);
    assert.equal(correos.length, 1);
  });

  test(`${ruta}/recibido apunta el lead una sola vez`, async (t) => {
    const { url, cerrar } = await arrancar();
    t.after(cerrar);

    const cookie = cookieDe(await enviar(url, ruta, datos));

    const primera = await visitar(url, `${ruta}/recibido`, cookie);
    assert.equal(primera.status, 200);
    const html = await primera.text();
    assert.match(html, /'generate_lead'/);
    assert.ok(!/evento\('ver_formulario'\)/.test(html), 'la confirmacion no es una visita al formulario');

    // El navegador sigue mandando la cookie si no se borra: la confirmacion tiene que
    // pedir al navegador que la olvide, y la recarga, aunque la traiga, no repite el lead.
    assert.match(primera.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  });

  test(`${ruta}/recibido sin envio previo vuelve al formulario`, async (t) => {
    const { url, cerrar } = await arrancar();
    t.after(cerrar);

    const respuesta = await visitar(url, `${ruta}/recibido`);

    assert.ok([302, 303].includes(respuesta.status), `respondio ${respuesta.status}`);
    assert.equal(respuesta.headers.get('location'), ruta);
  });

  test(`${ruta}/recibido no se indexa`, async (t) => {
    const { url, cerrar } = await arrancar();
    t.after(cerrar);

    const cookie = cookieDe(await enviar(url, ruta, datos));
    const html = await (await visitar(url, `${ruta}/recibido`, cookie)).text();

    assert.match(html, /<meta name="robots" content="noindex/);
  });

  test(`${ruta} sigue pintando el error en la respuesta al POST`, async (t) => {
    const { url, cerrar } = await arrancar();
    t.after(cerrar);

    const respuesta = await enviar(url, ruta, invalidos);

    assert.equal(respuesta.status, 400);
    assert.equal(respuesta.headers.get('set-cookie'), null);
    assert.ok(!/'generate_lead'/.test(await respuesta.text()));
  });
});

test('las confirmaciones no estan en el sitemap', () => {
  const sitemap = fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /recibido/);
});
