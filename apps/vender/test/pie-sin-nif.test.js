const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PIE } = require('../lib/textos');

const layout = fs.readFileSync(path.join(__dirname, '../views/layout.ejs'), 'utf8');
const avisoLegal = fs.readFileSync(path.join(__dirname, '../views/aviso-legal.ejs'), 'utf8');

// El articulo 10 de la LSSI obliga a publicar el NIF y el domicilio, pero no en cada
// pagina: basta con que esten en el aviso legal y que se llegue desde cualquier sitio. El
// pie los repetia en todas, que es superficie de scraping regalada sin cumplir nada extra.
test('el pie no publica el NIF ni el domicilio', () => {
  assert.doesNotMatch(PIE.titular, /72808254Y/);
  assert.doesNotMatch(PIE.titular, /Iribarren/);
});

// Quitar el NIF del pie solo es legal si el aviso legal sigue estando a un clic desde
// cualquier pagina, porque el layout lo pinta en todas.
test('el pie enlaza al aviso legal desde cualquier pagina', () => {
  assert.match(layout, /href="\/aviso-legal"/);
});

// Donde si son obligatorios. Si alguien los quita de aqui buscando discrecion, el
// incumplimiento es peor que el problema que evita.
test('el aviso legal conserva la identidad fiscal completa', () => {
  assert.match(avisoLegal, /72808254Y/);
  assert.match(avisoLegal, /Manuel Iribarren 10/);
});
