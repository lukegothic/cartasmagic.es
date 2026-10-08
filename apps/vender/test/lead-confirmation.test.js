const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// GA4 once counted 14 generate_lead over 10 intento_envio: the POST rendered the view with
// the confirmed lead, so reloading or going back and forward fired the event again and could
// resubmit the form, which is one more email to the business. The POST now redirects to a
// confirmation page that records the lead only once.
const stubModule = (relativePath, exports) => {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

const startApp = async () => {
  const emails = [];
  stubModule('../lib/mailer', { enviarAviso: async (email) => { emails.push(email); } });
  stubModule('../lib/manabox-fetch', { descargarMazo: async () => ({ nombre: 'Mazo', cartas: [] }) });

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
    emails,
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const FORMS = [
  {
    route: '/valoracion-cartas-magic',
    valid: { nombre: 'Iván Pérez', email: 'ivan@correo.com', volumen: 'menos-500' },
    invalid: { nombre: 'Iván Pérez', email: 'no-es-un-correo', volumen: 'menos-500' }
  },
  {
    route: '/presupuesto-manabox',
    valid: { nombre: 'Ana Ruiz', email: 'ana@correo.com', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' },
    invalid: { nombre: 'Ana Ruiz', email: 'no-es-un-correo', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' }
  }
];

const submit = (url, route, fields) =>
  fetch(`${url}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    redirect: 'manual'
  });

// fetch does not keep cookies: send back by hand what the POST set, as a browser would.
const cookieFrom = (response) => response.headers.get('set-cookie').split(';')[0];

const visit = (url, route, cookie) =>
  fetch(`${url}${route}`, { headers: cookie ? { cookie } : {}, redirect: 'manual' });

FORMS.forEach(({ route, valid, invalid }) => {
  test(`${route} answers a valid submission with a 303 to the confirmation`, async (t) => {
    const { url, emails, close } = await startApp();
    t.after(close);

    const response = await submit(url, route, valid);

    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), `${route}/recibido`);
    assert.equal(emails.length, 1);
  });

  test(`${route}/recibido records the lead only once`, async (t) => {
    const { url, close } = await startApp();
    t.after(close);

    const cookie = cookieFrom(await submit(url, route, valid));

    const first = await visit(url, `${route}/recibido`, cookie);
    assert.equal(first.status, 200);
    const html = await first.text();
    assert.match(html, /'generate_lead'/);
    assert.ok(!/evento\('ver_formulario'\)/.test(html), 'the confirmation is not a form view');

    // The browser keeps sending the cookie unless told to drop it, so the confirmation has
    // to expire it and a reload, even one that still carries it, does not repeat the lead.
    assert.match(first.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  });

  // A browser that blocks the cookie, or a reload after it was spent, must still see the
  // confirmation: sending it back to the form invites a second submission.
  test(`${route}/recibido without the marker shows the confirmation without recording a lead`, async (t) => {
    const { url, close } = await startApp();
    t.after(close);

    const response = await visit(url, `${route}/recibido`);

    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /class="form-feedback" role="status"/);
    assert.ok(!/'generate_lead'/.test(html), 'no lead without a fresh submission');
    assert.ok(!/evento\('ver_formulario'\)/.test(html), 'the confirmation is not a form view');
    assert.match(html, /<meta name="robots" content="noindex/);
  });

  test(`${route}/recibido is not indexed`, async (t) => {
    const { url, close } = await startApp();
    t.after(close);

    const cookie = cookieFrom(await submit(url, route, valid));
    const html = await (await visit(url, `${route}/recibido`, cookie)).text();

    assert.match(html, /<meta name="robots" content="noindex/);
  });

  test(`${route} still renders the error in the POST response`, async (t) => {
    const { url, close } = await startApp();
    t.after(close);

    const response = await submit(url, route, invalid);

    assert.equal(response.status, 400);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.ok(!/'generate_lead'/.test(await response.text()));
  });
});

test('confirmation pages are not in the sitemap', () => {
  const sitemap = fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /recibido/);
});
