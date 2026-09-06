const { normalizar } = require('./keywords');

// Palabras que no distinguen un tema de otro: salen en casi todas las consultas del
// dominio y agruparian todo junto.
const VACIAS = new Set([
  'cartas', 'carta', 'magic', 'mtg', 'the', 'gathering', 'de', 'la', 'el', 'los', 'las',
  'mi', 'mis', 'un', 'una', 'en', 'a', 'y', 'o', 'por', 'para', 'con', 'que', 'se', 'es'
]);

// El tema es la palabra con contenido que mas se repite entre las consultas huerfanas.
// No es clasificacion semantica, es agrupar por la raiz que comparten, que con este
// volumen basta para decidir sobre que escribir.
const RAICES = [
  ['venta', /\b(venta|vender|vendo|vende)\b/],
  ['compra', /\b(compra|comprar|compro|compran)\b/],
  ['valor', /\b(valor|vale|valen|valorar|tasar|tasacion|valoracion|precio)\b/],
  ['estado', /\b(estado|near mint|nm|conservacion)\b/],
  ['antiguas', /\b(antigua|antiguas|viejas|coleccion antigua)\b/],
  ['sueltas', /\b(suelta|sueltas|individual)\b/],
  ['tienda', /\b(tienda|tiendas|local)\b/]
];

const temaDe = (consulta) => {
  const texto = normalizar(consulta);
  const encontrada = RAICES.find(([, patron]) => patron.test(texto));
  if (encontrada) return encontrada[0];

  // Sin raiz conocida, la primera palabra con contenido sirve de etiqueta.
  return texto.split(' ').find((p) => !VACIAS.has(p)) || 'otras';
};

const agruparTemas = (sinDuenno) => {
  const temas = new Map();

  for (const hallazgo of sinDuenno) {
    const tema = temaDe(hallazgo.consulta);
    if (!temas.has(tema)) temas.set(tema, { tema, impresiones: 0, clics: 0, consultas: [] });
    const acumulado = temas.get(tema);
    acumulado.impresiones += hallazgo.impresiones;
    acumulado.clics += hallazgo.clics;
    acumulado.consultas.push(hallazgo);
  }

  return [...temas.values()].sort((a, b) => b.impresiones - a.impresiones);
};

// Dos paginas del mismo dominio con la misma keyword se quitan posiciones entre ellas.
// El control que compara dominios no lo ve, porque para el son el mismo sitio.
const canibalizacionInterna = (porKeyword) =>
  [...porKeyword.entries()]
    .filter(([, paginas]) => {
      if (paginas.length < 2) return false;
      return new Set(paginas.map(({ dominio }) => dominio)).size === 1;
    })
    .map(([keyword, paginas]) => ({ keyword, dominio: paginas[0].dominio, paginas }))
    .sort((a, b) => b.paginas.length - a.paginas.length);

// Cuantas palabras de la consulta aparecen en el texto. Un LLM no cita lo que no
// encuentra, asi que lo que no esta escrito no se puede responder.
const PROPORCION_CUBIERTA = 0.6;

// Solo articulos y preposiciones. Aqui "magic" y "cartas" si cuentan: la pregunta es si
// el texto las menciona, no si sirven para agrupar temas.
const SIN_CONTENIDO = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'en', 'a', 'y', 'o', 'por', 'para',
  'con', 'que', 'se', 'es', 'mi', 'mis', 'su', 'the'
]);

// "vender" tiene que casar con "vendedor" y "coleccion" con "colecciones". Comparar la
// palabra entera daria por no cubierto casi todo, que es lo que hacia antes.
const RAIZ_MINIMA = 5;

const raiz = (palabra) => (palabra.length > RAIZ_MINIMA ? palabra.slice(0, RAIZ_MINIMA) : palabra);

const vecesEn = (texto, palabra) => texto.split(raiz(palabra)).length - 1;

// La cobertura es la proporcion de palabras de la consulta que estan en el texto. Se
// mide la presencia, no lo repetidas que estan: ponderar por repeticion hacia que una
// palabra presente pero comun no llegara nunca al umbral, y sobre un llm.txt de verdad
// no salia cubierta ni una consulta.
//
// Ahora bien, la presencia sola tampoco basta. En "cartas magic sueltas" las dos
// primeras salen en cada parrafo y "sueltas" es la unica que dice de que va la consulta:
// dos de tres da 67 % y taparia el hueco. Por eso la palabra menos repetida, que es la
// que la distingue, tiene que estar si o si.
const coberturaLlm = (textoLlm, consultas) => {
  const texto = normalizar(textoLlm);
  const cubiertas = [];
  const huecos = [];

  for (const fila of consultas) {
    const palabras = normalizar(fila.consulta)
      .split(' ')
      .filter((p) => !SIN_CONTENIDO.has(p) && p.length > 2);
    if (!palabras.length) continue;

    const apariciones = palabras.map((p) => vecesEn(texto, p));
    const presentes = apariciones.filter((n) => n > 0).length;
    const cobertura = presentes / palabras.length;
    const distintivaPresente = Math.min(...apariciones) > 0;

    const destino =
      cobertura >= PROPORCION_CUBIERTA && distintivaPresente ? cubiertas : huecos;
    destino.push({ ...fila, cobertura });
  }

  return { cubiertas, huecos: huecos.sort((a, b) => b.impresiones - a.impresiones) };
};

module.exports = { agruparTemas, canibalizacionInterna, coberturaLlm };
