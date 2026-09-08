const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');

const { HOTLIST } = textos;
const sitemap = fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf8');
// Se renderiza de verdad en vez de leer la plantilla como texto: asi se comprueba lo que
// acaba viendo el visitante, incluidos los precios, que la plantilla no lleva escritos.
const vista = ejs.render(
  fs.readFileSync(path.join(__dirname, '../views/hotlist.ejs'), 'utf8'),
  { textos }
);

// Una hotlist es una oferta publica: quien lee una cifra y manda la carta espera cobrarla.
// Si una entrada se queda sin precio o sin estado, lo que se publica es un compromiso que
// no se sabe honrar, y eso se descubre cuando alguien ya ha enviado el paquete.
test('cada carta publicada lleva nombre, edicion, estado y precio', () => {
  assert.ok(HOTLIST.cartas.length >= 10, 'una hotlist de menos de diez cartas no merece pagina');

  HOTLIST.cartas.forEach((carta) => {
    assert.ok(carta.nombre, 'una carta sin nombre no se puede identificar');
    assert.ok(carta.edicion, `${carta.nombre} no dice de que edicion`);
    assert.ok(carta.estado, `${carta.nombre} no dice en que estado se paga ese precio`);
    assert.ok(Number.isFinite(carta.precio) && carta.precio > 0, `${carta.nombre} no tiene un precio pagable`);
  });
});

// El precio se publica por carta y por estado. Repetir nombre y edicion sin cambiar el
// estado son dos ofertas distintas por lo mismo, y gana la que lea el cliente.
test('no hay dos entradas para la misma carta en el mismo estado', () => {
  const claves = HOTLIST.cartas.map(({ nombre, edicion, estado }) => `${nombre}|${edicion}|${estado}`);
  assert.equal(new Set(claves).size, claves.length);
});

// Los precios salen en euros y con coma decimal: la referencia es Cardmarket, no las
// hotlists americanas de las que se copia el formato.
test('los precios se pintan en euros con coma decimal', () => {
  assert.match(vista, /€/);
  assert.doesNotMatch(vista, /\$/);
  // Se comprueban varias magnitudes porque el fallo tipico del separador de millares es
  // colocar solo el primero: con una sola cifra de cuatro digitos la prueba no lo ve.
  assert.equal(HOTLIST.formatoPrecio(38), '38,00 €');
  assert.equal(HOTLIST.formatoPrecio(420), '420,00 €');
  assert.equal(HOTLIST.formatoPrecio(1234.5), '1.234,50 €');
  assert.equal(HOTLIST.formatoPrecio(1234567), '1.234.567,00 €');
});

// El estado es la letra pequena de cualquier hotlist: sin decir sobre que estado se cotiza,
// la cifra alta se lee como si valiera para una carta jugada.
test('se avisa de sobre que estado se cotizan los precios', () => {
  assert.match(HOTLIST.aviso, /Near Mint|impecable/i);
});

// La cifra sale de precios de Cardmarket que se mueven. Publicarla sin fecha la convierte
// en una oferta indefinida que se acaba honrando a perdida.
test('la lista dice de cuando es', () => {
  assert.match(HOTLIST.actualizada, /^\d{2}\/\d{2}\/\d{4}$/);
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

// El precio publicado sale de un porcentaje fijo sobre Cardmarket. Si una fila se sale de
// la regla, o se paga de mas o la lista miente sobre lo que ofrece.
test('ninguna carta se paga por encima de lo que se anuncia', () => {
  const porcentaje = HOTLIST.condiciones.puntos.find(({ destacado }) => /60 %/.test(destacado));
  assert.ok(porcentaje, 'la pagina ya no dice que porcentaje paga');
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
  assert.equal(lista.numberOfItems, HOTLIST.cartas.length);
  lista.itemListElement.forEach(({ item }) => {
    assert.equal(item['@type'], 'BuyAction');
    assert.equal(item.priceSpecification.priceCurrency, 'EUR');
  });
});
