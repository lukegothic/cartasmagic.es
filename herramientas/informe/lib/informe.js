const { cliente, consultaGSC, consultaGA4 } = require('./google');
const { construirIndice } = require('./keywords');
const { agrupar, avisos, keywordsMuertas } = require('./analisis');
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

const iso = (d) => d.toISOString().slice(0, 10);

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

const bloqueGSC = async (auth, dominio, ventana) => {
  const [consultas, paginas] = await Promise.all([
    consultaGSC(auth, dominio, { ...ventana, dimensiones: ['query'] }),
    consultaGSC(auth, dominio, { ...ventana, dimensiones: ['page'] })
  ]);

  const total = consultas.reduce(
    (t, { clics, impresiones }) => ({ clics: t.clics + clics, impresiones: t.impresiones + impresiones }),
    { clics: 0, impresiones: 0 }
  );

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
          new URL(claves[0]).pathname,
          numero(impresiones),
          numero(clics),
          decimal(posicion)
        ])
    )
  );

  return { texto: lineas.join('\n'), consultas: consultas.map((f) => ({ ...f, dominio })) };
};

const bloqueGA4 = async (auth, { dominio, ga4 }, ventana) => {
  if (!ga4) {
    return (
      `${seccion(`GA4 ${dominio}`)}\n` +
      '  Falta GA4_PROPIEDAD. El identificador numerico esta en GA4, en\n' +
      '  Administrar > Detalles de la propiedad. Sin el no se lee el embudo.'
    );
  }

  const rango = ventana.ga4 || ventana;

  const [resumen, eventos, campanas] = await Promise.all([
    consultaGA4(auth, ga4, { ...rango, dominio, metricas: ['sessions', 'activeUsers'] }),
    consultaGA4(auth, ga4, { ...rango, dominio, dimensiones: ['eventName'], metricas: ['eventCount'] }),
    consultaGA4(auth, ga4, {
      ...rango,
      dominio,
      dimensiones: ['sessionCampaignName'],
      metricas: ['sessions', 'keyEvents']
    })
  ]);

  const cuenta = new Map(eventos.map(({ claves, valores }) => [claves[0], valores[0]]));
  const [sesiones = 0, usuarios = 0] = resumen[0]?.valores || [];

  const lineas = [seccion(`GA4 ${dominio}`)];
  lineas.push(`  ${numero(sesiones)} sesiones, ${numero(usuarios)} usuarios`);

  const puerta = cuenta.get('ver_formulario') || 0;
  lineas.push('\n  Embudo');
  lineas.push(
    tabla(
      ['paso', 'eventos', 'del anterior', 'aviso'],
      EMBUDO.map(({ evento, etiqueta, minimo, suelto }, i) => {
        const valor = cuenta.get(evento) || 0;
        const anterior = i > 0 && !suelto ? cuenta.get(EMBUDO[i - 1].evento) || 0 : 0;
        const ratio = anterior ? valor / anterior : null;
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

  const clics = cuenta.get('clic_cta') || 0;
  if (clics && puerta) {
    lineas.push(`\n  Portada a formulario: ${porcentaje(puerta / clics)} (${numero(clics)} clics en CTA)`);
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

  lineas.push(seccion('Nadie la reclama y aun asi rankea'));
  lineas.push('  Candidatas a meter en las keywords o en el copy de la pagina que toque.');
  lineas.push(
    tabla(
      ['consulta', 'impr', 'clics', 'pos', 'deberia ser de'],
      sinDuenno
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

module.exports = { SITIOS, EMBUDO, fechas, bloqueGSC, bloqueGA4, bloqueKeywords, hallazgos };
