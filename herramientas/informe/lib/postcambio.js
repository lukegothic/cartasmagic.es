const { avisos, agrupar } = require('./analisis');
const { claveObjetivo, enCooldown } = require('./objetivos');

const DIA_MS = 86400000;

const diaSiguiente = (fecha) => new Date(Date.parse(fecha) + DIA_MS).toISOString().slice(0, 10);

// Un CTR se juzga sobre el title y la description de la pagina que rankea.
const CAMPOS_CTR = ['title', 'description'];

// La fecha desde la que se juzga el CTR de una pagina, o null si se juzga la ventana
// entera: el Target no cambio dentro de la ventana, o sigue en Cooldown y entonces la
// candidata se descarta antes de mirar cifras.
const cambioDentroDeLaVentana = (pagina, targets, ventana, hoy) => {
  const cambio = CAMPOS_CTR.map((campo) => targets[claveObjetivo(pagina, campo)]?.cambio)
    .filter(Boolean)
    .sort()
    .at(-1);
  if (!cambio || cambio <= ventana.desde || enCooldown(cambio, hoy)) return null;
  return cambio;
};

// Los dias de cambio para los que hay que traer cifras de despues: uno por fecha distinta,
// no uno por pagina.
const fechasDeCambio = ({ paginas, targets, ventana, hoy }) =>
  [...new Set(paginas.map((pagina) => cambioDentroDeLaVentana(pagina, targets, ventana, hoy)).filter(Boolean))].sort();

// Sustituye las candidatas de CTR de las paginas cuyo title o description cambio por las
// juzgadas con las filas de despues del cambio: un title nuevo no responde de los clics
// del anterior. `consultasPostCambio` es `{ [fechaDeCambio]: filas }`; una fecha sin filas
// no tiene datos de despues, asi que no hay candidata. Las demas paginas siguen con la
// ventana entera.
const juzgarCtrTrasCambio = ({ ctrBajo, indice, targets, ventana, hoy, consultasPostCambio = {} }) => {
  const cambioDe = (h) => {
    const pagina = h.reclaman[0];
    return pagina ? cambioDentroDeLaVentana(pagina, targets, ventana, hoy) : null;
  };

  const juzgadas = fechasDeCambio({ ...indice, targets, ventana, hoy }).flatMap((cambio) =>
    avisos(agrupar(consultasPostCambio[cambio] ?? []), indice.porKeyword)
      .ctrBajo.filter((h) => cambioDe(h) === cambio)
      .map((h) => ({ ...h, desde: diaSiguiente(cambio) }))
  );

  return [...ctrBajo.filter((h) => !cambioDe(h)), ...juzgadas].sort((a, b) => b.impresiones - a.impresiones);
};

module.exports = { fechasDeCambio, juzgarCtrTrasCambio, diaSiguiente };
