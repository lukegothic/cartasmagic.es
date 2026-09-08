// Mira cada dia que compran las tiendas de referencia y saca que ha cambiado.
//
// Lo que responde es "que cartas han empezado a buscar y cuales han subido de precio", no
// "cuanto pagan". Los precios de fuera son en dolares y en dolares canadienses, sobre otro
// mercado y con otros costes, asi que no sirven para poner los nuestros: sirven como aviso de
// que algo se esta moviendo, para ir a mirarlo a Cardmarket.
//
// Uso:
//   node hotlist.js               lee las fuentes y compara con la ultima vez
//   node hotlist.js --solo-leer   lee y guarda la foto, sin informe (para el primer dia)

const { FuenteCaida } = require('./fuentes/comun');
const { cardmonster } = require('./fuentes/cardmonster');
const { crypt } = require('./fuentes/shopify');
const { starcitygames } = require('./fuentes/starcitygames');
const { porClave, comparar } = require('./lib/cambios');
const { componerMarkdown } = require('./lib/markdown');
const { leer, guardar, guardarInforme } = require('./lib/estado');

const FUENTES = { cardmonster, crypt, starcitygames };

// Una fuente caida no cancela las demas: se anota y se sigue. Que Crypt este en mantenimiento
// no es motivo para quedarse sin saber que ha hecho Card Monster.
const recoger = async () => {
  const anuncios = [];
  const fallos = [];

  for (const [nombre, leerFuente] of Object.entries(FUENTES)) {
    try {
      anuncios.push(...(await leerFuente()));
    } catch (error) {
      if (!(error instanceof FuenteCaida)) throw error;
      fallos.push(`${nombre}: ${error.message}`);
    }
  }

  return { anuncios, fallos };
};

const principal = async () => {
  const soloLeer = process.argv.includes('--solo-leer');
  const { anuncios, fallos } = await recoger();

  if (!anuncios.length) {
    // Sin una sola oferta no hay nada que comparar, y guardar la foto vacia haria que manana
    // todas las cartas parecieran nuevas.
    fallos.forEach((fallo) => console.error(`  ${fallo}`));
    console.error('Ninguna fuente ha devuelto nada. No se toca el historico.');
    process.exitCode = 1;
    return;
  }

  const hoy = porClave(anuncios);
  const ayer = leer();
  guardar(hoy);

  if (soloLeer) {
    console.log(`${anuncios.length} ofertas guardadas.`);
    return;
  }

  const texto = componerMarkdown(comparar(hoy, ayer), anuncios.length, fallos);
  console.log(texto);
  console.error(`\nGuardado en ${guardarInforme(texto)}`);
};

principal().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
