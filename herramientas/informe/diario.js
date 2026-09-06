const { cliente } = require('./lib/google');
const { construirIndice, leerLlms } = require('./lib/keywords');
const { SITIOS, fechas, bloqueGSC, bloqueGA4, hallazgos } = require('./lib/informe');
const { leer, guardar, firmar, comparar, esDiaDeEmbudo } = require('./lib/estado');
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

  const encontrados = hallazgos(consultas, indice);
  const firmas = firmar(encontrados);
  const { firmas: previas } = leer();
  const { nuevas, resueltas } = comparar(firmas, previas);

  const conEmbudo = esDiaDeEmbudo();
  if (!nuevas.length && !resueltas.length && !conEmbudo) {
    console.log(`Sin cambios: ${firmas.length} avisos, los mismos de ayer. No se envia correo.`);
    guardar(firmas);
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
    hallazgos: encontrados,
    consultas,
    porDominio,
    llms: leerLlms(),
    embudo: conEmbudo ? bloquesEmbudo.join('\n') : null,
    previas
  });

  await enviar({
    asunto: `Informe analitica ${ventana.hasta}`,
    texto: `Informe de analitica del ${ventana.hasta}.`,
    adjuntos: [{ nombre: `informe-${ventana.hasta}.md`, contenido: markdown }]
  });

  guardar(firmas);
  console.log(`Enviado el informe del ${ventana.hasta}. ${firmas.length} avisos, ${nuevas.length} nuevos.`);
};

principal().catch(({ message }) => {
  console.error(`\n${message}\n`);
  process.exit(1);
});
