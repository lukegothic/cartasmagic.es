const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');
const { ACTUALIZADA, CARTAS, formatoPrecio } = require('../lib/hotlist-cartas');

const sitemap = fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf8');
const estilos = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const ENLACE_ESTADOS = 'https://cartasmagic.es/blog/estado-de-la-carta-nm-ex-gd-lp?utm_source=vendercartasmagic&utm_medium=hotlist&utm_campaign=estados';

// Se renderiza de verdad en vez de leer la plantilla como texto: asi se comprueba lo que
// acaba viendo el visitante, incluidos los precios, que la plantilla no lleva escritos.
const vista = ejs.render(
  fs.readFileSync(path.join(__dirname, '../views/hotlist.ejs'), 'utf8'),
  { textos, cartas: CARTAS, actualizada: ACTUALIZADA, formatoPrecio, enlaceEstados: ENLACE_ESTADOS }
);

// Una hotlist es una oferta publica: quien lee una cifra y manda la carta espera cobrarla.
// Si una entrada se queda sin precio o sin imagen, lo que se publica es un compromiso que
// no se sabe honrar, y eso se descubre cuando alguien ya ha enviado el paquete.
test('cada carta publicada lleva nombre, edicion, imagen y precio', () => {
  assert.ok(CARTAS.length >= 10, 'una hotlist de menos de diez cartas no merece pagina');

  CARTAS.forEach((carta) => {
    assert.ok(carta.name, 'una carta sin nombre no se puede identificar');
    assert.ok(carta.set_name, `${carta.name} no dice de que edicion`);
    assert.ok(carta.image_uris?.normal, `${carta.name} no tiene imagen`);
    // pagamos es la oferta y la decide el negocio, no Scryfall: prices.eur es una
    // estimacion de mercado que viene con la carta y solo sirve de referencia al
    // recotizar. No se comprueba una contra la otra a proposito, porque pagar de mas por
    // una carta que hace mucha falta es una decision legitima y no puede tumbar el
    // despliegue.
    assert.ok(Number.isFinite(carta.pagamos) && carta.pagamos > 0, `${carta.name} no tiene una oferta pagable`);
  });
});

// Los campos son los de Scryfall a proposito, para que la salida del script que las baje
// entre sin renombrar nada. Si alguien los castellaniza, el script deja de encajar.
test('las cartas conservan los nombres de campo de Scryfall', () => {
  CARTAS.forEach((carta) => {
    assert.ok(!('nombre' in carta), `${carta.name} usa nombre en vez de name`);
    assert.ok(!('edicion' in carta), `${carta.name} usa edicion en vez de set_name`);
  });
});

// El precio se publica por carta y edicion. Repetir la misma impresion son dos ofertas
// distintas por lo mismo, y gana la que lea el cliente.
test('no hay dos entradas para la misma impresion', () => {
  const claves = CARTAS.map(({ name, set_name }) => `${name}|${set_name}`);
  assert.equal(new Set(claves).size, claves.length);
});

// Los precios salen en euros y con coma decimal: la referencia es Cardmarket, no las
// hotlists americanas de las que se copia el formato. Se comprueban varias magnitudes
// porque el fallo tipico del separador de millares es colocar solo el primero.
test('los precios se pintan en euros con coma decimal', () => {
  assert.match(vista, /€/);
  assert.doesNotMatch(vista, /\$/);
  assert.equal(formatoPrecio(38), '38,00 €');
  assert.equal(formatoPrecio(420), '420,00 €');
  assert.equal(formatoPrecio(1234.5), '1.234,50 €');
  assert.equal(formatoPrecio(1234567), '1.234.567,00 €');
});

// El idioma y el estado son la letra pequena de cualquier hotlist: sin decir que la cifra
// es de una inglesa impecable, la misma carta en aleman y jugada se lee como si valiera eso.
test('se avisa de que los precios son de inglesa y Near Mint', () => {
  assert.match(textos.HOTLIST.aviso.antes, /inglés/);
  assert.match(textos.HOTLIST.aviso.antes, /Near Mint/);
});

// El aviso se pinta arriba y abajo. Quien baja directo a mirar cifras no pasa por el
// encabezado, y es justo a quien mas le cambia la cuenta.
test('el aviso se lee sin tener que buscarlo', () => {
  assert.equal(vista.split(textos.HOTLIST.aviso.enlace).length - 1, 2);
});

// Decir "Near Mint" sin explicarlo deja fuera al que vende una coleccion vieja y no sabe
// la escala. La guia esta en el hub, que es donde vive el contenido.
test('el aviso enlaza a la guia de estados del hub', () => {
  assert.match(vista, /cartasmagic\.es\/blog\/estado-de-la-carta-nm-ex-gd-lp/);
  assert.match(vista, /utm_source=vendercartasmagic/);
});

// La imagen es lo que hace reconocer la carta sin saberse el nombre en ingles.
test('cada carta se pinta con su imagen', () => {
  assert.equal((vista.match(/<img/g) || []).length, CARTAS.length);
  assert.match(vista, /loading="lazy"/);
  assert.match(estilos, /\.hotlist-rejilla/);
});

// La cifra sale de precios de Cardmarket que se mueven. Publicarla sin fecha la convierte
// en una oferta indefinida que se acaba honrando a perdida.
test('la lista dice de cuando es', () => {
  assert.match(ACTUALIZADA, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.match(vista, /actualizada/i);
});

// La hotlist es una entrada mas al mismo embudo: si no lleva al formulario, atrae visitas
// que no pueden vender nada.
test('la pagina lleva al formulario de valoracion', () => {
  assert.match(vista, /href="\/valoracion-cartas-magic"/);
});

test('la pagina esta indexada y en el sitemap', () => {
  assert.equal(meta.HOTLIST.canonical, 'https://vendercartasmagic.es/hotlist');
  assert.match(sitemap, /<loc>https:\/\/vendercartasmagic\.es\/hotlist<\/loc>/);
});

// Una pagina que solo esta en el sitemap no la encuentra nadie navegando. El pie se pinta
// en todas, asi que es el sitio que la deja a un clic desde cualquier parte.
test('se llega a la hotlist desde cualquier pagina', () => {
  const layout = fs.readFileSync(path.join(__dirname, '../views/layout.ejs'), 'utf8');
  assert.match(layout, /href="\/hotlist"/);
});

// La devolucion cuesta 11,90 € y en una carta suelta se lleva media. Es la condicion que
// mas pesa justo en el publico que atrae esta pagina, asi que no puede faltar aqui.
test('la hotlist avisa de lo que cuesta la devolucion', () => {
  assert.match(vista, /11,90 €/);
});

// Un Offer con price dice "vendo esto a este precio". Indexaria la pagina como una tienda
// que vende duales a precio de compra, que es justo lo contrario de lo que hace.
test('el marcado declara compra, no venta', () => {
  const grafo = JSON.parse(meta.hotlistLdJson())['@graph'];
  const lista = grafo.find(({ '@type': tipo }) => tipo === 'ItemList');
  assert.equal(lista.numberOfItems, CARTAS.length);
  lista.itemListElement.forEach(({ item }) => {
    assert.equal(item['@type'], 'BuyAction');
    assert.equal(item.priceSpecification.priceCurrency, 'EUR');
  });
});
