const fs = require('node:fs');
const path = require('node:path');

// Los dos primeros digitos del codigo postal son la provincia, del 01 al 52.
const PATRON_CODIGO = String.raw`(?:0[1-9]|[1-4]\d|5[0-2])\d{3}`;
const CODIGO_POSTAL = new RegExp(String.raw`^(${PATRON_CODIGO})(?!\d)`);
const MAXIMO = 100;
const MINIMO_BUSQUEDA = 2;
const MAXIMO_SUGERENCIAS = 20;

const normalizar = (texto) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Se lee una vez al arrancar: son unos 800 KB y cada busqueda los recorre enteros.
const LISTADO = fs.readFileSync(path.join(__dirname, '..', 'data', 'codigos-postales.tsv'), 'utf8')
  .split('\n')
  .filter((linea) => linea && !linea.startsWith('#'))
  .map((linea) => {
    const [codigo, localidad] = linea.split('\t');
    return { codigo, localidad, sugerencia: `${codigo} ${localidad}`, palabras: ` ${normalizar(localidad)}` };
  });

const LOCALIDADES = LISTADO.reduce((mapa, { codigo, localidad }) =>
  mapa.set(codigo, [...(mapa.get(codigo) ?? []), localidad]), new Map());

// Con varias localidades en el mismo codigo no se elige ninguna: una al azar pondria en el
// asunto un pueblo que quiza no es el del cliente.
const localidadUnica = (codigo) => {
  const localidades = LOCALIDADES.get(codigo) ?? [];
  return localidades.length === 1 ? localidades[0] : null;
};

// La localidad acaba en la etiqueta, asi que solo se acepta la tecleada si es una de las del
// codigo, y entonces se escribe como la trae el listado. Un codigo que no esta en el listado
// no deja con que comparar, y se respeta lo que escribio el cliente.
const elegirLocalidad = (codigo, escrita) => {
  const localidades = LOCALIDADES.get(codigo);
  if (!localidades) return escrita || null;

  const reconocida = escrita && localidades.find((localidad) => normalizar(localidad) === normalizar(escrita));
  return reconocida || localidadUnica(codigo);
};

// No se exige que el codigo este en el listado: GeoNames no tiene por que estar al dia, y
// rechazar un codigo bueno deja al cliente sin poder enviar.
const leerCodigoPostal = (valor) => {
  const texto = String(valor ?? '').trim().slice(0, MAXIMO);
  const [, codigo] = texto.match(CODIGO_POSTAL) ?? [];
  if (!codigo) return null;

  const escrita = texto.slice(codigo.length).replace(/^[\s,-]+/, '').trim();
  return { codigo, localidad: elegirLocalidad(codigo, escrita) };
};

const lineaCodigoPostal = ({ codigo, localidad }) => [codigo, localidad].filter(Boolean).join(' ');

// Para el asunto: con varias localidades posibles, el codigo al menos dice la zona.
const lugarCodigoPostal = ({ codigo, localidad }) => localidad ?? codigo;

// Por numero se busca el principio del codigo. Por texto, el principio de cualquier palabra
// de la localidad, para que "henares" encuentre Alcala De Henares.
const buscarCodigosPostales = (consulta) => {
  const buscada = normalizar(String(consulta ?? '').trim());
  if (buscada.length < MINIMO_BUSQUEDA) return [];

  const coincide = /^\d/.test(buscada)
    ? ({ codigo }) => codigo.startsWith(buscada)
    : ({ palabras }) => palabras.includes(` ${buscada}`);

  return LISTADO.filter(coincide).slice(0, MAXIMO_SUGERENCIAS).map(({ sugerencia }) => sugerencia);
};

module.exports = { PATRON_CODIGO, leerCodigoPostal, buscarCodigosPostales, lineaCodigoPostal, lugarCodigoPostal };
