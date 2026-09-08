// Lo que comparten las fuentes: como se piden las paginas y como es un anuncio.
//
// El precio se guarda en la moneda de origen sin convertir: la conversion depende del dia,
// y mezclarla con la extraccion haria imposible saber si una diferencia viene del vendedor
// o del tipo de cambio.

// Identificarse es lo minimo al pedir paginas ajenas a diario: si molestamos, que sepan a
// quien escribir en vez de tener que bloquear a ciegas.
const AGENTE = 'cartasmagic-hotlist/1.0 (+https://vendercartasmagic.es; contacto@vendercartasmagic.es)';

// Ninguna de las listas cambia en cuestion de minutos, asi que no hay prisa que justifique
// apretar. Un segundo entre peticiones deja la carga por debajo de la de un visitante.
const ESPERA_ENTRE_PETICIONES = 1000;

const TIEMPO_LIMITE = 30000;

// Se distingue de una lista vacia a proposito. Una tienda puede quedarse sin cartas que
// buscar, y eso es un dato; que su web este caida no lo es, y confundirlos borraria la
// fuente del informe como si hubiera retirado todas sus ofertas.
class FuenteCaida extends Error {}

const esperar = (ms) => new Promise((cumplir) => setTimeout(cumplir, ms));

// Identifica la oferta entre dias distintos, para saber que ha cambiado.
const clave = ({ fuente, nombre, edicion, estado }) => `${fuente}|${nombre}|${edicion}|${estado}`;

const pedir = async (url, cabeceras = {}) => {
  try {
    const respuesta = await fetch(url, {
      headers: { 'User-Agent': AGENTE, ...cabeceras },
      signal: AbortSignal.timeout(TIEMPO_LIMITE)
    });
    if (!respuesta.ok) throw new FuenteCaida(`${url}: HTTP ${respuesta.status}`);
    return respuesta;
  } catch (error) {
    if (error instanceof FuenteCaida) throw error;
    throw new FuenteCaida(`${url}: ${error.message}`);
  } finally {
    await esperar(ESPERA_ENTRE_PETICIONES);
  }
};

const pedirJson = async (url) => {
  const respuesta = await pedir(url, { Accept: 'application/json' });
  try {
    return await respuesta.json();
  } catch {
    throw new FuenteCaida(`${url}: no devuelve json`);
  }
};

const pedirTexto = async (url) => (await pedir(url)).text();

// Para las fuentes que hay que mirar a ojo: dice si el enlace sigue en pie y cuanto pesa, sin
// descargarse el fichero entero. Una imagen de lista puede ocupar un mega y no se va a leer
// aqui, asi que basta con saber que esta.
const pedirCabecera = async (url) => {
  const respuesta = await fetch(url, {
    method: 'HEAD',
    headers: { 'User-Agent': AGENTE },
    signal: AbortSignal.timeout(TIEMPO_LIMITE)
  });
  return {
    ok: respuesta.ok,
    tipo: respuesta.headers.get('content-type') ?? '',
    bytes: Number(respuesta.headers.get('content-length') ?? 0)
  };
};

module.exports = { AGENTE, FuenteCaida, clave, pedirJson, pedirTexto, pedirCabecera };
