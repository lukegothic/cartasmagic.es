const { numero, decimal } = require('./formato');

// Cuantas de cada tipo entran en el informe. Mas abajo el volumen ya no distingue una
// senal de una casualidad, y una lista larga no se lee.
const MAXIMO_HUERFANAS = 10;
const MAXIMO_CTR = 8;

// Con unas 48 visitas al mes, por debajo de esto la diferencia entre actuar y no actuar
// cabe dentro del ruido. La accion se sigue proponiendo, pero marcada, porque
// docs/plan-medicion-embudo.md avisa de que decidir sobre azar es peor que no decidir.
const IMPRESIONES_FIABLES = 40;

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

const moverDeDominio = ({ consulta, impresiones, actual, deberia }, porKeyword) => {
  const duenno = porKeyword.get(consulta) || [];
  const yaEstaBien = declaradaDondeToca(duenno, deberia);

  return {
    firma: `dominio:${consulta}:${deberia}`,
    impresiones,
    titulo: yaEstaBien
      ? `Ganar posicion para "${consulta}" en ${deberia}`
      : `Mover "${consulta}" a ${deberia}`,
    porque: yaEstaBien
      ? `${numero(impresiones)} impresiones en posicion ${decimal(actual.posicion)}: la declara ` +
        `${deberia}, que es de quien es, pero quien rankea es ${actual.dominio}.`
      : `${numero(impresiones)} impresiones en posicion ${decimal(actual.posicion)}, pero rankea ` +
        `${actual.dominio} y segun el reparto es de ${deberia}.`,
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
      actual: apariciones
        .filter(({ dominio }) => dominio !== deberia)
        .reduce((a, b) => (a.posicion <= b.posicion ? a : b)),
      deberia
    },
    porKeyword
  ),
  firma: `canibal:${consulta}`
});

const reclamar = ({ consulta, impresiones, clics, mejor, deberia }, paginas) => {
  const destino = paginas.filter(({ dominio }) => dominio === deberia);

  return {
    firma: `huerfana:${consulta}`,
    impresiones,
    titulo: `Reclamar "${consulta}"`,
    porque:
      `${numero(impresiones)} impresiones y ${numero(clics)} clics en posicion ` +
      `${decimal(mejor.posicion)}, y ninguna pagina la declara.`,
    donde: destino.slice(0, 1).map(ubicacion),
    hacer: `Anadir "${consulta}" al meta keywords y usar esas palabras en el copy visible.`
  };
};

const reescribirTitle = ({ consulta, impresiones, clics, mejor, reclaman }) => ({
  firma: `ctr:${consulta}`,
  impresiones,
  titulo: `Reescribir el title de "${consulta}"`,
  porque:
    `Posicion ${decimal(mejor.posicion)} con ${numero(impresiones)} impresiones y solo ` +
    `${numero(clics)} clics: sale arriba pero no convence.`,
  donde: reclaman.slice(0, 1).map(ubicacion),
  hacer: 'Reescribir title y description para que respondan a esa busqueda.'
});

// Cada accion sale con su ubicacion en el codigo, para poder aplicarla sin buscar nada.
// El orden es el de impresiones perdidas: primero lo que cuesta mas trafico.
//
// El adjunto llega cada dia con las mismas acciones hasta que se aplican, asi que cada
// una dice si ya estaba ayer. Sin eso no hay forma de separar lo hecho de lo pendiente.
const derivarAcciones = (
  { canibalizacion, malDominio, sinDuenno, ctrBajo },
  { porKeyword, paginas },
  previas = [],
  ventana = null
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

  return [
    // Las de compra no tienen dominio que las responda, asi que no hay a quien darle la razon.
    ...canibalizacion
      .filter((h) => h.deberia && !faltaSoloTiempo(h) && !vaDelanteQuienToca(h))
      .map((h) => resolverCompetencia(h, porKeyword)),
    ...malDominio.filter((h) => !faltaSoloTiempo(h)).map((h) => moverDeDominio(h, porKeyword)),
    // Las que el reparto deja sin dominio a proposito no se proponen: no hay pagina que
    // pueda responderlas. Ver docs/reparto-keywords.md.
    ...sinDuenno
      .filter(({ deberia }) => deberia)
      .slice(0, MAXIMO_HUERFANAS)
      .map((h) => reclamar(h, paginas)),
    ...ctrBajo.slice(0, MAXIMO_CTR).map(reescribirTitle)
  ].map((accion) => ({
    ...accion,
    esNueva: !vistas.has(accion.firma),
    esRuido: accion.impresiones < IMPRESIONES_FIABLES
  }));
};

module.exports = { derivarAcciones };
