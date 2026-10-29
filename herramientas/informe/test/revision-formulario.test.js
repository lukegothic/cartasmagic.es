const test = require('node:test');
const assert = require('node:assert');
const { bloqueRevision } = require('../lib/revision-formulario');

// The 6-week review in #11 judges the forms deployed on 2026-10-29. The report is the only
// scheduled job with GA4 credentials, so it carries the numbers the review needs.
const lunes = (fecha) => new Date(`${fecha}T08:00:00Z`);

const fila = (claves, veces) => ({ claves, valores: [veces] });

// Answers by event and date range, and records every query.
const ga4Falso = (respuestas = {}) => {
  const pedidos = [];
  const pedir = async (_auth, _propiedad, consulta) => {
    pedidos.push(consulta);
    return respuestas[`${consulta.evento}:${consulta.desde}:${consulta.hasta}`] || [];
  };
  return { pedir, pedidos };
};

test('the block does not appear before 2026-12-14', async () => {
  const { pedir, pedidos } = ga4Falso();
  assert.equal(await bloqueRevision(null, '1', lunes('2026-12-07'), pedir), null);
  assert.equal(pedidos.length, 0);
});

test('the block appears from 2026-12-14 to 2026-12-31', async () => {
  const { pedir } = ga4Falso();
  assert.match(await bloqueRevision(null, '1', lunes('2026-12-14'), pedir), /Revision de 6 semanas/);
  assert.match(await bloqueRevision(null, '1', lunes('2026-12-28'), pedir), /Revision de 6 semanas/);
});

test('the block stops appearing after 2026-12-31', async () => {
  const { pedir } = ga4Falso();
  assert.equal(await bloqueRevision(null, '1', lunes('2027-01-04'), pedir), null);
});

test('without a GA4 property there is no block', async () => {
  assert.equal(await bloqueRevision(null, undefined, lunes('2026-12-14'), async () => []), null);
});

test('the weeks after the deploy show lead_confirmado by form', async () => {
  const { pedir } = ga4Falso({
    'lead_confirmado:2026-10-30:2026-11-05': [fila(['lead_confirmado', 'valoracion'], 2), fila(['lead_confirmado', 'manabox'], 1)],
    'lead_confirmado:2026-12-04:2026-12-10': [fila(['lead_confirmado', 'manabox'], 4)]
  });

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /2026-10-30 a 2026-11-05: 3 \(valoracion 2, manabox 1\)/);
  assert.match(texto, /2026-12-04 a 2026-12-10: 4 \(valoracion 0, manabox 4\)/);
});

test('the weeks before the deploy show generate_lead from vender only', async () => {
  const { pedir, pedidos } = ga4Falso({
    'generate_lead:2026-10-15:2026-10-21': [fila(['generate_lead'], 2)]
  });

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /2026-10-15 a 2026-10-21: 2/);
  for (const pedido of pedidos.filter(({ evento }) => evento === 'generate_lead')) {
    assert.equal(pedido.dominio, 'vendercartasmagic.es');
  }
});

// The site was down on 2026-10-23. Counting that day would make the week before the
// deploy look worse than it was.
test('the outage day is left out of the week before the deploy', async () => {
  const { pedir, pedidos } = ga4Falso({
    'generate_lead:2026-10-22:2026-10-22': [fila(['generate_lead'], 1)],
    'generate_lead:2026-10-24:2026-10-28': [fila(['generate_lead'], 2)]
  });

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /2026-10-22 a 2026-10-28: 3 .*sin el 2026-10-23/);
  assert.ok(!pedidos.some(({ desde, hasta }) => desde <= '2026-10-23' && hasta >= '2026-10-23'));
});

// generate_lead fired twice per lead until the fix of 2026-10-08, so those weeks are not
// comparable with the ones after.
test('weeks with the generate_lead double count are flagged', async () => {
  const { pedir } = ga4Falso();

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /2026-10-08 a 2026-10-14: 0 .*doble conteo/);
  assert.doesNotMatch(texto, /2026-10-15 a 2026-10-21: 0 .*doble conteo/);
});

test('the block states that the two sources are not the same', async () => {
  const { pedir } = ga4Falso();

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /generate_lead/);
  assert.match(texto, /lead_confirmado/);
  assert.match(texto, /aviso de cookies/);
});

test('abandonments are counted by form and last field', async () => {
  const { pedir, pedidos } = ga4Falso({
    'abandonar_formulario:2026-10-30:2026-12-10': [
      fila(['/valoracion-cartas-magic', 'email'], 3),
      fila(['/presupuesto-manabox', 'url'], 1),
      fila(['/valoracion-cartas-magic', 'codigoPostal'], 5)
    ]
  });

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /valoracion\s+codigoPostal\s+5/);
  assert.match(texto, /valoracion\s+email\s+3/);
  assert.match(texto, /manabox\s+url\s+1/);
  const abandonos = pedidos.find(({ evento }) => evento === 'abandonar_formulario');
  assert.deepEqual(abandonos.dimensiones, ['pagePath', 'customEvent:ultimo_campo']);
});

test('a failed query explains itself instead of breaking the report', async () => {
  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), async () => {
    throw new Error('Field customEvent:ultimo_campo is not a valid dimension');
  });

  assert.match(texto, /Revision de 6 semanas/);
  assert.match(texto, /customEvent:ultimo_campo is not a valid dimension/);
});

// The before average uses every clean day: the outage week still counts its other six
// days, and only the double-counted weeks are left out.
test('the before average counts the clean days of the outage week', async () => {
  const { pedir } = ga4Falso({
    'generate_lead:2026-10-15:2026-10-21': [fila(['generate_lead'], 1)],
    'generate_lead:2026-10-22:2026-10-22': [fila(['generate_lead'], 1)],
    'generate_lead:2026-10-24:2026-10-28': [fila(['generate_lead'], 1)],
    'generate_lead:2026-09-17:2026-09-23': [fila(['generate_lead'], 40)]
  });

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  // 3 leads in 13 clean days is 1.6 a week.
  assert.match(texto, /Media por semana: antes 1,6/);
});

test('a failed abandonment query keeps the lead numbers', async () => {
  const pedir = async (_auth, _propiedad, { evento }) => {
    if (evento === 'abandonar_formulario') throw new Error('Field customEvent:ultimo_campo is not a valid dimension');
    return [];
  };

  const texto = await bloqueRevision(null, '1', lunes('2026-12-14'), pedir);

  assert.match(texto, /Leads por semana despues/);
  assert.match(texto, /customEvent:ultimo_campo is not a valid dimension/);
});
