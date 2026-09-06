const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');

const VISTAS = path.join(__dirname, '..', 'views');

const render = (vista, datos) =>
  ejs.render(fs.readFileSync(path.join(VISTAS, `${vista}.ejs`), 'utf8'), datos, {
    filename: path.join(VISTAS, `${vista}.ejs`)
  });

const ENVIADO = {
  enviado: false,
  errorCode: 'EMAIL_NO_VALIDO',
  mensajeError: 'El correo no es válido',
  etiquetaConversion: 'valoracion',
  textoRecibido: ''
};

// Un error de validacion volvia a pintar el formulario en blanco: quien se equivocaba en
// una letra del correo tenia que teclear otra vez nombre, volumen, direccion y mensaje.
test('la valoracion conserva lo tecleado cuando el envio se rechaza', () => {
  const html = render('valoracion-cartas-magic', {
    ...ENVIADO,
    valores: {
      nombre: 'Juan García',
      email: 'juan@correo',
      volumen: '500-1000',
      direccion: 'Calle Mayor 1',
      mensaje: 'cuatro mazos'
    }
  });

  assert.match(html, /name="nombre"[^>]*value="Juan García"/);
  assert.match(html, /name="email"[^>]*value="juan@correo"/);
  assert.match(html, /<option value="500-1000" selected>/);
  assert.match(html, /name="direccion"[^>]*>Calle Mayor 1<\/textarea>/);
  assert.match(html, /name="mensaje"[^>]*>cuatro mazos<\/textarea>/);
});

// El presupuesto ya conservaba la url, pero perdia el resto igual que la valoracion.
test('el presupuesto de manabox conserva lo tecleado cuando el envio se rechaza', () => {
  const html = render('presupuesto-manabox', {
    ...ENVIADO,
    etiquetaConversion: 'manabox',
    valores: {
      url: 'https://manabox.app/decks/abc',
      nombre: 'Ana Ruiz',
      email: 'ana@correo',
      direccion: 'Calle Mayor 2',
      mensaje: 'dos albumes'
    }
  });

  assert.match(html, /name="url"[^>]*value="https:\/\/manabox.app\/decks\/abc"/);
  assert.match(html, /name="nombre"[^>]*value="Ana Ruiz"/);
  assert.match(html, /name="email"[^>]*value="ana@correo"/);
  assert.match(html, /name="direccion"[^>]*>Calle Mayor 2<\/textarea>/);
  assert.match(html, /name="mensaje"[^>]*>dos albumes<\/textarea>/);
});

// Una vista recien abierta no puede pintar "undefined" dentro de los campos.
test('los campos salen vacios cuando no hay nada tecleado', () => {
  const html = render('valoracion-cartas-magic', {
    ...ENVIADO,
    errorCode: null,
    mensajeError: null,
    valores: {}
  });

  assert.doesNotMatch(html, /undefined/);
  assert.match(html, /name="nombre"[^>]*value=""/);
});
