const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularPresupuesto } = require('../lib/presupuesto');

const carta = (precio, cantidad = 1, extra = {}) => ({
  nombre: 'Carta', cantidad, esFoil: false, set: 'Set', rareza: 'Rare', precio, ...extra
});

test('cada tramo aplica su porcentaje', () => {
  assert.equal(calcularPresupuesto([carta(100)]).oferta, 70);
  assert.equal(calcularPresupuesto([carta(10)]).oferta, 6);
  assert.equal(calcularPresupuesto([carta(2)]).oferta, 0.7);
  assert.equal(calcularPresupuesto([carta(0.6)]).oferta, 0.12);
});

test('el bulk se paga a tanto alzado por carta, no por porcentaje', () => {
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Common' })]).oferta, 0.5);
});

test('el bulk de rara o mitica se paga aparte del de comun', () => {
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Rare' })]).oferta, 5);
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Mythic' })]).oferta, 5);
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Uncommon' })]).oferta, 0.5);
});

// ManaBox escribe la rareza en minuscula en algunos exports, y una carta sin rareza no
// puede cobrar la tarifa alta por accidente: ante la duda cae en la de comun.
test('la rareza se reconoce sin distinguir mayusculas y a falta de dato paga la baja', () => {
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'rare' })]).oferta, 5);
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: '' })]).oferta, 0.5);
});

test('los limites de tramo caen en el tramo alto', () => {
  assert.equal(calcularPresupuesto([carta(20)]).oferta, 14);
  assert.equal(calcularPresupuesto([carta(5)]).oferta, 3);
  assert.equal(calcularPresupuesto([carta(1)]).oferta, 0.35);
  assert.equal(calcularPresupuesto([carta(0.5)]).oferta, 0.1);
});

test('la cantidad multiplica valor y oferta', () => {
  const r = calcularPresupuesto([carta(100, 3)]);
  assert.equal(r.valorMercado, 300);
  assert.equal(r.oferta, 210);
});

test('el total suma todas las cartas y redondea a dos decimales', () => {
  const r = calcularPresupuesto([
    carta(100), carta(10), carta(2), carta(0.6), carta(0.02, 50, { rareza: 'Common' })
  ]);
  assert.equal(r.valorMercado, 113.6);
  assert.equal(r.oferta, 77.07);
  assert.equal(r.totalCartas, 54);
});

test('informa del desglose por tramo', () => {
  const r = calcularPresupuesto([carta(100, 2), carta(0.02, 10, { rareza: 'Common' })]);
  const premium = r.tramos.find((t) => t.id === 'premium');
  assert.equal(premium.cartas, 2);
  assert.equal(premium.valorMercado, 200);
  assert.equal(premium.oferta, 140);
  assert.equal(r.tramos.find((t) => t.id === 'bulk').cartas, 10);
});

test('el bulk de rara y el de comun se desglosan por separado', () => {
  const r = calcularPresupuesto([
    carta(0.02, 10, { rareza: 'Rare' }), carta(0.02, 40, { rareza: 'Common' })
  ]);
  assert.equal(r.tramos.find((t) => t.id === 'bulkRara').cartas, 10);
  assert.equal(r.tramos.find((t) => t.id === 'bulkRara').oferta, 0.5);
  assert.equal(r.tramos.find((t) => t.id === 'bulk').cartas, 40);
  assert.equal(r.tramos.find((t) => t.id === 'bulk').oferta, 0.2);
});

test('marca si la oferta queda por debajo del minimo', () => {
  assert.equal(calcularPresupuesto([carta(100)]).bajoMinimo, false);
  assert.equal(calcularPresupuesto([carta(1)]).bajoMinimo, true);
});

test('una caja de bulk entera se queda muy por debajo del minimo', () => {
  assert.equal(calcularPresupuesto([carta(0.1, 500, { rareza: 'Common' })]).bajoMinimo, true);
});

test('separa el recuento de foils para poder revisarlas', () => {
  const r = calcularPresupuesto([carta(100, 2, { esFoil: true }), carta(10)]);
  assert.equal(r.totalFoils, 2);
});

test('lista las cartas mas caras ordenadas de mayor a menor', () => {
  const r = calcularPresupuesto([carta(5), carta(100), carta(30)]);
  assert.deepEqual(r.masCaras.slice(0, 3).map((c) => c.precio), [100, 30, 5]);
});

test('un mazo sin valor no revienta', () => {
  const r = calcularPresupuesto([]);
  assert.equal(r.oferta, 0);
  assert.equal(r.valorMercado, 0);
  assert.equal(r.bajoMinimo, true);
});
