const test = require('node:test');
const assert = require('node:assert');
const { bloqueGSC } = require('../lib/informe');

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
