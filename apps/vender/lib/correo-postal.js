const {
  envolver, escaparHtml, parrafo, notaHtml,
  LIMITES_PAQUETE, bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto,
  avisoAdjuntar, notaDireccion
} = require('./correo-plantilla');

const INTRO = 'Gracias por escribirnos. Te cuento cómo funciona cuando hay que valorar una colección entera.';
const PROCESO = 'Te generamos un código de envío a nuestra dirección, así que solo tienes que dejar el paquete en cualquier oficina de Correos. El envío lo pagamos nosotros. Cuando llega, lo revisamos y te escribimos con el presupuesto en un día laborable. Si te encaja, te hacemos la transferencia en 24 horas. Si no, te lo devolvemos, y en ese caso los costes de la devolución son a tu cargo (11,90 €, que es lo que suman el envío de ida y el de vuelta).';

const cuerpoHtml = ({ nombre, direccion }) => [
  direccion ? avisoAdjuntar() : '',
  parrafo(`Hola ${escaparHtml(nombre)},`),
  parrafo(INTRO),
  parrafo(PROCESO),
  direccion ? bloqueEtiqueta() : pedirDireccion(),
  direccion ? '' : parrafo(`Mientras tanto, ten en cuenta que el paquete no puede pasar de ${LIMITES_PAQUETE.peso} ni de ${LIMITES_PAQUETE.medidas}.`)
].filter(Boolean).join('\n\n');

const cuerpoTexto = ({ nombre, direccion }) => [
  `Hola ${nombre},`,
  '',
  INTRO,
  '',
  PROCESO,
  '',
  direccion ? bloqueEtiquetaTexto() : pedirDireccionTexto(),
  '',
  'Un saludo,',
  'Iván',
  'vendercartasmagic.es'
].join('\n');

const notasHtml = ({ email, provincia, queTiene, volumen, mensaje, direccion }) => [
  direccion ? notaDireccion(direccion) : '',
  notaHtml(`Correo: ${escaparHtml(email)} &middot; Provincia: ${escaparHtml(provincia)}`),
  notaHtml(`Qué tiene: ${escaparHtml(queTiene)} &middot; Volumen: ${escaparHtml(volumen)}`),
  notaHtml(`Dice el cliente: ${escaparHtml(mensaje || '(nada)')}`)
].filter(Boolean).join('\n');

const componerCorreoPostal = (datos) => ({
  subject: `Nueva colección: ${datos.nombre} (${datos.provincia})${datos.direccion ? ' - con dirección' : ''}`,
  replyTo: datos.email,
  text: cuerpoTexto(datos),
  html: envolver({ cuerpo: cuerpoHtml(datos), notas: notasHtml(datos) })
});

module.exports = { componerCorreoPostal };
