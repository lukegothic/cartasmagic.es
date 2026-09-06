const test = require('node:test');
const assert = require('node:assert');
const { agruparTemas, canibalizacionInterna, coberturaLlm } = require('../lib/huecos');

test('agrupa consultas sin duenno por el tema que comparten', () => {
  const sinDuenno = [
    { consulta: 'venta cartas magic', impresiones: 39, clics: 1, mejor: { posicion: 8.4 } },
    { consulta: 'venta de cartas magic', impresiones: 10, clics: 0, mejor: { posicion: 12.3 } },
    { consulta: 'compra venta cartas magic', impresiones: 19, clics: 1, mejor: { posicion: 6 } },
    { consulta: 'cartas magic sueltas', impresiones: 7, clics: 0, mejor: { posicion: 20.1 } }
  ];
  const temas = agruparTemas(sinDuenno);

  const venta = temas.find(({ tema }) => tema === 'venta');
  assert.ok(venta, 'deberia salir un tema de venta');
  assert.equal(venta.impresiones, 68);
  assert.equal(venta.consultas.length, 3);
});

test('ordena los temas por impresiones', () => {
  const temas = agruparTemas([
    { consulta: 'cartas magic sueltas', impresiones: 7, clics: 0, mejor: { posicion: 20 } },
    { consulta: 'venta cartas magic', impresiones: 39, clics: 1, mejor: { posicion: 8 } },
    { consulta: 'venta de cartas magic', impresiones: 10, clics: 0, mejor: { posicion: 12 } }
  ]);
  assert.equal(temas[0].tema, 'venta');
});

// Cuando el blog crece, dos articulos del hub acaban peleandose por la misma busqueda.
// Eso no lo ve el aviso que compara dominios, porque los dos son del mismo.
test('detecta dos paginas del mismo dominio compitiendo', () => {
  const porKeyword = new Map([
    [
      'valor cartas magic',
      [
        { dominio: 'cartasmagic.es', ruta: '/', fichero: 'apps/hub/routes/main.js' },
        { dominio: 'cartasmagic.es', ruta: '/blog', fichero: 'apps/hub/routes/main.js' },
        { dominio: 'cartasmagic.es', ruta: '/blog/como-saber', fichero: 'apps/hub/content/x.md' }
      ]
    ]
  ]);
  const choques = canibalizacionInterna(porKeyword);

  assert.equal(choques.length, 1);
  assert.equal(choques[0].keyword, 'valor cartas magic');
  assert.equal(choques[0].paginas.length, 3);
});

test('una keyword en una sola pagina no es canibalizacion', () => {
  const porKeyword = new Map([
    ['tasar cartas magic', [{ dominio: 'cartasmagic.es', ruta: '/blog', fichero: 'x.js' }]]
  ]);
  assert.equal(canibalizacionInterna(porKeyword).length, 0);
});

// Dos dominios distintos ya lo avisa el otro control, aqui solo interesa el mismo sitio.
test('no repite lo que ya avisa el control entre dominios', () => {
  const porKeyword = new Map([
    [
      'donde vender cartas magic',
      [
        { dominio: 'cartasmagic.es', ruta: '/blog', fichero: 'x.js' },
        { dominio: 'vendercartasmagic.es', ruta: '/', fichero: 'y.js' }
      ]
    ]
  ]);
  assert.equal(canibalizacionInterna(porKeyword).length, 0);
});

test('dice que consultas reales no responde el llm.txt', () => {
  const llm = 'Compramos colecciones completas de cartas Magic. El vendedor envia su coleccion.';
  const consultas = [
    { consulta: 'vender cartas magic', impresiones: 250 },
    { consulta: 'cartas magic antiguas', impresiones: 23 },
    { consulta: 'cuanto tardan en pagar', impresiones: 15 }
  ];
  const { cubiertas, huecos } = coberturaLlm(llm, consultas);

  assert.ok(cubiertas.some(({ consulta }) => consulta === 'vender cartas magic'));
  assert.ok(huecos.some(({ consulta }) => consulta === 'cartas magic antiguas'));
  assert.ok(huecos.some(({ consulta }) => consulta === 'cuanto tardan en pagar'));
});

// El problema real que tenia el primer calculo: "cartas magic sueltas" daba 100 % de
// cobertura en el hub porque "cartas" y "magic" salen en cada parrafo, aunque de vender
// sueltas no se hable en ninguna parte. Las palabras que se repiten en todo el texto no
// pueden puntuar igual que la que distingue la consulta.
test('una palabra que sale en todo el texto no tapa el hueco real', () => {
  const llm = `
    Compramos colecciones completas de cartas Magic. Las cartas Magic se valoran por
    edicion y estado. Enviamos las cartas Magic a Pamplona y pagamos las cartas Magic
    por transferencia.
  `;
  const { huecos } = coberturaLlm(llm, [{ consulta: 'cartas magic sueltas', impresiones: 7 }]);
  assert.equal(huecos.length, 1, '"sueltas" no aparece, asi que es un hueco');
});

test('sigue dando por cubierta una consulta que si esta', () => {
  const llm = 'Compramos colecciones completas de cartas Magic a particulares en Espana.';
  const { cubiertas } = coberturaLlm(llm, [{ consulta: 'comprar colecciones magic', impresiones: 20 }]);
  assert.equal(cubiertas.length, 1);
});

// Fixture con la longitud y las repeticiones de un llm.txt de verdad. Con textos de una
// frase el calculo parecia correcto y sobre el fichero real daba todo por hueco: una
// palabra presente pero repetida no llegaba nunca al umbral.
const LLM_REALISTA = `
  VenderCartasMagic compra colecciones de cartas Magic en toda Espana. El vendedor
  envia su coleccion de cartas y recibe un precio. Compramos colecciones completas de
  cartas Magic a particulares. No es una tienda: es un comprador directo que compra el
  lote entero. El vendedor describe que cartas tiene. Enviamos una etiqueta y el
  vendedor manda el paquete con sus cartas Magic. La valoracion de las cartas se hace
  con los precios de Cardmarket. Se compran mazos, albumes y colecciones completas de
  cartas Magic de cualquier epoca. No se compran cartas de otros juegos.
`;

test('una consulta cuyas palabras estan todas en el texto sale cubierta', () => {
  const { cubiertas } = coberturaLlm(LLM_REALISTA, [
    { consulta: 'vender cartas magic', impresiones: 268 }
  ]);
  assert.equal(cubiertas.length, 1, 'vender, cartas y magic salen todas en el texto');
});

test('una consulta con palabras que no estan sale como hueco', () => {
  const { huecos } = coberturaLlm(LLM_REALISTA, [
    { consulta: 'cartas magic sueltas', impresiones: 7 },
    { consulta: 'xilofono zurriburri', impresiones: 1 }
  ]);
  assert.equal(huecos.length, 2);
  assert.ok(
    huecos.find(({ consulta }) => consulta === 'xilofono zurriburri').cobertura === 0,
    'lo que no aparece en absoluto vale cero'
  );
});

// La escala tiene que usarse entera: si nada llega nunca al umbral, la seccion lista
// todo y no dice nada.
test('la cobertura llega al maximo cuando todo esta presente', () => {
  const { cubiertas } = coberturaLlm(LLM_REALISTA, [
    { consulta: 'colecciones completas', impresiones: 10 }
  ]);
  assert.equal(cubiertas[0].cobertura, 1);
});
