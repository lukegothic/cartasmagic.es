// Calcula las cifras publicables del historico de compras.
//
//   node scripts/agregados-compras.js ruta/al/historico.csv
//
// El CSV lleva nombres de vendedores y notas privadas sobre ellos, asi que vive fuera
// del repositorio y de aqui solo salen agregados. Nunca imprime filas individuales.
//
// La columna de cartas de 5 euros o mas tiene alguna fila con mas cartas caras que
// cartas en total, que es imposible. Esas filas se descartan del calculo de la
// proporcion, pero sus importes siguen contando en los totales.

const fs = require('node:fs');

const CABECERAS = {
  cartas: 'numero de cartas',
  tasado: 'tasado',
  entregado: 'total entregado'
};

// Opcional: sin ella se siguen calculando los totales, solo falta la proporcion.
const CABECERA_VALOR = 'numero cartas valor';

// Un CSV con comas y comillas dentro de las celdas: las notas de campo llevan las dos.
const partirLinea = (linea) => {
  const celdas = [];
  let actual = '';
  let entreComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];
    if (caracter === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === ',' && !entreComillas) {
      celdas.push(actual);
      actual = '';
    } else {
      actual += caracter;
    }
  }
  celdas.push(actual);
  return celdas;
};

const aNumero = (celda) => {
  const limpio = (celda || '').trim().replace(',', '.');
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
};

const mediana = (valores) => {
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};

const indiceDe = (cabecera, etiqueta) =>
  cabecera.findIndex((celda) => celda.trim().toLowerCase().startsWith(etiqueta));

const leerOperaciones = (ruta) => {
  const lineas = fs.readFileSync(ruta, 'utf8').split(/\r?\n/).filter(Boolean);
  const cabecera = partirLinea(lineas[0]);

  const columnas = Object.fromEntries(
    Object.entries(CABECERAS).map(([clave, etiqueta]) => [clave, indiceDe(cabecera, etiqueta)])
  );

  const faltan = Object.entries(columnas).filter(([, indice]) => indice === -1);
  if (faltan.length) {
    throw new Error(`No encuentro las columnas: ${faltan.map(([c]) => c).join(', ')}`);
  }

  const columnaValor = indiceDe(cabecera, CABECERA_VALOR);

  return lineas
    .slice(1)
    .map(partirLinea)
    .map((celdas) => ({
      cartas: aNumero(celdas[columnas.cartas]),
      tasado: aNumero(celdas[columnas.tasado]),
      entregado: aNumero(celdas[columnas.entregado]),
      cartasValor: columnaValor === -1 ? null : aNumero(celdas[columnaValor])
    }))
    .filter(({ cartas, tasado, entregado }) => cartas && tasado && entregado);
};

const resumir = (operaciones) => {
  const cartas = operaciones.map((o) => o.cartas);
  const pagos = operaciones.map((o) => o.entregado);

  // Mas cartas caras que cartas en total es imposible: esa fila no cuenta para la
  // proporcion.
  const conValor = operaciones.filter(
    (o) => o.cartasValor !== null && o.cartasValor !== undefined && o.cartasValor <= o.cartas
  );
  const cartasConValor = conValor.reduce((t, o) => t + o.cartasValor, 0);
  const cartasRevisadas = conValor.reduce((t, o) => t + o.cartas, 0);
  const porcentajeValor = cartasRevisadas
    ? Math.round((cartasConValor / cartasRevisadas) * 100)
    : null;

  return {
    operacionesConValor: conValor.length,
    porcentajeValor,
    porcentajeBulk: porcentajeValor === null ? null : 100 - porcentajeValor,
    operaciones: operaciones.length,
    cartasTotales: cartas.reduce((t, n) => t + n, 0),
    pagadoTotal: pagos.reduce((t, n) => t + n, 0),
    cartasMin: Math.min(...cartas),
    cartasMediana: mediana(cartas),
    cartasMax: Math.max(...cartas),
    pagadoMin: Math.min(...pagos),
    pagadoMediana: mediana(pagos),
    pagadoMax: Math.max(...pagos)
  };
};

const enEuros = (n) => Math.round(n).toLocaleString('es-ES');

if (require.main === module) {
  const ruta = process.argv[2];
  if (!ruta) {
    console.error('Falta la ruta del CSV: node scripts/agregados-compras.js historico.csv');
    process.exit(1);
  }

  const r = resumir(leerOperaciones(ruta));

  console.log(`Operaciones completadas: ${r.operaciones}`);
  console.log(`Cartas valoradas: ${enEuros(r.cartasTotales)}`);
  console.log(`Pagado en total: ${enEuros(r.pagadoTotal)} euros`);
  console.log('');
  console.log(`Cartas por coleccion: ${r.cartasMin} / ${r.cartasMediana} / ${r.cartasMax}`);
  console.log(
    `Pagado por coleccion: ${enEuros(r.pagadoMin)} / ${enEuros(r.pagadoMediana)} / ${enEuros(r.pagadoMax)} euros`
  );

  if (r.porcentajeValor === null) {
    console.log('');
    console.log('Sin datos coherentes de cartas de 5 euros o mas.');
    return;
  }

  console.log('');
  console.log(`Cartas de 5 euros o mas: ${r.porcentajeValor} %`);
  console.log(`Bulk: ${r.porcentajeBulk} %`);
  console.log(`(sobre ${r.operacionesConValor} de ${r.operaciones} operaciones)`);
}

module.exports = { leerOperaciones, resumir, partirLinea, mediana };
