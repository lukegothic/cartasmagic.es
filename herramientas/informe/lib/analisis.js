const { normalizar } = require('./keywords');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

// La frontera de reparto-keywords.md, en forma comprobable. El posesivo manda sobre todo
// lo demas: "cuanto valen mis cartas" es de vender aunque lleve "valor".
const POSESIVO = /\bmis?\b/;
// Hay dos formas de escribir el verbo comprar queriendo vender: "compra venta", que es
// el nombre del sector, y "quien compra", que pregunta por un comprador. Ninguna de las
// dos cuenta como intencion de compra aunque lleven la misma palabra.
const COMPRA_PERO_VENDE = /\b(compra\s*-?\s*venta|quien\s+compra)\b/;
const COMPRA = /\b(comprar|compra|compro|compramos)\b/;
// La otra cara: "venta cartas magic" busca lo que esta a la venta, y "vendo cartas magic"
// es el titulo de un anuncio de Wallapop. Las dos las escribe quien quiere comprar, salvo
// que el verbo vender diga lo contrario.
const ANUNCIO = /\b(venta|vendo)\b/;
const VERBO_VENDER = /\bvender\b/;
const TRANSACCIONAL = /\b(vender|vendo|venta|pagan|precio que|quien compra|donde vender)\b/;
const INFORMACIONAL = /\b(valor|vale|valen|valorar|tasar|tasacion|valoracion|estado|near mint|nm|edicion|ediciones|antiguas?|cuanto)\b/;

const intencion = (consulta) => {
  if (POSESIVO.test(consulta) && INFORMACIONAL.test(consulta)) return 'transaccional';
  if (COMPRA.test(consulta) && !COMPRA_PERO_VENDE.test(consulta)) return 'compra';
  if (ANUNCIO.test(consulta) && !COMPRA_PERO_VENDE.test(consulta) && !VERBO_VENDER.test(consulta)) {
    return 'compra';
  }
  if (TRANSACCIONAL.test(consulta)) return 'transaccional';
  if (INFORMACIONAL.test(consulta)) return 'informacional';
  return 'otra';
};

// Lo que una pagina declara pesa mas que el patron de palabras. "valoracion cartas
// magic" no lleva verbo de venta ni posesivo, pero es de vender porque su pagina la
// reclama, y el reparto la lista ahi. Sin esta precedencia el informe avisaria de una
// canibalizacion que no existe cada vez que se leyeran los datos.
const dominioQueTocaria = (consulta, porKeyword) => {
  const declarada = porKeyword?.get(consulta);
  if (declarada?.length) {
    const dominios = new Set(declarada.map(({ dominio }) => dominio));
    if (dominios.size === 1) return [...dominios][0];
  }

  const tipo = intencion(consulta);
  if (tipo === 'transaccional') return VENDER;
  if (tipo === 'informacional') return HUB;
  // La intencion de compra se queda sin dominio a proposito: ninguna de las dos paginas
  // responde a lo que se busca. Ver docs/reparto-keywords.md.
  return null;
};

// Umbrales de lectura. Con el volumen actual, por debajo de estas impresiones cualquier
// diferencia es ruido, asi que no se avisa de nada que no las alcance.
const MINIMO_IMPRESIONES = 10;
const POSICION_ALCANZABLE = 20;
const POSICION_CTR = 10;
const CTR_POBRE = 0.02;

const agrupar = (filas) => {
  const porConsulta = new Map();
  for (const { dominio, claves, clics, impresiones, posicion } of filas) {
    const consulta = normalizar(claves[0]);
    if (!porConsulta.has(consulta)) porConsulta.set(consulta, []);
    porConsulta.get(consulta).push({ dominio, clics, impresiones, posicion });
  }
  return porConsulta;
};

// Una consulta la "reclama" una pagina si su meta keywords la lleva literal, o si la
// keyword declarada esta contenida en la consulta larga.
const paginasQueLaReclaman = (consulta, porKeyword) => {
  const exactas = porKeyword.get(consulta) || [];
  if (exactas.length) return exactas;

  const parciales = [];
  for (const [keyword, paginas] of porKeyword) {
    if (consulta.includes(keyword)) parciales.push(...paginas);
  }
  return parciales;
};

// Dos consultas con las mismas palabras en otro orden son una sola busqueda para el
// buscador, asi que lo que rinde una lo rinde la otra.
const clavePalabras = (consulta) => [...new Set(consulta.split(' '))].sort().join(' ');

const ctrDe = ({ clics, impresiones }) => clics / impresiones;

const mismaPagina = (a, b) =>
  a.some((x) => b.some((y) => x.dominio === y.dominio && x.ruta === y.ruta));

// Variantes de la consulta, en la misma pagina, cuyo CTR ya no es pobre: el title ya
// funciona para esa busqueda y reescribirlo por el orden de las palabras solo arriesga lo
// que convierte. El CTR de cada una es el de quien mejor rankea, como el de la candidata.
const variantesQueRinden = (consulta, reclaman, porConsulta, porKeyword) => {
  const clave = clavePalabras(consulta);
  return [...porConsulta]
    .filter(([otra]) => otra !== consulta && clavePalabras(otra) === clave)
    .filter(([otra, apariciones]) => {
      const mejor = apariciones.reduce((a, b) => (a.posicion <= b.posicion ? a : b));
      return ctrDe(mejor) >= CTR_POBRE && mismaPagina(reclaman, paginasQueLaReclaman(otra, porKeyword));
    })
    .map(([otra]) => otra);
};

const avisos = (porConsulta, porKeyword) => {
  const canibalizacion = [];
  const sinDuenno = [];
  const malDominio = [];
  const ctrBajo = [];

  for (const [consulta, apariciones] of porConsulta) {
    // La demanda es la del dominio que mas impresiones ve: dos dominios en la misma pagina de
    // resultados son una sola busqueda, y sumarlos la contaba dos veces. El campo se llama
    // impresiones porque asi lo leen todos los consumidores de los avisos.
    const impresiones = Math.max(...apariciones.map((a) => a.impresiones));
    if (impresiones < MINIMO_IMPRESIONES) continue;

    const clics = apariciones.reduce((t, a) => t + a.clics, 0);
    const mejor = apariciones.reduce((a, b) => (a.posicion <= b.posicion ? a : b));
    const deberia = dominioQueTocaria(consulta, porKeyword);
    const reclaman = paginasQueLaReclaman(consulta, porKeyword);

    // Los dos dominios apareciendo a la vez es lo que la regla de reparto existe para
    // evitar, asi que se mira antes que nada. Pero solo compite quien esta al alcance: una
    // impresion suelta en posicion 56 no le quita clics a nadie, y contarla tapaba lo que
    // de verdad pasaba con la consulta.
    const enJuego = apariciones.filter(({ posicion }) => posicion <= POSICION_ALCANZABLE);
    if (enJuego.length > 1) {
      canibalizacion.push({ consulta, impresiones, apariciones, deberia });
      continue;
    }

    if (deberia && mejor.dominio !== deberia) {
      malDominio.push({ consulta, impresiones, apariciones, actual: mejor, deberia });
      continue;
    }

    if (!reclaman.length && mejor.posicion <= POSICION_ALCANZABLE) {
      sinDuenno.push({ consulta, impresiones, clics, apariciones, mejor, deberia });
      continue;
    }

    // El CTR es el de quien rankea, no el de las dos cifras mezcladas: los clics de un
    // dominio no se reparten entre las impresiones del otro.
    if (mejor.posicion <= POSICION_CTR && ctrDe(mejor) < CTR_POBRE) {
      const variantes = variantesQueRinden(consulta, reclaman, porConsulta, porKeyword);
      ctrBajo.push({ consulta, impresiones, clics, apariciones, mejor, reclaman, variantes });
    }
  }

  const porImpresiones = (a, b) => b.impresiones - a.impresiones;
  return {
    canibalizacion: canibalizacion.sort(porImpresiones),
    malDominio: malDominio.sort(porImpresiones),
    sinDuenno: sinDuenno.sort(porImpresiones),
    ctrBajo: ctrBajo.sort(porImpresiones)
  };
};

// El aviso legal no esta para rankear, asi que sus keywords sin impresiones no son un
// problema que corregir y solo estorban en la tabla.
const SIN_INTENCION_SEO = new Set(['/aviso-legal']);

// Keywords declaradas en un meta que no aparecen en ninguna consulta real: o nadie las
// busca o la pagina no rankea por ellas. En los dos casos ocupan sitio sin traer nada.
const keywordsMuertas = (porConsulta, paginas) => {
  const vistas = [...porConsulta.keys()];
  return paginas
    .filter(({ ruta }) => !SIN_INTENCION_SEO.has(ruta))
    .map(({ dominio, ruta, keywords, fichero }) => ({
      dominio,
      ruta,
      fichero,
      muertas: keywords.filter((k) => !vistas.some((c) => c.includes(k)))
    }))
    .filter(({ muertas }) => muertas.length);
};

module.exports = {
  agrupar,
  avisos,
  keywordsMuertas,
  intencion,
  dominioQueTocaria,
  MINIMO_IMPRESIONES,
  POSICION_CTR,
  HUB,
  VENDER
};
