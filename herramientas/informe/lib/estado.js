const fs = require('node:fs');
const path = require('node:path');

// El estado vive en un volumen del contenedor, no en el repositorio. Si no hay volumen
// el informe sigue funcionando: se comporta como si cada dia fuera el primero y manda
// siempre, que es peor pero no rompe nada.
const rutaEstado = () => path.join(process.env.INFORME_ESTADO_DIR || '/datos', 'ultimo-aviso.json');

const leer = () => {
  const fichero = rutaEstado();
  if (!fs.existsSync(fichero)) return { firmas: [], fecha: null };
  return JSON.parse(fs.readFileSync(fichero, 'utf8'));
};

const guardar = (firmas) => {
  const fichero = rutaEstado();
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, JSON.stringify({ firmas, fecha: new Date().toISOString() }, null, 2));
};

// La firma identifica el aviso, no su magnitud: si "vender cartas" pasa de 97 a 103
// impresiones sigue siendo el mismo hallazgo y no merece otro correo. Solo cuenta que
// aparezca uno que ayer no estaba.
const firmar = ({ canibalizacion, malDominio, sinDuenno, ctrBajo }) => [
  ...canibalizacion.map(({ consulta }) => `canibal:${consulta}`),
  ...malDominio.map(({ consulta, deberia }) => `dominio:${consulta}:${deberia}`),
  ...sinDuenno.map(({ consulta }) => `huerfana:${consulta}`),
  ...ctrBajo.map(({ consulta }) => `ctr:${consulta}`)
];

const comparar = (firmas, previas) => {
  const antes = new Set(previas);
  const ahora = new Set(firmas);
  return {
    nuevas: firmas.filter((f) => !antes.has(f)),
    resueltas: previas.filter((f) => !ahora.has(f))
  };
};

// El embudo necesita acumular semanas para que sus ratios digan algo, asi que solo sale
// los lunes. Los hallazgos de keywords son estructurales y valen desde la primera
// impresion, por eso esos si van a diario.
const esDiaDeEmbudo = (hoy = new Date()) => hoy.getDay() === 1;

module.exports = { leer, guardar, firmar, comparar, esDiaDeEmbudo };
