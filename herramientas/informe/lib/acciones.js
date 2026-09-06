const { numero, decimal } = require('./formato');

// Cuantas de cada tipo entran en el informe. Mas abajo el volumen ya no distingue una
// senal de una casualidad, y una lista larga no se lee.
const MAXIMO_HUERFANAS = 10;
const MAXIMO_CTR = 8;

const ubicacion = ({ fichero, numeroLinea }) => ({ fichero, numeroLinea });

const moverDeDominio = ({ consulta, impresiones, actual, deberia }, porKeyword) => {
  const duenno = porKeyword.get(consulta) || [];

  return {
    titulo: `Mover "${consulta}" a ${deberia}`,
    porque:
      `${numero(impresiones)} impresiones en posicion ${decimal(actual.posicion)}, pero rankea ` +
      `${actual.dominio} y segun el reparto es de ${deberia}.`,
    donde: duenno.map(ubicacion),
    hacer: duenno.length
      ? `Quitarla del meta keywords de ${duenno.map(({ ruta }) => ruta).join(', ')} y anadirla en la pagina equivalente de ${deberia}.`
      : `Anadirla al meta keywords de la pagina de ${deberia} que cubra ese tema.`
  };
};

const reclamar = ({ consulta, impresiones, clics, mejor, deberia }, paginas) => {
  const destino = paginas.filter(({ dominio }) => dominio === (deberia || mejor.dominio));

  return {
    titulo: `Reclamar "${consulta}"`,
    porque:
      `${numero(impresiones)} impresiones y ${numero(clics)} clics en posicion ` +
      `${decimal(mejor.posicion)}, y ninguna pagina la declara.`,
    donde: destino.slice(0, 1).map(ubicacion),
    hacer: `Anadir "${consulta}" al meta keywords y usar esas palabras en el copy visible.`
  };
};

const reescribirTitle = ({ consulta, impresiones, clics, mejor, reclaman }) => ({
  titulo: `Reescribir el title de "${consulta}"`,
  porque:
    `Posicion ${decimal(mejor.posicion)} con ${numero(impresiones)} impresiones y solo ` +
    `${numero(clics)} clics: sale arriba pero no convence.`,
  donde: reclaman.slice(0, 1).map(ubicacion),
  hacer: 'Reescribir title y description para que respondan a esa busqueda.'
});

// Cada accion sale con su ubicacion en el codigo, para poder aplicarla sin buscar nada.
// El orden es el de impresiones perdidas: primero lo que cuesta mas trafico.
const derivarAcciones = ({ malDominio, sinDuenno, ctrBajo }, { porKeyword, paginas }) => [
  ...malDominio.map((h) => moverDeDominio(h, porKeyword)),
  ...sinDuenno.slice(0, MAXIMO_HUERFANAS).map((h) => reclamar(h, paginas)),
  ...ctrBajo.slice(0, MAXIMO_CTR).map(reescribirTitle)
];

module.exports = { derivarAcciones };
