const test = require('node:test');
const assert = require('node:assert');
const { decidir } = require('../lib/decision');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

const paginaVender = {
  dominio: VENDER,
  ruta: '/',
  fichero: 'apps/vender/lib/metadatos.js',
  numeroLinea: 75,
  keywords: ['vender cartas magic']
};
const paginaHub = {
  dominio: HUB,
  ruta: '/',
  fichero: 'apps/hub/lib/metadatos.js',
  numeroLinea: 60,
  keywords: []
};

const indice = {
  porKeyword: new Map([['vender cartas magic', [paginaVender]]]),
  paginas: [paginaHub, paginaVender]
};

const fila = (dominio, consulta, impresiones, posicion, clics = 0) => ({
  dominio,
  claves: [consulta],
  impresiones,
  posicion,
  clics
});

const consultas = [
  fila(VENDER, 'vender cartas magic', 268, 10.7, 25),
  fila(VENDER, 'tasar cartas magic', 45, 15.3),
  fila(VENDER, 'vender cartas', 97, 16.2)
];

const ventana = { desde: '2026-07-10', hasta: '2026-10-07' };
const martes = new Date('2026-10-13T12:00:00');
const lunes = new Date('2026-10-12T12:00:00');

const FIRMAS_DE_HOY = ['dominio:tasar cartas magic:cartasmagic.es', 'huerfana:vender cartas'];

const decide = (extra = {}) =>
  decidir({ consultas, indice, estado: { firmas: [], fecha: null }, hoy: martes, ventana, ...extra });

test('the actions come with their file and line', () => {
  const { acciones } = decide();
  const reclamar = acciones.find(({ titulo }) => titulo === 'Reclamar "vender cartas"');
  const mover = acciones.find(({ titulo }) => titulo === 'Mover "tasar cartas magic" a cartasmagic.es');

  assert.deepEqual(mover.donde, []);
  assert.deepEqual(reclamar.donde, [{ fichero: 'apps/vender/lib/metadatos.js', numeroLinea: 75 }]);
  assert.equal(mover.impresiones, 45);
  assert.equal(reclamar.impresiones, 97);
});

// Types in the order the old code emitted them: move (40), claim (97), rewrite (60).
// By Demand the claim comes first, then the rewrite, then the move.
test('the actions are ordered by Demand whatever their type', () => {
  const { acciones } = decide({
    consultas: [
      fila(VENDER, 'tasar cartas magic', 40, 15.3),
      fila(VENDER, 'vender cartas', 97, 16.2),
      fila(VENDER, 'vender cartas magic online', 60, 8, 1)
    ]
  });

  assert.deepEqual(
    acciones.map(({ titulo }) => titulo),
    ['Reclamar "vender cartas"', 'Reescribir el title de "vender cartas magic online"', 'Mover "tasar cartas magic" a cartasmagic.es']
  );
});

// One search shown on both domains is one search: 7 and 5 impressions are a Demand of 7,
// below the minimum of 10, so there is nothing to act on.
test('a query seen 7 times on the hub and 5 on vender has a Demand of 7 and is not a Candidate', () => {
  const { acciones, hallazgos } = decide({
    consultas: [fila(HUB, 'vender cartas', 7, 12), fila(VENDER, 'vender cartas', 5, 16)]
  });
  const { muertas, ...candidatos } = hallazgos;

  assert.deepEqual(acciones, []);
  assert.deepEqual(Object.values(candidatos).flat(), []);
});

test('an action carries the impressions and position of each domain', () => {
  const { acciones } = decide({
    consultas: [fila(HUB, 'vender cartas', 50, 12), fila(VENDER, 'vender cartas', 44, 16)]
  });

  assert.equal(acciones.length, 1);
  assert.equal(acciones[0].impresiones, 50);
  assert.deepEqual(
    acciones[0].apariciones.map(({ dominio, impresiones, posicion }) => [dominio, impresiones, posicion]),
    [
      [HUB, 50, 12],
      [VENDER, 44, 16]
    ]
  );
});

test('an action seen yesterday is not new', () => {
  const { acciones } = decide({ estado: { firmas: ['huerfana:vender cartas'], fecha: null } });

  assert.deepEqual(
    acciones.map(({ firma, esNueva }) => [firma, esNueva]),
    [
      ['huerfana:vender cartas', false],
      ['dominio:tasar cartas magic:cartasmagic.es', true]
    ]
  );
});

test('sends when a finding appears that was not there yesterday', () => {
  const { enviar, siguiente } = decide({ estado: { firmas: ['huerfana:vender cartas'], fecha: null } });

  assert.equal(enviar, true);
  assert.deepEqual(siguiente.firmas, FIRMAS_DE_HOY);
});

test('sends when a finding from yesterday is gone', () => {
  const firmas = [...FIRMAS_DE_HOY, 'ctr:otra consulta'];

  assert.equal(decide({ estado: { firmas, fecha: null } }).enviar, true);
});

test('does not send on a weekday when the findings are the same as yesterday', () => {
  const { enviar, conEmbudo } = decide({ estado: { firmas: FIRMAS_DE_HOY, fecha: null } });

  assert.equal(enviar, false);
  assert.equal(conEmbudo, false);
});

test('sends on Monday even when nothing changed, with the funnel', () => {
  const { enviar, conEmbudo } = decide({ estado: { firmas: FIRMAS_DE_HOY, fecha: null }, hoy: lunes });

  assert.equal(enviar, true);
  assert.equal(conEmbudo, true);
});

// Between 10 and 39 impressions of Demand a query is a Candidate but not an Action: the
// difference between acting and not acting fits inside the noise.
test('a Candidate with a Demand between 10 and 39 goes to the Watch list and the discards, not to the actions', () => {
  const { acciones, vigilancia, descartes } = decide({
    consultas: [fila(VENDER, 'tasar cartas magic', 25, 15.3), fila(VENDER, 'vender cartas', 97, 16.2)]
  });

  assert.deepEqual(acciones.map(({ firma }) => firma), ['huerfana:vender cartas']);
  assert.deepEqual(vigilancia.map(({ consulta, impresiones }) => [consulta, impresiones]), [['tasar cartas magic', 25]]);
  assert.deepEqual(
    descartes.map(({ consulta, motivo }) => [consulta, motivo]),
    [['tasar cartas magic', 'TOO_LITTLE_DEMAND']]
  );
});

test('the Watch list keeps the impressions and position of each domain', () => {
  const { vigilancia } = decide({
    consultas: [fila(HUB, 'vender cartas', 30, 12), fila(VENDER, 'vender cartas', 22, 16)]
  });

  assert.deepEqual(
    vigilancia[0].apariciones.map(({ dominio, impresiones, posicion }) => [dominio, impresiones, posicion]),
    [
      [HUB, 30, 12],
      [VENDER, 22, 16]
    ]
  );
});

test('a Demand of exactly 40 is an Action', () => {
  const { acciones, vigilancia } = decide({ consultas: [fila(VENDER, 'vender cartas', 40, 16.2)] });

  assert.equal(acciones.length, 1);
  assert.deepEqual(vigilancia, []);
});

// "cartas magic vender" and "vender cartas magic" are one search for the engines. When the
// variant converts, the title already works and rewriting it for the other word order only
// risks the query that pays.
const indiceConVariante = (paginaDeCartasMagic) => ({
  porKeyword: new Map([
    ['vender cartas magic', [paginaVender]],
    ['cartas magic', [paginaDeCartasMagic]]
  ]),
  paginas: [paginaHub, paginaVender]
});

const titulosDeAcciones = (acciones) => acciones.map(({ titulo }) => titulo);
const REESCRIBIR_VARIANTE = 'Reescribir el title de "cartas magic vender"';

test('a CTR Candidate is discarded when its Query variant on the same page has normal CTR', () => {
  const { acciones, descartes } = decide({
    indice: indiceConVariante(paginaVender),
    consultas: [fila(VENDER, 'cartas magic vender', 268, 5, 0), fila(VENDER, 'vender cartas magic', 1000, 6, 87)]
  });

  assert.deepEqual(titulosDeAcciones(acciones), []);
  assert.deepEqual(
    descartes.map(({ consulta, motivo }) => [consulta, motivo]),
    [['cartas magic vender', 'QUERY_VARIANT_PERFORMS']]
  );
});

test('a Query variant on a different page does not discard the CTR Candidate', () => {
  const { acciones, descartes } = decide({
    indice: indiceConVariante(paginaHub),
    consultas: [fila(VENDER, 'cartas magic vender', 268, 5, 0), fila(VENDER, 'vender cartas magic', 1000, 6, 87)]
  });

  assert.deepEqual(titulosDeAcciones(acciones), [REESCRIBIR_VARIANTE]);
  assert.deepEqual(descartes, []);
});

test('a Query variant that is also below the CTR threshold does not discard', () => {
  const { acciones, descartes } = decide({
    indice: indiceConVariante(paginaVender),
    consultas: [fila(VENDER, 'cartas magic vender', 268, 5, 0), fila(VENDER, 'vender cartas magic', 1000, 6, 5)]
  });

  assert.ok(titulosDeAcciones(acciones).includes(REESCRIBIR_VARIANTE));
  assert.ok(!descartes.some(({ motivo }) => motivo === 'QUERY_VARIANT_PERFORMS'));
});

test('a variant with a CTR at exactly the threshold counts as performing', () => {
  const { descartes } = decide({
    indice: indiceConVariante(paginaVender),
    consultas: [fila(VENDER, 'cartas magic vender', 268, 5, 0), fila(VENDER, 'vender cartas magic', 1000, 6, 20)]
  });

  assert.deepEqual(descartes.map(({ motivo }) => motivo), ['QUERY_VARIANT_PERFORMS']);
});

test('a query with different words is not a Query variant', () => {
  const { acciones } = decide({
    indice: indiceConVariante(paginaVender),
    consultas: [fila(VENDER, 'cartas magic vender', 268, 5, 0), fila(VENDER, 'vender cartas magic online', 1000, 6, 87)]
  });

  assert.deepEqual(titulosDeAcciones(acciones), [REESCRIBIR_VARIANTE]);
});
