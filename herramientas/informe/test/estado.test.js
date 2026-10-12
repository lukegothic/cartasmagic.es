const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { leer, guardar, comparar, esDiaDeEmbudo } = require('../lib/estado');

test('una que desaparece cuenta como resuelta', () => {
  const { nuevas, resueltas } = comparar(['huerfana:vender cartas'], [
    'huerfana:vender cartas',
    'dominio:tasar cartas magic:cartasmagic.es'
  ]);
  assert.equal(nuevas.length, 0);
  assert.deepEqual(resueltas, ['dominio:tasar cartas magic:cartasmagic.es']);
});

test('el primer dia todo es nuevo', () => {
  const { nuevas } = comparar(['huerfana:vender cartas', 'huerfana:venta cartas magic'], []);
  assert.equal(nuevas.length, 2);
});

test('cambiar de dominio el mismo aviso cuenta como cambio', () => {
  const ayer = ['dominio:tasar cartas magic:cartasmagic.es'];
  const hoy = ['dominio:tasar cartas magic:vendercartasmagic.es'];
  const { nuevas, resueltas } = comparar(hoy, ayer);
  assert.equal(nuevas.length, 1);
  assert.equal(resueltas.length, 1);
});

// El embudo solo el lunes: es lo que evita que los ratios se lean con ruido diario,
// que es contra lo que avisa docs/plan-medicion-embudo.md.
test('el embudo sale los lunes y ningun otro dia', () => {
  assert.equal(esDiaDeEmbudo(new Date(2026, 8, 7)), true, 'lunes');
  for (const dia of [6, 8, 9, 10, 11, 12]) {
    assert.equal(esDiaDeEmbudo(new Date(2026, 8, dia)), false, `dia ${dia}`);
  }
});

// El adjunto se regeneraba entero cada dia, asi que una accion ya aplicada era
// indistinguible de una nueva. Marcar cuales son nuevas es lo que hace que el fichero
// sirva de lista de trabajo y no de inventario repetido.
test('marca que firmas son nuevas respecto a ayer', () => {
  const hoy = ['huerfana:vender cartas', 'huerfana:venta cartas magic'];
  const { nuevas } = comparar(hoy, ['huerfana:vender cartas']);
  assert.deepEqual(nuevas, ['huerfana:venta cartas magic']);
});

const conEstadoEn = (contenido, prueba) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'informe-estado-'));
  const anterior = process.env.INFORME_ESTADO_DIR;
  process.env.INFORME_ESTADO_DIR = dir;
  try {
    if (contenido !== undefined) fs.writeFileSync(path.join(dir, 'ultimo-aviso.json'), contenido);
    prueba(dir);
  } finally {
    if (anterior === undefined) delete process.env.INFORME_ESTADO_DIR;
    else process.env.INFORME_ESTADO_DIR = anterior;
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

test('sin fichero de estado el primer dia empieza vacio', () => {
  conEstadoEn(undefined, () => {
    const estado = leer();
    assert.deepEqual([estado.acciones, estado.alarmas], [[], []]);
  });
});

test('lo que se guarda es lo que se lee, tal cual', () => {
  conEstadoEn(undefined, () => {
    guardar({ acciones: ['huerfana:vender cartas'], alarmas: ['embudo:lead'] });
    const estado = leer();
    assert.deepEqual(estado.acciones, ['huerfana:vender cartas']);
    assert.deepEqual(estado.alarmas, ['embudo:lead']);
    assert.ok(!estado.migrado);
  });
});

// El formato anterior guardaba la firma de cada hallazgo, visible o no.
test('un fichero en el formato anterior se lee y se migra sin error', () => {
  const viejo = JSON.stringify({ firmas: ['huerfana:vender cartas', 'ctr:oculta'], fecha: '2026-10-11T07:00:00.000Z' });
  conEstadoEn(viejo, () => {
    const estado = leer();
    assert.deepEqual(estado.acciones, ['huerfana:vender cartas', 'ctr:oculta']);
    assert.deepEqual(estado.alarmas, []);
    assert.equal(estado.migrado, true);
  });
});

test('guardar sobre el formato anterior lo deja ya en el nuevo', () => {
  const viejo = JSON.stringify({ firmas: ['huerfana:vender cartas'], fecha: '2026-10-11T07:00:00.000Z' });
  conEstadoEn(viejo, () => {
    guardar({ acciones: ['huerfana:vender cartas'], alarmas: [] });
    assert.ok(!leer().migrado);
  });
});
