const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PORTADA } = require('../lib/textos');

const PUBLICO = path.join(__dirname, '..', 'public');
const CAMPOS = ['nombre', 'ciudad', 'fecha', 'pagado', 'cartas', 'cita'];
const CAMPOS_CARTA = ['nombre', 'foto', 'alt'];

const vacio = (valor) => !String(valor ?? '').trim();

// Un testimonio a medias resta confianza en vez de sumarla: la cifra o la carta que falta
// es justo lo que hace creible al resto.
test('cada testimonio trae todos sus datos', () => {
  const incompletos = PORTADA.testimonios.lista.flatMap((testimonio) => [
    ...CAMPOS.filter((campo) => vacio(testimonio[campo])),
    ...CAMPOS_CARTA.filter((campo) => vacio(testimonio.cartaTop?.[campo])).map((campo) => `cartaTop.${campo}`)
  ].map((campo) => `${testimonio.nombre}: ${campo}`));

  assert.deepEqual(incompletos, []);
});

test('la foto de la carta de cada testimonio existe', () => {
  const rotas = PORTADA.testimonios.lista
    .filter(({ cartaTop }) => !fs.existsSync(path.join(PUBLICO, cartaTop.foto)))
    .map(({ nombre, cartaTop }) => `${nombre}: ${cartaTop.foto}`);

  assert.deepEqual(rotas, []);
});
