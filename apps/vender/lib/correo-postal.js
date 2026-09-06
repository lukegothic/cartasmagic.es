const {
  envolver, escaparHtml, parrafo, firmaTexto,
  bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto
} = require('./correo-plantilla');
const { NOTAS_INTERNAS, LIMITES_PAQUETE, PEDIR_DIRECCION, POSTAL } = require('./textos-correo');
const { componerNotas } = require('./notas');

const cuerpoHtml = ({ nombre, direccion }) => [
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

const notas = ({ nombre, email, volumen, mensaje, direccion }) =>
  componerNotas({
    nombre,
    direccion,
    mensaje,
    asuntoCliente: POSTAL.asuntoCliente,
    lineas: [
      `${NOTAS_INTERNAS.correo} ${email}`,
      `${NOTAS_INTERNAS.volumen} ${volumen.largo}`
    ]
  });

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
  html: envolver(cuerpoHtml(datos)),
  attachments: [notas(datos)]
});

module.exports = { componerCorreoPostal };
