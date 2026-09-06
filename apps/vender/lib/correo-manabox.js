const {
  envolver, escaparHtml, euros, parrafo, lista, destacado, notaHtml, firmaTexto,
  bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto,
  avisoAdjuntar, notaDireccion
} = require('./correo-plantilla');
const { NOTAS_INTERNAS, LIMITES_PAQUETE, MANABOX } = require('./textos-correo');
const { calcularPresupuesto } = require('./presupuesto');
const { componerDesgloseCsv } = require('./desglose');

// Solo se deja pasar lo que puede ir dentro de un nombre de fichero sin dar problemas.
const nombreDeFichero = (texto) => texto.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'presupuesto';

const cuerpoHtml = ({ lead, mazo, presupuesto }) => [
  lead.direccion ? avisoAdjuntar() : '',
  parrafo(MANABOX.saludo(escaparHtml(lead.nombre))),
  parrafo(MANABOX.intro),
  destacado([
    `    <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#666;">${MANABOX.ofertaEtiqueta}</div>`,
    `    <div style="font-size:40px;font-weight:bold;color:#333;padding:8px 0;">${euros(presupuesto.oferta)} €</div>`,
    `    <div style="font-size:14px;color:#666;">${MANABOX.cartas(presupuesto.totalCartas)}${mazo.nombre ? ` &middot; ${escaparHtml(mazo.nombre)}` : ''}</div>`
  ].join('\n')),
  parrafo(`<strong>${MANABOX.queIncluyeTitulo}</strong>`),
  lista(MANABOX.queIncluye),
  parrafo(MANABOX.confirmacion),
  lead.direccion ? bloqueEtiqueta() : pedirDireccion(),
  lead.direccion ? '' : parrafo(MANABOX.limite(LIMITES_PAQUETE.peso, LIMITES_PAQUETE.medidas))
].filter(Boolean).join('\n\n');

const cuerpoTexto = ({ lead, mazo, presupuesto }) => [
  MANABOX.saludo(lead.nombre),
  '',
  MANABOX.intro,
  '',
  `    ${euros(presupuesto.oferta)} EUR`,
  `    ${MANABOX.cartas(presupuesto.totalCartas)}${mazo.nombre ? ` - ${mazo.nombre}` : ''}`,
  '',
  `${MANABOX.queIncluyeTitulo}:`,
  ...MANABOX.queIncluye.map((p) => `  - ${p}`),
  '',
  MANABOX.confirmacionTexto,
  '',
  lead.direccion ? bloqueEtiquetaTexto() : pedirDireccionTexto(),
  '',
  ...firmaTexto()
].join('\n');

const notasHtml = ({ lead, presupuesto }) => [
  lead.direccion ? notaDireccion(lead.direccion) : '',
  notaHtml(`${NOTAS_INTERNAS.correo} ${escaparHtml(lead.email)}<br>
  ${MANABOX.notas.enlace} <a href="${escaparHtml(lead.url)}">${escaparHtml(lead.url)}</a><br>
  ${MANABOX.notas.mercado} ${euros(presupuesto.valorMercado)} € &middot; ${MANABOX.notas.sePaga(Math.round((presupuesto.oferta / presupuesto.valorMercado) * 100))}<br>
  ${MANABOX.notas.foils} ${presupuesto.totalFoils}${presupuesto.bajoMinimo ? `<br><strong>${MANABOX.notas.bajoMinimo}</strong>` : ''}`),
  notaHtml(`${NOTAS_INTERNAS.diceCliente} ${escaparHtml(lead.mensaje || NOTAS_INTERNAS.sinMensaje)}`),
  notaHtml(`${MANABOX.notas.desglose} ${presupuesto.tramos.filter(({ cartas }) => cartas > 0).map(({ etiqueta, cartas, oferta }) => `${escaparHtml(etiqueta)}: ${cartas} a ${euros(oferta)} €`).join(' &middot; ')}`)
].join('\n');

const componerCorreoMazo = ({ lead, mazo, cartas, entorno = process.env }) => {
  const presupuesto = calcularPresupuesto(cartas, entorno);
  const partes = { lead, mazo, presupuesto };

  return {
    subject: MANABOX.asunto({
      nombre: lead.nombre,
      donde: lead.direccion?.localidad ? ` (${lead.direccion.localidad})` : '',
      oferta: euros(presupuesto.oferta),
      bajoMinimo: presupuesto.bajoMinimo,
      conDireccion: Boolean(lead.direccion)
    }),
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
