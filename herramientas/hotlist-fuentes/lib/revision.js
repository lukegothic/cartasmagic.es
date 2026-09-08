// El informe que se lee a mano.
//
// A diferencia del de cambios, este no supone que las fuentes se hayan podido leer. Su trabajo
// es dejarlo todo a la vista para que una persona decida: lo que se pudo extraer, lo que no, y
// el enlace de cada cosa para abrirla. Una fuente que no se sabe leer sigue saliendo, con su
// aviso al lado, porque el enlace a un cartel de noventa cartas vale mas que su ausencia.

const ESTADOS = {
  leida: 'Leída',
  parcial: 'Leída a medias',
  a_revisar: 'Hay que mirarla',
  caida: 'No contesta'
};

const cifra = (n) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

const fechaLegible = (dia = new Date()) =>
  [dia.getDate(), dia.getMonth() + 1].map((n) => String(n).padStart(2, '0')).join('/') + `/${dia.getFullYear()}`;

const resumen = (recogidas) => {
  const cartas = recogidas.reduce((total, { cartas }) => total + cartas.length, 0);
  const porEstado = recogidas.reduce((cuenta, { estado }) => ({ ...cuenta, [estado]: (cuenta[estado] ?? 0) + 1 }), {});
  return { cartas, porEstado };
};

const bloqueFuente = (fuente) => {
  const { tienda, pais, moneda, estado, cartas, aviso, imagenes = [], url, tienda_url: tiendaUrl, nota } = fuente;
  const lineas = [`### ${tienda} (${pais})`, '', `Estado: ${ESTADOS[estado] ?? estado}`];

  const enlace = url ?? tiendaUrl;
  if (enlace) lineas.push(`Página: ${enlace}`);
  if (nota) lineas.push(`Nota: ${nota}`);
  if (aviso) lineas.push(`Aviso: ${aviso}`);
  lineas.push('');

  // Las imagenes se enumeran para poder abrirlas: es lo unico que se puede hacer con ellas
  // hasta que alguien las mire.
  if (imagenes.length) {
    lineas.push('Imágenes de la página, hay que abrirlas para ver cuál es la lista:', '');
    lineas.push(...imagenes.map((i) => `- ${i}`), '');
  }

  if (!cartas.length) {
    if (!imagenes.length) lineas.push('No se ha sacado ninguna carta.', '');
    return lineas;
  }

  const ordenadas = [...cartas].sort((a, b) => b.precio - a.precio);
  lineas.push(
    `${cartas.length} cartas, de más cara a más barata:`,
    '',
    '| Carta | Edición | Estado | Paga |',
    '|---|---|---|---|',
    ...ordenadas.map((c) => `| ${c.nombre} | ${c.edicion || '-'} | ${c.estado} | ${cifra(c.precio)} ${moneda} |`),
    ''
  );

  return lineas;
};

const componerRevision = (recogidas, dia = new Date()) => {
  const { cartas, porEstado } = resumen(recogidas);
  const cuenta = Object.entries(porEstado)
    .map(([estado, n]) => `${n} ${(ESTADOS[estado] ?? estado).toLowerCase()}`)
    .join(', ');

  return [
    `# Lo que publican las tiendas, ${fechaLegible(dia)}`,
    '',
    `${recogidas.length} fuentes (${cuenta}). ${cartas} cartas extraídas.`,
    '',
    'Los precios son de cada tienda y en su moneda: sirven para ver qué se mueve, no para ' +
      'copiarlos. Lo que no se ha podido leer solo queda abajo con su enlace, para mirarlo a mano.',
    '',
    ...recogidas.flatMap(bloqueFuente)
  ].join('\n');
};

module.exports = { componerRevision };
