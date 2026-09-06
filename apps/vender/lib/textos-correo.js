// Prosa de los correos que se mandan al cliente. Separada de textos.js a proposito: no es
// copy de interfaz sino comunicacion, se lee en otro contexto (la bandeja de entrada, sin
// la pagina delante) y se edita por otros motivos.
//
// Aqui solo va el texto. El HTML que lo envuelve vive en correo-plantilla.js y las etiquetas
// de los datos del formulario se montan en notas.js, que son maquetacion y no prosa.

const FIRMA = {
  despedida: 'Un saludo,',
  nombre: 'Iván',
  sitio: 'vendercartasmagic.es',
  url: 'https://vendercartasmagic.es'
};

const NOTAS_INTERNAS = {
  titulo: 'Datos del formulario',
  nombre: 'Nombre:',
  direccion: 'Dirección para la etiqueta:',
  direccionIncompleta: 'Parece incompleta: conviene revisar antes de generar la etiqueta',
  correo: 'Correo:',
  volumen: 'Volumen:',
  diceCliente: 'Dice el cliente:',
  sinMensaje: '(nada)'
};

const LIMITES_PAQUETE = { peso: '2 kg', medidas: '30 x 20 x 20 cm' };

// Cuando el cliente ya ha dejado su direccion, el correo no se la vuelve a pedir: habla de
// la etiqueta como si viniese adjunta.
const ETIQUETA = {
  intro: 'Te adjunto la etiqueta de envío prepagada. Solo tienes que:',
  pasos: [
    'Meter las cartas en una caja',
    'Enseñar la etiqueta en tu oficina de Correos, no hace falta imprimirla',
    'Y listo: el envío ya está pagado por nosotros'
  ],
  seguimiento: 'Tiene número de seguimiento, así que puedes seguir el paquete. En un día laborable desde que llegue te mando la valoración a este mismo correo.',
  limite: (peso, medidas) =>
    `Ten en cuenta que el paquete no puede pasar de ${peso} ni de ${medidas}. Si se te queda corto, avísame y te preparo otra etiqueta.`,
  limiteTexto: (peso, medidas) =>
    `Ten en cuenta que el paquete no puede pasar de ${peso} ni de ${medidas}.`
};

const PEDIR_DIRECCION = {
  html: '<strong>Para prepararte la etiqueta solo necesito una dirección de remitente</strong>, por si hubiese que devolverte el paquete. En cuanto me la mandes te devuelvo la etiqueta ya rellenada.',
  texto: 'Para prepararte la etiqueta solo necesito una dirección de remitente, por si hubiese que devolverte el paquete. En cuanto me la mandes te devuelvo la etiqueta ya rellenada.',
  limite: (peso, medidas) =>
    `Mientras tanto, ten en cuenta que el paquete no puede pasar de ${peso} ni de ${medidas}.`
};

// Correo de quien pide valorar una coleccion entera por correo postal.
const POSTAL = {
  saludo: (nombre) => `Hola ${nombre},`,
  intro: 'Gracias por escribirnos. Te cuento cómo funciona cuando hay que valorar una colección entera.',
  proceso: 'Te generamos un código de envío a nuestra dirección, así que solo tienes que dejar el paquete en cualquier oficina de Correos. El envío lo pagamos nosotros. Cuando llega, lo revisamos y te escribimos con el presupuesto en un día laborable. Si te encaja, te hacemos la transferencia en 24 horas. Si no, te lo devolvemos, y en ese caso los costes de la devolución son a tu cargo (11,90 €, que es lo que suman el envío de ida y el de vuelta).',
  // El asunto es lo unico que se lee antes de decidir si la etiqueta sale ya, asi que lleva
  // el volumen, que marca el tamaño de la etiqueta, y la localidad cuando se puede generar.
  asunto: ({ nombre, volumen, donde, conDireccion }) =>
    `Nueva colección: ${nombre} (${volumen}${donde})${conDireccion ? ' - con dirección' : ''}`
};

// Correo de quien manda una lista de ManaBox y recibe ya una cifra.
const MANABOX = {
  saludo: (nombre) => `Hola ${nombre},`,
  intro: 'Hemos valorado la lista que nos mandaste. Esta es nuestra oferta por el lote completo:',
  ofertaEtiqueta: 'Oferta por tu colección',
  cartas: (total) => `${total} cartas`,
  queIncluyeTitulo: 'Qué incluye',
  queIncluye: [
    'Etiqueta de Correos prepagada: el envío lo pagamos nosotros',
    'Pago por transferencia dentro de las 24 horas siguientes a que aceptes',
    'Precio definitivo por el lote entero, sin negociación'
  ],
  confirmacion: 'El precio sale de la lista que nos has enviado y se confirma al recibir las cartas y comprobar su estado. Si el estado no se corresponde con la lista, te lo diríamos antes de pagar nada.',
  // La version de texto plano se corta antes: sin el matiz del estado, que en html cabe.
  confirmacionTexto: 'El precio sale de la lista que nos has enviado y se confirma al recibir las cartas y comprobar su estado.',
  limite: (peso, medidas) =>
    `Ten en cuenta que el paquete no puede pasar de ${peso} ni de ${medidas}. Si se te queda corto, avísame y te preparo una etiqueta para más peso.`,
  asunto: ({ nombre, donde, oferta, bajoMinimo, conDireccion }) =>
    `Presupuesto para ${nombre}${donde}: ${oferta} EUR${bajoMinimo ? ' (bajo mínimo)' : ''}${conDireccion ? ' - con dirección' : ''}`,
  notas: {
    enlace: 'Enlace:',
    mazo: 'Mazo:',
    mercado: 'Mercado:',
    sePaga: (porcentaje) => `se paga el ${porcentaje} %`,
    foils: 'Foils:',
    bajoMinimo: 'Por debajo del mínimo configurado',
    desglose: 'Desglose por tramo:'
  }
};

module.exports = { FIRMA, NOTAS_INTERNAS, LIMITES_PAQUETE, ETIQUETA, PEDIR_DIRECCION, POSTAL, MANABOX };
