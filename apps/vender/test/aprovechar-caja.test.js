// La caja de 2 kg entra igual llena que medio vacia, y el envio lo pagamos nosotros. Cada
// correo que sale sin invitar a llenarla deja cartas en casa del cliente que ya no vuelven:
// una segunda tanda cuesta otro envio, asi que lo que no venga en esta caja no viene.
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

// Las cuatro combinaciones: las dos vias, con la etiqueta ya adjunta y pidiendo todavia la
// direccion. El cliente decide que mete en la caja en cualquiera de las cuatro.
const CORREOS = [
  ['postal, pidiendo direccion', () => postal()],
  ['postal, con etiqueta', () => postal({ direccion })],
  ['manabox, pidiendo direccion', () => manabox()],
  ['manabox, con etiqueta', () => manabox({ direccion })]
];

CORREOS.forEach(([caso, componer]) => {
  test(`invita a llenar la caja (${caso})`, () => {
    const { html, text } = componer();
    [html, text].forEach((cuerpo) => {
      assert.match(cuerpo, /1\.000 cartas/, 'dice cuantas cartas caben, que 2 kg no lo dice');
      assert.match(cuerpo, /foils/i);
      assert.match(cuerpo, /raras/i);
    });
  });
});

// El precio de ManaBox sale de la lista que mando el cliente. Si la caja llega con mas
// cartas hay que decir de antemano que se pagan aparte, o parece que van de regalo.
test('en ManaBox se explica que lo que venga de mas se valora aparte', () => {
  const { html, text } = manabox({ direccion });
  [html, text].forEach((cuerpo) => assert.match(cuerpo, /aparte/i));
});

// El parrafo habla del tamaño de la caja, asi que los limites tienen que estar dichos antes
// en los cuatro cuerpos. En texto plano y sin direccion no estaban.
CORREOS.forEach(([caso, componer]) => {
  test(`los limites del paquete van antes de la invitacion (${caso})`, () => {
    const { html, text } = componer();
    [html, text].forEach((cuerpo) => {
      assert.match(cuerpo, /2 kg/);
      assert.ok(cuerpo.indexOf('2 kg') < cuerpo.indexOf('1.000 cartas'));
    });
  });
});

// Va despues de los pasos del envio: primero como se manda, luego que conviene meter.
test('la invitacion va detras de la etiqueta, no delante', () => {
  const { html } = postal({ direccion });
  assert.ok(html.indexOf('oficina de Correos') < html.indexOf('1.000 cartas'));
});
