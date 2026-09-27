const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularPresupuesto } = require('../lib/presupuesto');
const mazoValorado = require('./fixtures/mazo-valorado-en-mtginvestor.json');

const carta = (precio, cantidad = 1, extra = {}) => ({
  nombre: 'Carta', cantidad, esFoil: false, set: 'Set', rareza: 'Rare', precio, ...extra
});

const tramoDe = (precio) => calcularPresupuesto([carta(precio)]).tramos.find((t) => t.cartas > 0).id;

// Todas las cartas se valoran como EX, que paga el 85 % de su precio de Cardmarket.
test('cada tramo aplica su porcentaje sobre el precio en EX', () => {
  assert.equal(calcularPresupuesto([carta(100)]).ofertaCartas, 59.5);
  assert.equal(calcularPresupuesto([carta(10)]).ofertaCartas, 4.25);
  assert.equal(calcularPresupuesto([carta(2)]).ofertaCartas, 0.34);
  assert.equal(calcularPresupuesto([carta(0.6)]).ofertaCartas, 0.05);
});

test('el bulk se paga a tanto alzado por carta, sin rebaja por estado', () => {
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Common' })]).ofertaCartas, 0.5);
});

test('el bulk de rara o mitica se paga aparte del de comun', () => {
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Rare' })]).ofertaCartas, 5);
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Mythic' })]).ofertaCartas, 5);
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'Uncommon' })]).ofertaCartas, 0.5);
});

// ManaBox escribe la rareza en minuscula en algunos exports, y una carta sin rareza no
// puede cobrar la tarifa alta por accidente: ante la duda cae en la de comun.
test('la rareza se reconoce sin distinguir mayusculas y a falta de dato paga la baja', () => {
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: 'rare' })]).ofertaCartas, 5);
  assert.equal(calcularPresupuesto([carta(0.02, 100, { rareza: '' })]).ofertaCartas, 0.5);
});

// El tramo sale del precio de Cardmarket, no del rebajado por estado, como en mtginvestor.
test('los limites de tramo caen en el tramo alto', () => {
  assert.equal(tramoDe(20), 'premium');
  assert.equal(tramoDe(5), 'alta');
  assert.equal(tramoDe(1), 'media');
  assert.equal(tramoDe(0.5), 'baja');
});

test('la cantidad multiplica valor y oferta', () => {
  const r = calcularPresupuesto([carta(100, 3)]);
  assert.equal(r.valorMercado, 300);
  assert.equal(r.ofertaCartas, 178.5);
});

test('el total suma todas las cartas y redondea a dos decimales', () => {
  const r = calcularPresupuesto([
    carta(100), carta(10), carta(2), carta(0.6), carta(0.02, 50, { rareza: 'Common' })
  ]);
  assert.equal(r.valorMercado, 113.6);
  assert.equal(r.ofertaCartas, 64.39);
  assert.equal(r.totalCartas, 54);
});

test('el envio se descuenta de la oferta', () => {
  const r = calcularPresupuesto([carta(100)]);
  assert.equal(r.costeEnvio, 5);
  assert.equal(r.oferta, 54.5);
});

test('la oferta no baja de cero por descontar el envio', () => {
  assert.equal(calcularPresupuesto([carta(1)]).oferta, 0);
});

test('informa del desglose por tramo', () => {
  const r = calcularPresupuesto([carta(100, 2), carta(0.02, 10, { rareza: 'Common' })]);
  const premium = r.tramos.find((t) => t.id === 'premium');
  assert.equal(premium.cartas, 2);
  assert.equal(premium.valorMercado, 200);
  assert.equal(premium.oferta, 119);
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

// Una carta sin precio no es bulk: pagarla como bulk seria inventarse que no vale nada.
test('la carta sin precio de Cardmarket queda sin valorar, fuera de los tramos de pago', () => {
  const r = calcularPresupuesto([carta(100), carta(0, 3, { rareza: 'Common' })]);
  const sinPrecio = r.tramos.find((t) => t.id === 'sinPrecio');
  assert.equal(sinPrecio.cartas, 3);
  assert.equal(sinPrecio.oferta, 0);
  assert.equal(r.tramos.find((t) => t.id === 'bulk').cartas, 0);
  assert.equal(r.ofertaCartas, 59.5);
  assert.equal(r.totalCartas, 4);
});

test('marca si la oferta queda por debajo del minimo', () => {
  assert.equal(calcularPresupuesto([carta(100)]).bajoMinimo, false);
  assert.equal(calcularPresupuesto([carta(1)]).bajoMinimo, true);
});

test('el minimo se mira despues de descontar el envio', () => {
  const r = calcularPresupuesto([carta(90)]);
  assert.equal(r.ofertaCartas, 53.55);
  assert.equal(r.bajoMinimo, true);
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

// Mazo real que se valoro a mano en mtginvestor, en EX y con envio, en 371,65 €. La web
// daba 527,16 € por el mismo mazo. Si esto se mueve, la web vuelve a prometer otra cifra.
test('un mazo da la misma oferta que en mtginvestor', () => {
  const r = calcularPresupuesto(mazoValorado);
  assert.equal(r.valorMercado, 978.03);
  assert.equal(r.ofertaCartas, 376.65);
  assert.equal(r.oferta, 371.65);
});
