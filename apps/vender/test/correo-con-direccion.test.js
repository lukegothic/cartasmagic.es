const test = require('node:test');
const assert = require('node:assert/strict');
const { componerCorreo } = require('../lib/lead');
const { componerCorreoMazo } = require('../lib/correo-manabox');
const { leerDireccion } = require('../lib/direccion');

const postal = (extra = {}) => componerCorreo({
  nombre: 'Jordi', email: 'jordi@correo.com', provincia: 'Valencia',
  tipo: 'mazos-albumes', volumen: '500-1000', mensaje: 'varios mazos',
  ...extra
});

// Se construye con la funcion de verdad: a mano se quedaba sin localidad y el asunto no lo notaba.
const direccion = leerDireccion({ direccion: 'Calle Baron de Santa Barbara 17, 46110 Godella (Valencia)' });

test('sin direccion el correo la pide, como hasta ahora', () => {
  const { html } = postal();
  assert.match(html, /direcci[oó]n de remitente/i);
  assert.doesNotMatch(html, /ADJUNTAR LA ETIQUETA/);
});

test('con direccion el correo ya no la pide y habla de la etiqueta adjunta', () => {
  const { html } = postal({ direccion });
  assert.doesNotMatch(html, /necesito una direcci[oó]n de remitente/i);
  assert.match(html, /etiqueta/i);
  assert.match(html, /Correos/);
});

test('con direccion el correo te recuerda adjuntar la etiqueta antes de reenviar', () => {
  const { html } = postal({ direccion });
  assert.match(html, /ADJUNTAR LA ETIQUETA/);
});

test('la direccion aparece en las notas internas, para copiarla a Correos', () => {
  const { html } = postal({ direccion });
  const marca = html.indexOf('id="notas-internas"');
  assert.ok(html.indexOf('Godella') > marca, 'la direccion es informacion tuya, no del cuerpo');
});

test('el asunto avisa de que hay direccion, para distinguirlo de un vistazo', () => {
  assert.match(postal({ direccion }).subject, /con direcci[oó]n/i);
  assert.doesNotMatch(postal().subject, /con direcci[oó]n/i);
});

test('una direccion dudosa se marca en las notas', () => {
  const { html } = postal({ direccion: { texto: 'Madrid', pareceIncompleta: true } });
  assert.match(html, /revisar|incompleta/i);
});

test('la via de ManaBox se comporta igual', () => {
  const lead = { nombre: 'Pepe', email: 'pepe@correo.com', url: 'https://manabox.app/decks/AZ7', idMazo: 'AZ7', mensaje: '' };
  const cartas = [{ nombre: 'x', cantidad: 1, esFoil: false, set: 's', rareza: 'r', precio: 100 }];
  const sin = componerCorreoMazo({ lead, mazo: { nombre: 'M', formato: 'Commander' }, cartas });
  const con = componerCorreoMazo({ lead: { ...lead, direccion }, mazo: { nombre: 'M', formato: 'Commander' }, cartas });

  assert.match(sin.html, /direcci[oó]n de remitente/i);
  assert.match(con.html, /ADJUNTAR LA ETIQUETA/);
  assert.match(con.subject, /con direcci[oó]n/i);
  assert.equal(con.attachments.length, 1, 'el csv sigue viajando');
});

test('con direccion no se pide la direccion por ningun lado, en ninguna de las dos vias', () => {
  const lead = { nombre: 'P', email: 'p@x.es', url: 'https://manabox.app/decks/A', idMazo: 'A', mensaje: '', direccion };
  const mb = componerCorreoMazo({ lead, mazo: { nombre: 'M', formato: 'C' }, cartas: [{ nombre: 'x', cantidad: 1, esFoil: false, set: 's', rareza: 'r', precio: 100 }] });

  [mb, postal({ direccion })].forEach(({ html, text }) => {
    assert.doesNotMatch(html, /necesito una direcci[oó]n de remitente/i);
    assert.doesNotMatch(text, /necesito una direcci[oó]n de remitente/i);
  });
});

// El asunto de ManaBox ya lleva la oferta, que es lo que decide; la localidad ahorra abrir
// el correo para saber si la etiqueta se puede generar ya.
test('el asunto de ManaBox lleva la localidad cuando hay direccion', () => {
  const lead = { nombre: 'Ana', email: 'a@x.es', url: 'https://manabox.app/decks/A', idMazo: 'A', mensaje: '', direccion };
  const { subject } = componerCorreoMazo({
    lead, mazo: { nombre: 'M', formato: 'C' },
    cartas: [{ nombre: 'x', cantidad: 1, esFoil: false, set: 's', rareza: 'r', precio: 100 }]
  });
  assert.match(subject, /Godella/);
});
