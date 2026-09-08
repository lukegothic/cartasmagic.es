// Pruebas de la extraccion. No tocan la red: el html y el json de ejemplo son recortes reales
// de cada fuente, guardados aqui para que una prueba que falla signifique que hemos roto algo
// nosotros y no que la tienda estaba caida esa tarde.

const test = require('node:test');
const assert = require('node:assert/strict');

const { FuenteCaida } = require('../fuentes/comun');
const { cardmonster } = require('../fuentes/cardmonster');
const { leerColeccion } = require('../fuentes/shopify');

const CARDMONSTER_HTML = `
<div><strong>All Prices are Based On NEAR MINT Conditions!</strong></div>
<img src="https://cdn.shopify.com/s/files/1/0270/files/mtg_logo_2_480x480.png">
<table><tbody>
<tr><td>Commander Legends: Battle for Baldur&#39;s Gate</td><td>Ancient Copper Dragon</td>
<td>161</td><td></td><td>Near Mint</td><td>$100.00</td></tr>
<tr><td>Unlimited Edition</td><td>Black Lotus</td><td>233</td><td></td>
<td>Lightly Played</td><td>$15,000.00</td></tr>
<tr><td>Cabecera que no es una carta</td></tr>
</tbody></table>
<img src="https://cdn.shopify.com/s/files/1/0270/files/pokemon_logo_480x480.png">
<table><tbody>
<tr><td>SWSH12: Silver Tempest</td><td>Lugia V</td><td>186</td><td></td>
<td>Near Mint</td><td>$420.00</td></tr>
</tbody></table>`;

const CRYPT_JSON = {
  products: [
    {
      title: 'Bloodthirsty Conqueror [Foundations]',
      handle: 'bloodthirsty-conqueror-foundations',
      variants: [
        { title: 'Near Mint', price: '58.20' },
        { title: 'Lightly Played', price: '49.50' },
        { title: 'Near Mint Foil', price: '62.30' }
      ]
    },
    { title: 'Sin corchetes de edicion', handle: 'raro', variants: [{ title: 'Near Mint', price: '10.00' }] }
  ]
};

// Las fuentes reciben el lector como parametro, asi que probar sin red es pasarles uno que
// devuelve el recorte guardado.
const devolver = (valor) => async () => valor;

test('cardmonster saca una oferta por fila de seis columnas', async () => {
  const anuncios = await cardmonster(devolver(CARDMONSTER_HTML));

  assert.equal(anuncios.length, 2);
  assert.equal(anuncios[0].nombre, 'Ancient Copper Dragon');
  assert.equal(anuncios[0].edicion, "Commander Legends: Battle for Baldur's Gate");
  assert.equal(anuncios[0].precio, 100);
  assert.equal(anuncios[0].moneda, 'USD');
});

// 15,000.00 son quince mil dolares, no quince.
test('la coma de los millares no parte la cifra', async () => {
  const anuncios = await cardmonster(devolver(CARDMONSTER_HTML));
  const lotus = anuncios.find(({ nombre }) => nombre === 'Black Lotus');

  assert.equal(lotus.precio, 15000);
  assert.equal(lotus.estado, 'Lightly Played');
});

// La pagina lista tambien Pokemon y Yu-Gi-Oh, que no compramos.
test('no se cuelan las cartas de otros juegos', async () => {
  const anuncios = await cardmonster(devolver(CARDMONSTER_HTML));

  assert.ok(!anuncios.some(({ nombre }) => nombre === 'Lugia V'));
});

// Si dieramos la lista por vacia, el informe diria que han dejado de comprar.
test('una tabla irreconocible es un fallo y no una lista vacia', async () => {
  await assert.rejects(() => cardmonster(devolver('<p>rediseno</p>')), FuenteCaida);
});

test('shopify separa el nombre de la edicion y coge la variante limpia', async () => {
  const respuestas = [CRYPT_JSON, { products: [] }];
  const anuncios = await leerColeccion('https://tienda', 'coleccion', 'crypt', 'CAD',
    async () => respuestas.shift());

  assert.equal(anuncios.length, 1);
  assert.equal(anuncios[0].nombre, 'Bloodthirsty Conqueror');
  assert.equal(anuncios[0].edicion, 'Foundations');
  // La de foil vale mas y la jugada menos: coger otra variante compararia cosas distintas
  // entre dias.
  assert.equal(anuncios[0].precio, 58.2);
  assert.equal(anuncios[0].estado, 'Near Mint');
});
