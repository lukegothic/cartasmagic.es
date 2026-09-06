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

// Los pasos van dentro del adjunto y no en el correo porque el adjunto es lo unico que se
// borra siempre antes de reenviar: si se cuelan, se cuelan con el fichero entero.
const PASOS_REENVIO = {
  titulo: 'Antes de reenviar',
  // Gmail no deja tocar el asunto al responder, y ademas cita el cuerpo. Con reenviar no
  // pasa ninguna de las dos cosas.
  pasos: [
    'Pulsa Reenviar, no Responder',
    'Copia el asunto de aquí abajo: el de este correo es para tu bandeja, no para el cliente',
    'Pon la dirección del cliente en Para, la tienes más abajo'
  ],
  quitarNotas: (fichero) => `Quita este fichero (${fichero}) de los adjuntos: lleva lo que pagas`,
  quitarCsv: (fichero) => `Decide si el desglose (${fichero}) va al cliente`,
  adjuntarEtiqueta: 'Adjunta la etiqueta de Correos, que este cliente ya ha dejado dirección',
  // El asunto va en una linea suelta, sin nada delante, para copiarlo de un tiron.
  asunto: 'Asunto para el cliente:',
  separador: '---'
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

// Packlink solo deja cancelar un envio dentro de los 15 dias siguientes a contratarlo. Los 5
// que se anuncian son un margen nuestro dentro de esa ventana: dejan diez dias para tramitar
// la cancelacion sin apurar el plazo del transportista.
//
// No confundir con los 15 dias naturales del aviso legal, que son otra cosa y corren desde
// que se manda el precio de unas cartas ya recibidas. Aqui todavia no ha salido el paquete.
const PLAZO_ETIQUETA = {
  // En la via postal no hay cifra todavia: caduca solo el envio.
  etiqueta: 'La etiqueta caduca a los 5 días. Pasado ese plazo se cancela el envío.',
  // La cifra sale de precios de Cardmarket, que se mueven, asi que caduca con la etiqueta.
  conOferta: 'La oferta y la etiqueta caducan a los 5 días. Pasado ese plazo se cancela el envío y habría que valorar las cartas otra vez.'
};

// El envio lo pagamos nosotros y la caja viaja igual llena que medio vacia, asi que interesa
// que venga llena: lo que se quede en casa del cliente ya no vuelve, porque una segunda tanda
// cuesta otro envio. El parrafo se lo dice mirandolo desde su lado, que es cobrar mas.
const APROVECHAR_CAJA = {
  // Las 1.000 cartas no son un limite como el peso o las medidas, que los mide Correos: son
  // una estimacion y solo sirven para persuadir, por eso no salen de LIMITES_PAQUETE.
  intro: 'En una caja de ese tamaño caben unas 1.000 cartas, y sale mejor mandarla llena: cuantas más cartas valoremos de una vez, más alta es la oferta. Merece la pena revisar cajas y carpetas antes de cerrarla, sobre todo si aparecen cartas raras, foils o cartas de ediciones antiguas, que son las que más levantan la valoración.',
  // El precio de ManaBox sale de una lista cerrada, asi que hay que decir de antemano que lo
  // que llegue de mas no va de regalo.
  extras: 'Si metes cartas que no estaban en la lista, las valoramos aparte y te sumamos lo que salga a la oferta.'
};

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
    `Ten en cuenta que el paquete no puede pasar de ${peso} ni de ${medidas}.`,
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
    `Nueva colección: ${nombre} (${volumen}${donde})${conDireccion ? ' - con dirección' : ''}`,
  // El que se copia al reenviar. Sin datos de triaje: el cliente no tiene por que leer el
  // volumen que dijo ni si nos consta su direccion.
  asuntoCliente: 'Tu valoración - vendercartasmagic.es'
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
  // El que se copia al reenviar. La cifra no va aqui: el cliente la lee en el cuerpo, y en el
  // asunto delataria la oferta antes de abrir el correo.
  asuntoCliente: 'Tu presupuesto - vendercartasmagic.es',
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

module.exports = { FIRMA, PASOS_REENVIO, NOTAS_INTERNAS, LIMITES_PAQUETE, PLAZO_ETIQUETA, APROVECHAR_CAJA, ETIQUETA, PEDIR_DIRECCION, POSTAL, MANABOX };
