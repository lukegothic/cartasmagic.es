// Escribe los graficos de los articulos en public/blog/<slug>/.
//
//   node scripts/graficos-articulos.js                    solo los de datos publicados
//   node scripts/graficos-articulos.js ruta/al/historico.csv   ademas, la dispersion
//
// Los SVG se guardan en el repositorio ya generados: el servidor solo sirve ficheros y no
// tiene el CSV, que vive fuera por llevar nombres de vendedores. Al cambiar los datos hay
// que volver a pasar este script y commitear el resultado.

const fs = require('node:fs');
const path = require('node:path');

const { medidor, barras, dispersion, matriz, serieTemporal } = require('../lib/graficos');
const { serieDeValor, FRONTERA } = require('./valor-por-edicion');
const { leerOperaciones } = require('./agregados-compras');

const BLOG = path.join(__dirname, '..', 'public', 'blog');

// Los seis acabados de The One Ring, tal y como estan publicados en el articulo.
const ACABADOS = [
  { etiqueta: 'Normal', valor: 89.28 },
  { etiqueta: 'Foil', valor: 109.43 },
  { etiqueta: 'Foil especial bundle', valor: 86.11 },
  { etiqueta: 'Foil arte extendido', valor: 238.33 },
  { etiqueta: 'Foil de presentación', valor: 205.46 },
  { etiqueta: 'Foil "Silver Scroll"', valor: 714.0 }
];

// La misma tabla aparece en dos articulos, asi que el grafico se escribe en los dos sitios
// desde una sola definicion. Se pinta lo que la carta PIERDE, no lo que conserva: asi la
// celda mas oscura es la peor noticia, que es lo que dice el texto de los dos articulos.
const PERDIDA = {
  columnas: ['EX', 'GD', 'LP o peor'],
  filas: [
    { etiqueta: 'Menos de 15 euros', valores: [20, 30, 50] },
    { etiqueta: 'De 15 a 25 euros', valores: [15, 30, 50] },
    { etiqueta: 'De 25 a 100 euros', valores: [15, 25, 35] },
    { etiqueta: 'Más de 100 euros', valores: [10, 20, 30] },
    { etiqueta: 'Alpha, Beta y Unlimited', valores: [20, 40, 60] },
    { etiqueta: 'Foils', valores: [25, 50, 70] }
  ]
};

const escribir = (slug, nombre, svg) => {
  const destino = path.join(BLOG, slug, nombre);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, svg);
  console.log(`escrito ${path.relative(path.join(__dirname, '..'), destino)}`);
};

const graficosPublicados = () => {
  escribir(
    'informe-mercado-magic-espana',
    'proporcion-valor.svg',
    medidor({ etiqueta: 'Cartas de 5 euros o más', porcentaje: 14 })
  );

  escribir(
    'como-saber-cuanto-vale-una-carta-magic',
    'acabados-precio.svg',
    barras({
      titulo: 'The One Ring: precio de cada acabado',
      series: ACABADOS,
      destacada: 'Normal'
    })
  );

  const descuentos = matriz({
    titulo: 'Cuánto pierde una carta según su estado',
    ...PERDIDA
  });

  ['como-saber-cuanto-vale-una-carta-magic', 'estado-de-la-carta-nm-ex-gd-lp'].forEach((slug) =>
    escribir(slug, 'descuento-por-estado.svg', descuentos)
  );

};

// La nube de puntos sale del CSV oficial, que es el que trae el tamano real de cada
// coleccion. El fichero de rendimiento cuenta solo las cartas catalogadas en stock, asi
// que su columna de cartas no sirve para este grafico.
// Necesita red: las fechas de salida salen de la API de Scryfall.
const graficoDeValorPorEdicion = async () => {
  const puntos = await serieDeValor();

  escribir(
    'que-colecciones-antiguas-valen-dinero',
    'valor-por-edicion.svg',
    serieTemporal({
      titulo: 'Lo que vale una caja de sobres, edición por edición',
      puntos,
      corte: FRONTERA
    })
  );

  console.log(`(${puntos.length} ediciones)`);
};

const graficoDeDispersion = (rutaCsv) => {
  const puntos = leerOperaciones(rutaCsv).map(({ cartas, entregado }) => ({
    cartas,
    pagado: entregado
  }));

  const nube = dispersion({ titulo: 'Cuánto se pagó por cada colección', puntos });

  // Los dos articulos hacen la misma afirmacion, asi que comparten grafico.
  ['informe-mercado-magic-espana', 'que-colecciones-antiguas-valen-dinero'].forEach((slug) =>
    escribir(slug, 'cartas-frente-a-pagado.svg', nube)
  );

  console.log(`(${puntos.length} colecciones leidas del CSV)`);
};

const principal = async () => {
  graficosPublicados();

  // La serie de valor por edicion pide las fechas a Scryfall. Si la red falla, el resto
  // de graficos ya estan escritos y solo se pierde este.
  try {
    await graficoDeValorPorEdicion();
  } catch (err) {
    console.error(`No se pudo generar el valor por edicion: ${err.message}`);
  }

  const rutaCsv = process.argv[2];
  if (!rutaCsv) {
    console.log('');
    console.log('Sin CSV: falta la nube de puntos de las colecciones.');
    console.log('  node scripts/graficos-articulos.js ruta/al/historico.csv');
    return;
  }

  graficoDeDispersion(rutaCsv);
};

if (require.main === module) {
  principal();
}

module.exports = { graficosPublicados, graficoDeDispersion, graficoDeValorPorEdicion };
