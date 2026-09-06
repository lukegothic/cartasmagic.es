const { cliente } = require('./lib/google');
const { construirIndice, leerLlms } = require('./lib/keywords');
const { SITIOS, fechas, bloqueGSC, bloqueGA4, bloqueKeywords, hallazgos } = require('./lib/informe');
const { leer, guardar, firmar, comparar, esDiaDeEmbudo } = require('./lib/estado');
const { enviar } = require('./lib/correo');
const { numero, decimal, titulo, seccion } = require('./lib/formato');
const { componerMarkdown } = require('./lib/markdown');

const VENTANA_KEYWORDS = 90;

const lineaAviso = {
  canibal: ({ consulta, impresiones, apariciones }) =>
    `  ${consulta} (${numero(impresiones)} impr): ${apariciones
      .map(({ dominio, posicion }) => `${dominio.split('.')[0]} ${decimal(posicion)}`)
      .join(' y ')}`,
  dominio: ({ consulta, impresiones, actual, deberia }) =>
    `  ${consulta} (${numero(impresiones)} impr) rankea en ${actual.dominio.split('.')[0]} ` +
    `en la posicion ${decimal(actual.posicion)}, y es del ${deberia.split('.')[0]}`,
  huerfana: ({ consulta, impresiones, clics, mejor }) =>
    `  ${consulta}: ${numero(impresiones)} impresiones, ${numero(clics)} clics, ` +
    `posicion ${decimal(mejor.posicion)}. Ninguna pagina la declara`,
  ctr: ({ consulta, impresiones, clics, mejor }) =>
    `  ${consulta}: posicion ${decimal(mejor.posicion)} pero ${numero(clics)} clics ` +
    `de ${numero(impresiones)} impresiones`
};

// Del conjunto de hallazgos se saca la ficha de cada firma nueva, para que el correo
// diga que ha aparecido y no solo cuantos son.
const detallar = (firmas, encontrados) => {
  const porFirma = new Map();
  for (const h of encontrados.canibalizacion) porFirma.set(`canibal:${h.consulta}`, lineaAviso.canibal(h));
  for (const h of encontrados.malDominio) porFirma.set(`dominio:${h.consulta}:${h.deberia}`, lineaAviso.dominio(h));
  for (const h of encontrados.sinDuenno) porFirma.set(`huerfana:${h.consulta}`, lineaAviso.huerfana(h));
  for (const h of encontrados.ctrBajo) porFirma.set(`ctr:${h.consulta}`, lineaAviso.ctr(h));
  return firmas.map((f) => porFirma.get(f)).filter(Boolean);
};

const cuerpoDiario = (nuevas, resueltas, encontrados, indice, consultas) => {
  const partes = [titulo(`Avisos nuevos  ${new Date().toISOString().slice(0, 10)}`)];

  if (nuevas.length) {
    partes.push(seccion(`${nuevas.length} aviso${nuevas.length > 1 ? 's' : ''} que ayer no estaba${nuevas.length > 1 ? 'n' : ''}`));
    partes.push(detallar(nuevas, encontrados).join('\n'));
  }

  if (resueltas.length) {
    partes.push(seccion(`${resueltas.length} que ya no aparece${resueltas.length > 1 ? 'n' : ''}`));
    partes.push(resueltas.map((f) => `  ${f.split(':').slice(1).join(':')}`).join('\n'));
  }

  partes.push(bloqueKeywords(consultas, indice));
  return partes.join('\n');
};

const principal = async () => {
  const auth = await cliente();
  const indice = construirIndice();
  const ventana = fechas(VENTANA_KEYWORDS);

  const consultas = [];
  const bloquesGSC = [];
  const porDominio = [];
  for (const { dominio } of SITIOS) {
    const gsc = await bloqueGSC(auth, dominio, ventana);
    consultas.push(...gsc.consultas);
    bloquesGSC.push(gsc.texto);
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

  const partes = [cuerpoDiario(nuevas, resueltas, encontrados, indice, consultas)];

  const bloquesEmbudo = [];
  if (conEmbudo) {
    partes.push(titulo('Resumen semanal'));
    partes.push(...bloquesGSC);
    for (const sitio of SITIOS) {
      const bloque = await bloqueGA4(auth, sitio, ventana);
      partes.push(bloque);
      bloquesEmbudo.push(bloque);
    }
  }

  const etiqueta = nuevas.length ? `${nuevas.length} aviso${nuevas.length > 1 ? 's' : ''} nuevo${nuevas.length > 1 ? 's' : ''}` : 'resumen semanal';

  // El adjunto es lo que se le pasa a un agente para que aplique los cambios: lleva el
  // fichero y la linea de cada accion, no solo las cifras.
  const markdown = componerMarkdown({
    ventana,
    indice,
    hallazgos: encontrados,
    consultas,
    porDominio,
    llms: leerLlms(),
    embudo: conEmbudo ? bloquesEmbudo.join('\n') : null
  });

  await enviar({
    asunto: `cartasmagic: ${etiqueta}`,
    texto: partes.join('\n'),
    adjuntos: [{ nombre: `informe-${ventana.hasta}.md`, contenido: markdown }]
  });

  guardar(firmas);
  console.log(`Enviado: ${etiqueta}. ${firmas.length} avisos en total.`);
};

principal().catch(({ message }) => {
  console.error(`\n${message}\n`);
  process.exit(1);
});
