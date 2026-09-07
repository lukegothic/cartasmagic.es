const test = require('node:test');
const assert = require('node:assert');
const { intencion, dominioQueTocaria, agrupar, avisos, HUB, VENDER } = require('../lib/analisis');

// Las keywords de las dos listas de docs/reparto-keywords.md. Si el clasificador deja de
// coincidir con el documento, el aviso de canibalizacion empieza a mentir.
test('las keywords informacionales del reparto son del hub', () => {
  const informacionales = [
    'valor cartas magic',
    'cuanto vale una carta magic',
    'valorar cartas magic',
    'tasar cartas magic',
    'precio cartas magic antiguas',
    'estado cartas magic',
    'near mint magic',
    'cartas magic antiguas valor',
    'ediciones magic caras'
  ];
  for (const consulta of informacionales) {
    assert.equal(dominioQueTocaria(consulta), HUB, consulta);
  }
});

test('las keywords transaccionales del reparto son de vender', () => {
  const transaccionales = [
    'vender cartas magic',
    'vender coleccion cartas magic',
    'donde vender cartas magic',
    'como vender cartas magic',
    'vender cartas magic online',
    'vender cartas magic espana'
  ];
  for (const consulta of transaccionales) {
    assert.equal(dominioQueTocaria(consulta), VENDER, consulta);
  }
});

// "valoracion cartas magic" es de vender segun el reparto, pero no lo delata ninguna
// palabra: no lleva verbo de venta ni posesivo. Solo se sabe porque su pagina la
// reclama, asi que es el caso que justifica la precedencia de lo declarado.
test('lo declarado en la pagina manda sobre el patron de palabras', () => {
  const porKeyword = new Map([
    [
      'valoracion cartas magic',
      [{ dominio: VENDER, ruta: '/valoracion-cartas-magic', fichero: 'apps/vender/lib/metadatos.js' }]
    ]
  ]);
  assert.equal(dominioQueTocaria('valoracion cartas magic'), HUB);
  assert.equal(dominioQueTocaria('valoracion cartas magic', porKeyword), VENDER);
});

// El caso que separa las dos listas en el documento: el posesivo marca la frontera.
test('el posesivo lleva una consulta de valor a vender', () => {
  assert.equal(dominioQueTocaria('valor cartas magic'), HUB);
  assert.equal(dominioQueTocaria('cuanto valen mis cartas magic'), VENDER);
});

test('avisa cuando los dos dominios rankean la misma consulta', () => {
  const filas = [
    { dominio: VENDER, claves: ['donde vender cartas magic'], clics: 4, impresiones: 41, posicion: 6 },
    { dominio: HUB, claves: ['donde vender cartas magic'], clics: 0, impresiones: 12, posicion: 18 }
  ];
  const { canibalizacion } = avisos(agrupar(filas), new Map());
  assert.equal(canibalizacion.length, 1);
  assert.equal(canibalizacion[0].consulta, 'donde vender cartas magic');
  assert.equal(canibalizacion[0].impresiones, 53);
});

test('avisa cuando rankea el dominio que no toca', () => {
  const filas = [{ dominio: HUB, claves: ['vender cartas magic'], clics: 1, impresiones: 30, posicion: 14 }];
  const { malDominio } = avisos(agrupar(filas), new Map());
  assert.equal(malDominio.length, 1);
  assert.equal(malDominio[0].deberia, VENDER);
});

// Con 48 visitas al mes cualquier consulta de una o dos impresiones es ruido, y avisar
// sobre ella hace que el informe no se pueda leer.
test('ignora las consultas por debajo del minimo de impresiones', () => {
  const filas = [{ dominio: HUB, claves: ['vender cartas magic'], clics: 0, impresiones: 3, posicion: 40 }];
  const { malDominio, sinDuenno } = avisos(agrupar(filas), new Map());
  assert.equal(malDominio.length, 0);
  assert.equal(sinDuenno.length, 0);
});

test('detecta una consulta que rankea sin que ninguna pagina la reclame', () => {
  const filas = [{ dominio: HUB, claves: ['valorar cartas magic'], clics: 0, impresiones: 36, posicion: 12 }];
  const { sinDuenno } = avisos(agrupar(filas), new Map());
  assert.equal(sinDuenno.length, 1);
  assert.equal(sinDuenno[0].deberia, HUB);
});

test('no la da por huerfana si una pagina la lleva en su meta', () => {
  const porKeyword = new Map([
    ['valorar cartas magic', [{ dominio: HUB, ruta: '/blog', fichero: 'apps/hub/lib/metadatos.js' }]]
  ]);
  const filas = [{ dominio: HUB, claves: ['valorar cartas magic'], clics: 0, impresiones: 36, posicion: 12 }];
  const { sinDuenno } = avisos(agrupar(filas), porKeyword);
  assert.equal(sinDuenno.length, 0);
});

test('avisa de posicion buena con CTR pobre', () => {
  const porKeyword = new Map([
    ['vender cartas magic', [{ dominio: VENDER, ruta: '/', fichero: 'apps/vender/lib/metadatos.js' }]]
  ]);
  const filas = [{ dominio: VENDER, claves: ['vender cartas magic'], clics: 1, impresiones: 200, posicion: 7 }];
  const { ctrBajo } = avisos(agrupar(filas), porKeyword);
  assert.equal(ctrBajo.length, 1);
});

// El reparto deja fuera a proposito las consultas de compra: mientras no exista
// comprarcartasmagic.es, ninguna pagina puede responderlas y mandarlas al formulario de
// venta es una visita perdida. Ver docs/reparto-keywords.md.
test('la intencion de compra no es de nadie', () => {
  for (const consulta of [
    'compra cartas magic',
    'comprar cartas magic',
    'comprar cartas magic sueltas',
    'compro cartas magic',
    'comprar magic the gathering'
  ]) {
    assert.equal(intencion(consulta), 'compra', consulta);
    assert.equal(dominioQueTocaria(consulta, new Map()), null, consulta);
  }
});

test('compra venta sigue siendo de vender, porque quien la busca quiere vender', () => {
  assert.equal(dominioQueTocaria('compra venta cartas magic', new Map()), VENDER);
});

test('vender no se confunde con comprar', () => {
  assert.equal(intencion('vender cartas magic'), 'transaccional');
  assert.equal(intencion('donde vender cartas magic'), 'transaccional');
});

// "quien compra cartas magic" lo escribe quien quiere vender: pregunta por un comprador,
// no busca comprar. Es de vender pese a llevar el verbo comprar.
test('preguntar quien compra es intencion de venta', () => {
  assert.equal(intencion('quien compra cartas magic'), 'transaccional');
  assert.equal(dominioQueTocaria('quien compra cartas magic', new Map()), VENDER);
  assert.equal(intencion('quien compra colecciones magic'), 'transaccional');
});
