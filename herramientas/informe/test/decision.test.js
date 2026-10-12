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
  fila(VENDER, 'tasar cartas magic', 25, 15.3),
  fila(VENDER, 'vender cartas', 97, 16.2)
];

const ventana = { desde: '2026-07-10', hasta: '2026-10-07' };
const martes = new Date('2026-10-13T12:00:00');
const lunes = new Date('2026-10-12T12:00:00');

const FIRMAS_DE_HOY = ['dominio:tasar cartas magic:cartasmagic.es', 'huerfana:vender cartas'];

const decide = (extra = {}) =>
  decidir({ consultas, indice, estado: { firmas: [], fecha: null }, hoy: martes, ventana, ...extra });

test('the actions come ordered by type with their file and line', () => {
  const { acciones } = decide();

  assert.deepEqual(
    acciones.map(({ titulo }) => titulo),
    ['Mover "tasar cartas magic" a cartasmagic.es', 'Reclamar "vender cartas"']
  );
  assert.deepEqual(acciones[0].donde, []);
  assert.deepEqual(acciones[1].donde, [{ fichero: 'apps/vender/lib/metadatos.js', numeroLinea: 75 }]);
  assert.equal(acciones[0].impresiones, 25);
  assert.equal(acciones[0].esRuido, true);
  assert.equal(acciones[1].impresiones, 97);
  assert.equal(acciones[1].esRuido, false);
});

test('an action seen yesterday is not new', () => {
  const { acciones } = decide({ estado: { firmas: ['huerfana:vender cartas'], fecha: null } });

  assert.deepEqual(
    acciones.map(({ firma, esNueva }) => [firma, esNueva]),
    [
      ['dominio:tasar cartas magic:cartasmagic.es', true],
      ['huerfana:vender cartas', false]
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
