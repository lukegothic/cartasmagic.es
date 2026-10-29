const { cliente, consultaGSC, consultaGA4, GSC_MAXIMO_FILAS } = require('./google');
const { construirIndice } = require('./keywords');
const { agrupar, avisos, keywordsMuertas, intencion } = require('./analisis');
const { diaSiguiente } = require('./postcambio');
const { DIA_MS, iso } = require('./dias');
const { numero, decimal, porcentaje, titulo, seccion, tabla } = require('./formato');

// Una sola propiedad de GA4 para los dos dominios, cada uno con su flujo de datos. Se
// separan por hostName al consultar, no por propiedad.
const SITIOS = [
  { dominio: 'cartasmagic.es', ga4: process.env.GA4_PROPIEDAD },
  { dominio: 'vendercartasmagic.es', ga4: process.env.GA4_PROPIEDAD }
];

// Los cinco del embudo de docs/plan-medicion-embudo.md, en orden. Los umbrales son los
// del documento: por debajo, el problema esta en ese paso y no en el siguiente.
const EMBUDO = [
  { evento: 'ver_formulario', etiqueta: 'Formulario visto' },
  { evento: 'empezar_formulario', etiqueta: 'Formulario empezado', minimo: 0.4 },
  { evento: 'intento_envio', etiqueta: 'Intento de envio', minimo: 0.6 },
  { evento: 'generate_lead', etiqueta: 'Lead', minimo: 0.99 },
  { evento: 'envio_rechazado', etiqueta: 'Envio rechazado', suelto: true }
];

// Primer dia con el embudo medido sin errores: el doble conteo de generate_lead se
// corrigio el 2026-10-08, y antes de eso sacaba mas leads que intentos de envio.
const EMBUDO_DESDE = '2026-10-09';

// GSC no tiene consolidados los ultimos tres dias y contarlos hunde las medias. GA4 si
// los tiene, y ademas es donde esta casi todo lo que ha recogido hasta ahora, asi que
// cada uno lleva su propia ventana.
const fechas = (dias) => {
  const hoy = new Date();
  const hastaGSC = new Date(hoy.getTime() - 3 * 86400000);
  return {
    desde: iso(new Date(hastaGSC.getTime() - dias * 86400000)),
    hasta: iso(hastaGSC),
    ga4: { desde: iso(new Date(hoy.getTime() - dias * 86400000)), hasta: iso(hoy) }
  };
};

// GSC devuelve una fila por URL: http y https, con y sin www, con y sin parametros. Todas
// son la misma pagina, y la clave del resultado pasa a ser la ruta.
const fusionarPaginasPorRuta = (filas) => {
  const porRuta = new Map();
  for (const { claves, impresiones, clics, posicion } of filas) {
    const ruta = new URL(claves[0]).pathname;
    const previa = porRuta.get(ruta) || { impresiones: 0, clics: 0, posicionPonderada: 0 };
    porRuta.set(ruta, {
      impresiones: previa.impresiones + impresiones,
      clics: previa.clics + clics,
      posicionPonderada: previa.posicionPonderada + posicion * impresiones
    });
  }
  return [...porRuta].map(([ruta, { impresiones, clics, posicionPonderada }]) => ({
    claves: [ruta],
    impresiones,
    clics,
    ctr: clics / impresiones,
    posicion: posicionPonderada / impresiones
  }));
};

const bloqueGSC = async (auth, dominio, ventana, pedirGSC = consultaGSC) => {
  // El total va aparte y sin desglosar. Sumar la dimension query se queda corto porque
  // GSC oculta las consultas de pocas busquedas, y sumar la dimension page se pasa
  // porque una consulta que saca dos paginas cuenta en las dos.
  const [consultas, paginasPorUrl, [totales]] = await Promise.all([
    pedirGSC(auth, dominio, { ...ventana, dimensiones: ['query'] }),
    pedirGSC(auth, dominio, { ...ventana, dimensiones: ['page'] }),
    pedirGSC(auth, dominio, { ...ventana, dimensiones: [] })
  ]);

  const paginas = fusionarPaginasPorRuta(paginasPorUrl);

  // Sin desglosar GSC devuelve una fila unica, o ninguna si la propiedad aun no tiene datos.
  const total = totales || { clics: 0, impresiones: 0 };

  const lineas = [seccion(`GSC ${dominio}`)];
  lineas.push(
    `  ${numero(total.clics)} clics, ${numero(total.impresiones)} impresiones, ` +
      `CTR ${porcentaje(total.impresiones ? total.clics / total.impresiones : 0)}`
  );

  lineas.push('\n  Consultas con mas impresiones');
  lineas.push(
    tabla(
      ['consulta', 'impr', 'clics', 'ctr', 'pos'],
      consultas
        .slice()
        .sort((a, b) => b.impresiones - a.impresiones)
        .slice(0, 15)
        .map(({ claves, impresiones, clics, ctr, posicion }) => [
          claves[0],
          numero(impresiones),
          numero(clics),
          porcentaje(ctr),
          decimal(posicion)
        ])
    )
  );

  lineas.push('\n  Paginas');
  lineas.push(
    tabla(
      ['pagina', 'impr', 'clics', 'pos'],
      paginas
        .slice()
        .sort((a, b) => b.impresiones - a.impresiones)
        .slice(0, 10)
        .map(({ claves, impresiones, clics, posicion }) => [
          claves[0],
          numero(impresiones),
          numero(clics),
          decimal(posicion)
        ])
    )
  );

  return {
    texto: lineas.join('\n'),
    consultas: consultas.map((f) => ({ ...f, dominio })),
    paginas,
    total
  };
};

// Un paso no puede tener mas eventos que el anterior: si los tiene, el fallo es de medicion
// y un porcentaje por encima de 100 lo haria pasar por conversion. Con cero eventos antes
// tambien cuenta: leads sin un solo intento de envio no son conversion, son el mismo fallo.
const superaAlAnterior = (cuenta, i) =>
  i > 0 &&
  !EMBUDO[i].suelto &&
  (cuenta.get(EMBUDO[i].evento) || 0) > (cuenta.get(EMBUDO[i - 1].evento) || 0);

// Por pagina, porque la portada se mide con lo que pasa en ella y no en todo el sitio.
const pedirEventosEmbudo = (pedirGA4, auth, ga4, rango, dominio) =>
  pedirGA4(auth, ga4, {
    ...rango,
    desde: rango.desde > EMBUDO_DESDE ? rango.desde : EMBUDO_DESDE,
    dominio,
    dimensiones: ['eventName', 'pagePath'],
    metricas: ['eventCount'],
    limite: 1000
  });

// Alarmas de medicion: lo que el embudo dice sobre los datos y no sobre las paginas. Cada
// una lleva su firma, que es lo que guarda el estado para saber si hoy hay una nueva.
const alarmasDeEmbudo = async (auth, sitios, ventana, pedirGA4 = consultaGA4) => {
  const rango = ventana.ga4 || ventana;
  const porSitio = await Promise.all(
    sitios
      .filter(({ ga4 }) => ga4)
      .map(async ({ dominio, ga4 }) => {
        const eventos = await pedirEventosEmbudo(pedirGA4, auth, ga4, rango, dominio);
        const cuenta = new Map();
        for (const { claves: [evento], valores: [veces] } of eventos) {
          cuenta.set(evento, (cuenta.get(evento) || 0) + veces);
        }
        return EMBUDO.flatMap(({ evento, etiqueta }, i) =>
          superaAlAnterior(cuenta, i)
            ? [{ firma: `embudo:${dominio}:${evento}:mas-eventos-que-el-anterior`, dominio, evento, etiqueta }]
            : []
        );
      })
  );
  return porSitio.flat();
};

// Leads por semana desde lead_confirmado, que manda el servidor de vender y por eso cuenta
// tambien a quien rechaza las cookies. Es la fuente de verdad de leads, pero no un paso
// del embudo: los pasos de cliente solo cuentan a quien acepta, y ponerlo detras de ellos
// dispararia la alarma de mas eventos que el paso anterior todos los dias.
const FORMULARIOS_LEAD = ['valoracion', 'manabox'];

// Las dos semanas completas antes de hoy. El informe sale los lunes, asi que son de lunes
// a domingo.
const semanasLeads = (hoy) => {
  const dia = (n) => iso(new Date(hoy.getTime() - n * DIA_MS));
  return [
    { etiqueta: 'Esta semana', desde: dia(7), hasta: dia(1) },
    { etiqueta: 'Semana anterior', desde: dia(14), hasta: dia(8) }
  ];
};

const lineaSemanaLeads = ({ etiqueta, desde, hasta }, filas) => {
  const porFormulario = new Map();
  for (const { claves: [evento, formulario], valores: [veces] } of filas) {
    if (evento === 'lead_confirmado') porFormulario.set(formulario, (porFormulario.get(formulario) || 0) + veces);
  }
  const total = [...porFormulario.values()].reduce((suma, veces) => suma + veces, 0);
  // Las dimensiones personalizadas no son retroactivas: lo enviado antes de dar de alta
  // formulario llega como (not set), y sin esta cifra el desglose no sumaria el total.
  const conocidos = FORMULARIOS_LEAD.reduce((suma, f) => suma + (porFormulario.get(f) || 0), 0);
  const desglose = [
    ...FORMULARIOS_LEAD.map((f) => `${f} ${numero(porFormulario.get(f) || 0)}`),
    ...(total > conocidos ? [`sin formulario ${numero(total - conocidos)}`] : [])
  ].join(', ');
  return `  ${etiqueta}, ${desde} a ${hasta}: ${numero(total)} (${desglose})`;
};

// Sin filtro por dominio: el Measurement Protocol no lleva hostName, y filtrar como el
// resto del informe dejaria fuera todos los leads.
const bloqueLeads = async (auth, ga4, hoy, pedirGA4 = consultaGA4) => {
  if (!ga4) return null;

  const cabecera = seccion('Leads confirmados (lead_confirmado)');
  const semanas = semanasLeads(hoy);
  try {
    const filas = await Promise.all(
      semanas.map(({ desde, hasta }) =>
        pedirGA4(auth, ga4, {
          desde,
          hasta,
          evento: 'lead_confirmado',
          dimensiones: ['eventName', 'customEvent:formulario'],
          metricas: ['eventCount']
        })
      )
    );
    return [cabecera, ...semanas.map((semana, i) => lineaSemanaLeads(semana, filas[i]))].join('\n');
  } catch ({ message }) {
    return (
      `${cabecera}\n  No se pudo leer: ${message}\n` +
      '  Si GA4 no reconoce customEvent:formulario, falta darlo de alta como dimension personalizada\n' +
      '  de evento en Administrar > Definiciones personalizadas.'
    );
  }
};

const bloqueGA4 = async (auth, { dominio, ga4 }, ventana, pedirGA4 = consultaGA4) => {
  if (!ga4) {
    return (
      `${seccion(`GA4 ${dominio}`)}\n` +
      '  Falta GA4_PROPIEDAD. El identificador numerico esta en GA4, en\n' +
      '  Administrar > Detalles de la propiedad. Sin el no se lee el embudo.'
    );
  }

  const rango = ventana.ga4 || ventana;

  const [resumen, eventos, campanas] = await Promise.all([
    pedirGA4(auth, ga4, { ...rango, dominio, metricas: ['sessions', 'activeUsers'] }),
    pedirEventosEmbudo(pedirGA4, auth, ga4, rango, dominio),
    pedirGA4(auth, ga4, {
      ...rango,
      dominio,
      dimensiones: ['sessionCampaignName'],
      metricas: ['sessions', 'keyEvents']
    })
  ]);

  const cuenta = new Map();
  const enPortada = new Map();
  for (const { claves: [evento, ruta], valores: [veces] } of eventos) {
    cuenta.set(evento, (cuenta.get(evento) || 0) + veces);
    if (ruta === '/') enPortada.set(evento, veces);
  }
  const [sesiones = 0, usuarios = 0] = resumen[0]?.valores || [];

  const lineas = [seccion(`GA4 ${dominio}`)];
  lineas.push(`  ${numero(sesiones)} sesiones, ${numero(usuarios)} usuarios`);

  lineas.push('\n  Embudo');
  lineas.push(
    tabla(
      ['paso', 'eventos', 'del anterior', 'aviso'],
      EMBUDO.map(({ evento, etiqueta, minimo, suelto }, i) => {
        const valor = cuenta.get(evento) || 0;
        const anterior = i > 0 && !suelto ? cuenta.get(EMBUDO[i - 1].evento) || 0 : 0;
        const ratio = anterior ? valor / anterior : null;
        if (superaAlAnterior(cuenta, i)) {
          return [etiqueta, numero(valor), '', 'mas eventos que el paso anterior, fallo de medicion'];
        }
        const flojo = minimo && ratio !== null && ratio < minimo;
        return [
          etiqueta,
          numero(valor),
          ratio === null ? '' : porcentaje(ratio),
          flojo ? `por debajo del ${porcentaje(minimo)}` : ''
        ];
      })
    )
  );

  const visitasPortada = enPortada.get('page_view') || 0;
  const clicsPortada = enPortada.get('clic_cta') || 0;
  if (visitasPortada && cuenta.has('clic_cta')) {
    lineas.push(
      `\n  Portada a formulario: ${porcentaje(clicsPortada / visitasPortada)} ` +
        `(${numero(clicsPortada)} clics en CTA de ${numero(visitasPortada)} visitas a la portada)`
    );
  }

  lineas.push('\n  Campanas');
  lineas.push(
    tabla(
      ['campana', 'sesiones', 'conversiones'],
      campanas
        .filter(({ valores }) => valores[0] > 0)
        .sort((a, b) => b.valores[0] - a.valores[0])
        .slice(0, 12)
        .map(({ claves, valores }) => [claves[0] || '(directo)', numero(valores[0]), numero(valores[1])])
    )
  );

  return lineas.join('\n');
};

// Las consultas de cada dominio desde el dia siguiente a cada cambio de un Target hasta el
// final de la ventana: ese dia mezcla las dos versiones. GSC incluye en el rango los dos
// extremos. El resultado es `{ [fechaDeCambio]: filas }`, la forma que `decidir` espera.
// Con el limite por defecto (200, ordenadas por clics) una consulta sin clics quedaba fuera
// y salia como "sin datos de despues del cambio", asi que se pide el maximo.
const consultasPostCambio = async (auth, cambios, ventana, pedirGSC = consultaGSC) =>
  Object.fromEntries(
    await Promise.all(
      cambios.map(async (cambio) => {
        const porDominio = await Promise.all(
          SITIOS.map(async ({ dominio }) => {
            const filas = await pedirGSC(auth, dominio, {
              desde: diaSiguiente(cambio),
              hasta: ventana.hasta,
              dimensiones: ['query'],
              limite: GSC_MAXIMO_FILAS
            });
            return filas.map((fila) => ({ ...fila, dominio }));
          })
        );
        return [cambio, porDominio.flat()];
      })
    )
  );

// Los hallazgos se calculan aparte del texto porque el trabajo diario necesita
// compararlos con los de ayer, no pintarlos.
const hallazgos = (consultas, indice) => {
  const porConsulta = agrupar(consultas);
  return {
    ...avisos(porConsulta, indice.porKeyword),
    muertas: keywordsMuertas(porConsulta, indice.paginas)
  };
};

const bloqueKeywords = (consultas, indice) => {
  const { canibalizacion, malDominio, sinDuenno, ctrBajo, muertas } = hallazgos(consultas, indice);

  const lineas = [titulo('Keywords: que tocar')];

  lineas.push(seccion('Los dos dominios compiten por la misma consulta'));
  lineas.push(
    tabla(
      ['consulta', 'impr', 'donde rankea', 'de quien es'],
      canibalizacion.map(({ consulta, impresiones, apariciones, deberia }) => [
        consulta,
        numero(impresiones),
        apariciones.map(({ dominio, posicion }) => `${dominio.split('.')[0]} ${decimal(posicion)}`).join(' | '),
        deberia || '?'
      ])
    )
  );

  lineas.push(seccion('Rankea el dominio que no toca'));
  lineas.push(
    tabla(
      ['consulta', 'impr', 'rankea', 'pos', 'deberia'],
      malDominio.map(({ consulta, impresiones, actual, deberia }) => [
        consulta,
        numero(impresiones),
        actual.dominio.split('.')[0],
        decimal(actual.posicion),
        deberia.split('.')[0]
      ])
    )
  );

  // La intencion de compra se queda sin dominio a proposito (docs/reparto-keywords.md),
  // asi que no es candidata a reclamar. Se lista aparte para que la demanda siga a la vista.
  const { purchaseIntent = [], claimable = [] } = Object.groupBy(sinDuenno, ({ consulta }) =>
    intencion(consulta) === 'compra' ? 'purchaseIntent' : 'claimable'
  );

  lineas.push(seccion('Nadie la reclama y aun asi rankea'));
  lineas.push('  Candidatas a meter en las keywords o en el copy de la pagina que toque.');
  lineas.push(
    tabla(
      ['consulta', 'impr', 'clics', 'pos', 'deberia ser de'],
      claimable
        .slice(0, 20)
        .map(({ consulta, impresiones, clics, mejor, deberia }) => [
          consulta,
          numero(impresiones),
          numero(clics),
          decimal(mejor.posicion),
          (deberia || mejor.dominio).split('.')[0]
        ])
    )
  );
  if (purchaseIntent.length) {
    lineas.push(
      '  Intencion de compra, sin dominio a proposito: ' +
        purchaseIntent.map(({ consulta, impresiones }) => `${consulta} (${numero(impresiones)})`).join(', ')
    );
  }

  lineas.push(seccion('Buena posicion y casi ningun clic'));
  lineas.push('  Rankea pero el titulo o la descripcion no convencen. Se arregla en el copy.');
  lineas.push(
    tabla(
      ['consulta', 'impr', 'clics', 'pos', 'pagina'],
      ctrBajo
        .slice(0, 15)
        .map(({ consulta, impresiones, clics, mejor, reclaman }) => [
          consulta,
          numero(impresiones),
          numero(clics),
          decimal(mejor.posicion),
          reclaman[0] ? reclaman[0].ruta : '?'
        ])
    )
  );

  lineas.push(seccion('Keywords declaradas que no traen ni una impresion'));
  lineas.push(
    tabla(
      ['pagina', 'fichero', 'keywords'],
      muertas.map(({ dominio, ruta, fichero, muertas: kw }) => [
        `${dominio.split('.')[0]}${ruta}`,
        fichero,
        kw.join(', ')
      ])
    )
  );

  return lineas.join('\n');
};

module.exports = { SITIOS, EMBUDO, fechas, bloqueGSC, bloqueGA4, bloqueLeads, alarmasDeEmbudo, bloqueKeywords, hallazgos, consultasPostCambio };
