const test = require('node:test');
const assert = require('node:assert');
const { EMBUDO, alarmasDeEmbudo, bloqueLeads } = require('../lib/informe');

// lead_confirmado is sent by the vender server, so it counts visitors who rejected cookies.
// Every client-side funnel step only counts those who accepted, so as a funnel step it would
// raise the "more events than the previous step" alarm every single day.
test('lead_confirmado is not a funnel step', () => {
  assert.ok(!EMBUDO.some(({ evento }) => evento === 'lead_confirmado'));
});

test('lead_confirmado never raises a Measurement alarm', async () => {
  const eventos = async (_auth, _propiedad, { dimensiones = [] }) =>
    dimensiones[0] === 'eventName'
      ? [
          ['ver_formulario', 100], ['empezar_formulario', 50], ['intento_envio', 30],
          ['generate_lead', 30], ['lead_confirmado', 90]
        ].map(([evento, veces]) => ({ claves: [evento, '/valoracion-cartas-magic'], valores: [veces] }))
      : [];

  const alarmas = await alarmasDeEmbudo(
    null, [{ dominio: 'vendercartasmagic.es', ga4: '1' }], { desde: '2026-10-01', hasta: '2026-10-12' }, eventos
  );

  assert.deepEqual(alarmas, []);
});

// Monday 2026-11-02: this week is Monday 26 to Sunday 1, the previous one the week before.
const LUNES = new Date('2026-11-02T08:00:00Z');

const leadsPorSemana = (porRango) => {
  const pedidos = [];
  const pedir = async (_auth, propiedad, consulta) => {
    pedidos.push({ propiedad, ...consulta });
    return porRango[consulta.desde] || [];
  };
  return { pedir, pedidos };
};

const fila = (evento, formulario, veces) => ({ claves: [evento, formulario], valores: [veces] });

test('the leads line shows this week and last week by form', async () => {
  const { pedir } = leadsPorSemana({
    '2026-10-26': [fila('lead_confirmado', 'valoracion', 3), fila('lead_confirmado', 'manabox', 1), fila('page_view', '(not set)', 400)],
    '2026-10-19': [fila('lead_confirmado', 'valoracion', 2)]
  });

  const texto = await bloqueLeads(null, '1', LUNES, pedir);

  assert.match(texto, /2026-10-26 a 2026-11-01: 4 \(valoracion 3, manabox 1\)/);
  assert.match(texto, /2026-10-19 a 2026-10-25: 2 \(valoracion 2, manabox 0\)/);
});

// The event goes through the Measurement Protocol, which carries no hostName, so filtering
// by domain like the rest of the report would drop every single one.
test('the leads query is not filtered by domain', async () => {
  const { pedir, pedidos } = leadsPorSemana({});

  await bloqueLeads(null, '1', LUNES, pedir);

  assert.equal(pedidos.length, 2);
  for (const pedido of pedidos) {
    assert.equal(pedido.dominio, undefined);
    assert.deepEqual(pedido.dimensiones, ['eventName', 'customEvent:formulario']);
  }
});

// The property holds every event of both domains: without filtering by name, the row
// limit could cut lead_confirmado off without any warning.
test('the leads query asks GA4 for lead_confirmado only', async () => {
  const { pedir, pedidos } = leadsPorSemana({});

  await bloqueLeads(null, '1', LUNES, pedir);

  for (const pedido of pedidos) assert.equal(pedido.evento, 'lead_confirmado');
});

// Custom dimensions are not retroactive: leads sent before formulario was registered come
// back as (not set). They still count in the total, so the breakdown has to show them or
// it would not add up.
test('leads without a form still show up in the breakdown', async () => {
  const { pedir } = leadsPorSemana({
    '2026-10-26': [fila('lead_confirmado', '(not set)', 2), fila('lead_confirmado', 'valoracion', 1)]
  });

  const texto = await bloqueLeads(null, '1', LUNES, pedir);

  assert.match(texto, /2026-10-26 a 2026-11-01: 3 \(valoracion 1, manabox 0, sin formulario 2\)/);
});

test('a week without leads shows zero for both forms', async () => {
  const { pedir } = leadsPorSemana({});

  const texto = await bloqueLeads(null, '1', LUNES, pedir);

  assert.match(texto, /2026-10-26 a 2026-11-01: 0 \(valoracion 0, manabox 0\)/);
});

// Until formulario is registered as a custom dimension GA4 rejects the query. That must
// not take the Monday email down with it.
test('a failed leads query explains itself instead of breaking the report', async () => {
  const pedir = async () => { throw new Error('Field customEvent:formulario is not a valid dimension'); };

  const texto = await bloqueLeads(null, '1', LUNES, pedir);

  assert.match(texto, /customEvent:formulario is not a valid dimension/);
  assert.match(texto, /dimension personalizada/);
});

test('without a GA4 property there is no leads line', async () => {
  assert.equal(await bloqueLeads(null, undefined, LUNES, async () => []), null);
});
