// Packlink solo admite cancelar un envio dentro de los 15 dias siguientes a contratarlo, y
// pasado ese plazo la etiqueta pagada ya no se recupera. Los 5 dias que se anuncian al
// cliente son un margen nuestro dentro de esa ventana: dejan diez dias para tramitar la
// cancelacion sin apurar. En presupuesto caduca ademas la cifra, que sale de precios de
// Cardmarket que se mueven.
const test = require('node:test');
const assert = require('node:assert/strict');
const { componerCorreo } = require('../lib/lead');
const { componerCorreoMazo } = require('../lib/correo-manabox');
const { leerDireccion } = require('../lib/direccion');

const direccion = leerDireccion({ direccion: 'Calle Mayor 1\n46110 Godella (Valencia)' });

const postal = (extra = {}) => componerCorreo({
  nombre: 'Jordi', email: 'jordi@correo.com',
  volumen: '500-1000', mensaje: 'varios mazos',
  ...extra
});

const manabox = (extra = {}) => componerCorreoMazo({
  lead: { nombre: 'Ana', email: 'ana@correo.com', url: 'https://manabox.app/decks/A', idMazo: 'A', mensaje: '', ...extra },
  mazo: { nombre: 'M', formato: 'Commander' },
  cartas: [{ nombre: 'x', cantidad: 1, esFoil: false, set: 's', rareza: 'r', precio: 100 }]
});

const CORREOS = [
  ['postal, pidiendo direccion', () => postal()],
  ['postal, con etiqueta', () => postal({ direccion })],
  ['manabox, pidiendo direccion', () => manabox()],
  ['manabox, con etiqueta', () => manabox({ direccion })]
];

CORREOS.forEach(([caso, componer]) => {
  test(`avisa de los 5 dias (${caso})`, () => {
    const { html, text } = componer();
    [html, text].forEach((cuerpo) => {
      assert.match(cuerpo, /5 días/);
      assert.match(cuerpo, /cancela/i, 'dice que pasa al vencer, no solo cuanto dura');
    });
  });
});

// La cifra de ManaBox sale de precios de Cardmarket, que se mueven: si se acepta un mes
// despues, se paga de mas. En la via postal no hay cifra todavia y el plazo es solo del envio.
test('en presupuesto el plazo alcanza a la oferta, no solo a la etiqueta', () => {
  const { html, text } = manabox({ direccion });
  [html, text].forEach((cuerpo) => assert.match(cuerpo, /oferta/i));
});

// Los 15 dias del aviso legal corren desde que se manda el precio de las cartas ya recibidas,
// que es otro momento: anunciarlos aqui haria pensar que la etiqueta dura 15 dias.
CORREOS.forEach(([caso, componer]) => {
  test(`no menciona los 15 dias del aviso legal (${caso})`, () => {
    const { html, text } = componer();
    [html, text].forEach((cuerpo) => assert.doesNotMatch(cuerpo, /15 días/));
  });
});

// El aviso cierra el bloque logistico: peso y medidas, luego el plazo, y despues ya el
// parrafo de llenar la caja, que es el que conviene que quede al final.
CORREOS.forEach(([caso, componer]) => {
  test(`el plazo va entre los limites y la invitacion (${caso})`, () => {
    const { html, text } = componer();
    [html, text].forEach((cuerpo) => {
      assert.ok(cuerpo.indexOf('2 kg') < cuerpo.indexOf('5 días'));
      assert.ok(cuerpo.indexOf('5 días') < cuerpo.indexOf('1.000 cartas'));
    });
  });
});
