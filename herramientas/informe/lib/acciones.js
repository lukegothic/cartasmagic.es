const { numero, decimal } = require('./formato');

// Cuantas de cada tipo entran en el informe. Mas abajo el volumen ya no distingue una
// senal de una casualidad, y una lista larga no se lee.
const MAXIMO_HUERFANAS = 10;
const MAXIMO_CTR = 8;

// Con unas 48 visitas al mes, por debajo de esto la diferencia entre actuar y no actuar
// cabe dentro del ruido. La candidata no se propone como accion y pasa a vigilancia,
// porque docs/plan-medicion-embudo.md avisa de que decidir sobre azar es peor que no decidir.
const IMPRESIONES_FIABLES = 40;

// Motivos por los que una candidata no llega a accion. Son codigos estables, no texto.
const DISCARD_REASONS = Object.freeze({
  TOO_LITTLE_DEMAND: 'TOO_LITTLE_DEMAND',
  PAGE_NEWER_THAN_WINDOW: 'PAGE_NEWER_THAN_WINDOW',
  QUERY_VARIANT_PERFORMS: 'QUERY_VARIANT_PERFORMS',
  NO_OWNER_DOMAIN: 'NO_OWNER_DOMAIN',
  OWNER_ALREADY_FIRST: 'OWNER_ALREADY_FIRST',
  TARGET_IN_COOLDOWN: 'TARGET_IN_COOLDOWN',
  OVER_LIST_LIMIT: 'OVER_LIST_LIMIT',
  POST_CHANGE_NO_DATA: 'POST_CHANGE_NO_DATA',
  POST_CHANGE_RANK_OUT_OF_RANGE: 'POST_CHANGE_RANK_OUT_OF_RANGE',
  POST_CHANGE_CTR_NORMAL: 'POST_CHANGE_CTR_NORMAL',
  POST_CHANGE_OTHER_TYPE: 'POST_CHANGE_OTHER_TYPE'
});

const ubicacion = ({ fichero, numeroLinea }) => ({ fichero, numeroLinea });

// Una pagina publicada despues de arrancar la ventana no ha tenido la ventana entera para
// posicionarse, asi que compararla con quien lleva ahi desde el principio no mide como
// esta optimizada: mide cuanto lleva existiendo. El informe del 15 de septiembre de 2026
// mando reforzar un articulo de 10 dias por no rankear en 90, con la keyword ya en el H1.
const naceDentroDeLaVentana = (paginas, ventana) =>
  Boolean(ventana?.desde) && paginas.some(({ fecha }) => fecha && fecha > ventana.desde);

// Que la declare ya el dominio correcto y rankee el otro no es un error de reparto: la
// declaracion esta bien y lo que falta es que la pagina se gane la posicion. Mandar a
// quitarla de donde debe estar era borrar lo unico correcto que habia.
const declaradaDondeToca = (duenno, deberia) =>
  duenno.length > 0 && duenno.every(({ dominio }) => dominio === deberia);

const moverDeDominio = ({ consulta, impresiones, apariciones, actual, deberia }, porKeyword) => {
  const duenno = porKeyword.get(consulta) || [];
  const yaEstaBien = declaradaDondeToca(duenno, deberia);

  return {
    firma: `dominio:${consulta}:${deberia}`,
    impresiones,
    apariciones,
    titulo: yaEstaBien
      ? `Ganar posicion para "${consulta}" en ${deberia}`
      : `Mover "${consulta}" a ${deberia}`,
    porque: yaEstaBien
      ? `${numero(impresiones)} impresiones de demanda: la declara ${deberia}, que es de ` +
        `quien es, pero quien rankea es ${actual.dominio}, en posicion ${decimal(actual.posicion)}.`
      : `${numero(impresiones)} impresiones de demanda, pero rankea ${actual.dominio}, en ` +
        `posicion ${decimal(actual.posicion)}, y segun el reparto es de ${deberia}.`,
    donde: duenno.map(ubicacion),
    hacer: yaEstaBien
      ? `Reforzar ${duenno.map(({ ruta }) => ruta).join(', ')} con esas palabras en el copy visible, y comprobar que ${actual.dominio} no las lleva en su meta.`
      : duenno.length
        ? `Quitarla del meta keywords de ${duenno.map(({ ruta }) => ruta).join(', ')} y anadirla en la pagina equivalente de ${deberia}.`
        : `Anadirla al meta keywords de la pagina de ${deberia} que cubra ese tema.`
  };
};

// Cuando compiten los dos, lo que hay que corregir es la aparicion del dominio al que no
// le toca, asi que es esa la que se usa como "actual". La firma es la de estado.js, para
// que la marca de nueva se compare con lo mismo que se guardo ayer.
const resolverCompetencia = ({ consulta, impresiones, apariciones, deberia }, porKeyword) => ({
  ...moverDeDominio(
    {
      consulta,
      impresiones,
      apariciones,
      actual: apariciones
        .filter(({ dominio }) => dominio !== deberia)
        .reduce((a, b) => (a.posicion <= b.posicion ? a : b)),
      deberia
    },
    porKeyword
  ),
  firma: `canibal:${consulta}`
});

const reclamar = ({ consulta, impresiones, clics, apariciones, mejor, deberia }, paginas) => {
  const destino = paginas.filter(({ dominio }) => dominio === deberia);

  return {
    firma: `huerfana:${consulta}`,
    impresiones,
    apariciones,
    titulo: `Reclamar "${consulta}"`,
    porque:
      `${numero(impresiones)} impresiones de demanda y ${numero(clics)} clics, con ${mejor.dominio} ` +
      `en posicion ${decimal(mejor.posicion)}, y ninguna pagina la declara.`,
    donde: destino.slice(0, 1).map(ubicacion),
    hacer: `Anadir "${consulta}" al meta keywords y usar esas palabras en el copy visible.`
  };
};

const reescribirTitle = ({ consulta, impresiones, apariciones, mejor, reclaman, desde }) => ({
  firma: `ctr:${consulta}`,
  impresiones,
  apariciones,
  titulo: `Reescribir el title de "${consulta}"`,
  porque:
    `${mejor.dominio} en posicion ${decimal(mejor.posicion)} con ${numero(mejor.impresiones)} ` +
    `impresiones y solo ${numero(mejor.clics)} clics: sale arriba pero no convence.` +
    (desde ? ` Cifras desde ${desde}, el dia siguiente al ultimo cambio del title o la description.` : ''),
  donde: reclaman.slice(0, 1).map(ubicacion),
  hacer: 'Reescribir title y description para que respondan a esa busqueda.'
});

const ETIQUETAS = {
  canibalizacion: 'Competencia entre dominios',
  malDominio: 'Dominio equivocado',
  sinDuenno: 'Sin declarar',
  ctrBajo: 'CTR bajo'
};

// Cada accion sale con su ubicacion en el codigo, para poder aplicarla sin buscar nada.
// El orden es el de demanda, la misma para todos los tipos: primero lo que mas se busca.
//
// El adjunto llega cada dia con las mismas acciones hasta que se aplican, asi que cada
// una dice si ya estaba ayer. Sin eso no hay forma de separar lo hecho de lo pendiente.
//
// Ninguna candidata se pierde en silencio: la que no llega a accion sale en `descartes`
// con su motivo, y la que solo falla por demanda sale ademas en `vigilancia`.
const derivarAcciones = (
  { canibalizacion, malDominio, sinDuenno, ctrBajo },
  { porKeyword, paginas },
  previas = [],
  ventana = null,
  enCooldown = () => false
) => {
  const vistas = new Set(previas);

  // Solo se descarta cuando la declaracion ya esta donde toca y lo unico que falta es
  // tiempo. Un reparto mal hecho se corrige igual, sea la pagina nueva o vieja.
  const faltaSoloTiempo = ({ consulta, deberia }) => {
    const duenno = porKeyword.get(consulta) || [];
    return declaradaDondeToca(duenno, deberia) && naceDentroDeLaVentana(duenno, ventana);
  };

  // Si el dominio que toca la declara y ya va delante, el otro solo asoma detras y no hay
  // nada que quitar ni que ganar.
  const vaDelanteQuienToca = ({ consulta, apariciones, deberia }) => {
    const mejor = apariciones.reduce((a, b) => (a.posicion <= b.posicion ? a : b));
    return declaradaDondeToca(porKeyword.get(consulta) || [], deberia) && mejor.dominio === deberia;
  };

  // Lo que cada tipo cambia, para saber si ya se toco hace poco: mover o reforzar toca las
  // keywords y el copy de quien declara la consulta; reclamar, las de la pagina destino;
  // reescribir, el title y la description de la pagina que rankea.
  const keywordsEnCooldown = ({ consulta }) => enCooldown(porKeyword.get(consulta) || [], ['keywords', 'copy']);
  const paginaDestino = ({ deberia }) => paginas.filter(({ dominio }) => dominio === deberia).slice(0, 1);

  // Los motivos van por orden: la demanda es el ultimo, porque una candidata que ademas
  // falla por otra cosa no esta en vigilancia, solo sin demanda. Las listas llegan
  // ordenadas por demanda, asi que el tope se queda con las de mas demanda.
  const evaluar = (tipo, hallazgos, construir, motivoPrevio, enEspera, maximo = Infinity) => {
    let aceptadas = 0;
    return hallazgos.map((hallazgo) => {
      const motivo = motivoPrevio(hallazgo);
      if (motivo) return { tipo, hallazgo, motivo };
      if (enEspera(hallazgo)) return { tipo, hallazgo, motivo: DISCARD_REASONS.TARGET_IN_COOLDOWN };
      if (hallazgo.impresiones < IMPRESIONES_FIABLES) {
        return { tipo, hallazgo, motivo: DISCARD_REASONS.TOO_LITTLE_DEMAND };
      }
      aceptadas += 1;
      if (aceptadas > maximo) return { tipo, hallazgo, motivo: DISCARD_REASONS.OVER_LIST_LIMIT };
      return { tipo, hallazgo, accion: construir(hallazgo) };
    });
  };

  const evaluadas = [
    // Las de compra no tienen dominio que las responda, asi que no hay a quien darle la razon.
    ...evaluar(
      'canibalizacion',
      canibalizacion,
      (h) => resolverCompetencia(h, porKeyword),
      (h) =>
        (!h.deberia && DISCARD_REASONS.NO_OWNER_DOMAIN) ||
        (faltaSoloTiempo(h) && DISCARD_REASONS.PAGE_NEWER_THAN_WINDOW) ||
        (vaDelanteQuienToca(h) && DISCARD_REASONS.OWNER_ALREADY_FIRST) ||
        null,
      keywordsEnCooldown
    ),
    ...evaluar(
      'malDominio',
      malDominio,
      (h) => moverDeDominio(h, porKeyword),
      (h) => (faltaSoloTiempo(h) ? DISCARD_REASONS.PAGE_NEWER_THAN_WINDOW : null),
      keywordsEnCooldown
    ),
    // Las que el reparto deja sin dominio a proposito no se proponen: no hay pagina que
    // pueda responderlas. Ver docs/reparto-keywords.md.
    ...evaluar(
      'sinDuenno',
      sinDuenno,
      (h) => reclamar(h, paginas),
      (h) => (h.deberia ? null : DISCARD_REASONS.NO_OWNER_DOMAIN),
      (h) => enCooldown(paginaDestino(h), ['keywords', 'copy']),
      MAXIMO_HUERFANAS
    ),
    // Una variante con las mismas palabras que ya convierte en la misma pagina es la prueba
    // de que el title funciona: el CTR pobre es de la candidata, no de la pagina.
    ...evaluar(
      'ctrBajo',
      ctrBajo,
      reescribirTitle,
      (h) => h.descarte ?? (h.variantes?.length ? DISCARD_REASONS.QUERY_VARIANT_PERFORMS : null),
      (h) => enCooldown(h.reclaman.slice(0, 1), ['title', 'description']),
      MAXIMO_CTR
    )
  ];

  const porDemanda = (a, b) => b.impresiones - a.impresiones;

  const descartes = evaluadas
    .filter(({ motivo }) => motivo)
    .map(({ tipo, hallazgo: { consulta, impresiones, apariciones }, motivo }) => ({
      titulo: `${ETIQUETAS[tipo]} "${consulta}"`,
      consulta,
      impresiones,
      apariciones,
      motivo
    }))
    .sort(porDemanda);

  return {
    acciones: evaluadas
      .filter(({ accion }) => accion)
      .map(({ accion }) => ({ ...accion, esNueva: !vistas.has(accion.firma) }))
      .sort(porDemanda),
    descartes,
    vigilancia: descartes.filter(({ motivo }) => motivo === DISCARD_REASONS.TOO_LITTLE_DEMAND)
  };
};

module.exports = { derivarAcciones, DISCARD_REASONS };
