const { extraerIdMazo } = require('./manabox');
const { calcularPresupuesto } = require('./presupuesto');
const { componerDesgloseCsv } = require('./desglose');

const TIPOS = {
  'coleccion-completa': 'Una colección completa',
  'mazos-albumes': 'Mazos montados y álbumes',
  'cartas-valor': 'Solo las cartas que sabe que valen algo',
  'no-lo-se': 'No lo sabe, lo heredó o se lo dejaron'
};

const VOLUMENES = {
  'menos-500': 'Menos de 500 cartas',
  '500-1200': 'Entre 500 y 1.200 cartas',
  'mas-1200': 'Más de 1.200 cartas (más de 2 kg, hay que avisar antes)',
  'ni-idea': 'Ni idea'
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_CARTAS_LISTADAS = 15;

const limpiar = (valor, maximo) => String(valor ?? '').trim().slice(0, maximo);

const validarLead = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const provincia = limpiar(body.provincia, 80);
  const mensaje = limpiar(body.mensaje, 2000);
  const { tipo, volumen } = body;

  if (!nombre || !provincia) return { error: 'CAMPOS_OBLIGATORIOS' };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO' };
  if (!TIPOS[tipo] || !VOLUMENES[volumen]) return { error: 'OPCION_NO_VALIDA' };

  return { lead: { nombre, email, provincia, mensaje, tipo, volumen } };
};

const componerCorreo = ({ nombre, email, provincia, mensaje, tipo, volumen }) => ({
  subject: `Nueva colección: ${nombre} (${provincia})`,
  replyTo: email,
  text: [
    `Nombre: ${nombre}`,
    `Correo: ${email}`,
    `Provincia: ${provincia}`,
    `Qué tiene: ${TIPOS[tipo]}`,
    `Volumen: ${VOLUMENES[volumen]}`,
    '',
    mensaje || '(sin mensaje adicional)'
  ].join('\n')
});


const validarLeadMazo = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const mensaje = limpiar(body.mensaje, 2000);
  const url = limpiar(body.url, 300);

  if (!nombre) return { error: 'CAMPOS_OBLIGATORIOS' };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO' };

  const idMazo = extraerIdMazo(url);
  if (!idMazo) return { error: 'ENLACE_NO_VALIDO' };

  return { lead: { nombre, email, mensaje, url, idMazo } };
};

const euros = (valor) =>
  valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

// Solo se deja pasar lo que puede ir dentro de un nombre de fichero sin dar problemas.
const nombreDeFichero = (texto) => texto.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'presupuesto';

const escaparHtml = (texto) =>
  String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// El correo llega listo para reenviar al cliente: el cuerpo es lo que el cliente debe leer y
// las notas internas van al final, en un bloque aparte que se borra antes de mandarlo.
const cuerpoHtml = ({ lead, mazo, presupuesto }) => `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#333;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <p style="font-size:16px;margin:0 0 16px;">Hola ${escaparHtml(lead.nombre)},</p>

  <p style="font-size:16px;line-height:1.5;margin:0 0 24px;">Hemos valorado la lista que nos mandaste. Esta es nuestra oferta por el lote completo:</p>

  <div style="background:#fff8e1;border:2px solid #f5901e;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
    <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#666;">Oferta por tu colección</div>
    <div style="font-size:40px;font-weight:bold;color:#333;padding:8px 0;">${euros(presupuesto.oferta)} €</div>
    <div style="font-size:14px;color:#666;">${presupuesto.totalCartas} cartas${mazo.nombre ? ` &middot; ${escaparHtml(mazo.nombre)}` : ''}</div>
  </div>

  <p style="font-size:16px;line-height:1.5;margin:0 0 8px;"><strong>Qué incluye</strong></p>
  <ul style="font-size:15px;line-height:1.7;margin:0 0 24px;padding-left:20px;">
    <li>Etiqueta de Correos prepagada: el envío lo pagamos nosotros</li>
    <li>Pago por transferencia dentro de las 24 horas siguientes a que aceptes</li>
    <li>Precio cerrado por el lote entero, sin negociación</li>
  </ul>

  <p style="font-size:15px;line-height:1.5;color:#666;margin:0 0 24px;">El precio sale de la lista que nos has enviado y se confirma al recibir las cartas y comprobar su estado. Si el estado no se corresponde con la lista, te lo diríamos antes de pagar nada.</p>

  <p style="font-size:16px;line-height:1.5;margin:0 0 24px;">Si te encaja, responde a este correo y te mandamos la etiqueta de envío.</p>

  <p style="font-size:16px;margin:0;">Un saludo,<br>Iván<br><a href="https://vendercartasmagic.es" style="color:#f5901e;">vendercartasmagic.es</a></p>
</div>

<div id="notas-internas" style="max-width:600px;margin:24px auto 0;background:#eee;border-radius:8px;padding:16px;font-size:13px;color:#666;">
  <strong>Notas internas (borrar antes de reenviar)</strong>
  <p style="margin:8px 0 0;">Correo: ${escaparHtml(lead.email)}<br>
  Enlace: <a href="${escaparHtml(lead.url)}">${escaparHtml(lead.url)}</a><br>
  Mercado: ${euros(presupuesto.valorMercado)} € &middot; se paga el ${Math.round((presupuesto.oferta / presupuesto.valorMercado) * 100)} %<br>
  Foils: ${presupuesto.totalFoils}${presupuesto.bajoMinimo ? '<br><strong>Por debajo del mínimo configurado</strong>' : ''}</p>
  <p style="margin:8px 0 0;">Dice el cliente: ${escaparHtml(lead.mensaje || '(nada)')}</p>
  <p style="margin:8px 0 0;">Desglose por tramo: ${presupuesto.tramos.filter(({ cartas }) => cartas > 0).map(({ etiqueta, cartas, oferta }) => `${escaparHtml(etiqueta)}: ${cartas} a ${euros(oferta)} €`).join(' &middot; ')}</p>
</div>
</body>
</html>`;

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
  'Si te encaja, responde a este correo y te mandamos la etiqueta de envío.',
  '',
  'Un saludo,',
  'Iván',
  'vendercartasmagic.es',
  '',
  '--- Notas internas (borrar antes de reenviar) ---',
  `Correo: ${lead.email}`,
  `Enlace: ${lead.url}`,
  `Mercado: ${euros(presupuesto.valorMercado)} EUR`,
  `Foils: ${presupuesto.totalFoils}${presupuesto.bajoMinimo ? ' | POR DEBAJO DEL MINIMO' : ''}`,
  `Dice el cliente: ${lead.mensaje || '(nada)'}`
].join('\n');

const componerCorreoMazo = ({ lead, mazo, cartas, entorno = process.env }) => {
  const presupuesto = calcularPresupuesto(cartas, entorno);
  const partes = { lead, mazo, presupuesto };

  return {
    subject: `Presupuesto para ${lead.nombre}: ${euros(presupuesto.oferta)} EUR${presupuesto.bajoMinimo ? ' (bajo mínimo)' : ''}`,
    replyTo: lead.email,
    text: cuerpoTexto(partes),
    html: cuerpoHtml(partes),
    attachments: [{
      filename: `desglose-${nombreDeFichero(lead.nombre)}.csv`,
      content: componerDesgloseCsv(cartas, entorno),
      contentType: 'text/csv; charset=utf-8'
    }]
  };
};

module.exports = { validarLead, componerCorreo, validarLeadMazo, componerCorreoMazo };
