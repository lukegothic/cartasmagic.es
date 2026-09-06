const { normalizar } = require('./keywords');

// Las 52 provincias. La clave es lo que se busca en la consulta y el valor la zona con
// la que se agrupa, para que "capellades" y "barcelona" no cuenten como dos sitios.
const PROVINCIAS = [
  'alava', 'albacete', 'alicante', 'almeria', 'asturias', 'avila', 'badajoz', 'baleares',
  'barcelona', 'burgos', 'caceres', 'cadiz', 'cantabria', 'castellon', 'ceuta', 'ciudad real',
  'cordoba', 'cuenca', 'girona', 'granada', 'guadalajara', 'guipuzcoa', 'huelva', 'huesca',
  'jaen', 'la coruna', 'la rioja', 'las palmas', 'leon', 'lleida', 'lugo', 'madrid', 'malaga',
  'melilla', 'murcia', 'navarra', 'ourense', 'palencia', 'pontevedra', 'salamanca', 'segovia',
  'sevilla', 'soria', 'tarragona', 'tenerife', 'teruel', 'toledo', 'valencia', 'valladolid',
  'vizcaya', 'zamora', 'zaragoza'
];

// Ciudades que aparecen en las consultas reales y no son capital de provincia. Se anaden
// segun se vean en los datos, no de una lista de todos los municipios de Espana.
const CIUDADES = {
  capellades: 'barcelona',
  bilbao: 'vizcaya',
  gijon: 'asturias',
  vigo: 'pontevedra',
  hospitalet: 'barcelona',
  sabadell: 'barcelona',
  terrassa: 'barcelona',
  mostoles: 'madrid',
  alcala: 'madrid',
  pamplona: 'navarra',
  donostia: 'guipuzcoa',
  'san sebastian': 'guipuzcoa'
};

// Por debajo de esto una pagina por zona no se sostiene: son 52 paginas casi iguales
// compitiendo entre ellas, que es justo lo que Google penaliza como doorway pages.
const IMPRESIONES_PARA_PAGINA = 150;

// La comparacion es por palabra completa. Buscar la subcadena daria falsos positivos con
// nombres cortos dentro de otras palabras.
const contienePalabra = (consulta, termino) =>
  new RegExp(`(^|\\s)${termino.replace(/ /g, '\\s')}($|\\s)`).test(consulta);

const detectarGeo = (consulta) => {
  const texto = normalizar(consulta);

  for (const [ciudad, zona] of Object.entries(CIUDADES)) {
    if (contienePalabra(texto, ciudad)) return zona;
  }
  return PROVINCIAS.find((p) => contienePalabra(texto, p)) || null;
};

const agruparGeo = (filas) => {
  const zonas = new Map();

  for (const { claves, impresiones, clics, posicion } of filas) {
    const consulta = claves[0];
    const zona = detectarGeo(consulta);
    if (!zona) continue;

    if (!zonas.has(zona)) zonas.set(zona, { zona, impresiones: 0, clics: 0, consultas: [] });
    const acumulado = zonas.get(zona);
    acumulado.impresiones += impresiones;
    acumulado.clics += clics;
    acumulado.consultas.push({ consulta, impresiones, clics, posicion });
  }

  return [...zonas.values()]
    .map((z) => ({ ...z, merecePagina: z.impresiones >= IMPRESIONES_PARA_PAGINA }))
    .sort((a, b) => b.impresiones - a.impresiones);
};

module.exports = { detectarGeo, agruparGeo, IMPRESIONES_PARA_PAGINA };
