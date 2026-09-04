const { envolver, escaparHtml, parrafo, lista, notaHtml } = require('./correo-plantilla');

const LIMITES = { peso: '3 kg', medidas: '40 x 20 x 20 cm' };

// El correo pide la direccion de remite porque sin ella no se puede generar la etiqueta.
// La etiqueta va en un segundo correo, cuando el cliente conteste con su direccion.
const cuerpoHtml = ({ nombre }) => [
  parrafo(`Hola ${escaparHtml(nombre)},`),
  parrafo('Gracias por escribirnos. Te cuento cómo funciona cuando hay que valorar una colección entera.'),
  parrafo('Te generamos un código de envío a nuestra dirección, así que solo tienes que dejar el paquete en cualquier oficina de Correos. El envío lo pagamos nosotros. Cuando llega, lo revisamos y te escribimos con el presupuesto en un día laborable. Si te encaja, te hacemos la transferencia en 24 horas. Si no, te lo devolvemos, y en ese caso los costes de la devolución son a tu cargo (11,90 €, que es lo que suman el envío de ida y el de vuelta).'),
  parrafo('<strong>Para prepararte la etiqueta solo necesito una dirección de remitente</strong>, por si hubiese que devolverte el paquete. En cuanto me la mandes te devuelvo la etiqueta ya rellenada.'),
  parrafo('Mientras tanto, estas son las medidas máximas del paquete:'),
  lista([
    `Peso: ${LIMITES.peso}`,
    `Largo x ancho x alto: ${LIMITES.medidas}`
  ]),
  parrafo(`Si ves que va a pesar más de ${LIMITES.peso}, avísame y te preparo una etiqueta para más peso.`)
].join('\n\n');

const cuerpoTexto = ({ nombre }) => [
  `Hola ${nombre},`,
  '',
  'Gracias por escribirnos. Te cuento cómo funciona cuando hay que valorar una colección entera.',
  '',
  'Te generamos un código de envío a nuestra dirección, así que solo tienes que dejar el paquete en cualquier oficina de Correos. El envío lo pagamos nosotros. Cuando llega, lo revisamos y te escribimos con el presupuesto en un día laborable. Si te encaja, te hacemos la transferencia en 24 horas. Si no, te lo devolvemos, y en ese caso los costes de la devolución son a tu cargo (11,90 EUR).',
  '',
  'Para prepararte la etiqueta solo necesito una dirección de remitente, por si hubiese que devolverte el paquete. En cuanto me la mandes te devuelvo la etiqueta ya rellenada.',
  '',
  'Mientras tanto, estas son las medidas máximas del paquete:',
  `  Peso: ${LIMITES.peso}`,
  `  Largo x ancho x alto: ${LIMITES.medidas}`,
  '',
  `Si ves que va a pesar más de ${LIMITES.peso}, avísame y te preparo una etiqueta para más peso.`,
  '',
  'Un saludo,',
  'Iván',
  'vendercartasmagic.es'
].join('\n');

const notasHtml = ({ email, provincia, queTiene, volumen, mensaje }) => [
  notaHtml(`Correo: ${escaparHtml(email)} &middot; Provincia: ${escaparHtml(provincia)}`),
  notaHtml(`Qué tiene: ${escaparHtml(queTiene)} &middot; Volumen: ${escaparHtml(volumen)}`),
  notaHtml(`Dice el cliente: ${escaparHtml(mensaje || '(nada)')}`)
].join('\n');

const componerCorreoPostal = (datos) => ({
  subject: `Nueva colección: ${datos.nombre} (${datos.provincia})`,
  replyTo: datos.email,
  text: cuerpoTexto(datos),
  html: envolver({ cuerpo: cuerpoHtml(datos), notas: notasHtml(datos) })
});

module.exports = { componerCorreoPostal };
