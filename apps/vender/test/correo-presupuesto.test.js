const test = require('node:test');
const assert = require('node:assert/strict');
const { componerCorreoMazo } = require('../lib/correo-manabox');

const base = {
  lead: { nombre: 'Pepe', email: 'pepe@correo.com', url: 'https://manabox.app/decks/AZ7', idMazo: 'AZ7', mensaje: 'algunas jugadas' },
  mazo: { nombre: 'Venta', formato: 'Commander' },
  cartas: [
    { nombre: 'Ancient Tomb', cantidad: 1, esFoil: true, set: 'Zendikar Expeditions', rareza: 'Mythic', precio: 365.28 },
    { nombre: 'Sol Ring', cantidad: 1, esFoil: false, set: 'C21', rareza: 'Uncommon', precio: 1.5 }
  ]
};

test('el asunto lleva la oferta y a quien va dirigido', () => {
  const c = componerCorreoMazo(base);
  assert.match(c.subject, /Pepe/);
  assert.match(c.subject, /219,69/);
});

test('el correo va listo para reenviar: destinatario en replyTo y cuerpo html', () => {
  const c = componerCorreoMazo(base);
  assert.equal(c.replyTo, 'pepe@correo.com');
  assert.match(c.html, /<html/i);
  assert.match(c.html, /Pepe/);
});

test('el cuerpo html lleva la oferta bien visible y el nombre del mazo', () => {
  const { html } = componerCorreoMazo(base);
  assert.match(html, /219,69/);
  assert.match(html, /Venta/);
  assert.match(html, /2 cartas/);
});

test('el cuerpo html NO lleva el desglose carta a carta, que va en el adjunto', () => {
  const { html } = componerCorreoMazo(base);
  assert.doesNotMatch(html, /Ancient Tomb/, 'el desglose va solo en el csv');
  assert.doesNotMatch(html, /1\.502/);
});

const csvDe = ({ attachments }) => attachments.find(({ filename }) => filename.endsWith('.csv'));

test('el desglose viaja como adjunto csv', () => {
  const adjunto = csvDe(componerCorreoMazo(base));
  assert.match(adjunto.content, /Ancient Tomb/);
  assert.match(adjunto.content, /TOTAL/);
});

test('el nombre del adjunto identifica el mazo, para no confundirlo entre varios', () => {
  assert.match(csvDe(componerCorreoMazo(base)).filename, /Pepe/i);
});

test('las notas para ti van aparte, para que el cuerpo se reenvie tal cual', () => {
  const { html, attachments } = componerCorreoMazo(base);
  const notas = attachments.find(({ filename }) => filename.startsWith('notas-'));
  assert.doesNotMatch(html, /algunas jugadas/, 'el mensaje del cliente no va en el cuerpo');
  assert.doesNotMatch(html, /manabox\.app/, 'el enlace original tampoco');
  assert.match(notas.content, /algunas jugadas/);
  assert.match(notas.content, /manabox\.app/);
});

test('avisa en el asunto cuando la oferta baja del minimo', () => {
  const c = componerCorreoMazo({ ...base, cartas: [{ nombre: 'x', cantidad: 1, esFoil: false, set: 's', rareza: 'r', precio: 1 }] });
  assert.match(c.subject, /bajo mínimo/i);
});

test('sigue habiendo una version en texto plano', () => {
  const c = componerCorreoMazo(base);
  assert.match(c.text, /219,69/);
  assert.match(c.text, /Pepe/);
});
