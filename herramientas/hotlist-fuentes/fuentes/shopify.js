// Tiendas montadas sobre Shopify: de momento solo Crypt.
//
// Shopify publica cada coleccion en /collections/<nombre>/products.json sin pedir clave ni
// saltarse nada: es el mismo listado que sirve la web, en json en vez de en html. Se usa eso
// y no el html porque el html cambia cada vez que la tienda toca su plantilla, y el json no.

const { FuenteCaida, pedirJson } = require('./comun');

// El titulo de Shopify mete la edicion entre corchetes al final ("Tundra [Revised Edition]").
// Lo que va antes es el nombre, que puede llevar parentesis propios ("Ancient Copper Dragon
// (Borderless)"), asi que no se corta por el primer separador que aparezca.
const TITULO = /^(.+?)\s*\[([^\]]+)\]\s*$/;

// Solo interesa la carta en ingles, sin foil y en el mejor estado: es lo que publica nuestra
// hotlist, y comparar contra una variante en frances o jugada seria comparar cosas distintas.
const VARIANTE_LIMPIA = 'Near Mint';

const MAXIMO_POR_PAGINA = 250;

// Una coleccion que no se acaba nunca solo puede ser un bucle: Shopify repite la misma pagina
// cuando el parametro deja de tener sentido para ella.
const MAXIMO_PAGINAS = 40;

const anuncio = (producto, fuente, moneda, tienda) => {
  const encaje = TITULO.exec(producto.title ?? '');
  if (!encaje) return null;

  const limpia = (producto.variants ?? []).find(({ title }) => title === VARIANTE_LIMPIA);
  if (!limpia?.price) return null;

  const [, nombre, edicion] = encaje;
  return {
    fuente,
    nombre: nombre.trim(),
    edicion: edicion.trim(),
    estado: VARIANTE_LIMPIA,
    precio: Number(limpia.price),
    moneda,
    url: `${tienda}/products/${producto.handle ?? ''}`
  };
};

// El lector entra como parametro para poder probar la extraccion sin red. Por defecto es el
// que pide de verdad, asi que quien lo llama no tiene que saber que existe.
const leerColeccion = async (tienda, coleccion, fuente, moneda, leer = pedirJson) => {
  const anuncios = [];

  for (let pagina = 1; pagina <= MAXIMO_PAGINAS; pagina += 1) {
    const url = `${tienda}/collections/${coleccion}/products.json?limit=${MAXIMO_POR_PAGINA}&page=${pagina}`;
    const datos = await leer(url);
    if (!Array.isArray(datos?.products)) throw new FuenteCaida(`${url}: no trae products`);
    if (!datos.products.length) return anuncios;

    anuncios.push(...datos.products.map((p) => anuncio(p, fuente, moneda, tienda)).filter(Boolean));
  }

  return anuncios;
};

const crypt = () => leerColeccion('https://cryptmtg.com', 'mtg-hotlist', 'crypt', 'CAD');

// Alchemist's Refuge no tiene funcion propia a proposito. Su pagina de buylist anuncia una
// "hot list" pero no la publica: dice que hay que preguntar en la tienda o por telefono. Se
// comprobaron sus 250 colecciones y ninguna enumera cartas de compra, asi que no hay nada que
// leer. Si algun dia la publican, se anade aqui una linea con leerColeccion.

module.exports = { leerColeccion, crypt };
