const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { leerOperaciones, resumir, partirLinea, mediana } = require('../scripts/agregados-compras');

const CABECERA =
  'hace,cdo,quien,numero de cartas,tasado,pagado en cash,pagado en cartas,total entregado (en cartas valoramos 20% menos),total ganancia';

const conCsv = (filas) => {
  const ruta = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'hub-compras-')),
    'historico.csv'
  );
  fs.writeFileSync(ruta, [CABECERA, ...filas].join('\n'));
  return ruta;
};

test('parte las celdas respetando las comas dentro de las comillas', () => {
  assert.deepEqual(partirLinea('a,"uno, dos",b'), ['a', 'uno, dos', 'b']);
});

test('parte las celdas respetando las comillas escapadas', () => {
  assert.deepEqual(partirLinea('a,"dice ""hola"" y sale",b'), ['a', 'dice "hola" y sale', 'b']);
});

test('lee las operaciones con las columnas que importan', () => {
  const ruta = conCsv(['239,1/9/2026,A,516,500,0,240,192,308']);

  assert.deepEqual(leerOperaciones(ruta), [
    { cartas: 516, tasado: 500, entregado: 192, cartasValor: null }
  ]);
});

// Una operacion que no se cerro no es una compra: contarla hundiria las cifras.
test('descarta las operaciones sin importe entregado', () => {
  const ruta = conCsv([
    '239,1/9/2026,A,516,500,0,240,192,308',
    '236,1/12/2026,C,168,550,0,0,0,550'
  ]);

  assert.equal(leerOperaciones(ruta).length, 1);
});

test('lee los importes escritos con coma decimal', () => {
  const ruta = conCsv(['239,1/9/2026,A,516,500,0,240,"192,50",308']);

  assert.equal(leerOperaciones(ruta)[0].entregado, 192.5);
});

test('avisa si el csv no trae las columnas esperadas', () => {
  const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hub-compras-')), 'otro.csv');
  fs.writeFileSync(ruta, 'una,cabecera,cualquiera\n1,2,3');

  assert.throws(() => leerOperaciones(ruta), /No encuentro las columnas/);
});

test('calcula la mediana con un numero par de valores', () => {
  assert.equal(mediana([1, 2, 3, 4]), 2.5);
});

test('calcula la mediana con un numero impar de valores', () => {
  assert.equal(mediana([3, 1, 2]), 2);
});

test('resume los totales y los rangos', () => {
  const r = resumir([
    { cartas: 100, tasado: 500, entregado: 400 },
    { cartas: 200, tasado: 800, entregado: 600 },
    { cartas: 300, tasado: 900, entregado: 800 }
  ]);

  assert.equal(r.operaciones, 3);
  assert.equal(r.cartasTotales, 600);
  assert.equal(r.pagadoTotal, 1800);
  assert.equal(r.cartasMediana, 200);
  assert.equal(r.pagadoMin, 400);
  assert.equal(r.pagadoMax, 800);
});

// La columna de cartas de 5 euros o mas tiene alguna fila con mas cartas caras que
// cartas en total, que es imposible. Esas filas se descartan solo para el calculo de la
// proporcion: sus importes siguen contando en los totales.
test('descarta del recuento de valor las filas con mas cartas caras que cartas', () => {
  const operaciones = [
    { cartas: 500, tasado: 500, entregado: 400, cartasValor: 25 },
    { cartas: 26, tasado: 2700, entregado: 1900, cartasValor: 153 }
  ];

  const r = resumir(operaciones);

  assert.equal(r.operaciones, 2);
  assert.equal(r.operacionesConValor, 1);
  assert.equal(r.porcentajeValor, 5);
  assert.equal(r.porcentajeBulk, 95);
});

test('no calcula proporcion si ninguna fila es coherente', () => {
  const r = resumir([{ cartas: 26, tasado: 2700, entregado: 1900, cartasValor: 153 }]);

  assert.equal(r.operacionesConValor, 0);
  assert.equal(r.porcentajeValor, null);
  assert.equal(r.porcentajeBulk, null);
});

test('lee la columna de cartas de 5 euros o mas', () => {
  const ruta = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'hub-compras-')),
    'historico.csv'
  );
  fs.writeFileSync(
    ruta,
    [
      'hace,cdo,quien,numero de cartas,tasado,pagado en cash,pagado en cartas,total entregado (x),total ganancia,pct,pct efectivo,numero cartas valor 5 euros o mas',
      '239,1/9/2026,A,516,500,0,240,192,308,"0,6","0,5",26'
    ].join('\n')
  );

  assert.equal(leerOperaciones(ruta)[0].cartasValor, 26);
});
