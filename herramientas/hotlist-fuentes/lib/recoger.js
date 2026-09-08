// Recoge lo que publica cada tienda, sea como sea que lo publique.
//
// La idea es que ninguna fuente se pierda por no saber leerla del todo. De unas se saca la
// lista entera (shopify), de otras casi entera (una tabla html), y de otras solo el enlace a
// un cartel que hay que mirar a ojo. Las tres cosas valen: quien revisa esto es una persona,
// y lo que no se pueda extraer se le deja delante con su enlace en vez de tirarlo.
//
// Por eso aqui no se lanza FuenteCaida por no entender una pagina. Solo se marca el estado:
//   leida       se saco la lista
//   parcial     se saco algo, pero puede faltar
//   a_revisar   no se puede leer sola, hay un enlace o una imagen que mirar
//   caida       no contesto, que es lo unico que si es un fallo

const { pedirJson, pedirTexto, pedirCabecera } = require('../fuentes/comun');
const { leerTabla } = require('./tabla');

const MAXIMO_PAGINAS = 40;

// Cada tienda titula sus productos a su manera, y de ahi hay que sacar carta y edicion:
//   simple  "Tundra [Revised Edition]", la edicion en el unico corchete
//   corchetes  "Swan Song [65] [Theros] [Non-Foil]", varios corchetes y la edicion no es el
//              primero. Se descarta el que sea solo numeros, que es el de coleccion, y el de
//              acabado, y de lo que queda se coge el primero.
const TITULO_SIMPLE = /^(.+?)\s*\[([^\]]+)\]\s*$/;
const ACABADOS = /^(non-?foil|foil|etched|borderless|showcase|extended art|retro)$/i;

const partirTitulo = (titulo, formato) => {
  if (formato !== 'corchetes') {
    const encaje = TITULO_SIMPLE.exec(titulo);
    return encaje ? { nombre: encaje[1].trim(), edicion: encaje[2].trim() } : null;
  }

  const trozos = [...titulo.matchAll(/\[([^\]]*)\]/g)].map(([, t]) => t.trim());
  // Sin corchetes no es una carta: en estas listas suele ser una caja de sobres.
  if (!trozos.length) return null;

  const nombre = titulo.slice(0, titulo.indexOf('[')).trim();
  const edicion = trozos.find((t) => t && !/^\d+$/.test(t) && !ACABADOS.test(t));
  return nombre && edicion ? { nombre, edicion } : null;
};

// Unas tiendas escriben "Near Mint", otras "NM-Mint" y otras "NM". Se coge la primera variante
// que encaje con lo que diga la fuente, en su orden, para no comparar una inglesa con una
// alemana o una normal con una foil.
const varianteLimpia = (variantes, preferidas) => {
  for (const preferida of preferidas) {
    const encaje = variantes.find(({ title }) => title === preferida);
    if (encaje?.price) return encaje;
  }
  return null;
};

const recogerShopify = async (fuente, leer = pedirJson) => {
  const { formato_titulo: formato = 'simple', variantes: preferidas = ['Near Mint'] } = fuente;
  const cartas = [];
  let descartados = 0;

  for (let pagina = 1; pagina <= MAXIMO_PAGINAS; pagina += 1) {
    const url = `${fuente.tienda_url}/collections/${fuente.coleccion}/products.json?limit=250&page=${pagina}`;
    const datos = await leer(url);
    if (!Array.isArray(datos?.products) || !datos.products.length) break;

    for (const producto of datos.products) {
      const partes = partirTitulo(producto.title ?? '', formato);
      const limpia = partes && varianteLimpia(producto.variants ?? [], preferidas);
      if (!partes || !limpia) {
        descartados += 1;
        continue;
      }

      cartas.push({
        nombre: partes.nombre,
        edicion: partes.edicion,
        estado: limpia.title,
        precio: Number(limpia.price),
        url: `${fuente.tienda_url}/products/${producto.handle ?? ''}`
      });
    }
  }

  // Estas colecciones mezclan cajas de sobres con cartas sueltas. Se dice cuantas se han
  // dejado fuera para que no parezca que la lista es mas corta de lo que es.
  return {
    estado: 'leida',
    cartas,
    aviso: descartados ? `${descartados} productos que no son cartas sueltas, fuera` : undefined
  };
};

const recogerTabla = async (fuente, leer = pedirTexto) => {
  const cartas = leerTabla(await leer(fuente.url), fuente);
  // Una tabla que no da ni una fila casi siempre es un rediseno, no una tienda que ha dejado
  // de comprar. Se marca para mirarla en vez de decir que su lista esta vacia.
  return cartas.length
    ? { estado: 'leida', cartas }
    : { estado: 'a_revisar', cartas: [], aviso: 'la tabla ya no tiene la forma esperada' };
};

// De una imagen no se saca texto aqui: se deja el enlace para abrirlo. Leerla pediria un OCR,
// y con listas de noventa cartas escritas en un cartel el OCR se equivoca lo justo para que
// haya que repasarlo entero igualmente.
const recogerImagen = async (fuente, leer = pedirTexto) => {
  const html = await leer(fuente.url);
  const patron = new RegExp(fuente.patron_imagen, 'g');
  const imagenes = [...new Set(html.match(patron) ?? [])].map((i) => (i.startsWith('http') ? i : `https://${i}`));

  return {
    estado: 'a_revisar',
    cartas: [],
    imagenes,
    aviso: imagenes.length
      ? `${imagenes.length} imagenes en la pagina, hay que mirar cual es la lista`
      : 'no se han encontrado imagenes con ese patron'
  };
};

const recogerHtml = async (fuente, leer = pedirTexto) => {
  const html = await leer(fuente.url);
  return {
    estado: 'a_revisar',
    cartas: [],
    aviso: `pagina guardada, ${Math.round(html.length / 1024)} kB, hay que mirarla`
  };
};

// Una fuente pendiente no se pide: esta declarada para que salga en el informe y no se olvide
// por que no se lee, en vez de desaparecer y parecer que nunca existio.
const recogerPendiente = async (fuente) => ({
  estado: 'a_revisar',
  cartas: [],
  aviso: fuente.nota ?? 'pendiente'
});

const RECOGEDORES = {
  shopify: recogerShopify,
  tabla: recogerTabla,
  imagen: recogerImagen,
  html: recogerHtml,
  pendiente: recogerPendiente
};

// Una fuente que falla no cancela las demas: que Crypt este en mantenimiento no es motivo
// para quedarse sin saber que ha hecho Card Monster.
const recogerFuente = async (fuente, lectores = {}) => {
  const recoger = RECOGEDORES[fuente.tipo];
  if (!recoger) return { ...fuente, estado: 'caida', cartas: [], aviso: `tipo desconocido: ${fuente.tipo}` };

  try {
    const resultado = await recoger(fuente, lectores[fuente.tipo]);
    return { ...fuente, ...resultado };
  } catch (error) {
    return { ...fuente, estado: 'caida', cartas: [], aviso: error.message };
  }
};

const recogerTodas = async (fuentes, lectores = {}) => {
  const recogidas = [];
  for (const fuente of fuentes) recogidas.push(await recogerFuente(fuente, lectores));
  return recogidas;
};

module.exports = { recogerFuente, recogerTodas };
