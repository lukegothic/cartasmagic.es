const test = require('node:test');
const assert = require('node:assert');
const { firmar, comparar, esDiaDeEmbudo } = require('../lib/estado');

const hallazgo = {
  canibalizacion: [{ consulta: 'donde vender cartas magic' }],
  malDominio: [{ consulta: 'tasar cartas magic', deberia: 'cartasmagic.es' }],
  sinDuenno: [{ consulta: 'vender cartas' }],
  ctrBajo: []
};

test('la firma distingue el tipo de aviso, no solo la consulta', () => {
  const firmas = firmar(hallazgo);
  assert.deepEqual(firmas, [
    'canibal:donde vender cartas magic',
    'dominio:tasar cartas magic:cartasmagic.es',
    'huerfana:vender cartas'
  ]);
});

// El motivo de que la firma no lleve impresiones: si las cifras entraran, cualquier
// variacion diaria contaria como aviso nuevo y el correo llegaria todos los dias.
test('que cambien las impresiones no cuenta como aviso nuevo', () => {
  const ayer = firmar({ ...hallazgo, sinDuenno: [{ consulta: 'vender cartas', impresiones: 97 }] });
  const hoy = firmar({ ...hallazgo, sinDuenno: [{ consulta: 'vender cartas', impresiones: 121 }] });
  const { nuevas, resueltas } = comparar(hoy, ayer);
  assert.equal(nuevas.length, 0);
  assert.equal(resueltas.length, 0);
});

test('una consulta que aparece hoy es un aviso nuevo', () => {
  const ayer = ['huerfana:vender cartas'];
  const hoy = ['huerfana:vender cartas', 'huerfana:venta cartas magic'];
  const { nuevas, resueltas } = comparar(hoy, ayer);
  assert.deepEqual(nuevas, ['huerfana:venta cartas magic']);
  assert.equal(resueltas.length, 0);
});

test('una que desaparece cuenta como resuelta', () => {
  const { nuevas, resueltas } = comparar(['huerfana:vender cartas'], [
    'huerfana:vender cartas',
    'dominio:tasar cartas magic:cartasmagic.es'
  ]);
  assert.equal(nuevas.length, 0);
  assert.deepEqual(resueltas, ['dominio:tasar cartas magic:cartasmagic.es']);
});

test('el primer dia todo es nuevo', () => {
  const { nuevas } = comparar(firmar(hallazgo), []);
  assert.equal(nuevas.length, 3);
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
