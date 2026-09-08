// Las cartas que se buscan ahora mismo y lo que se paga por cada una. Vive aparte de
// textos.js a proposito: alli hay titulares y parrafos, y aqui hay precios y existencias,
// que se editan por otro motivo y con otro criterio.
//
// Cada entrada es la carta tal y como la devuelve Scryfall, con un unico campo anadido por
// nosotros: lo que se paga. Se guarda el objeto entero, sin recortarlo a los cuatro campos
// que hoy pinta la pagina, porque el fichero lo va a escribir un script que consulta la api
// y quedarse solo con lo que hace falta ahora obligaria a volver a bajarlo todo el dia que
// haga falta la rareza, el idioma o el numero de coleccion.
//
// De Scryfall se leen: name, set_name, image_uris.normal y prices.eur. Los nombres de campo
// son los suyos, no se renombran, para que la salida del script entre sin traducir nada.
//
// Para anadir una carta a mano:
//   1. Buscarla en https://scryfall.com en la edicion concreta.
//   2. Copiar su json (https://api.scryfall.com/cards/<id>) como una entrada mas.
//   3. Poner pagamos: el 60 % de prices.eur, que es el porcentaje que anuncia la pagina.
//   4. Actualizar ACTUALIZADA con la fecha del dia.

// La pagina publica esta fecha. Una lista que dice ser de anteayer cuando es de hace ocho
// meses promete una cotizacion al dia que no cumple.
const ACTUALIZADA = '08/09/2026';

// pagamos es lo unico que no viene de Scryfall: es la oferta, en euros.
const CARTAS = [
  {
    name: "Gaea's Cradle",
    set_name: "Urza's Saga",
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/2/5/25b0b816-0583-44aa-9dc5-f3ff48993a51.jpg' },
    prices: { eur: '1160.65' },
    pagamos: 695
  },
  {
    name: 'Mox Diamond',
    set_name: 'Stronghold',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/2/8/28028830-83ed-45e2-b495-3b9ad9d3e988.jpg' },
    prices: { eur: '835.47' },
    pagamos: 500
  },
  {
    name: 'Underground Sea',
    set_name: 'Revised Edition',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/1/f/1f35877c-e66c-4ef0-842a-f68cd233ae4b.jpg' },
    prices: { eur: '715.19' },
    pagamos: 430
  },
  {
    name: 'Volcanic Island',
    set_name: 'Revised Edition',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/b/1/b12e5430-0e80-47dd-80ac-85728b656a24.jpg' },
    prices: { eur: '573.38' },
    pagamos: 345
  },
  {
    name: "Lion's Eye Diamond",
    set_name: 'Mirage',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/6/3/63bacc32-d6ba-420c-9b49-299c08e5fb39.jpg' },
    prices: { eur: '535.71' },
    pagamos: 320
  },
  {
    name: 'Imperial Seal',
    set_name: 'Portal Three Kingdoms',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/8/2/822e30db-40c5-4099-868b-185ad9b7c7dc.jpg' },
    prices: { eur: '395.86' },
    pagamos: 240
  },
  {
    name: 'Tundra',
    set_name: 'Revised Edition',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/9/c/9c9d5f72-e199-4d5b-ae7e-cc5b9bdfae99.jpg' },
    prices: { eur: '391.71' },
    pagamos: 235
  },
  {
    name: 'Bayou',
    set_name: 'Revised Edition',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/5/6/56355ff3-2232-4a11-b868-aec9a50b9ee5.jpg' },
    prices: { eur: '306.28' },
    pagamos: 185
  },
  {
    name: 'Grim Monolith',
    set_name: "Urza's Legacy",
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/9/d/9ddc9fe1-17c8-4e1d-aeb8-c4214e881280.jpg' },
    prices: { eur: '309.74' },
    pagamos: 185
  },
  {
    name: 'The One Ring',
    set_name: 'The Lord of the Rings: Tales of Middle-earth',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/d/5/d5806e68-1054-458e-866d-1f2470f682b2.jpg' },
    prices: { eur: '89.28' },
    pagamos: 53
  },
  {
    name: 'Sheoldred, the Apocalypse',
    set_name: 'Dominaria United',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/d/6/d67be074-cdd4-41d9-ac89-0a0456c4e4b2.jpg' },
    prices: { eur: '75.78' },
    pagamos: 45
  },
  {
    name: 'Force of Will',
    set_name: 'Alliances',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/9/a/9a879b60-4381-447d-8a5a-8e0b6a1d49ca.jpg' },
    prices: { eur: '59.62' },
    pagamos: 36
  },
  {
    name: 'Wasteland',
    set_name: 'Tempest',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/9/9/99ff731b-8399-40c8-b539-ba6ba5783771.jpg' },
    prices: { eur: '46.68' },
    pagamos: 28
  },
  {
    name: 'Mana Crypt',
    set_name: 'Eternal Masters',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/0/c/0cb33b46-4d1b-4f97-bfdc-d815aee111da.jpg' },
    prices: { eur: '40.69' },
    pagamos: 24
  },
  {
    name: 'Jeweled Lotus',
    set_name: 'Commander Legends',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/3/c/3c7de64b-3dc8-47dd-8999-4353b5a3a06f.jpg' },
    prices: { eur: '37.98' },
    pagamos: 23
  },
  {
    name: 'Cavern of Souls',
    set_name: 'Avacyn Restored',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/1/3/1381c8f1-a292-4bdf-b20c-a5c2a169ee84.jpg' },
    prices: { eur: '38.82' },
    pagamos: 23
  },
  {
    name: 'Orcish Bowmasters',
    set_name: 'The Lord of the Rings: Tales of Middle-earth',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/7/c/7c024bae-5631-4e20-ac69-df392ac9e109.jpg' },
    prices: { eur: '34.74' },
    pagamos: 21
  },
  {
    name: 'Rhystic Study',
    set_name: 'Prophecy',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/3/3/3394cefd-a3c6-4917-8f46-234e441ecfb6.jpg' },
    prices: { eur: '34.37' },
    pagamos: 21
  },
  {
    name: 'Ragavan, Nimble Pilferer',
    set_name: 'Modern Horizons 2',
    image_uris: { normal: 'https://cards.scryfall.io/normal/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg' },
    prices: { eur: '33.76' },
    pagamos: 20
  }
];

// Punto para los millares y coma para los decimales, que es como se escribe una cifra en
// castellano. Se delega en toLocaleString, igual que el euros de correo-plantilla.js.
const formatoPrecio = (precio) =>
  `${precio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' })} €`;

module.exports = { ACTUALIZADA, CARTAS, formatoPrecio };
