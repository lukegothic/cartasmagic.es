const test = require('node:test');
const assert = require('node:assert/strict');
const { componerDesgloseCsv } = require('../lib/desglose');

const carta = (extra = {}) => ({ nombre: 'Sol Ring', cantidad: 1, esFoil: false, set: 'C21', rareza: 'Uncommon', precio: 1.5, ...extra });

test('la primera fila son las cabeceras', () => {
  const [cabecera] = componerDesgloseCsv([carta()]).replace('﻿', '').split('\r\n');
  assert.equal(cabecera, 'Cantidad;Carta;Edicion;Rareza;Foil;Precio unidad EUR;Precio total EUR;Tramo;Se paga EUR');
});

test('cada carta sale con su tramo y lo que se paga', () => {
  const filas = componerDesgloseCsv([carta({ precio: 100, cantidad: 2 })]).split('\r\n');
  assert.equal(filas[1], '2;Sol Ring;C21;Uncommon;No;100,00;200,00;Cartas de 20 EUR o mas;120,00');
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

test('el pie totaliza mercado y oferta', () => {
  const csv = componerDesgloseCsv([carta({ precio: 100 }), carta({ precio: 10 })]);
  assert.match(csv, /TOTAL;;;;;;110,00;;65,00/);
});

test('una formula en el nombre no se ejecuta al abrir la hoja', () => {
  const filas = componerDesgloseCsv([carta({ nombre: '=HYPERLINK("http://malo")' })]).split('\r\n');
  assert.match(filas[1], /'=HYPERLINK/, 'debe quedar neutralizada con un apostrofo');
});

test('el csv empieza por BOM, para que Excel respete las tildes', () => {
  assert.ok(componerDesgloseCsv([carta({ nombre: 'Sénéchal' })]).startsWith('\ufeff'));
});
