// Pruebas de la recogida. No tocan la red: cada tipo de fuente recibe su lector de mentira.

const test = require('node:test');
const assert = require('node:assert/strict');

const { aNumero, leerTabla } = require('../lib/tabla');
const { recogerFuente } = require('../lib/recoger');
const { componerRevision } = require('../lib/revision');

const devolver = (valor) => async () => valor;

const TABLA_HTML = `
<img src="files/mtg_logo_2_480x480.png">
<table><tbody>
<tr><td>Unlimited Edition</td><td>Black Lotus</td><td>233</td><td></td><td>Lightly Played</td><td>$15,000.00</td></tr>
<tr><td>Tempest</td><td>Wasteland</td><td>46</td><td></td><td>Near Mint</td><td>$100.00</td></tr>
<tr><td>Cabecera suelta</td></tr>
</tbody></table>
<img src="files/pokemon_logo_480x480.png">
<table><tbody>
<tr><td>Silver Tempest</td><td>Lugia V</td><td>186</td><td></td><td>Near Mint</td><td>$420.00</td></tr>
</tbody></table>`;

const FUENTE_TABLA = {
  id: 'x', tienda: 'X', pais: 'EE. UU.', moneda: 'USD', tipo: 'tabla', url: 'https://x/hotlist',
  recortar_desde: 'mtg_logo',
  recortar_hasta: 'files/(?!mtg_logo)[a-z0-9_]+_logo',
  columnas: { edicion: 0, nombre: 1, estado: 4, precio: 5 }
};

// Una tienda estadounidense escribe 3,400.00 y una europea 3.400,00. Confundirlas convierte
// tres mil cuatrocientos en tres con cuatro.
test('la cifra se lee con separadores de cualquiera de los dos estilos', () => {
  assert.equal(aNumero('$15,000.00'), 15000);
  assert.equal(aNumero('3.400,00 €'), 3400);
  assert.equal(aNumero('$100.00'), 100);
  assert.equal(aNumero('58,20'), 58.2);
  assert.equal(aNumero('420'), 420);
  assert.equal(aNumero('sin cifra'), null);
});

test('la tabla se lee segun las columnas que diga la fuente', () => {
  const cartas = leerTabla(TABLA_HTML, FUENTE_TABLA);

  assert.equal(cartas.length, 2);
  assert.equal(cartas[0].nombre, 'Black Lotus');
  assert.equal(cartas[0].edicion, 'Unlimited Edition');
  assert.equal(cartas[0].estado, 'Lightly Played');
  assert.equal(cartas[0].precio, 15000);
});

// La misma pagina lista Pokemon y Yu-Gi-Oh, que no compramos.
test('el recorte deja fuera los otros juegos', () => {
  assert.ok(!leerTabla(TABLA_HTML, FUENTE_TABLA).some(({ nombre }) => nombre === 'Lugia V'));
});

// Una tabla que no da ni una fila casi siempre es un rediseno. Decir que la lista esta vacia
// seria decir que han dejado de comprar, que es lo contrario de lo que pasa.
test('una tabla irreconocible se marca para mirarla, no se da por vacia', async () => {
  const recogida = await recogerFuente(FUENTE_TABLA, { tabla: devolver('<p>rediseno</p>') });

  assert.equal(recogida.estado, 'a_revisar');
  assert.match(recogida.aviso, /forma esperada/);
});

// De una imagen no se saca texto: lo util es el enlace, para abrirla.
test('de una fuente de imagen se sacan los enlaces de las imagenes', async () => {
  const fuente = {
    id: 'y', tienda: 'Y', pais: 'EE. UU.', moneda: 'USD', tipo: 'imagen', url: 'https://y',
    patron_imagen: 'static\\.ejemplo\\.com/[a-z0-9]+\\.(?:jpg|png)'
  };
  const html = '<img src="https://static.ejemplo.com/lista.jpg"><img src="https://static.ejemplo.com/logo.png">';

  const recogida = await recogerFuente(fuente, { imagen: devolver(html) });

  assert.equal(recogida.estado, 'a_revisar');
  assert.equal(recogida.imagenes.length, 2);
  assert.ok(recogida.imagenes.includes('https://static.ejemplo.com/lista.jpg'));
});

// Que una tienda no conteste no puede cancelar las demas.
test('una fuente que revienta se marca caida y no arrastra al resto', async () => {
  const romper = async () => { throw new Error('503'); };
  const recogida = await recogerFuente(FUENTE_TABLA, { tabla: romper });

  assert.equal(recogida.estado, 'caida');
  assert.match(recogida.aviso, /503/);
});

// El informe es para leerlo a mano: una fuente que no se sabe leer tiene que salir igual, con
// su enlace, porque un cartel de noventa cartas vale mas que su ausencia.
test('el informe enseña tambien las fuentes que no se han podido leer', () => {
  const texto = componerRevision([
    { ...FUENTE_TABLA, estado: 'a_revisar', cartas: [], imagenes: ['https://x/lista.jpg'], aviso: 'hay que mirarla' }
  ]);

  assert.match(texto, /Hay que mirarla/);
  assert.match(texto, /https:\/\/x\/lista\.jpg/);
});

test('el informe avisa de que los precios de fuera no son para copiarlos', () => {
  assert.match(componerRevision([]), /no para copiarlos/);
});

// Cada tienda titula a su manera. Face to Face escribe "Swan Song [65] [Theros] [Non-Foil]":
// la edicion no es el primer corchete, y quedarse con el daria "65" como edicion.
test('del titulo con varios corchetes se saca la edicion y no el numero', async () => {
  const fuente = {
    id: 'f2f', tienda: 'F', pais: 'Canada', moneda: 'CAD', tipo: 'shopify',
    tienda_url: 'https://f', coleccion: 'hotlists-magic',
    formato_titulo: 'corchetes', variantes: ['NM']
  };
  const productos = [
    { title: 'Swan Song [65] [Theros] [Non-Foil]', handle: 'swan-song', variants: [{ title: 'NM', price: '26.99' }] },
    { title: 'FINAL FANTASY - Play Booster Box', handle: 'caja', variants: [{ title: 'Default Title', price: '349.99' }] }
  ];
  const respuestas = [{ products: productos }, { products: [] }];

  const recogida = await recogerFuente(fuente, { shopify: async () => respuestas.shift() });

  assert.equal(recogida.cartas.length, 1);
  assert.equal(recogida.cartas[0].nombre, 'Swan Song');
  assert.equal(recogida.cartas[0].edicion, 'Theros');
  // La caja de sobres no es una carta suelta, pero se dice que se ha dejado fuera.
  assert.match(recogida.aviso, /1 productos/);
});

// Unas tiendas escriben "Near Mint", otras "NM-Mint" y otras "NM". Coger la variante que no es
// compararia una inglesa con una alemana, o una normal con una foil.
test('se coge la variante limpia se llame como se llame en cada tienda', async () => {
  const fuente = {
    id: 'c', tienda: 'C', pais: 'Canada', moneda: 'CAD', tipo: 'shopify',
    tienda_url: 'https://c', coleccion: 'hot', formato_titulo: 'simple',
    variantes: ['NM-Mint', 'Near Mint']
  };
  const productos = [{
    title: 'Abhorrent Oculus [Duskmourn]', handle: 'a',
    variants: [
      { title: 'NM-Mint', price: '19.10' },
      { title: 'NM-Mint Foil', price: '25.00' },
      { title: 'NM-Mint Non English', price: '15.00' }
    ]
  }];
  const respuestas = [{ products: productos }, { products: [] }];

  const recogida = await recogerFuente(fuente, { shopify: async () => respuestas.shift() });

  assert.equal(recogida.cartas[0].precio, 19.1);
  assert.equal(recogida.cartas[0].estado, 'NM-Mint');
});
