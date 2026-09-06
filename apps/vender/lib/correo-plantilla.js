// Cascaron comun de los correos que se reenvian al cliente. El cuerpo es solo lo que el
// cliente debe leer: los datos del formulario viajan aparte, como adjunto (ver notas.js).
//
// Aqui vive la maquetacion, no la prosa: el texto de los correos esta en textos-correo.js.
const { FIRMA, LIMITES_PAQUETE, APROVECHAR_CAJA, ETIQUETA, PEDIR_DIRECCION } = require('./textos-correo');

const escaparHtml = (texto) =>
  String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const euros = (valor) =>
  valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

const FIRMA_HTML = `  <p style="font-size:16px;margin:0;">${FIRMA.despedida}<br>${FIRMA.nombre}<br><a href="${FIRMA.url}" style="color:#f5901e;">${FIRMA.sitio}</a></p>`;

const firmaTexto = () => [FIRMA.despedida, FIRMA.nombre, FIRMA.sitio];

const envolver = (cuerpo) => `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#333;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
${cuerpo}

${FIRMA_HTML}
</div>
</body>
</html>`;

const parrafo = (texto) => `  <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${texto}</p>`;

const lista = (puntos) =>
  `  <ul style="font-size:15px;line-height:1.7;margin:0 0 24px;padding-left:20px;">\n${puntos.map((p) => `    <li>${p}</li>`).join('\n')}\n  </ul>`;

const destacado = (contenido) =>
  `  <div style="background:#fff8e1;border:2px solid #f5901e;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">\n${contenido}\n  </div>`;

// Cuando el cliente ya ha dejado su direccion, el correo no se la vuelve a pedir: habla de la
// etiqueta como si viniese adjunta.
const bloqueEtiqueta = () => [
  parrafo(ETIQUETA.intro),
  lista(ETIQUETA.pasos),
  parrafo(ETIQUETA.seguimiento),
  parrafo(ETIQUETA.limite(LIMITES_PAQUETE.peso, LIMITES_PAQUETE.medidas))
].join('\n\n');

const bloqueEtiquetaTexto = () => [
  ETIQUETA.intro,
  ...ETIQUETA.pasos.map((p) => `  - ${p}`),
  '',
  ETIQUETA.seguimiento,
  '',
  ETIQUETA.limiteTexto(LIMITES_PAQUETE.peso, LIMITES_PAQUETE.medidas)
].join('\n');

// Va detras de los pasos del envio en las dos vias y tanto si la etiqueta viaja adjunta como
// si todavia se esta pidiendo la direccion: el cliente decide que mete en la caja en los cuatro
// casos. `extras` solo lo pasa ManaBox, donde el precio sale de una lista cerrada.
const aprovecharCaja = (extras = '') =>
  [APROVECHAR_CAJA.intro, extras].filter(Boolean).map(parrafo).join('\n\n');

const aprovecharCajaTexto = (extras = '') =>
  [APROVECHAR_CAJA.intro, extras].filter(Boolean).join('\n\n');

const pedirDireccion = () => parrafo(PEDIR_DIRECCION.html);

const pedirDireccionTexto = () => PEDIR_DIRECCION.texto;

module.exports = {
  envolver, escaparHtml, euros, parrafo, lista, destacado, firmaTexto,
  bloqueEtiqueta, bloqueEtiquetaTexto, aprovecharCaja, aprovecharCajaTexto,
  pedirDireccion, pedirDireccionTexto
};
