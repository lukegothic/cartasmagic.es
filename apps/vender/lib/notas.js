// Los datos del formulario viajan como adjunto y no dentro del correo: asi el cuerpo sale ya
// listo para reenviar al cliente, sin borrar nada antes.
const { PASOS_REENVIO, NOTAS_INTERNAS } = require('./textos-correo');

// Solo se deja pasar lo que puede ir dentro de un nombre de fichero sin dar problemas. La NFD
// separa la tilde de su letra, asi que hay que quitarla antes: si no, "Rodríguez" se partia en
// "Rodri-guez" al convertir la tilde suelta en guion.
const nombreDeFichero = (texto, siVacio) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || siVacio;

// La direccion ocupa varias lineas, asi que se sangra debajo de su etiqueta en vez de ir
// pegada a ella.
const bloqueDireccion = (direccion) => [
  NOTAS_INTERNAS.direccion,
  ...direccion.texto.split('\n').map((l) => `  ${l.trim()}`),
  ...(direccion.pareceIncompleta ? [`  ${NOTAS_INTERNAS.direccionIncompleta}`] : [])
];

// El orden es el del reenvio: lo que se puede olvidar del todo va antes que lo que se ve al
// escribir. Solo se listan los pasos que aplican, para que ninguno se lea en balde.
const bloquePasos = ({ fichero, csv, direccion }) => [
  PASOS_REENVIO.titulo,
  ...[
    ...PASOS_REENVIO.pasos,
    PASOS_REENVIO.quitarNotas(fichero),
    ...(csv ? [PASOS_REENVIO.quitarCsv(csv)] : []),
    ...(direccion ? [PASOS_REENVIO.adjuntarEtiqueta] : [])
  ].map((paso, i) => `  ${i + 1}. ${paso}`),
  '',
  PASOS_REENVIO.separador,
  ''
];

const componerNotas = ({ nombre, lineas, direccion, mensaje, csv }) => {
  const filename = `notas-${nombreDeFichero(nombre, 'cliente')}.txt`;

  return {
    filename,
    content: [
      ...bloquePasos({ fichero: filename, csv, direccion }),
      NOTAS_INTERNAS.titulo,
      '',
      `${NOTAS_INTERNAS.nombre} ${nombre}`,
      ...lineas,
      ...(direccion ? bloqueDireccion(direccion) : []),
      `${NOTAS_INTERNAS.diceCliente} ${mensaje || NOTAS_INTERNAS.sinMensaje}`,
      ''
    ].join('\n'),
    contentType: 'text/plain; charset=utf-8'
  };
};

module.exports = { componerNotas, nombreDeFichero };
