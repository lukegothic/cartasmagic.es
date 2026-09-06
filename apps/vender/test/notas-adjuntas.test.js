const test = require('node:test');
const assert = require('node:assert/strict');
const { componerCorreo } = require('../lib/lead');
const { componerCorreoMazo } = require('../lib/correo-manabox');
const { leerDireccion } = require('../lib/direccion');

const direccion = leerDireccion({ direccion: 'Calle Baron de Santa Barbara 17, 46110 Godella (Valencia)' });

const postal = (extra = {}) => componerCorreo({
  nombre: 'Jordi', email: 'jordi@correo.com',
  volumen: '500-1000', mensaje: 'varios mazos de Commander',
  ...extra
});

const mazo = (extra = {}) => componerCorreoMazo({
  lead: {
    nombre: 'Pepe', email: 'pepe@correo.com', url: 'https://manabox.app/decks/AZ7',
    idMazo: 'AZ7', mensaje: 'algunas jugadas', ...extra
  },
  mazo: { nombre: 'Venta', formato: 'Commander' },
  cartas: [{ nombre: 'Ancient Tomb', cantidad: 1, esFoil: true, set: 'ZNE', rareza: 'Mythic', precio: 365.28 }]
});

const notasDe = ({ attachments }) => attachments.find(({ filename }) => filename.startsWith('notas-'));

test('las notas abren con los pasos del reenvio, antes de los datos', () => {
  const { content } = notasDe(postal());
  assert.match(content, /Reenviar/, 'el boton correcto es Reenviar, no Responder');
  assert.ok(content.indexOf('Reenviar') < content.indexOf('Jordi'), 'los pasos van antes que los datos');
});

test('los pasos avisan de quitar este mismo fichero antes de reenviar', () => {
  const { content, filename } = notasDe(postal());
  assert.match(content, new RegExp(filename.replace('.', '\\.')), 'el aviso nombra el fichero que hay que quitar');
});

test('los pasos recuerdan cambiar el asunto, que Gmail no deja tocar al responder', () => {
  assert.match(notasDe(postal()).content, /asunto/i);
});

// El asunto se pone a mano en cada reenvio, asi que va escrito y en su propia linea: hay que
// poder copiarlo de un tiron, sin arrastrar la etiqueta que lo introduce.
test('las notas traen el asunto ya escrito, en una linea suelta', () => {
  const lineas = notasDe(postal()).content.split('\n');
  assert.ok(lineas.includes('Tu valoración - vendercartasmagic.es'), 'el asunto va solo en su linea');
});

test('cada via trae el asunto que le toca', () => {
  assert.match(notasDe(postal()).content, /Tu valoración - vendercartasmagic\.es/);
  assert.match(notasDe(mazo()).content, /Tu presupuesto - vendercartasmagic\.es/);
});

test('el asunto de cara al cliente no lleva los datos de triaje del asunto interno', () => {
  const { content } = notasDe(mazo({ direccion }));
  const asunto = content.split('\n').find((l) => l.includes('vendercartasmagic.es'));
  assert.doesNotMatch(asunto, /EUR|Godella|con direcci[oó]n/, 'eso es para tu bandeja, no para el cliente');
});

test('solo se recuerda adjuntar la etiqueta cuando hay direccion para generarla', () => {
  assert.match(notasDe(postal({ direccion })).content, /etiqueta/i);
  assert.doesNotMatch(notasDe(postal()).content, /adjuntar la etiqueta/i);
});

test('solo en ManaBox se avisa del csv, que es el unico correo que lo lleva', () => {
  assert.match(notasDe(mazo()).content, /desglose-Pepe\.csv/);
  assert.doesNotMatch(notasDe(postal()).content, /\.csv/);
});

test('las notas viajan como adjunto de texto, no dentro del cuerpo', () => {
  [postal(), mazo()].forEach((correo) => {
    const notas = notasDe(correo);
    assert.ok(notas, 'debe haber un adjunto de notas');
    assert.match(notas.filename, /\.txt$/);
    assert.match(notas.contentType, /text\/plain/);
  });
});

// Un nombre con tilde salia partido: la NFD separa la tilde y luego se colaba de guion.
test('las tildes del nombre no parten el nombre del fichero', () => {
  assert.match(notasDe(postal({ nombre: 'Daniel Rodríguez' })).filename, /^notas-Daniel-Rodriguez\.txt$/);
});

test('el nombre del adjunto identifica al cliente, para no confundirlo entre varios', () => {
  assert.match(notasDe(postal()).filename, /Jordi/i);
  assert.match(notasDe(mazo()).filename, /Pepe/i);
});

test('el cuerpo ya no lleva el bloque de notas internas', () => {
  [postal({ direccion }), mazo({ direccion })].forEach(({ html }) => {
    assert.doesNotMatch(html, /notas-internas/);
    assert.doesNotMatch(html, /borrar antes de reenviar/i);
  });
});

test('el aviso de adjuntar la etiqueta no sale en ninguna de las dos vias', () => {
  [postal(), postal({ direccion }), mazo(), mazo({ direccion })].forEach(({ html, text }) => {
    assert.doesNotMatch(html, /ADJUNTAR LA ETIQUETA/i);
    assert.doesNotMatch(text, /ADJUNTAR LA ETIQUETA/i);
  });
});

test('las notas del formulario postal llevan todos los datos suministrados', () => {
  const { content } = notasDe(postal({ direccion }));
  assert.match(content, /Jordi/);
  assert.match(content, /jordi@correo\.com/);
  assert.match(content, /Entre 500 y 1\.000 cartas/);
  assert.match(content, /Godella/);
  assert.match(content, /varios mazos de Commander/);
});

test('las notas de ManaBox llevan todos los datos del formulario y del presupuesto', () => {
  const { content } = notasDe(mazo({ direccion }));
  assert.match(content, /Pepe/);
  assert.match(content, /pepe@correo\.com/);
  assert.match(content, /manabox\.app\/decks\/AZ7/);
  assert.match(content, /Godella/);
  assert.match(content, /algunas jugadas/);
  assert.match(content, /Venta/, 'el nombre del mazo tambien es un dato');
  assert.match(content, /365,28|Mercado/, 'la valoracion que sustenta la oferta');
});

test('una direccion dudosa se marca en las notas adjuntas', () => {
  const { content } = notasDe(postal({ direccion: { texto: 'Madrid', pareceIncompleta: true } }));
  assert.match(content, /revisar|incompleta/i);
});

test('sin mensaje del cliente las notas lo dicen en vez de dejar un hueco', () => {
  assert.match(notasDe(postal({ mensaje: '' })).content, /\(nada\)/);
});

test('el desglose csv de ManaBox sigue viajando junto a las notas', () => {
  const { attachments } = mazo();
  assert.equal(attachments.length, 2);
  assert.ok(attachments.some(({ filename }) => filename.endsWith('.csv')));
});
