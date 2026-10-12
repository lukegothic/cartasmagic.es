const test = require('node:test');
const assert = require('node:assert');
const { decidir, fechasPostCambio } = require('../lib/decision');
const { consultasPostCambio } = require('../lib/informe');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

// Once a changed Target leaves Cooldown its CTR is judged on the data dated after the
// change, so a new title is not blamed for the clicks of the old one.
const pagina = (dominio, fichero, keywords = []) => ({
  dominio,
  ruta: '/',
  fichero,
  numeroLinea: 75,
  keywords,
  texto: { title: 'Titulo', description: 'Descripcion', copy: 'Copy' }
});

const indice = {
  porKeyword: new Map([['vender cartas magic', [pagina(VENDER, 'apps/vender/lib/metadatos.js', ['vender cartas magic'])]]]),
  paginas: [pagina(HUB, 'apps/hub/lib/metadatos.js'), pagina(VENDER, 'apps/vender/lib/metadatos.js', ['vender cartas magic'])]
};

const fila = (consulta, impresiones, posicion, clics = 0, dominio = VENDER) => ({
  dominio,
  claves: [consulta],
  impresiones,
  posicion,
  clics
});

const ventana = { desde: '2026-07-10', hasta: '2026-10-10' };
const hoy = new Date('2026-10-13T12:00:00');
const ESTADO_VACIO = { acciones: [], alarmas: [], fecha: null };
const CLAVE_TITLE = 'vendercartasmagic.es/#title';
const CONSULTA = 'vender cartas magic';
const HACE_40_DIAS = '2026-09-03';

// Over the whole window the query looks like a poor CTR: 268 impressions, 1 click.
const ventanaEntera = [fila(CONSULTA, 268, 5, 1)];

// Yesterday's state: the title last changed on `cambio`.
const estadoConTitleCambiado = (cambio) => {
  const { targets } = decidir({
    consultas: [],
    indice,
    estado: ESTADO_VACIO,
    hoy,
    ventana,
    ultimoCambioGit: () => '2026-01-01'
  });
  return { ...ESTADO_VACIO, targets: { ...targets, [CLAVE_TITLE]: { ...targets[CLAVE_TITLE], cambio } } };
};

const decide = (extra = {}) =>
  decidir({
    consultas: ventanaEntera,
    indice,
    estado: estadoConTitleCambiado(HACE_40_DIAS),
    hoy,
    ventana,
    ultimoCambioGit: () => null,
    consultasPostCambio: {},
    ...extra
  });

const postCambio = (...filas) => ({ [HACE_40_DIAS]: filas });
const motivosDe = (descartes) => descartes.map(({ consulta, motivo }) => [consulta, motivo]);

test('a CTR Candidate on a Target changed 40 days ago is judged only on the data after the change', () => {
  const { acciones } = decide({ consultasPostCambio: postCambio(fila(CONSULTA, 120, 5, 0)) });

  assert.equal(acciones.length, 1);
  assert.equal(acciones[0].titulo, 'Reescribir el title de "vender cartas magic"');
  assert.equal(acciones[0].impresiones, 120);
  assert.match(acciones[0].porque, /desde 2026-09-04/);
});

test('post-change Demand under 40 puts the CTR Candidate on the Watch list', () => {
  const { acciones, vigilancia } = decide({ consultasPostCambio: postCambio(fila(CONSULTA, 25, 5, 0)) });

  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(vigilancia), [[CONSULTA, 'TOO_LITTLE_DEMAND']]);
  assert.equal(vigilancia[0].impresiones, 25);
});

test('post-change Demand under 10 is not a Candidate at all', () => {
  const { acciones, descartes, vigilancia } = decide({ consultasPostCambio: postCambio(fila(CONSULTA, 9, 5, 0)) });

  assert.deepEqual([acciones, descartes, vigilancia], [[], [], []]);
});

// "No Candidate is dropped without a reason": a Candidate of the full window that the
// post-change data removes is discarded with the cause, except under 10 of Demand, which the
// spec allows to vanish.
test('a Candidate with no data after the change is discarded with POST_CHANGE_NO_DATA', () => {
  const { acciones, descartes } = decide({ consultasPostCambio: postCambio() });

  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(descartes), [[CONSULTA, 'POST_CHANGE_NO_DATA']]);
  assert.equal(descartes[0].impresiones, 268);
});

test('a Candidate that ranks outside the CTR range after the change is discarded with POST_CHANGE_RANK_OUT_OF_RANGE', () => {
  const { acciones, descartes } = decide({ consultasPostCambio: postCambio(fila(CONSULTA, 120, 15, 0)) });

  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(descartes), [[CONSULTA, 'POST_CHANGE_RANK_OUT_OF_RANGE']]);
  assert.equal(descartes[0].impresiones, 120);
});

test('a Candidate whose CTR is normal after the change is discarded with POST_CHANGE_CTR_NORMAL', () => {
  const { acciones, descartes } = decide({ consultasPostCambio: postCambio(fila(CONSULTA, 120, 5, 9)) });

  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(descartes), [[CONSULTA, 'POST_CHANGE_CTR_NORMAL']]);
});

test('a Candidate that becomes another type after the change is discarded with POST_CHANGE_OTHER_TYPE', () => {
  const { acciones, descartes } = decide({
    consultasPostCambio: postCambio(fila(CONSULTA, 120, 5, 0), fila(CONSULTA, 100, 8, 0, HUB))
  });

  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(descartes), [[CONSULTA, 'POST_CHANGE_OTHER_TYPE']]);
});

test('a discarded post-change Candidate does not reach the Watch list', () => {
  const { vigilancia } = decide({ consultasPostCambio: postCambio() });

  assert.deepEqual(vigilancia, []);
});

test('a query that only looks poor after the change becomes a Candidate', () => {
  const { acciones } = decide({
    consultas: [fila(CONSULTA, 268, 5, 20)],
    consultasPostCambio: postCambio(fila(CONSULTA, 120, 5, 0))
  });

  assert.deepEqual(acciones.map(({ impresiones }) => impresiones), [120]);
});

test('a Target that changed before the window uses the full window as before', () => {
  const { acciones } = decide({ estado: estadoConTitleCambiado('2026-06-01') });

  assert.deepEqual(acciones.map(({ impresiones }) => impresiones), [268]);
  assert.doesNotMatch(acciones[0].porque, /desde/);
});

test('a Target that never changed uses the full window as before', () => {
  const { acciones } = decide({ estado: ESTADO_VACIO, ultimoCambioGit: () => '2026-01-01' });

  assert.deepEqual(acciones.map(({ impresiones }) => impresiones), [268]);
});

test('a Target still in Cooldown is discarded for the Cooldown, not judged on post-change data', () => {
  const { acciones, descartes } = decide({
    estado: estadoConTitleCambiado('2026-09-20'),
    consultasPostCambio: { '2026-09-20': [fila(CONSULTA, 120, 5, 0)] }
  });

  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(descartes), [[CONSULTA, 'TARGET_IN_COOLDOWN']]);
});

test('the change dates to fetch are those inside the window and out of Cooldown', () => {
  const fechas = (cambio) =>
    fechasPostCambio({ indice, estado: estadoConTitleCambiado(cambio), hoy, ventana, ultimoCambioGit: () => null });

  assert.deepEqual(fechas(HACE_40_DIAS), [HACE_40_DIAS]);
  assert.deepEqual(fechas('2026-09-15'), [], 'still in Cooldown');
  assert.deepEqual(fechas('2026-06-01'), [], 'before the window');
});

test('the post-change rows are fetched per change date, from the day after the change, for both domains', async () => {
  const pedidas = [];
  const pedirGSC = async (_auth, dominio, parametros) => {
    pedidas.push({ dominio, ...parametros });
    return [{ claves: [CONSULTA], clics: 0, impresiones: 7, posicion: 5 }];
  };

  const porFecha = await consultasPostCambio(null, [HACE_40_DIAS], ventana, pedirGSC);

  assert.deepEqual(
    pedidas.map(({ dominio, desde, hasta, dimensiones }) => [dominio, desde, hasta, dimensiones]),
    [
      [HUB, '2026-09-04', '2026-10-10', ['query']],
      [VENDER, '2026-09-04', '2026-10-10', ['query']]
    ]
  );
  assert.deepEqual(Object.keys(porFecha), [HACE_40_DIAS]);
  assert.deepEqual(porFecha[HACE_40_DIAS].map(({ dominio }) => dominio), [HUB, VENDER]);
});
