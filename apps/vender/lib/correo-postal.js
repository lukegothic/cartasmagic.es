const {
  envolver, escaparHtml, parrafo, notaHtml, firmaTexto,
  bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto,
  avisoAdjuntar, notaDireccion
} = require('./correo-plantilla');
const { NOTAS_INTERNAS, LIMITES_PAQUETE, PEDIR_DIRECCION, POSTAL } = require('./textos-correo');

const cuerpoHtml = ({ nombre, direccion }) => [
  direccion ? avisoAdjuntar() : '',
  parrafo(POSTAL.saludo(escaparHtml(nombre))),
  parrafo(POSTAL.intro),
  parrafo(POSTAL.proceso),
  direccion ? bloqueEtiqueta() : pedirDireccion(),
  direccion ? '' : parrafo(PEDIR_DIRECCION.limite(LIMITES_PAQUETE.peso, LIMITES_PAQUETE.medidas))
].filter(Boolean).join('\n\n');

const cuerpoTexto = ({ nombre, direccion }) => [
  POSTAL.saludo(nombre),
  '',
  POSTAL.intro,
  '',
  POSTAL.proceso,
  '',
  direccion ? bloqueEtiquetaTexto() : pedirDireccionTexto(),
  '',
  ...firmaTexto()
].join('\n');

const notasHtml = ({ email, volumen, mensaje, direccion }) => [
  direccion ? notaDireccion(direccion) : '',
  notaHtml(`${NOTAS_INTERNAS.correo} ${escaparHtml(email)}`),
  notaHtml(`${NOTAS_INTERNAS.volumen} ${escaparHtml(volumen.largo)}`),
  notaHtml(`${NOTAS_INTERNAS.diceCliente} ${escaparHtml(mensaje || NOTAS_INTERNAS.sinMensaje)}`)
].filter(Boolean).join('\n');

const asunto = ({ nombre, volumen, direccion }) =>
  POSTAL.asunto({
    nombre,
    volumen: volumen.corto,
    donde: direccion?.localidad ? `, ${direccion.localidad}` : '',
    conDireccion: Boolean(direccion)
  });

const componerCorreoPostal = (datos) => ({
  subject: asunto(datos),
  replyTo: datos.email,
  text: cuerpoTexto(datos),
  html: envolver({ cuerpo: cuerpoHtml(datos), notas: notasHtml(datos) })
});

module.exports = { componerCorreoPostal };
