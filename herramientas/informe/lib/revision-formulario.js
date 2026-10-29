const { consultaGA4 } = require('./google');
const { DIA_MS, iso } = require('./dias');
const { decimal, numero, seccion, tabla } = require('./formato');
const { lineaSemanaLeads } = require('./informe');

// Los numeros de la revision de 6 semanas de #11. Los formularios se cambiaron el
// 2026-10-29 (orden de la valoracion y aviso de cookies a media tarde, ManaBox y el "Ni
// idea" por defecto un rato despues), asi que ese dia no cuenta en ningun lado.
const DESPLIEGUE = '2026-10-29';
const SEMANAS = 6;

// Sale los lunes desde que las 6 semanas estan completas y hasta fin de año. Despues ya
// se ha decidido y el bloque solo alargaria el informe.
const VISIBLE_DESDE = '2026-12-14';
const VISIBLE_HASTA = '2026-12-31';

// La web estuvo caida ese dia: contarlo hunde la semana anterior al cambio.
const CAIDA = '2026-10-23';

// generate_lead se apuntaba dos veces por lead hasta el arreglo del 2026-10-08.
const SIN_DOBLE_CONTEO_DESDE = '2026-10-09';

const VENDER = 'vendercartasmagic.es';
const PAGINAS = { '/valoracion-cartas-magic': 'valoracion', '/presupuesto-manabox': 'manabox' };

const desplazar = (fecha, dias) => iso(new Date(new Date(`${fecha}T00:00:00Z`).getTime() + dias * DIA_MS));

const semanasDesde = (inicio) =>
  Array.from({ length: SEMANAS }, (_, i) => ({ desde: desplazar(inicio, i * 7), hasta: desplazar(inicio, i * 7 + 6) }));

const DESPUES = semanasDesde(desplazar(DESPLIEGUE, 1));
const ANTES = semanasDesde(desplazar(DESPLIEGUE, -SEMANAS * 7));

const conCaida = ({ desde, hasta }) => CAIDA >= desde && CAIDA <= hasta;
const conDobleConteo = ({ desde }) => desde < SIN_DOBLE_CONTEO_DESDE;

const tramosSinCaida = (semana) => {
  if (!conCaida(semana)) return [semana];
  return [
    { desde: semana.desde, hasta: desplazar(CAIDA, -1) },
    { desde: desplazar(CAIDA, 1), hasta: semana.hasta }
  ].filter((tramo) => tramo.desde <= tramo.hasta);
};

const diasContados = (semana) => tramosSinCaida(semana).reduce(
  (dias, { desde, hasta }) => dias + (new Date(hasta) - new Date(desde)) / DIA_MS + 1, 0
);

const sumar = (filas) => filas.reduce((suma, { valores: [veces] }) => suma + veces, 0);

const leadsAntes = async (pedirGA4, auth, ga4, semana) => {
  const filas = await Promise.all(
    tramosSinCaida(semana).map(({ desde, hasta }) =>
      pedirGA4(auth, ga4, {
        desde,
        hasta,
        dominio: VENDER,
        evento: 'generate_lead',
        dimensiones: ['eventName'],
        metricas: ['eventCount']
      })
    )
  );
  return sumar(filas.flat());
};

const leadsDespues = (pedirGA4, auth, ga4) =>
  Promise.all(
    DESPUES.map(({ desde, hasta }) =>
      pedirGA4(auth, ga4, {
        desde,
        hasta,
        evento: 'lead_confirmado',
        dimensiones: ['eventName', 'customEvent:formulario'],
        metricas: ['eventCount']
      })
    )
  );

const notasAntes = (semana) => [
  ...(conCaida(semana) ? [`sin el ${CAIDA}, web caida`] : []),
  ...(conDobleConteo(semana) ? ['doble conteo de generate_lead, no comparable'] : [])
];

const lineaAntes = (semana, leads) => {
  const notas = notasAntes(semana);
  return `  ${semana.desde} a ${semana.hasta}: ${numero(leads)}${notas.length ? ` (${notas.join(', ')})` : ''}`;
};

// La media de antes por dia contado: fuera las semanas del doble conteo, que la
// inflarian, y de la semana de la caida solo cuentan los dias que se pidieron.
const mediaAntes = (antes) => {
  const limpias = ANTES.map((semana, i) => ({ semana, leads: antes[i] })).filter(({ semana }) => !conDobleConteo(semana));
  const dias = limpias.reduce((suma, { semana }) => suma + diasContados(semana), 0);
  return dias ? (limpias.reduce((suma, { leads }) => suma + leads, 0) / dias) * 7 : null;
};

const NOTA_DIMENSION = '  Si GA4 no reconoce una dimension customEvent:, falta darla de alta en Administrar >\n' +
  '  Definiciones personalizadas.';

// Va aparte para que un fallo aqui no se lleve por delante las cifras de leads.
const lineasAbandono = async (pedirGA4, auth, ga4) => {
  const titulo = `\n  Abandonos por ultimo campo tocado (abandonar_formulario, ${SEMANAS} semanas despues)`;
  try {
    const filas = await pedirGA4(auth, ga4, {
      desde: DESPUES[0].desde,
      hasta: DESPUES.at(-1).hasta,
      dominio: VENDER,
      evento: 'abandonar_formulario',
      dimensiones: ['pagePath', 'customEvent:ultimo_campo'],
      metricas: ['eventCount']
    });
    const ordenadas = filas
      .slice()
      .sort((a, b) => b.valores[0] - a.valores[0])
      .map(({ claves: [ruta, campo], valores: [veces] }) => [PAGINAS[ruta] || ruta, campo, numero(veces)]);
    return [titulo, tabla(['formulario', 'ultimo campo', 'abandonos'], ordenadas)];
  } catch ({ message }) {
    return [titulo, `  No se pudo leer: ${message}`, NOTA_DIMENSION];
  }
};

const CABECERA = seccion(`Revision de ${SEMANAS} semanas de los formularios (#11)`);

const EXPLICACION = [
  `  Formularios cambiados el ${DESPLIEGUE}. Antes se cuenta generate_lead, que manda el navegador;`,
  '  despues, lead_confirmado, que manda el servidor. Desde el aviso de cookies generate_lead solo',
  '  cuenta a quien acepta, y por eso despues no sirve: lead_confirmado cuenta a todos. Antes del',
  '  aviso generate_lead tambien contaba a todos, asi que las dos cifras miden casi a la misma',
  '  gente, pero no son la misma medida. La temporada de Navidad cae dentro de las semanas de despues.',
  '  La calidad de los leads se lee a mano en docs/lead-outcomes.md.'
].join('\n');

const bloqueRevision = async (auth, ga4, hoy, pedirGA4 = consultaGA4) => {
  const dia = iso(hoy);
  if (!ga4 || dia < VISIBLE_DESDE || dia > VISIBLE_HASTA) return null;

  const abandonos = await lineasAbandono(pedirGA4, auth, ga4);
  try {
    const [antes, despues] = await Promise.all([
      Promise.all(ANTES.map((semana) => leadsAntes(pedirGA4, auth, ga4, semana))),
      leadsDespues(pedirGA4, auth, ga4)
    ]);
    const media = mediaAntes(antes);

    return [
      CABECERA,
      EXPLICACION,
      '\n  Leads por semana antes (generate_lead)',
      ...ANTES.map((semana, i) => lineaAntes(semana, antes[i])),
      '\n  Leads por semana despues (lead_confirmado)',
      ...DESPUES.map((semana, i) => lineaSemanaLeads({ etiqueta: `Semana ${i + 1}`, ...semana }, despues[i])),
      `\n  Media por semana: antes ${media === null ? 'sin semanas limpias' : decimal(media)} ` +
        `(sin las semanas del doble conteo), despues ${decimal(sumar(despues.flat()) / SEMANAS)}`,
      ...abandonos
    ].join('\n');
  } catch ({ message }) {
    return [CABECERA, `  No se pudo leer: ${message}`, NOTA_DIMENSION, ...abandonos].join('\n');
  }
};

module.exports = { bloqueRevision };
