// Cascaron comun de los correos que se reenvian al cliente. El cuerpo es lo que el cliente
// debe leer y las notas internas van al final, en un bloque identificado que se borra antes
// de reenviar.
//
// Aqui vive la maquetacion, no la prosa: el texto de los correos esta en textos-correo.js.
const { FIRMA, NOTAS_INTERNAS, LIMITES_PAQUETE, ETIQUETA, PEDIR_DIRECCION } = require('./textos-correo');

const escaparHtml = (texto) =>
  String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const euros = (valor) =>
  valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

const FIRMA_HTML = `  <p style="font-size:16px;margin:0;">${FIRMA.despedida}<br>${FIRMA.nombre}<br><a href="${FIRMA.url}" style="color:#f5901e;">${FIRMA.sitio}</a></p>`;

const firmaTexto = () => [FIRMA.despedida, FIRMA.nombre, FIRMA.sitio];

const envolver = ({ cuerpo, notas }) => `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#333;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
${cuerpo}

${FIRMA_HTML}
</div>

<div id="notas-internas" style="max-width:600px;margin:24px auto 0;background:#eee;border-radius:8px;padding:16px;font-size:13px;color:#666;">
  <strong>${NOTAS_INTERNAS.titulo}</strong>
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

// Cuando el cliente ya ha dejado su direccion, el correo no se la vuelve a pedir: habla de la
// etiqueta como si viniese adjunta. La etiqueta se genera a mano, asi que queda un recordatorio
// bien visible para no reenviar el correo sin ella.
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

const pedirDireccion = () => parrafo(PEDIR_DIRECCION.html);

const pedirDireccionTexto = () => PEDIR_DIRECCION.texto;

const avisoAdjuntar = () =>
  `  <p style="background:#ffe0b2;border:2px dashed #f5901e;border-radius:6px;padding:12px;margin:0 0 16px;font-weight:bold;text-align:center;">${NOTAS_INTERNAS.avisoAdjuntar}</p>`;

const notaDireccion = (direccion) =>
  notaHtml(`${NOTAS_INTERNAS.direccion}<br><strong>${escaparHtml(direccion.texto).replace(/\n/g, '<br>')}</strong>${direccion.pareceIncompleta ? `<br><strong>${NOTAS_INTERNAS.direccionIncompleta}</strong>` : ''}`);

module.exports = {
  envolver, escaparHtml, euros, parrafo, lista, destacado, notaHtml, firmaTexto,
  bloqueEtiqueta, bloqueEtiquetaTexto, pedirDireccion, pedirDireccionTexto,
  avisoAdjuntar, notaDireccion
};
