const { test } = require('node:test');
const assert = require('node:assert');

const { medidor, barras, dispersion, matriz, serieTemporal } = require('../lib/graficos');

// El SVG se sirve como fichero, no incrustado, asi que tiene que traer sus medidas y su
// viewBox: sin ellos el navegador no sabe cuanto sitio reservar y la pagina da saltos.
test('el SVG declara viewBox y medidas', () => {
  const svg = medidor({ etiqueta: 'Cartas de 5 euros o mas', porcentaje: 14 });

  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /width="\d+"/);
  assert.match(svg, /height="\d+"/);
});

// El grafico lo lee tambien quien no ve la pagina. Sin title accesible es una imagen muda.
test('el SVG lleva un titulo accesible', () => {
  const svg = medidor({ etiqueta: 'Cartas de 5 euros o mas', porcentaje: 14 });

  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-labelledby="titulo"/);
  assert.match(svg, /<title id="titulo">[^<]+<\/title>/);
});

test('el medidor pinta la proporcion y su complemento', () => {
  const svg = medidor({ etiqueta: 'Cartas de 5 euros o mas', porcentaje: 14 });

  assert.match(svg, /14 %/);
  assert.match(svg, /86 %/);
});

// Un porcentaje fuera de rango saldria como una barra que se sale del carril.
test('el medidor rechaza porcentajes imposibles', () => {
  assert.throws(() => medidor({ etiqueta: 'x', porcentaje: 140 }), /porcentaje/);
  assert.throws(() => medidor({ etiqueta: 'x', porcentaje: -1 }), /porcentaje/);
});

const ACABADOS = [
  { etiqueta: 'Normal', valor: 89.28 },
  { etiqueta: 'Foil', valor: 109.43 },
  { etiqueta: 'Foil especial bundle', valor: 86.11 },
  { etiqueta: 'Foil arte extendido', valor: 238.33 },
  { etiqueta: 'Foil de presentación', valor: 205.46 },
  { etiqueta: 'Foil "Silver Scroll"', valor: 714.0 }
];

test('las barras salen una por cada valor', () => {
  const svg = barras({ titulo: 'Acabados', series: ACABADOS, destacada: 'Normal' });

  assert.equal((svg.match(/class="barra"/g) || []).length, ACABADOS.length);
});

// La barra destacada es la referencia con la que se comparan las demas: se pinta con el
// color de marca y el resto en gris, que es lo que dirige la mirada al dato que importa.
test('solo la barra destacada lleva el color de marca', () => {
  const svg = barras({ titulo: 'Acabados', series: ACABADOS, destacada: 'Normal' });

  assert.equal((svg.match(/fill="#7c5cbf"/g) || []).length, 1);
});

test('las barras rechazan una destacada que no existe', () => {
  assert.throws(
    () => barras({ titulo: 'x', series: ACABADOS, destacada: 'No existe' }),
    /destacada/
  );
});

// Los importes se leen en la pagina, no solo al pasar el raton: un SVG estatico no tiene
// donde poner un tooltip.
test('las barras etiquetan cada valor en euros', () => {
  const svg = barras({ titulo: 'Acabados', series: ACABADOS, destacada: 'Normal' });

  assert.match(svg, /714 euros/);
  assert.match(svg, /86 euros/);
});

const COLECCIONES = [
  { cartas: 26, pagado: 1900 },
  { cartas: 978, pagado: 700 },
  { cartas: 428, pagado: 830 },
  { cartas: 120, pagado: 192 }
];

test('la dispersion pinta un punto por coleccion', () => {
  const svg = dispersion({ titulo: 'Cartas frente a importe', puntos: COLECCIONES });

  assert.equal((svg.match(/class="punto"/g) || []).length, COLECCIONES.length);
});

// Los dos extremos son el argumento del articulo: la coleccion de 26 cartas que se pago
// a 1.900 euros y la de casi mil que se pago a 700.
test('la dispersion rotula los dos extremos y ningun punto mas', () => {
  const svg = dispersion({ titulo: 'x', puntos: COLECCIONES });

  assert.equal((svg.match(/class="rotulo-punto"/g) || []).length, 2);
});

test('la dispersion aguanta un solo punto sin romper la escala', () => {
  const svg = dispersion({ titulo: 'x', puntos: [{ cartas: 400, pagado: 800 }] });

  assert.match(svg, /class="punto"/);
  assert.ok(!svg.includes('NaN'));
});

test('la dispersion rechaza una lista vacia', () => {
  assert.throws(() => dispersion({ titulo: 'x', puntos: [] }), /puntos/);
});

// Un SVG con NaN en una coordenada no lo dibuja ningun navegador, y el fallo es mudo.
test('ningun grafico emite NaN', () => {
  const svgs = [
    medidor({ etiqueta: 'x', porcentaje: 0 }),
    medidor({ etiqueta: 'x', porcentaje: 100 }),
    barras({ titulo: 'x', series: ACABADOS, destacada: 'Foil' }),
    dispersion({ titulo: 'x', puntos: COLECCIONES })
  ];

  svgs.forEach((svg) => assert.ok(!svg.includes('NaN'), 'hay un NaN en el SVG'));
});

// Los textos de los graficos entran en el HTML: un ampersand suelto rompe el documento.
test('escapa los caracteres que romperian el XML', () => {
  const svg = barras({
    titulo: 'Precio & acabado',
    series: [{ etiqueta: 'Normal <foil>', valor: 10 }],
    destacada: 'Normal <foil>'
  });

  assert.ok(!svg.includes('Precio & acabado'));
  assert.match(svg, /Precio &amp; acabado/);
  assert.match(svg, /Normal &lt;foil&gt;/);
});

// El grafico compara importes, asi que se lee ordenado: en el orden en que aparecen en la
// tabla del articulo hay que ir y volver entre filas para ver cual supera a cual.
test('las barras se ordenan de menor a mayor importe', () => {
  const svg = barras({ titulo: 'Acabados', series: ACABADOS, destacada: 'Normal' });

  const anchos = [...svg.matchAll(/class="barra"[^>]*width="(\d+)"/g)].map((m) => Number(m[1]));

  assert.deepEqual(anchos, [...anchos].sort((a, b) => a - b));
});

const DESCUENTOS = {
  columnas: ['EX', 'GD', 'LP o peor'],
  filas: [
    { etiqueta: 'Menos de 15 euros', valores: [80, 70, 50] },
    { etiqueta: 'De 15 a 25 euros', valores: [85, 70, 50] },
    { etiqueta: 'De 25 a 100 euros', valores: [85, 75, 65] },
    { etiqueta: 'Más de 100 euros', valores: [90, 80, 70] },
    { etiqueta: 'Alpha, Beta y Unlimited', valores: [80, 60, 40] },
    { etiqueta: 'Foils', valores: [75, 50, 30] }
  ]
};

test('la matriz pinta una celda por valor', () => {
  const svg = matriz({ titulo: 'Descuentos', ...DESCUENTOS });

  assert.equal((svg.match(/class="celda"/g) || []).length, 18);
});

// El valor va escrito en cada celda: el color da la lectura de un vistazo, pero quien
// busca su caso concreto necesita la cifra, no un tono.
test('la matriz rotula cada celda con su porcentaje', () => {
  const svg = matriz({ titulo: 'Descuentos', ...DESCUENTOS });

  assert.equal((svg.match(/>\d+ %</g) || []).length, 18);
});

// Mas oscuro es mas perdida: la rampa tiene que ir en el mismo sentido que la cifra, o el
// color dice lo contrario que el numero que lleva encima.
test('la matriz pinta mas oscuro el valor mas alto', () => {
  const svg = matriz({
    titulo: 'x',
    columnas: ['EX', 'GD', 'LP'],
    filas: [{ etiqueta: 'a', valores: [10, 40, 70] }]
  });

  const tonos = [...svg.matchAll(/class="celda"[^>]*fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  const claridad = (hex) =>
    [1, 3, 5].reduce((t, i) => t + parseInt(hex.slice(i, i + 2), 16), 0);

  assert.ok(
    claridad(tonos[0]) > claridad(tonos[1]) && claridad(tonos[1]) > claridad(tonos[2]),
    'la celda del valor mas alto tiene que ser la mas oscura'
  );
});

// Sobre los tonos claros de la rampa el texto blanco no llega al contraste minimo, asi
// que la tinta de cada celda depende de lo claro que sea su fondo.
test('la matriz elige la tinta segun lo claro que sea el fondo', () => {
  const svg = matriz({ titulo: 'Descuentos', ...DESCUENTOS });

  assert.match(svg, /fill="#ffffff"/);
  assert.match(svg, /fill="#0a0a0f"/);
});

test('la matriz rechaza una fila con menos valores que columnas', () => {
  assert.throws(
    () =>
      matriz({
        titulo: 'x',
        columnas: ['EX', 'GD'],
        filas: [{ etiqueta: 'a', valores: [80] }]
      }),
    /valores/
  );
});

const SERIE = [
  { fecha: '1993-12-17', valor: 6534 },
  { fecha: '1997-10-14', valor: 1816 },
  { fecha: '2003-10-02', valor: 341 },
  { fecha: '2013-02-01', valor: 20 },
  { fecha: '2024-08-02', valor: 181 }
];

test('la serie pinta un punto por edicion', () => {
  const svg = serieTemporal({ titulo: 'x', puntos: SERIE, corte: '2003-07-28' });

  assert.equal((svg.match(/class="hito-serie"/g) || []).length, SERIE.length);
});

// El rango va de 20 a 6.534 dolares: en escala lineal la edicion mas barata mide un pixel
// y no se ve. La logaritmica las mantiene todas legibles sin recortar ninguna.
test('la escala es logaritmica, no lineal', () => {
  const svg = serieTemporal({ titulo: 'x', puntos: SERIE, corte: '2003-07-28' });
  const ys = [...svg.matchAll(/class="hito-serie"[^>]*cy="([\d.]+)"/g)].map((m) => Number(m[1]));

  // Con escala lineal el salto de 6.534 a 1.816 se comeria casi toda la altura y el resto
  // quedaria amontonado abajo. En log los tres primeros quedan repartidos.
  const [alto1, alto2, alto3] = ys;
  assert.ok(alto2 - alto1 < (alto3 - alto1) * 0.9, 'los saltos no estan comprimidos');
});

test('la serie marca la frontera de la Octava Edicion', () => {
  const svg = serieTemporal({ titulo: 'x', puntos: SERIE, corte: '2003-07-28' });

  assert.match(svg, /class="corte"/);
});

test('la serie rechaza una lista vacia', () => {
  assert.throws(() => serieTemporal({ titulo: 'x', puntos: [], corte: '2003-07-28' }), /puntos/);
});
