const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PIE } = require('../lib/textos');
const { enlaceVender, AVISO_LEGAL } = require('../lib/enlaces');

const layout = fs.readFileSync(path.join(__dirname, '../views/layout.ejs'), 'utf8');

// Mismo criterio que en vender: el NIF y el domicilio son obligatorios en el aviso legal,
// no en el pie de cada pagina. El hub ademas no tiene aviso legal propio, asi que lo suyo
// es enlazar al de vender en lugar de repetir aqui la identidad fiscal.
test('el pie no publica el NIF ni el domicilio', () => {
  assert.doesNotMatch(PIE.titular, /72808254Y/);
  assert.doesNotMatch(PIE.titular, /Iribarren/);
});

// Sin el enlace, quitar el NIF dejaria el hub sin ninguna via hacia la identidad fiscal.
test('el pie enlaza al aviso legal de vender', () => {
  assert.match(layout, /href="<%= avisoLegal %>"/);
  assert.ok(PIE.avisoLegal.length > 0);
});

// El enlace sale del helper, no escrito a mano: sin los parametros no se sabe cuanta gente
// llega al aviso legal desde el hub, y es la unica via que le queda al NIF.
test('el enlace del pie apunta al aviso legal con medicion', () => {
  const url = new URL(enlaceVender(AVISO_LEGAL, 'pie-legal'));

  assert.equal(url.origin + url.pathname, 'https://vendercartasmagic.es/aviso-legal');
  assert.equal(url.searchParams.get('utm_campaign'), 'pie-legal');
});
