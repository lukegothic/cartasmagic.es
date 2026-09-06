const { numero, decimal, porcentaje } = require('./formato');
const { agruparGeo, IMPRESIONES_PARA_PAGINA } = require('./geo');
const { agruparTemas, canibalizacionInterna, coberturaLlm } = require('./huecos');
const { derivarAcciones } = require('./acciones');

const enlace = ({ fichero, numeroLinea }) => `\`${fichero}:${numeroLinea}\``;

const tabla = (cabeceras, filas) =>
  filas.length
    ? [
        `| ${cabeceras.join(' | ')} |`,
        `|${cabeceras.map(() => '---').join('|')}|`,
        ...filas.map((f) => `| ${f.join(' | ')} |`)
      ].join('\n')
    : '_Nada._';

const seccionAcciones = (acciones) => {
  if (!acciones.length) return '## Acciones\n\n_Sin acciones pendientes._';

  const cuerpo = acciones
    .map(({ titulo, porque, donde, hacer, esNueva, esRuido }, i) => {
      const marcas = [esNueva ? 'NUEVA' : null, esRuido ? 'POCO VOLUMEN' : null].filter(Boolean);
      return (
        `### ${i + 1}. ${titulo}${marcas.length ? ` _(${marcas.join(', ')})_` : ''}\n\n` +
        `- **Por que:** ${porque}\n` +
        `- **Donde:** ${donde.length ? donde.map(enlace).join(', ') : 'sin pagina asignada'}\n` +
        `- **Hacer:** ${hacer}`
      );
    })
    .join('\n\n');

  const nuevas = acciones.filter(({ esNueva }) => esNueva).length;
  const ruido = acciones.filter(({ esRuido }) => esRuido).length;

  // El adjunto repite las acciones hasta que se aplican, asi que sin decir cuantas son
  // nuevas se lee como un inventario y no como una lista de trabajo.
  const aviso = ruido
    ? `\n\n${ruido} de estas acciones se apoyan en menos de 40 impresiones y van marcadas ` +
      'como POCO VOLUMEN. A ese nivel la diferencia entre acertar y no cabe dentro del ruido, ' +
      'asi que conviene aplicarlas solo si el cambio no cuesta nada y no tocan nada que ya ' +
      'funcione.'
    : '';

  return (
    `## Acciones\n\n${acciones.length} en total, ${nuevas} sin ver ayer. ` +
    `Ordenadas por impresiones perdidas.${aviso}\n\n${cuerpo}`
  );
};

const seccionGeo = (consultas) => {
  const zonas = agruparGeo(consultas);
  if (!zonas.length) return '## Intencion local\n\n_Ninguna consulta menciona una zona._';

  const filas = zonas.map(({ zona, impresiones, clics, consultas: cs, merecePagina }) => [
    zona,
    numero(impresiones),
    numero(clics),
    cs.length,
    merecePagina ? 'si' : 'no'
  ]);

  const conPagina = zonas.filter(({ merecePagina }) => merecePagina);
  const veredicto = conPagina.length
    ? `Zonas con volumen para una pagina propia: ${conPagina.map(({ zona }) => zona).join(', ')}.`
    : `Ninguna zona llega a ${IMPRESIONES_PARA_PAGINA} impresiones, que es el minimo para que ` +
      'una pagina propia se sostenga. Una pagina por provincia hoy serian 52 paginas casi ' +
      'iguales compitiendo entre ellas, que es lo que Google penaliza como doorway pages. ' +
      'Lo que si cabe es mencionar las zonas con demanda dentro de una pagina que ya existe.';

  return (
    '## Intencion local\n\n' +
    tabla(['zona', 'impresiones', 'clics', 'consultas', 'merece pagina'], filas) +
    `\n\n${veredicto}`
  );
};

const seccionHuecos = (sinDuenno) => {
  const temas = agruparTemas(sinDuenno);
  if (!temas.length) return '## Huecos de contenido\n\n_Sin huecos._';

  const cuerpo = temas
    .slice(0, 6)
    .map(({ tema, impresiones, consultas }) => {
      const lista = consultas
        .slice(0, 6)
        .map(({ consulta, impresiones: i, mejor }) => `  - ${consulta} (${numero(i)} impr, pos ${decimal(mejor.posicion)})`)
        .join('\n');
      return `- **${tema}**: ${numero(impresiones)} impresiones sin pagina que las reclame\n${lista}`;
    })
    .join('\n');

  return `## Huecos de contenido\n\nConsultas con impresiones agrupadas por tema.\n\n${cuerpo}`;
};

const seccionLlm = (llms, consultas) => {
  const bloques = llms.map(({ dominio, fichero, texto }) => {
    const suyas = consultas.filter((c) => c.dominio === dominio);
    const { huecos } = coberturaLlm(texto, suyas);
    const top = huecos.filter(({ impresiones }) => impresiones >= 5).slice(0, 10);

    if (!top.length) return `### ${dominio}\n\n${enlace({ fichero, numeroLinea: 1 })}: sin huecos claros.`;

    const filas = top.map(({ consulta, impresiones, cobertura }) => [
      consulta,
      numero(impresiones),
      porcentaje(cobertura)
    ]);
    return (
      `### ${dominio}\n\n` +
      `Fichero: ${enlace({ fichero, numeroLinea: 1 })}\n\n` +
      tabla(['consulta con impresiones', 'impr', 'cubierta'], filas)
    );
  });

  return (
    '## Cobertura de llm.txt\n\n' +
    'Consultas reales que el llm.txt no responde. Un modelo no cita lo que no encuentra ' +
    'escrito.\n\n' +
    bloques.join('\n\n')
  );
};

const seccionCanibalizacionInterna = (porKeyword) => {
  const choques = canibalizacionInterna(porKeyword);
  if (!choques.length) return '## Canibalizacion interna\n\n_Ninguna keyword repetida dentro del mismo dominio._';

  const filas = choques.map(({ keyword, dominio, paginas }) => [
    keyword,
    dominio,
    paginas.map(({ ruta }) => ruta).join('<br>'),
    paginas.map(enlace).join('<br>')
  ]);

  return (
    '## Canibalizacion interna\n\n' +
    'La misma keyword declarada en varias paginas del mismo dominio: se quitan posiciones ' +
    'entre ellas.\n\n' +
    tabla(['keyword', 'dominio', 'paginas', 'ficheros'], filas)
  );
};

const seccionDatos = (porDominio) => {
  const bloques = porDominio.map(({ dominio, total, consultas, paginas }) => {
    const filasConsultas = consultas
      .slice()
      .sort((a, b) => b.impresiones - a.impresiones)
      .slice(0, 25)
      .map(({ claves, impresiones, clics, ctr, posicion }) => [
        claves[0],
        numero(impresiones),
        numero(clics),
        porcentaje(ctr),
        decimal(posicion)
      ]);

    const filasPaginas = paginas
      .slice()
      .sort((a, b) => b.impresiones - a.impresiones)
      .slice(0, 12)
      .map(({ claves, impresiones, clics, posicion }) => [
        new URL(claves[0]).pathname,
        numero(impresiones),
        numero(clics),
        decimal(posicion)
      ]);

    return (
      `### ${dominio}\n\n` +
      `${numero(total.clics)} clics, ${numero(total.impresiones)} impresiones, ` +
      `CTR ${porcentaje(total.impresiones ? total.clics / total.impresiones : 0)}\n\n` +
      `#### Consultas\n\n${tabla(['consulta', 'impr', 'clics', 'ctr', 'pos'], filasConsultas)}\n\n` +
      `#### Paginas\n\n${tabla(['pagina', 'impr', 'clics', 'pos'], filasPaginas)}`
    );
  });

  return `## Datos en bruto\n\n${bloques.join('\n\n')}`;
};

const componerMarkdown = ({ ventana, indice, hallazgos, consultas, porDominio, llms, embudo, previas }) => {
  const acciones = derivarAcciones(hallazgos, indice, previas);

  const partes = [
    `# Informe cartasmagic ${ventana.hasta}`,
    '',
    `Ventana de Search Console: ${ventana.desde} a ${ventana.hasta}.`,
    `Paginas con keywords declaradas: ${indice.paginas.length}.`,
    '',
    '> Este fichero esta pensado para pasarselo a un agente y que aplique los cambios.',
    '> Cada accion lleva el fichero y la linea exacta.',
    '',
    seccionAcciones(acciones),
    '',
    seccionGeo(consultas),
    '',
    seccionHuecos(hallazgos.sinDuenno),
    '',
    seccionLlm(llms, consultas.map((c) => ({ consulta: c.claves[0], impresiones: c.impresiones, dominio: c.dominio }))),
    '',
    seccionCanibalizacionInterna(indice.porKeyword),
    ''
  ];

  if (embudo) partes.push(embudo, '');
  partes.push(seccionDatos(porDominio));

  return partes.join('\n');
};

module.exports = { componerMarkdown };
