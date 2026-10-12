const { cliente } = require('./lib/google');
const { construirIndice, leerLlms } = require('./lib/keywords');
const { SITIOS, fechas, bloqueGSC, bloqueGA4, alarmasDeEmbudo, consultasPostCambio } = require('./lib/informe');
const { decidir, fechasPostCambio } = require('./lib/decision');
const { leer, guardar } = require('./lib/estado');
const { ultimoCambioGit } = require('./lib/git');
const { enviar } = require('./lib/correo');
const { componerMarkdown } = require('./lib/markdown');

const VENTANA_KEYWORDS = 90;

const principal = async () => {
  const auth = await cliente();
  const indice = construirIndice();
  const ventana = fechas(VENTANA_KEYWORDS);

  const consultas = [];
  const porDominio = [];
  for (const { dominio } of SITIOS) {
    const gsc = await bloqueGSC(auth, dominio, ventana);
    consultas.push(...gsc.consultas);
    porDominio.push({ dominio, total: gsc.total, consultas: gsc.consultas, paginas: gsc.paginas });
  }

  const estado = leer();
  const hoy = new Date();

  // La decision no pide nada a GSC: se le dice que cifras de despues de cambio necesita y
  // se le pasan ya traidas.
  const cambios = fechasPostCambio({ indice, estado, hoy, ventana, ultimoCambioGit });

  // Las alarmas de medicion pueden mandar el correo cualquier dia, asi que los eventos del
  // embudo se leen antes de decidir y no solo los lunes, cuando se pinta la tabla.
  // Si GA4 falla, se arrastran las firmas de ayer: un dia sin lectura no es una alarma
  // resuelta, y el informe de Search Console no debe caerse por ello.
  let alarmas = [];
  let firmasAlarmas = estado.alarmas;
  try {
    alarmas = await alarmasDeEmbudo(auth, SITIOS, ventana);
    firmasAlarmas = alarmas.map(({ firma }) => firma);
  } catch ({ message }) {
    console.warn(`No se pudo leer el embudo de GA4, se mantienen las alarmas de ayer: ${message}`);
  }

  const { acciones, descartes, vigilancia, hallazgos, nuevas, conEmbudo, enviar, resumen, siguiente } = decidir({
    consultas,
    indice,
    estado,
    hoy,
    ventana,
    ultimoCambioGit,
    alarmas: firmasAlarmas,
    consultasPostCambio: await consultasPostCambio(auth, cambios, ventana)
  });

  if (!enviar) {
    console.log(
      `Sin cambios visibles: ${resumen.acciones} acciones, ${resumen.descartes} descartes, ` +
        `${resumen.vigilancia} en vigilancia. No se envia correo.`
    );
    guardar(siguiente);
    return;
  }

  // El embudo necesita acumular semanas para que sus ratios digan algo, asi que solo
  // entra en el informe de los lunes.
  const bloquesEmbudo = [];
  if (conEmbudo) {
    for (const sitio of SITIOS) bloquesEmbudo.push(await bloqueGA4(auth, sitio, ventana));
  }

  // Todo el contenido va en el adjunto. El correo solo dice de que dia es: el proceso es
  // descargar el fichero y pasarselo a un agente, y cualquier prosa en el cuerpo sobra.
  const markdown = componerMarkdown({
    ventana,
    indice,
    acciones,
    descartes,
    vigilancia,
    hallazgos,
    consultas,
    porDominio,
    llms: leerLlms(),
    alarmas,
    embudo: conEmbudo ? bloquesEmbudo.join('\n') : null
  });

  await enviar({
    asunto: `Informe analitica ${ventana.hasta}`,
    texto: `Informe de analitica del ${ventana.hasta}.`,
    adjuntos: [{ nombre: `informe-${ventana.hasta}.md`, contenido: markdown }]
  });

  guardar(siguiente);
  console.log(
    `Enviado el informe del ${ventana.hasta}. ${resumen.acciones} acciones, ${nuevas.length} nuevas, ` +
      `${resumen.descartes} descartes, ${resumen.vigilancia} en vigilancia.`
  );
};

principal().catch(({ message }) => {
  console.error(`\n${message}\n`);
  process.exit(1);
});
