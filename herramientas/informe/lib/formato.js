// Formato numerico castellano: punto para millares, coma para decimales.
const numero = (n) => Math.round(n).toLocaleString('es-ES');
const decimal = (n, cifras = 1) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: cifras, maximumFractionDigits: cifras });
const porcentaje = (n) => `${decimal(n * 100)} %`;

const titulo = (texto) => `\n${texto}\n${'='.repeat(texto.length)}`;
const seccion = (texto) => `\n${texto}\n${'-'.repeat(texto.length)}`;

const tabla = (cabeceras, filas) => {
  if (!filas.length) return '  (nada)';

  const anchos = cabeceras.map((cabecera, i) =>
    Math.max(cabecera.length, ...filas.map((fila) => String(fila[i] ?? '').length))
  );
  const linea = (celdas) =>
    '  ' + celdas.map((celda, i) => String(celda ?? '').padEnd(anchos[i])).join('  ').trimEnd();

  return [linea(cabeceras), '  ' + anchos.map((a) => '-'.repeat(a)).join('  '), ...filas.map(linea)].join('\n');
};

module.exports = { numero, decimal, porcentaje, titulo, seccion, tabla };
