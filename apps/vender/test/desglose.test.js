const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { componerDesgloseCsv } = require('../lib/desglose');
const { calcularPresupuesto } = require('../lib/presupuesto');
const mazoValorado = require('./fixtures/mazo-valorado-en-mtginvestor.json');

const carta = (extra = {}) => ({ nombre: 'Sol Ring', cantidad: 1, esFoil: false, set: 'C21', rareza: 'Uncommon', precio: 1.5, ...extra });

test('la primera fila son las cabeceras', () => {
  const [cabecera] = componerDesgloseCsv([carta()]).replace('﻿', '').split('\r\n');
  assert.equal(cabecera, 'Cantidad;Carta;Edicion;Rareza;Foil;Precio unidad EUR;Precio total EUR;Tramo;Se paga EUR');
});

test('cada carta sale con su tramo y lo que se paga', () => {
  const filas = componerDesgloseCsv([carta({ precio: 100, cantidad: 2 })]).split('\r\n');
  assert.equal(filas[1], '2;Sol Ring;C21;Uncommon;No;100,00;200,00;Cartas de 20 EUR o mas;119,00');
});

test('las foil se marcan', () => {
  const filas = componerDesgloseCsv([carta({ esFoil: true })]).split('\r\n');
  assert.match(filas[1], /;Si;/);
});

test('se usa la coma decimal, para que Excel en espanol lo lea bien', () => {
  const filas = componerDesgloseCsv([carta({ precio: 1234.5 })]).split('\r\n');
  assert.match(filas[1], /1234,50/);
  assert.doesNotMatch(filas[1], /1\.234/, 'sin separador de millares, que rompe la celda');
});

test('las cartas van de mas cara a mas barata', () => {
  const filas = componerDesgloseCsv([carta({ nombre: 'Barata', precio: 1 }), carta({ nombre: 'Cara', precio: 90 })]).split('\r\n');
  assert.match(filas[1], /Cara/);
  assert.match(filas[2], /Barata/);
});

test('un punto y coma en el nombre no parte la fila', () => {
  const filas = componerDesgloseCsv([carta({ nombre: 'Carta; rara' })]).split('\r\n');
  assert.match(filas[1], /"Carta; rara"/);
});

test('una comilla en el nombre se escapa doblandola', () => {
  const filas = componerDesgloseCsv([carta({ nombre: 'Ach! Hans, Run! "Fun"' })]).split('\r\n');
  assert.match(filas[1], /"Ach! Hans, Run! ""Fun"""/);
});

test('el envio se descuenta en su propia fila antes del total', () => {
  const filas = componerDesgloseCsv([carta({ precio: 100 }), carta({ precio: 10 })]).split('\r\n');
  assert.equal(filas.at(-2), 'ENVIO;;;;;;;;-5,00');
  assert.equal(filas.at(-1), 'TOTAL;;;;;;110,00;;59,60');
});

test('a partir de 100 € de oferta no sale la fila del envio', () => {
  const filas = componerDesgloseCsv([carta({ precio: 200 })]).split('\r\n');
  assert.ok(filas.every((f) => !f.startsWith('ENVIO')));
  assert.equal(filas.at(-1), 'TOTAL;;;;;;200,00;;119,00');
});

test('el bulk comun se paga a su tarifa y no a la de rara', () => {
  const filas = componerDesgloseCsv([
    carta({ precio: 0.02, cantidad: 100, rareza: 'Common' }),
    carta({ precio: 0.01, cantidad: 100, rareza: 'Rare' })
  ]).split('\r\n');
  assert.ok(filas.includes('SUBTOTAL;100 cartas a 0,003 EUR;;;;;;Bulk de común o infrecuente (menos de 0,50 EUR);0,30'));
  assert.ok(filas.includes('SUBTOTAL;100 cartas a 0,05 EUR;;;;;;Bulk de rara o mitica (menos de 0,50 EUR);5,00'));
});

// Una carta de bulk se paga a 0,003 EUR: redondeada sola sale a 0,00, y cien filas asi no
// suman lo que se paga por ellas. El bulk se redondea una vez, en el subtotal de su tramo.
test('la carta de bulk no lleva pago propio, que va en el subtotal del tramo', () => {
  const filas = componerDesgloseCsv([carta({ precio: 0.1, rareza: 'Common' })]).split('\r\n');
  assert.equal(filas[1], '1;Sol Ring;C21;Common;No;0,10;0,10;Bulk de común o infrecuente (menos de 0,50 EUR);');
});

const numero = (celda) => Number(celda.replace(',', '.'));

const cartasDelDesglose = (csv) =>
  csv.trim().split(/\r?\n/).slice(1).map((l) => l.split(';'))
    .filter(([cantidad]) => !['ENVIO', 'TOTAL'].includes(cantidad))
    .map(([cantidad, nombre, set, rareza, foil, precio]) =>
      ({ cantidad: numero(cantidad), nombre, set, rareza, esFoil: foil === 'Si', precio: numero(precio) }));

// Fixture: el desglose real de un lote de 237 cartas, casi todo bulk, cuya columna sumaba
// 7,71 EUR contra un total y un correo de 7,92.
test('la columna de lo que se paga suma el total, que es la oferta del correo', () => {
  const cartas = cartasDelDesglose(fs.readFileSync(path.join(__dirname, 'fixtures/desglose-coleccion-bulk.csv'), 'utf8'));
  const filas = componerDesgloseCsv(cartas, {}).split('\r\n').map((f) => f.split(';'));
  const centimos = (celda) => Math.round(numero(celda || '0') * 100);
  const suma = filas.slice(1, -1).reduce((s, f) => s + centimos(f[8]), 0);
  const total = centimos(filas.at(-1)[8]);

  assert.equal(suma, total);
  assert.equal(total, Math.round(calcularPresupuesto(cartas, {}).oferta * 100));
});

test('la carta sin precio sale sin valorar y sin pago', () => {
  const filas = componerDesgloseCsv([carta({ precio: 0 })]).split('\r\n');
  assert.equal(filas[1], '1;Sol Ring;C21;Uncommon;No;;;Sin precio en Cardmarket;');
});

test('el total del csv es la oferta del correo', () => {
  const oferta = calcularPresupuesto(mazoValorado).oferta.toFixed(2).replace('.', ',');
  const csv = componerDesgloseCsv(mazoValorado.map((c) => ({ nombre: 'x', set: 's', ...c })));
  assert.equal(csv.split('\r\n').at(-1), `TOTAL;;;;;;978,03;;${oferta}`);
});

test('una formula en el nombre no se ejecuta al abrir la hoja', () => {
  const filas = componerDesgloseCsv([carta({ nombre: '=HYPERLINK("http://malo")' })]).split('\r\n');
  assert.match(filas[1], /'=HYPERLINK/, 'debe quedar neutralizada con un apostrofo');
});

test('el csv empieza por BOM, para que Excel respete las tildes', () => {
  assert.ok(componerDesgloseCsv([carta({ nombre: 'Sénéchal' })]).startsWith('\ufeff'));
});
