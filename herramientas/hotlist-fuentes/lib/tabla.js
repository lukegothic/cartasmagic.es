// Lee una tabla html a partir de lo que diga la fuente en fuentes.json, en vez de tener un
// fichero de codigo por tienda. Las tablas de estas listas se parecen mucho: filas, celdas, y
// una columna para el nombre, otra para la edicion y otra para el precio. Lo que cambia es en
// que orden estan, y eso es configuracion, no logica.
//
// Se recorta con expresiones regulares y no con un analizador de html porque node no trae
// ninguno y estas tablas son fijas y simples. Si algun dia hace falta html de verdad, eso pide
// una dependencia y conviene pensarlo entonces.

const FILA = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELDA = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

// Vale tanto "$3,400.00" como "420 €" o "58.20": lo que se busca es la cifra, y el simbolo
// puede ir delante o detras segun la tienda.
const CIFRA = /([0-9][0-9.,]*)/;

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

const limpiar = (celda) =>
  celda
    .replace(/<[^>]+>/g, '')
    .replace(/&(#39|amp|lt|gt|quot|nbsp);/g, (_, e) => ENTIDADES[e])
    .replace(/\s+/g, ' ')
    .trim();

// Una tienda estadounidense escribe 3,400.00 y una europea 3.400,00. Se decide por cual de los
// dos separadores va el ultimo: el que quede mas a la derecha es el decimal.
const aNumero = (texto) => {
  const encaje = CIFRA.exec(texto);
  if (!encaje) return null;

  const cifra = encaje[1];
  const ultimaComa = cifra.lastIndexOf(',');
  const ultimoPunto = cifra.lastIndexOf('.');

  if (ultimaComa === -1 && ultimoPunto === -1) return Number(cifra);

  const decimal = ultimaComa > ultimoPunto ? ',' : '.';
  const millares = decimal === ',' ? '.' : ',';
  const normalizada = cifra.split(millares).join('').replace(decimal, '.');
  const numero = Number(normalizada);
  return Number.isFinite(numero) ? numero : null;
};

// Muchas listas mezclan varios juegos en la misma pagina. Si la fuente dice por donde empieza
// y por donde acaba la parte de Magic, se recorta antes de leer nada.
const recortar = (html, { recortar_desde: desde, recortar_hasta: hasta }) => {
  if (!desde) return html;

  const inicio = html.indexOf(desde);
  if (inicio === -1) return '';

  const resto = html.slice(inicio + desde.length);
  if (!hasta) return resto;

  const fin = new RegExp(hasta).exec(resto);
  return fin ? resto.slice(0, fin.index) : resto;
};

const leerTabla = (html, fuente) => {
  const { columnas = {}, estado_por_defecto: estadoPorDefecto = 'Near Mint' } = fuente;
  const seccion = recortar(html, fuente);
  const cartas = [];

  for (const [, contenido] of seccion.matchAll(FILA)) {
    const celdas = [...contenido.matchAll(CELDA)].map(([, c]) => limpiar(c));

    const nombre = celdas[columnas.nombre];
    const precio = aNumero(celdas[columnas.precio] ?? '');
    // Sin nombre o sin precio no hay oferta que publicar, y casi siempre es una cabecera.
    if (!nombre || precio === null || precio <= 0) continue;

    cartas.push({
      nombre,
      edicion: celdas[columnas.edicion] ?? '',
      estado: celdas[columnas.estado] || estadoPorDefecto,
      precio,
      url: fuente.url
    });
  }

  return cartas;
};

module.exports = { aNumero, leerTabla };
