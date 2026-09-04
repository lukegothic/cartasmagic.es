const {
  envolver, escaparHtml, euros, parrafo, lista, destacado, notaHtml,
  LIMITES_PAQUETE, bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto,
  avisoAdjuntar, notaDireccion
} = require('./correo-plantilla');
const { calcularPresupuesto } = require('./presupuesto');
const { componerDesgloseCsv } = require('./desglose');

// Solo se deja pasar lo que puede ir dentro de un nombre de fichero sin dar problemas.
const nombreDeFichero = (texto) => texto.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'presupuesto';

const cuerpoHtml = ({ lead, mazo, presupuesto }) => [
  lead.direccion ? avisoAdjuntar() : '',
  parrafo(`Hola ${escaparHtml(lead.nombre)},`),
  parrafo('Hemos valorado la lista que nos mandaste. Esta es nuestra oferta por el lote completo:'),
  destacado([
    `    <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#666;">Oferta por tu colección</div>`,
    `    <div style="font-size:40px;font-weight:bold;color:#333;padding:8px 0;">${euros(presupuesto.oferta)} €</div>`,
    `    <div style="font-size:14px;color:#666;">${presupuesto.totalCartas} cartas${mazo.nombre ? ` &middot; ${escaparHtml(mazo.nombre)}` : ''}</div>`
  ].join('\n')),
  parrafo('<strong>Qué incluye</strong>'),
  lista([
    'Etiqueta de Correos prepagada: el envío lo pagamos nosotros',
    'Pago por transferencia dentro de las 24 horas siguientes a que aceptes',
    'Precio cerrado por el lote entero, sin negociación'
  ]),
  parrafo('El precio sale de la lista que nos has enviado y se confirma al recibir las cartas y comprobar su estado. Si el estado no se corresponde con la lista, te lo diríamos antes de pagar nada.'),
  lead.direccion ? bloqueEtiqueta() : pedirDireccion(),
  lead.direccion ? '' : parrafo(`Ten en cuenta que el paquete no puede pasar de ${LIMITES_PAQUETE.peso} ni de ${LIMITES_PAQUETE.medidas}. Si se te queda corto, avísame y te preparo una etiqueta para más peso.`)
].filter(Boolean).join('\n\n');

const cuerpoTexto = ({ lead, mazo, presupuesto }) => [
  `Hola ${lead.nombre},`,
  '',
  'Hemos valorado la lista que nos mandaste. Esta es nuestra oferta por el lote completo:',
  '',
  `    ${euros(presupuesto.oferta)} EUR`,
  `    ${presupuesto.totalCartas} cartas${mazo.nombre ? ` - ${mazo.nombre}` : ''}`,
  '',
  'Qué incluye:',
  '  - Etiqueta de Correos prepagada: el envío lo pagamos nosotros',
  '  - Pago por transferencia dentro de las 24 horas siguientes a que aceptes',
  '  - Precio cerrado por el lote entero, sin negociación',
  '',
  'El precio sale de la lista que nos has enviado y se confirma al recibir las cartas y comprobar su estado.',
  '',
  lead.direccion ? bloqueEtiquetaTexto() : pedirDireccionTexto(),
  '',
  'Un saludo,',
  'Iván',
  'vendercartasmagic.es'
].join('\n');

const notasHtml = ({ lead, presupuesto }) => [
  lead.direccion ? notaDireccion(lead.direccion) : '',
  notaHtml(`Correo: ${escaparHtml(lead.email)}<br>
  Enlace: <a href="${escaparHtml(lead.url)}">${escaparHtml(lead.url)}</a><br>
  Mercado: ${euros(presupuesto.valorMercado)} € &middot; se paga el ${Math.round((presupuesto.oferta / presupuesto.valorMercado) * 100)} %<br>
  Foils: ${presupuesto.totalFoils}${presupuesto.bajoMinimo ? '<br><strong>Por debajo del mínimo configurado</strong>' : ''}`),
  notaHtml(`Dice el cliente: ${escaparHtml(lead.mensaje || '(nada)')}`),
  notaHtml(`Desglose por tramo: ${presupuesto.tramos.filter(({ cartas }) => cartas > 0).map(({ etiqueta, cartas, oferta }) => `${escaparHtml(etiqueta)}: ${cartas} a ${euros(oferta)} €`).join(' &middot; ')}`)
].join('\n');

const componerCorreoMazo = ({ lead, mazo, cartas, entorno = process.env }) => {
  const presupuesto = calcularPresupuesto(cartas, entorno);
  const partes = { lead, mazo, presupuesto };

  return {
    subject: `Presupuesto para ${lead.nombre}: ${euros(presupuesto.oferta)} EUR${presupuesto.bajoMinimo ? ' (bajo mínimo)' : ''}${lead.direccion ? ' - con dirección' : ''}`,
    replyTo: lead.email,
    text: cuerpoTexto(partes),
    html: envolver({ cuerpo: cuerpoHtml(partes), notas: notasHtml(partes) }),
    attachments: [{
      filename: `desglose-${nombreDeFichero(lead.nombre)}.csv`,
      content: componerDesgloseCsv(cartas, entorno),
      contentType: 'text/csv; charset=utf-8'
    }]
  };
};

module.exports = { componerCorreoMazo };
