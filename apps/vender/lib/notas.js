// Los datos del formulario viajan como adjunto y no dentro del correo: asi el cuerpo sale ya
// listo para reenviar al cliente, sin borrar nada antes.
const { NOTAS_INTERNAS } = require('./textos-correo');

// Solo se deja pasar lo que puede ir dentro de un nombre de fichero sin dar problemas.
const nombreDeFichero = (texto, siVacio) => texto.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || siVacio;

// La direccion ocupa varias lineas, asi que se sangra debajo de su etiqueta en vez de ir
// pegada a ella.
const bloqueDireccion = (direccion) => [
  NOTAS_INTERNAS.direccion,
  ...direccion.texto.split('\n').map((l) => `  ${l.trim()}`),
  ...(direccion.pareceIncompleta ? [`  ${NOTAS_INTERNAS.direccionIncompleta}`] : [])
];

const componerNotas = ({ nombre, lineas, direccion, mensaje }) => ({
  filename: `notas-${nombreDeFichero(nombre, 'cliente')}.txt`,
  content: [
    NOTAS_INTERNAS.titulo,
    '',
    `${NOTAS_INTERNAS.nombre} ${nombre}`,
    ...lineas,
    ...(direccion ? bloqueDireccion(direccion) : []),
    `${NOTAS_INTERNAS.diceCliente} ${mensaje || NOTAS_INTERNAS.sinMensaje}`,
    ''
  ].join('\n'),
  contentType: 'text/plain; charset=utf-8'
});

module.exports = { componerNotas, nombreDeFichero };
