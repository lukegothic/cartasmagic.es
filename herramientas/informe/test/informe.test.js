const test = require('node:test');
const assert = require('node:assert');
const { bloqueGSC, bloqueGA4, bloqueKeywords } = require('../lib/informe');

// GSC oculta las consultas de pocas busquedas para no identificar a quien busca, asi que
// sumar la dimension query siempre se queda corto: en vender daba 822 impresiones cuando
// la propiedad tenia 1954. Sumar la dimension page tampoco vale, porque una consulta que
// saca dos paginas se cuenta dos veces y pasaba de largo, 2154. El unico total que
// cuadra es el que devuelve GSC sin desglosar.
const respuestas = {
  query: [
    { claves: ['vender cartas magic'], clics: 25, impresiones: 268, ctr: 0.09, posicion: 10.7 },
    { claves: ['vender cartas'], clics: 0, impresiones: 93, ctr: 0, posicion: 16.2 }
  ],
  page: [
    { claves: ['https://vendercartasmagic.es/'], clics: 143, impresiones: 1812, ctr: 0.08, posicion: 8.9 },
    { claves: ['https://vendercartasmagic.es/como-vender-cartas-magic'], clics: 2, impresiones: 198, ctr: 0.01, posicion: 31.7 }
  ],
  total: [{ claves: [], clics: 148, impresiones: 1954, ctr: 0.076, posicion: 9.1 }]
};

const consultaFalsa = async (_auth, _dominio, { dimensiones }) =>
  respuestas[!dimensiones || !dimensiones.length ? 'total' : dimensiones[0]];

test('el total sale de GSC sin desglosar, no de sumar las consultas', async () => {
  const { total } = await bloqueGSC(null, 'vendercartasmagic.es', { desde: 'a', hasta: 'b' }, consultaFalsa);

  assert.equal(total.impresiones, 1954);
  assert.equal(total.clics, 148);
});

// El sintoma que lo delato en el informe del 2026-09-06: la tabla de paginas sacaba
// una pagina con 1812 impresiones encima de un total de 822.
test('el total nunca queda por debajo de la pagina con mas impresiones', async () => {
  const { total, paginas } = await bloqueGSC(null, 'vendercartasmagic.es', { desde: 'a', hasta: 'b' }, consultaFalsa);

  const mayor = Math.max(...paginas.map(({ impresiones }) => impresiones));
  assert.ok(total.impresiones >= mayor, `total ${total.impresiones} por debajo de ${mayor}`);
});

// Una propiedad recien dada de alta no devuelve ninguna fila. Antes el total salia de un
// reduce sobre un array vacio y daba cero sin romper, asi que el arreglo tiene que
// aguantar lo mismo.
test('un dominio sin datos da cero y no rompe', async () => {
  const sinDatos = async () => [];
  const { total } = await bloqueGSC(null, 'nuevo.es', { desde: 'a', hasta: 'b' }, sinDatos);

  assert.deepEqual(total, { clics: 0, impresiones: 0 });
});

// La cifra se llamaba "Portada a formulario" pero dividia todas las vistas del
// formulario, entrasen por donde entrasen, entre los clics en los botones de la portada.
// Quien llega a /valoracion-cartas-magic desde Google no ha pasado por la portada, y el
// informe del 2026-09-25 sacaba un 162,7 %. La pregunta de plan-medicion-embudo.md es
// otra: de cada cien que entran por la portada, cuantos pulsan un boton hacia el
// formulario.
const eventosGA4 = [
  { claves: ['page_view', '/'], valores: [300] },
  { claves: ['page_view', '/valoracion-cartas-magic'], valores: [150] },
  { claves: ['clic_cta', '/'], valores: [60] },
  { claves: ['clic_cta', '/como-vender-cartas-magic'], valores: [15] },
  { claves: ['ver_formulario', '/valoracion-cartas-magic'], valores: [122] }
];

const consultaGA4Falsa = async (_auth, _propiedad, { dimensiones = [] }) =>
  dimensiones[0] === 'eventName' ? eventosGA4 : [];

test('la portada se mide con sus propias visitas, no con las vistas del formulario', async () => {
  const texto = await bloqueGA4(
    null,
    { dominio: 'vendercartasmagic.es', ga4: '1' },
    { desde: 'a', hasta: 'b' },
    consultaGA4Falsa
  );

  assert.match(texto, /Portada a formulario: 20,0 % \(60 clics en CTA de 300 visitas a la portada\)/);
});

test('las vistas del formulario se siguen contando en todas las paginas', async () => {
  const texto = await bloqueGA4(
    null,
    { dominio: 'vendercartasmagic.es', ga4: '1' },
    { desde: 'a', hasta: 'b' },
    consultaGA4Falsa
  );

  assert.match(texto, /Formulario visto\s+122/);
});

// El hub no lanza clic_cta: sus botones cruzan a vender con utm y se miden alli. Sin el
// evento no hay nada medido, y un 0 % diria que nadie pulsa.
test('sin clic_cta en el sitio no se pinta la cifra de la portada', async () => {
  const soloVisitas = async (_auth, _propiedad, { dimensiones = [] }) =>
    dimensiones[0] === 'eventName' ? [{ claves: ['page_view', '/'], valores: [184] }] : [];

  const texto = await bloqueGA4(null, { dominio: 'cartasmagic.es', ga4: '1' }, { desde: 'a', hasta: 'b' }, soloVisitas);

  assert.doesNotMatch(texto, /Portada a formulario/);
});

// generate_lead existe desde el 2026-09-04 y el resto del embudo desde el 09-05. Con la
// ventana empezando antes, los leads de prueba del 09-04 salian sin su intento de envio
// y el informe del 2026-09-25 daba un 120 % de intento a lead.
test('los eventos del embudo se leen desde que existen todos sus pasos', async () => {
  const pedidos = [];
  const registrar = async (_auth, _propiedad, consulta) => {
    pedidos.push(consulta);
    return [];
  };

  await bloqueGA4(null, { dominio: 'vendercartasmagic.es', ga4: '1' }, { desde: '2026-06-30', hasta: '2026-09-28' }, registrar);

  const eventos = pedidos.find(({ dimensiones = [] }) => dimensiones[0] === 'eventName');
  assert.equal(eventos.desde, '2026-09-05');
});

// Con generate_lead disparando en cada recarga de la confirmacion, el informe pintaba
// "Lead 14 / 140,0 %" sobre 10 intentos. Mas eventos que en el paso anterior no es una
// conversion, es un fallo de medicion, y un porcentaje por encima de 100 lo esconde.
test('un paso con mas eventos que el anterior se avisa en vez de dar un porcentaje', async () => {
  const embudoInflado = async (_auth, _propiedad, { dimensiones = [] }) =>
    dimensiones[0] === 'eventName'
      ? [
          { claves: ['intento_envio', '/valoracion-cartas-magic'], valores: [10] },
          { claves: ['generate_lead', '/valoracion-cartas-magic'], valores: [14] }
        ]
      : [];

  const texto = await bloqueGA4(null, { dominio: 'vendercartasmagic.es', ga4: '1' }, { desde: 'a', hasta: 'b' }, embudoInflado);

  const lead = texto.split('\n').find((linea) => /^\s*Lead\s/.test(linea));
  assert.doesNotMatch(lead, /140,0 %/);
  assert.match(lead, /14\s+mas eventos que el paso anterior, fallo de medicion/);
});

test('una ventana que ya empieza despues no se toca', async () => {
  const pedidos = [];
  const registrar = async (_auth, _propiedad, consulta) => {
    pedidos.push(consulta);
    return [];
  };

  await bloqueGA4(null, { dominio: 'vendercartasmagic.es', ga4: '1' }, { desde: '2026-12-10', hasta: '2027-03-10' }, registrar);

  const eventos = pedidos.find(({ dimensiones = [] }) => dimensiones[0] === 'eventName');
  assert.equal(eventos.desde, '2026-12-10');
});

// El reparto deja la intencion de compra sin dominio a proposito, y las acciones ya no la
// proponian. La tabla de huerfanas de la consola si: el 8 de octubre de 2026 seguia
// pintando "venta de cartas magic" como candidata a meter en las keywords de vender.
test('las consultas de compra no salen como candidatas a reclamar, pero se siguen viendo', () => {
  const consultas = [
    { dominio: 'vendercartasmagic.es', claves: ['venta de cartas magic'], clics: 0, impresiones: 20, posicion: 9 },
    { dominio: 'vendercartasmagic.es', claves: ['venta cartas magic'], clics: 0, impresiones: 19, posicion: 10.1 },
    { dominio: 'vendercartasmagic.es', claves: ['vender cartas pokemon'], clics: 1, impresiones: 15, posicion: 12 }
  ];

  const texto = bloqueKeywords(consultas, { porKeyword: new Map(), paginas: [] });
  const huerfanas = texto.split('Nadie la reclama y aun asi rankea')[1].split('Buena posicion y casi ningun clic')[0];
  const [candidatas, compra] = huerfanas.split('Intencion de compra');

  assert.match(candidatas, /vender cartas pokemon/);
  assert.doesNotMatch(candidatas, /venta de cartas magic/);
  assert.doesNotMatch(candidatas, /venta cartas magic/);
  assert.ok(compra, 'falta la linea de intencion de compra');
  assert.match(compra, /venta de cartas magic/);
  assert.match(compra, /venta cartas magic/);
});

// Sin intencion clara el reparto tampoco le da dominio, pero eso no la hace de compra:
// antes salia en la tabla con el dominio donde rankea, y ahi tiene que seguir.
test('una huerfana sin intencion clara sigue saliendo como candidata a reclamar', () => {
  const consultas = [
    { dominio: 'vendercartasmagic.es', claves: ['cartas magic sueltas'], clics: 0, impresiones: 18, posicion: 11 },
    { dominio: 'vendercartasmagic.es', claves: ['venta de cartas magic'], clics: 0, impresiones: 20, posicion: 9 }
  ];

  const texto = bloqueKeywords(consultas, { porKeyword: new Map(), paginas: [] });
  const huerfanas = texto.split('Nadie la reclama y aun asi rankea')[1].split('Buena posicion y casi ningun clic')[0];
  const [candidatas, compra] = huerfanas.split('Intencion de compra');

  assert.match(candidatas, /cartas magic sueltas.*vendercartasmagic/);
  assert.doesNotMatch(compra, /cartas magic sueltas/);
});
