// Cascaron comun de los correos que se reenvian al cliente. El cuerpo es lo que el cliente
// debe leer y las notas internas van al final, en un bloque identificado que se borra antes
// de reenviar.
const escaparHtml = (texto) =>
  String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const euros = (valor) =>
  valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

const FIRMA_HTML = `  <p style="font-size:16px;margin:0;">Un saludo,<br>Iván<br><a href="https://vendercartasmagic.es" style="color:#f5901e;">vendercartasmagic.es</a></p>`;

const envolver = ({ cuerpo, notas }) => `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#333;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
${cuerpo}

${FIRMA_HTML}
</div>

<div id="notas-internas" style="max-width:600px;margin:24px auto 0;background:#eee;border-radius:8px;padding:16px;font-size:13px;color:#666;">
  <strong>Notas internas (borrar antes de reenviar)</strong>
${notas}
</div>
</body>
</html>`;

const notaHtml = (texto) => `  <p style="margin:8px 0 0;">${texto}</p>`;

const parrafo = (texto) => `  <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${texto}</p>`;

const lista = (puntos) =>
  `  <ul style="font-size:15px;line-height:1.7;margin:0 0 24px;padding-left:20px;">\n${puntos.map((p) => `    <li>${p}</li>`).join('\n')}\n  </ul>`;

const destacado = (contenido) =>
  `  <div style="background:#fff8e1;border:2px solid #f5901e;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">\n${contenido}\n  </div>`;


const LIMITES_PAQUETE = { peso: '2 kg', medidas: '30 x 20 x 20 cm' };

// Cuando el cliente ya ha dejado su direccion, el correo no se la vuelve a pedir: habla de la
// etiqueta como si viniese adjunta. La etiqueta se genera a mano, asi que queda un recordatorio
// bien visible para no reenviar el correo sin ella.
const bloqueEtiqueta = () => [
  parrafo('Te adjunto la etiqueta de envío prepagada. Solo tienes que:'),
  lista([
    'Meter las cartas en una caja',
    'Enseñar la etiqueta en tu oficina de Correos, no hace falta imprimirla',
    'Y listo: el envío lo pagamos nosotros'
  ]),
  parrafo('Tiene número de seguimiento, así que puedes seguir el paquete. En un día laborable desde que llegue te mando la valoración a este mismo correo.'),
  parrafo(`Ten en cuenta que el paquete no puede pasar de ${LIMITES_PAQUETE.peso} ni de ${LIMITES_PAQUETE.medidas}. Si se te queda corto, avísame y te preparo otra etiqueta.`)
].join('\n\n');

const bloqueEtiquetaTexto = () => [
  'Te adjunto la etiqueta de envío prepagada. Solo tienes que:',
  '  - Meter las cartas en una caja',
  '  - Enseñar la etiqueta en tu oficina de Correos, no hace falta imprimirla',
  '  - Y listo: el envío lo pagamos nosotros',
  '',
  'Tiene número de seguimiento, así que puedes seguir el paquete. En un día laborable desde que llegue te mando la valoración a este mismo correo.',
  '',
  `Ten en cuenta que el paquete no puede pasar de ${LIMITES_PAQUETE.peso} ni de ${LIMITES_PAQUETE.medidas}.`
].join('\n');

const pedirDireccion = () =>
  parrafo('<strong>Para prepararte la etiqueta solo necesito una dirección de remitente</strong>, por si hubiese que devolverte el paquete. En cuanto me la mandes te devuelvo la etiqueta ya rellenada.');

const pedirDireccionTexto = () =>
  'Para prepararte la etiqueta solo necesito una dirección de remitente, por si hubiese que devolverte el paquete. En cuanto me la mandes te devuelvo la etiqueta ya rellenada.';

const avisoAdjuntar = () =>
  '  <p style="background:#ffe0b2;border:2px dashed #f5901e;border-radius:6px;padding:12px;margin:0 0 16px;font-weight:bold;text-align:center;">ADJUNTAR LA ETIQUETA ANTES DE ENVIAR</p>';

const notaDireccion = (direccion) =>
  notaHtml(`Dirección para la etiqueta:<br><strong>${escaparHtml(direccion.texto).replace(/\n/g, '<br>')}</strong>${direccion.pareceIncompleta ? '<br><strong>Parece incompleta: conviene revisar antes de generar la etiqueta</strong>' : ''}`);

module.exports = {
  envolver, escaparHtml, euros, parrafo, lista, destacado, notaHtml,
  LIMITES_PAQUETE, bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto,
  avisoAdjuntar, notaDireccion
};
