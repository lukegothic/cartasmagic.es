const test = require('node:test');
const assert = require('node:assert');
const { decidir } = require('../lib/decision');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

// A Target whose numbers describe its old version cannot back an Action, so while it is in
// Cooldown no Candidate on it can become one.
const pagina = (dominio, fichero, texto = {}, keywords = []) => ({
  dominio,
  ruta: '/',
  fichero,
  numeroLinea: 75,
  keywords,
  texto: { title: 'Titulo', description: 'Descripcion', copy: 'Copy', ...texto }
});

const indiceConTexto = (texto) => {
  const hub = pagina(HUB, 'apps/hub/lib/metadatos.js');
  const vender = pagina(VENDER, 'apps/vender/lib/metadatos.js', texto, ['vender cartas magic']);
  return { porKeyword: new Map([['vender cartas magic', [vender]]]), paginas: [hub, vender] };
};

const fila = (consulta, impresiones, posicion, clics = 0) => ({
  dominio: VENDER,
  claves: [consulta],
  impresiones,
  posicion,
  clics
});

const ventana = { desde: '2026-07-10', hasta: '2026-10-07' };
const hoy = new Date('2026-10-13T12:00:00');
const HOY = '2026-10-13';
const ESTADO_VACIO = { acciones: [], alarmas: [], fecha: null };

const decide = (extra = {}) =>
  decidir({
    consultas: [],
    indice: indiceConTexto({}),
    estado: ESTADO_VACIO,
    hoy,
    ventana,
    ultimoCambioGit: () => null,
    ...extra
  });

const CLAVE_KEYWORDS = 'vendercartasmagic.es/#keywords';
const CLAVE_TITLE = 'vendercartasmagic.es/#title';
const CLAVE_COPY = 'vendercartasmagic.es/#copy';
const RECLAMAR = 'huerfana:vender cartas';

const reclamar = [fila('vender cartas', 97, 16.2)];
const ctrBajo = [fila('vender cartas magic', 268, 5, 1)];

const motivosDe = (descartes) => descartes.map(({ consulta, motivo }) => [consulta, motivo]);
const firmasDe = (acciones) => acciones.map(({ firma }) => firma);

// A run on an unchanged page whose files were last touched on `cambioGit`: what a later
// run reads as yesterday's state.
const estadoSembrado = (cambioGit = '2026-01-01') => ({
  ...ESTADO_VACIO,
  targets: decide({ ultimoCambioGit: () => cambioGit }).siguiente.targets
});

test('a Target whose text changed today is in Cooldown and its Candidates are discarded', () => {
  const estado = estadoSembrado();
  const sinCambios = decide({ consultas: reclamar, estado });
  assert.deepEqual(firmasDe(sinCambios.acciones), [RECLAMAR]);

  const cambiado = decide({ indice: indiceConTexto({ copy: 'Copy reescrito' }), consultas: reclamar, estado });

  assert.deepEqual(cambiado.acciones, []);
  assert.deepEqual(motivosDe(cambiado.descartes), [['vender cartas', 'TARGET_IN_COOLDOWN']]);
  assert.equal(cambiado.targets[CLAVE_COPY].cambio, HOY);
  assert.equal(cambiado.targets[CLAVE_KEYWORDS].cambio, '2026-01-01');
});

test('a Candidate in Cooldown with little Demand is discarded for the Cooldown, not put on the Watch list', () => {
  const { vigilancia, descartes } = decide({
    indice: indiceConTexto({ copy: 'Copy reescrito' }),
    consultas: [fila('vender cartas', 25, 16.2)],
    estado: estadoSembrado()
  });

  assert.deepEqual(motivosDe(descartes), [['vender cartas', 'TARGET_IN_COOLDOWN']]);
  assert.deepEqual(vigilancia, []);
});

test('a Target changed 28 days ago is in Cooldown and one changed 29 days ago is not', () => {
  const conCambioHace = (cambioGit) => decide({ consultas: reclamar, estado: estadoSembrado(cambioGit) });

  assert.deepEqual(firmasDe(conCambioHace('2026-09-15').acciones), [], '28 days ago');
  assert.deepEqual(firmasDe(conCambioHace('2026-09-14').acciones), [RECLAMAR], '29 days ago');
});

test('on the first run a Target with no stored entry takes the git change date of its file', () => {
  const preguntados = [];
  const { acciones, descartes, targets } = decide({
    consultas: reclamar,
    ultimoCambioGit: (fichero) => {
      preguntados.push(fichero);
      return '2026-10-10';
    }
  });

  assert.ok(preguntados.includes('apps/vender/lib/metadatos.js'));
  assert.equal(targets[CLAVE_KEYWORDS].cambio, '2026-10-10');
  assert.deepEqual(acciones, []);
  assert.deepEqual(motivosDe(descartes), [['vender cartas', 'TARGET_IN_COOLDOWN']]);
});

test('an old git change date leaves the Target out of Cooldown', () => {
  const { acciones } = decide({ consultas: reclamar, ultimoCambioGit: () => '2026-08-01' });

  assert.deepEqual(firmasDe(acciones), [RECLAMAR]);
});

test('git is not asked again for a Target that already has a stored entry', () => {
  const preguntados = [];
  decide({ estado: estadoSembrado(), ultimoCambioGit: (fichero) => preguntados.push(fichero) });

  assert.deepEqual(preguntados, []);
});

test('a Target with an unknown git date is not in Cooldown', () => {
  const { acciones } = decide({ consultas: reclamar });

  assert.deepEqual(firmasDe(acciones), [RECLAMAR]);
});

// Rewriting a title judges the title and description, so a new copy does not hold it back.
test('a CTR Candidate depends on the title and description, not on the copy', () => {
  const estado = estadoSembrado();

  const conTitleNuevo = decide({ indice: indiceConTexto({ title: 'Otro titulo' }), consultas: ctrBajo, estado });
  assert.deepEqual(motivosDe(conTitleNuevo.descartes), [['vender cartas magic', 'TARGET_IN_COOLDOWN']]);
  assert.equal(conTitleNuevo.targets[CLAVE_TITLE].cambio, HOY);

  const conCopyNuevo = decide({ indice: indiceConTexto({ copy: 'Otro copy' }), consultas: ctrBajo, estado });
  assert.deepEqual(
    conCopyNuevo.acciones.map(({ titulo }) => titulo),
    ['Reescribir el title de "vender cartas magic"']
  );
});

test('the next state carries the Target snapshot next to the signatures', () => {
  const { siguiente } = decide({ ultimoCambioGit: () => '2026-08-01' });

  assert.deepEqual(siguiente.acciones, []);
  assert.equal(siguiente.targets[CLAVE_KEYWORDS].cambio, '2026-08-01');
  assert.match(siguiente.targets[CLAVE_KEYWORDS].huella, /^[0-9a-f]+$/);
});

test('a state written before the snapshot existed keeps its signatures and gets the snapshot', () => {
  const firmas = ['huerfana:vender cartas'];
  const anterior = { acciones: firmas, alarmas: ['embudo:lead'], fecha: '2026-10-12T07:00:00.000Z' };
  const { siguiente, enviar } = decide({ estado: anterior, alarmas: ['embudo:lead'], consultas: reclamar });

  assert.deepEqual(siguiente.acciones, firmas);
  assert.deepEqual(siguiente.alarmas, ['embudo:lead']);
  assert.equal(enviar, false);
  assert.ok(Object.keys(siguiente.targets).length > 0);
});
