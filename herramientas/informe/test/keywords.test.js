const test = require('node:test');
const assert = require('node:assert');
const { construirIndice } = require('../lib/keywords');

// El indice se construye leyendo los ficheros reales del repo, asi que este test es el
// unico que se entera si una pagina cambia de sitio y el scanner se queda mirando donde
// ya no hay nada. Los demas tests le pasan paginas a mano y por eso no lo veian.
test('encuentra las paginas de los dos dominios, no solo los articulos del hub', () => {
  const { paginas } = construirIndice();
  const rutas = paginas.map(({ dominio, ruta }) => `${dominio}${ruta}`);

  for (const esperada of [
    'cartasmagic.es/',
    'cartasmagic.es/blog',
    'vendercartasmagic.es/',
    'vendercartasmagic.es/como-vender-cartas-magic',
    'vendercartasmagic.es/valoracion-cartas-magic',
    'vendercartasmagic.es/presupuesto-manabox'
  ]) {
    assert.ok(rutas.includes(esperada), `falta ${esperada} en el indice: ${rutas.join(', ')}`);
  }
});

test('cita el fichero donde de verdad se editan las keywords', () => {
  const { paginas } = construirIndice();
  const portada = paginas.find(({ dominio, ruta }) => dominio === 'vendercartasmagic.es' && ruta === '/');

  assert.equal(portada.fichero, 'apps/vender/lib/metadatos.js');
  const lineas = require('node:fs')
    .readFileSync(require('node:path').resolve(__dirname, '../../../', portada.fichero), 'utf8')
    .split('\n');
  assert.match(lineas[portada.numeroLinea - 1], /keywords:/);
});

test('las keywords de venta que ya estan declaradas no salen como huerfanas', () => {
  const { porKeyword } = construirIndice();

  for (const keyword of [
    'vender cartas',
    'donde vender cartas magic',
    'venta cartas magic',
    'vender cartas magic online',
    'tasar cartas magic',
    'valorar cartas magic'
  ]) {
    assert.ok(porKeyword.has(keyword), `${keyword} deberia tener pagina`);
  }
});
