const { normalizar } = require('./keywords');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

// La frontera de reparto-keywords.md, en forma comprobable. El posesivo manda sobre todo
// lo demas: "cuanto valen mis cartas" es de vender aunque lleve "valor".
const POSESIVO = /\bmis?\b/;
const TRANSACCIONAL = /\b(vender|vendo|comprar|compran|compra|pagan|precio que|quien compra|donde vender)\b/;
const INFORMACIONAL = /\b(valor|vale|valen|valorar|tasar|tasacion|valoracion|estado|near mint|nm|edicion|ediciones|antiguas?|cuanto)\b/;

const intencion = (consulta) => {
  if (POSESIVO.test(consulta) && INFORMACIONAL.test(consulta)) return 'transaccional';
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
  return null;
};

// Umbrales de lectura. Con el volumen actual, por debajo de estas impresiones cualquier
// diferencia es ruido, asi que no se avisa de nada que no las alcance.
const MINIMO_IMPRESIONES = 10;
const POSICION_ALCANZABLE = 20;
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

const avisos = (porConsulta, porKeyword) => {
  const canibalizacion = [];
  const sinDuenno = [];
  const malDominio = [];
  const ctrBajo = [];

  for (const [consulta, apariciones] of porConsulta) {
    const impresiones = apariciones.reduce((t, a) => t + a.impresiones, 0);
    if (impresiones < MINIMO_IMPRESIONES) continue;

    const clics = apariciones.reduce((t, a) => t + a.clics, 0);
    const mejor = apariciones.reduce((a, b) => (a.posicion <= b.posicion ? a : b));
    const deberia = dominioQueTocaria(consulta, porKeyword);
    const reclaman = paginasQueLaReclaman(consulta, porKeyword);

    // Los dos dominios apareciendo a la vez es lo que la regla de reparto existe para
    // evitar, asi que se mira antes que nada.
    if (apariciones.length > 1) {
      canibalizacion.push({ consulta, impresiones, apariciones, deberia });
      continue;
    }

    if (deberia && mejor.dominio !== deberia) {
      malDominio.push({ consulta, impresiones, actual: mejor, deberia });
      continue;
    }

    if (!reclaman.length && mejor.posicion <= POSICION_ALCANZABLE) {
      sinDuenno.push({ consulta, impresiones, clics, mejor, deberia });
      continue;
    }

    if (mejor.posicion <= 10 && impresiones >= MINIMO_IMPRESIONES && clics / impresiones < CTR_POBRE) {
      ctrBajo.push({ consulta, impresiones, clics, mejor, reclaman });
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

module.exports = { agrupar, avisos, keywordsMuertas, intencion, dominioQueTocaria, HUB, VENDER };
