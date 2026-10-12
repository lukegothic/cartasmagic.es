const { avisos, agrupar, MINIMO_IMPRESIONES, POSICION_CTR } = require('./analisis');
const { DISCARD_REASONS } = require('./acciones');
const { DIA_MS, iso } = require('./dias');
const { claveObjetivo, enCooldown } = require('./objetivos');

const diaSiguiente = (fecha) => iso(new Date(Date.parse(fecha) + DIA_MS));

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

// Por que una candidata de CTR de la ventana entera no sobrevive a las cifras de despues
// del cambio, o null si no hace falta decirlo: con menos demanda que el minimo no es
// candidata, y eso el spec lo deja desaparecer. Sin filas de despues si se dice, porque una
// consulta que tenia demanda y ya no sale es justo lo que no debe perderse en silencio.
const motivoDeBaja = (consulta, porConsulta, hallazgosPost) => {
  const apariciones = porConsulta.get(consulta);
  if (!apariciones) return DISCARD_REASONS.POST_CHANGE_NO_DATA;
  if (Math.max(...apariciones.map((a) => a.impresiones)) < MINIMO_IMPRESIONES) return null;

  const { ctrBajo, ...deOtroTipo } = hallazgosPost;
  if (Object.values(deOtroTipo).some((lista) => lista.some((h) => h.consulta === consulta))) {
    return DISCARD_REASONS.POST_CHANGE_OTHER_TYPE;
  }
  if (Math.min(...apariciones.map((a) => a.posicion)) > POSICION_CTR) {
    return DISCARD_REASONS.POST_CHANGE_RANK_OUT_OF_RANGE;
  }
  return DISCARD_REASONS.POST_CHANGE_CTR_NORMAL;
};

// Sustituye las candidatas de CTR de las paginas cuyo title o description cambio por las
// juzgadas con las filas de despues del cambio: un title nuevo no responde de los clics
// del anterior. `consultasPostCambio` es `{ [fechaDeCambio]: filas }`. Las demas paginas
// siguen con la ventana entera.
//
// Ninguna candidata se pierde en silencio: la de la ventana entera que las cifras de despues
// no confirman sigue en la lista con su motivo en `descarte`, con las cifras de despues si
// las hay. Una fecha sin filas no tiene datos de despues.
const juzgarCtrTrasCambio = ({ ctrBajo, indice, targets, ventana, hoy, consultasPostCambio = {} }) => {
  const cambioDe = (h) => {
    const pagina = h.reclaman[0];
    return pagina ? cambioDentroDeLaVentana(pagina, targets, ventana, hoy) : null;
  };

  const despues = new Map(
    fechasDeCambio({ ...indice, targets, ventana, hoy }).map((cambio) => {
      const porConsulta = agrupar(consultasPostCambio[cambio] ?? []);
      return [cambio, { porConsulta, hallazgos: avisos(porConsulta, indice.porKeyword) }];
    })
  );

  const juzgadas = [...despues].flatMap(([cambio, { hallazgos }]) =>
    hallazgos.ctrBajo.filter((h) => cambioDe(h) === cambio).map((h) => ({ ...h, desde: diaSiguiente(cambio) }))
  );
  const juzgadasPorConsulta = new Set(juzgadas.map(({ consulta }) => consulta));

  const descartadas = ctrBajo
    .filter((h) => cambioDe(h) && !juzgadasPorConsulta.has(h.consulta))
    .flatMap((h) => {
      const { porConsulta, hallazgos } = despues.get(cambioDe(h));
      const descarte = motivoDeBaja(h.consulta, porConsulta, hallazgos);
      if (!descarte) return [];
      const apariciones = porConsulta.get(h.consulta);
      return [
        apariciones
          ? { ...h, apariciones, impresiones: Math.max(...apariciones.map((a) => a.impresiones)), descarte }
          : { ...h, descarte }
      ];
    });

  return [...ctrBajo.filter((h) => !cambioDe(h)), ...juzgadas, ...descartadas].sort(
    (a, b) => b.impresiones - a.impresiones
  );
};

module.exports = { fechasDeCambio, juzgarCtrTrasCambio, diaSiguiente };
