const {
  envolver, escaparHtml, euros, parrafo, lista, destacado, firmaTexto,
  bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto
} = require('./correo-plantilla');
const { NOTAS_INTERNAS, LIMITES_PAQUETE, MANABOX } = require('./textos-correo');
const { calcularPresupuesto } = require('./presupuesto');
const { componerDesgloseCsv } = require('./desglose');
const { componerNotas, nombreDeFichero } = require('./notas');

const SEPARADOR = ' - ';

const cuerpoHtml = ({ lead, mazo, presupuesto }) => [
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

const notas = ({ lead, mazo, presupuesto, csv }) =>
  componerNotas({
    nombre: lead.nombre,
    direccion: lead.direccion,
    mensaje: lead.mensaje,
    csv,
    asuntoCliente: MANABOX.asuntoCliente,
    lineas: [
      `${NOTAS_INTERNAS.correo} ${lead.email}`,
      `${MANABOX.notas.enlace} ${lead.url}`,
      `${MANABOX.notas.mazo} ${[mazo.nombre, mazo.formato].filter(Boolean).join(SEPARADOR)}`,
      `${MANABOX.notas.mercado} ${euros(presupuesto.valorMercado)} EUR${SEPARADOR}${MANABOX.notas.sePaga(Math.round((presupuesto.oferta / presupuesto.valorMercado) * 100))}`,
      `${MANABOX.notas.foils} ${presupuesto.totalFoils}`,
      ...(presupuesto.bajoMinimo ? [MANABOX.notas.bajoMinimo] : []),
      `${MANABOX.notas.desglose} ${presupuesto.tramos.filter(({ cartas }) => cartas > 0).map(({ etiqueta, cartas, oferta }) => `${etiqueta}: ${cartas} a ${euros(oferta)} EUR`).join(SEPARADOR)}`
    ]
  });

const componerCorreoMazo = ({ lead, mazo, cartas, entorno = process.env }) => {
  const presupuesto = calcularPresupuesto(cartas, entorno);
  const csv = `desglose-${nombreDeFichero(lead.nombre, 'presupuesto')}.csv`;
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
    html: envolver(cuerpoHtml(partes)),
    attachments: [
      notas({ ...partes, csv }),
      {
        filename: csv,
        content: componerDesgloseCsv(cartas, entorno),
        contentType: 'text/csv; charset=utf-8'
      }
    ]
  };
};

module.exports = { componerCorreoMazo };
