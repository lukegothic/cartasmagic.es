// El informe del dia, en markdown para que se lea igual en el log de Dokploy que en un fichero.

const { PENDIENTE } = require('../fuentes/starcitygames');

const MAXIMO_FILAS = 40;

// Punto para millares y coma para decimales, como en formato.js del informe.
const cifra = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Se compone a mano en vez de con toLocaleDateString porque el contenedor de Dokploy trae
// otros datos de ICU que Windows y escribia 8/9/2026 donde aqui sale 08/09/2026. La fecha la
// lee una persona en el informe: que cambie de forma segun donde corra es ruido.
const fechaLegible = (dia = new Date()) =>
  [dia.getDate(), dia.getMonth() + 1].map((n) => String(n).padStart(2, '0')).join('/') +
  `/${dia.getFullYear()}`;

const tabla = (titulo, cabeceras, filas) => {
  if (!filas.length) return [`## ${titulo}`, '', 'Nada.', ''];
  return [
    `## ${titulo}`,
    '',
    `| ${cabeceras.join(' | ')} |`,
    `|${cabeceras.map(() => '---').join('|')}|`,
    ...filas.map((fila) => `| ${fila.join(' | ')} |`),
    ''
  ];
};

const componerMarkdown = ({ nuevas, retiradas, movidas }, total, fallos, dia = new Date()) => {
  const lineas = [
    `# Que compran las otras tiendas, ${fechaLegible(dia)}`,
    '',
    `${total} ofertas leidas. Los precios son de cada tienda y en su moneda: sirven para ver que ` +
      'se mueve, no para copiarlos.',
    '',
    ...tabla(
      'Cartas que han empezado a buscar',
      ['Carta', 'Edicion', 'Tienda', 'Paga'],
      nuevas.slice(0, MAXIMO_FILAS).map((a) => [a.nombre, a.edicion, a.fuente, `${cifra(a.precio)} ${a.moneda}`])
    ),
    ...tabla(
      'Cartas que han cambiado de precio',
      ['Carta', 'Edicion', 'Tienda', 'Antes', 'Ahora', 'Cambio'],
      movidas.slice(0, MAXIMO_FILAS).map(({ anuncio, antes, diferencia }) => [
        anuncio.nombre,
        anuncio.edicion,
        anuncio.fuente,
        cifra(antes),
        `${cifra(anuncio.precio)} ${anuncio.moneda}`,
        `${diferencia > 0 ? '+' : ''}${cifra(diferencia)}`
      ])
    ),
    ...tabla(
      'Cartas que han dejado de buscar',
      ['Carta', 'Edicion', 'Tienda'],
      retiradas.slice(0, 20).map((a) => [a.nombre, a.edicion, a.fuente])
    )
  ];

  if (fallos.length) {
    lineas.push('## Fuentes que no se han podido leer', '', ...fallos.map((f) => `- ${f}`), '');
  }

  lineas.push('## Fuentes pendientes', '', `- ${PENDIENTE}`, '');
  return lineas.join('\n');
};

module.exports = { componerMarkdown };
