const test = require('node:test');
const assert = require('node:assert');
const { detectarGeo, agruparGeo } = require('../lib/geo');

test('reconoce una provincia en la consulta', () => {
  assert.equal(detectarGeo('vender cartas magic madrid'), 'madrid');
  assert.equal(detectarGeo('vender cartas magic barcelona'), 'barcelona');
  assert.equal(detectarGeo('tiendas magic valencia'), 'valencia');
});

test('no inventa geografia donde no la hay', () => {
  assert.equal(detectarGeo('vender cartas magic'), null);
  assert.equal(detectarGeo('cuanto vale una carta magic'), null);
});

// "magic" contiene "gi" y otras subcadenas que pegarian con nombres cortos si la
// comparacion no fuera por palabra completa.
test('no confunde una subcadena con un nombre de sitio', () => {
  assert.equal(detectarGeo('magic the gathering'), null);
  assert.equal(detectarGeo('vender cartas magic online'), null);
});

test('reconoce ciudades que no son capital de provincia', () => {
  assert.equal(detectarGeo('capellades'), 'barcelona');
});

test('agrupa las consultas por zona y suma impresiones', () => {
  const filas = [
    { claves: ['vender cartas magic madrid'], impresiones: 14, clics: 1, posicion: 12.6 },
    { claves: ['comprar cartas magic madrid'], impresiones: 6, clics: 0, posicion: 20 },
    { claves: ['vender cartas magic barcelona'], impresiones: 5, clics: 0, posicion: 29.4 },
    { claves: ['vender cartas magic'], impresiones: 250, clics: 23, posicion: 10.8 }
  ];
  const zonas = agruparGeo(filas);

  assert.equal(zonas.length, 2);
  assert.equal(zonas[0].zona, 'madrid');
  assert.equal(zonas[0].impresiones, 20);
  assert.equal(zonas[0].consultas.length, 2);
  assert.equal(zonas[1].zona, 'barcelona');
});

// El aviso importante: con estas cifras una pagina por provincia no se sostiene, y el
// informe tiene que decirlo en vez de invitar a crear 52 paginas casi iguales.
test('marca si una zona tiene volumen suficiente para una pagina propia', () => {
  const pocas = agruparGeo([
    { claves: ['vender cartas magic madrid'], impresiones: 14, clics: 1, posicion: 12.6 }
  ]);
  assert.equal(pocas[0].merecePagina, false);

  const muchas = agruparGeo([
    { claves: ['vender cartas magic madrid'], impresiones: 90, clics: 4, posicion: 12 },
    { claves: ['comprar cartas magic madrid'], impresiones: 70, clics: 2, posicion: 15 }
  ]);
  assert.equal(muchas[0].merecePagina, true);
});
