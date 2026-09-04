const test = require('node:test');
const assert = require('node:assert/strict');
const { leerTramos, leerOfertaMinima } = require('../lib/presupuesto');

const carta = (precio, cantidad = 1) => ({ nombre: 'x', cantidad, esFoil: false, set: 's', rareza: 'r', precio });

test('sin variables de entorno se usan los porcentajes por defecto', () => {
  const tramos = leerTramos({});
  assert.equal(tramos.find((t) => t.id === 'premium').porcentaje, 0.6);
  assert.equal(tramos.find((t) => t.id === 'bulk').porUnidad, 0.02);
});

test('cada variable de entorno cambia su tramo', () => {
  const tramos = leerTramos({
    TRAMO_PREMIUM_PCT: '70', TRAMO_ALTA_PCT: '60', TRAMO_MEDIA_PCT: '45',
    TRAMO_BAJA_PCT: '30', TRAMO_BULK_EUR: '0.03'
  });
  assert.deepEqual(tramos.map((t) => t.porcentaje ?? t.porUnidad), [0.7, 0.6, 0.45, 0.3, 0.03]);
});

test('el porcentaje se escribe como entero y se aplica como fracción', () => {
  const { calcularPresupuesto } = require('../lib/presupuesto');
  assert.equal(calcularPresupuesto([carta(100)], { TRAMO_PREMIUM_PCT: '70' }).oferta, 70);
});

test('un valor no numérico o fuera de rango cae al valor por defecto', () => {
  assert.equal(leerTramos({ TRAMO_PREMIUM_PCT: 'mucho' }).find((t) => t.id === 'premium').porcentaje, 0.6);
  assert.equal(leerTramos({ TRAMO_PREMIUM_PCT: '' }).find((t) => t.id === 'premium').porcentaje, 0.6);
  assert.equal(leerTramos({ TRAMO_PREMIUM_PCT: '-5' }).find((t) => t.id === 'premium').porcentaje, 0.6);
  assert.equal(leerTramos({ TRAMO_PREMIUM_PCT: '250' }).find((t) => t.id === 'premium').porcentaje, 0.6);
});

test('se admite el cero, que significa no pagar ese tramo', () => {
  assert.equal(leerTramos({ TRAMO_BAJA_PCT: '0' }).find((t) => t.id === 'baja').porcentaje, 0);
  assert.equal(leerTramos({ TRAMO_BULK_EUR: '0' }).find((t) => t.id === 'bulk').porUnidad, 0);
});

test('las etiquetas siguen los cortes, que no se configuran', () => {
  assert.equal(leerTramos({}).find((t) => t.id === 'premium').etiqueta, 'Cartas de 20 € o más');
});

test('la oferta minima tambien sale del entorno', () => {
  assert.equal(leerOfertaMinima({}), 50);
  assert.equal(leerOfertaMinima({ OFERTA_MINIMA: '120' }), 120);
  assert.equal(leerOfertaMinima({ OFERTA_MINIMA: 'nada' }), 50);
});

test('la oferta minima configurada decide el aviso', () => {
  const { calcularPresupuesto } = require('../lib/presupuesto');
  assert.equal(calcularPresupuesto([carta(100)], { OFERTA_MINIMA: '1000' }).bajoMinimo, true);
  assert.equal(calcularPresupuesto([carta(100)], { OFERTA_MINIMA: '10' }).bajoMinimo, false);
});
