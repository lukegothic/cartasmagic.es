// Card Monster Games: la hotlist va escrita a mano en una tabla dentro de la pagina.
//
// No hay json que pedir, asi que toca leer el html. La tabla tiene seis columnas y siempre
// en el mismo orden: edicion, carta, numero de coleccion, una columna vacia, estado y precio.
// La cuarta esta en blanco en todas las filas vistas; se conserva en el recuento para que, si
// algun dia la rellenan, la fila deje de encajar y salte el aviso en vez de colarse un dato
// en la casilla equivocada.
//
// Se recortan las filas con expresiones regulares y no con un analizador de html porque node
// no trae ninguno y la tabla es fija y simple. Si algun dia hiciera falta leer html de verdad,
// eso pediria una dependencia y conviene pensarlo entonces.

const { FuenteCaida, pedirTexto } = require('./comun');

const PAGINA = 'https://cardmonstergames.com/pages/hotlist';

// La pagina lista los tres juegos que vende la tienda, cada uno con su tabla y precedido de su
// logo. Solo interesa Magic: sin recortar se colaban Pokemon y Yu-Gi-Oh, que no compramos, y
// el informe acababa proponiendo mirar un Lugia V en Cardmarket.
const LOGO_MAGIC = 'mtg_logo';
const LOGO_SIGUIENTE = /files\/(?!mtg_logo)[a-z0-9_]+_logo/;

const COLUMNAS = 6;
const [EDICION, NOMBRE, , , ESTADO, PRECIO] = [0, 1, 2, 3, 4, 5];

// "$3,400.00" -> 3400.00. La coma es separador de millares, que es como escribe las cifras una
// tienda estadounidense: quitarla antes de convertir evita leer quince mil como quince.
const CIFRA = /\$\s*([0-9,]+(?:\.[0-9]{2})?)/;

const FILA = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELDA = /<td[^>]*>([\s\S]*?)<\/td>/gi;

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

const limpiar = (celda) =>
  celda
    .replace(/<[^>]+>/g, '')
    .replace(/&(#39|amp|lt|gt|quot|nbsp);/g, (_, e) => ENTIDADES[e])
    .replace(/\s+/g, ' ')
    .trim();

const precioDe = (celda) => {
  const encaje = CIFRA.exec(celda);
  return encaje ? Number(encaje[1].replace(/,/g, '')) : null;
};

// Recorta el trozo entre el logo de Magic y el logo del juego siguiente.
const tablaDeMagic = (html) => {
  const inicio = html.indexOf(LOGO_MAGIC);
  if (inicio === -1) throw new FuenteCaida(`${PAGINA}: no se encuentra la seccion de Magic`);

  const resto = html.slice(inicio + LOGO_MAGIC.length);
  const siguiente = LOGO_SIGUIENTE.exec(resto);
  return siguiente ? resto.slice(0, siguiente.index) : resto;
};

// El lector entra como parametro para poder probar la extraccion sin red. Por defecto es el
// que pide de verdad, asi que quien lo llama no tiene que saber que existe.
const cardmonster = async (leer = pedirTexto) => {
  const seccion = tablaDeMagic(await leer(PAGINA));

  // Quedarse con las filas de seis columnas y precio legible deja fuera las de cabecera y
  // cualquier tabla suelta que no tenga esta forma.
  const anuncios = [];
  for (const [, contenido] of seccion.matchAll(FILA)) {
    const celdas = [...contenido.matchAll(CELDA)].map(([, c]) => limpiar(c));
    if (celdas.length !== COLUMNAS) continue;

    const precio = precioDe(celdas[PRECIO]);
    if (precio === null || !celdas[NOMBRE] || !celdas[EDICION]) continue;

    anuncios.push({
      fuente: 'cardmonster',
      nombre: celdas[NOMBRE],
      edicion: celdas[EDICION],
      estado: celdas[ESTADO] || 'Near Mint',
      precio,
      moneda: 'USD',
      url: PAGINA
    });
  }

  // La pagina siempre ha tenido decenas de cartas. Si no sale ninguna es que han cambiado la
  // maquetacion, y eso hay que saberlo: dar la lista por vacia diria que han dejado de comprar,
  // que es lo contrario de lo que pasa.
  if (!anuncios.length) throw new FuenteCaida(`${PAGINA}: la tabla ya no tiene la forma esperada`);

  return anuncios;
};

module.exports = { cardmonster };
