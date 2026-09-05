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

const notasHtml = ({ email, volumen, mensaje, direccion }) => [
  direccion ? notaDireccion(direccion) : '',
  notaHtml(`Correo: ${escaparHtml(email)}`),
  notaHtml(`Volumen: ${escaparHtml(volumen.largo)}`),
  notaHtml(`Dice el cliente: ${escaparHtml(mensaje || '(nada)')}`)
].filter(Boolean).join('\n');

// El asunto es lo unico que se lee antes de decidir si la etiqueta sale ya, asi que lleva
// el volumen, que marca el tamaño de la etiqueta, y la localidad cuando se puede generar.
const asunto = ({ nombre, volumen, direccion }) => {
  const donde = direccion?.localidad ? `, ${direccion.localidad}` : '';
  return `Nueva colección: ${nombre} (${volumen.corto}${donde})${direccion ? ' - con dirección' : ''}`;
};

const componerCorreoPostal = (datos) => ({
  subject: asunto(datos),
  replyTo: datos.email,
  text: cuerpoTexto(datos),
  html: envolver({ cuerpo: cuerpoHtml(datos), notas: notasHtml(datos) })
});

module.exports = { componerCorreoPostal };
