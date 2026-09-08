// Mira que compran las tiendas de referencia y deja lo que publican para revisarlo.
//
// Lo que responde es "que cartas quieren y que ha cambiado", no "cuanto pagamos nosotros". Los
// precios de fuera son en dolares y en dolares canadienses, sobre otro mercado y con otros
// costes: sirven como aviso de que algo se mueve, para ir a mirarlo a Cardmarket.
//
// Las fuentes se declaran en fuentes.json, no aqui. Anadir una tienda es anadir una entrada.
//
// Uso:
//   node hotlist.js               recoge y saca el informe de revision
//   node hotlist.js --cambios     ademas, compara con la ultima vez y dice que ha cambiado
//   node hotlist.js --solo-leer   recoge y guarda la foto, sin informe (para el primer dia)

const fs = require('node:fs');
const path = require('node:path');

const { recogerTodas } = require('./lib/recoger');
const { componerRevision } = require('./lib/revision');
const { porClave, comparar } = require('./lib/cambios');
const { componerMarkdown } = require('./lib/markdown');
const { leer, guardar, guardarInforme } = require('./lib/estado');

const leerFuentes = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fuentes.json'), 'utf8')).fuentes;

// Solo entran en la comparacion las cartas que se han sabido extraer. Las fuentes que hay que
// mirar a ojo no tienen precio con el que comparar, y meterlas como si estuvieran vacias diria
// cada dia que han retirado toda su lista.
const cartasDe = (recogidas) =>
  recogidas.flatMap(({ id, moneda, cartas }) =>
    cartas.map((carta) => ({ ...carta, fuente: id, moneda })));

const principal = async () => {
  const soloLeer = process.argv.includes('--solo-leer');
  const conCambios = process.argv.includes('--cambios');

  const recogidas = await recogerTodas(leerFuentes());
  const anuncios = cartasDe(recogidas);

  if (!anuncios.length && recogidas.every(({ estado }) => estado === 'caida')) {
    recogidas.forEach(({ tienda, aviso }) => console.error(`  ${tienda}: ${aviso}`));
    console.error('Ninguna fuente ha contestado. No se toca el historico.');
    process.exitCode = 1;
    return;
  }

  const hoy = porClave(anuncios);
  const ayer = leer();
  guardar(hoy);

  if (soloLeer) {
    console.log(`${anuncios.length} cartas de ${recogidas.length} fuentes guardadas.`);
    return;
  }

  const revision = componerRevision(recogidas);
  console.log(revision);
  console.error(`\nGuardado en ${guardarInforme(revision, new Date(), 'revision')}`);

  if (conCambios) {
    const cambios = componerMarkdown(comparar(hoy, ayer), anuncios.length, []);
    console.log(`\n---\n\n${cambios}`);
    console.error(`Guardado en ${guardarInforme(cambios, new Date(), 'cambios')}`);
  }
};

principal().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
