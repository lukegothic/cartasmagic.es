const fs = require('node:fs');
const path = require('node:path');

// El estado vive en un volumen del contenedor, no en el repositorio. Si no hay volumen
// el informe sigue funcionando: se comporta como si cada dia fuera el primero y manda
// siempre, que es peor pero no rompe nada.
const rutaEstado = () => path.join(process.env.INFORME_ESTADO_DIR || '/datos', 'ultimo-aviso.json');

const VACIO = { acciones: [], alarmas: [], targets: {}, fecha: null };

// El formato anterior guardaba `firmas`: la de cada hallazgo, visible o no. Se lee una vez
// y se marca como migrado, porque de el no se puede saber cuales eran visibles: sirve para
// detectar acciones nuevas, no para dar por resueltas las que faltan. El siguiente guardado
// ya sale en el formato nuevo.
const migrar = ({ firmas, fecha = null }) => ({ ...VACIO, acciones: firmas, fecha, migrado: true });

const leer = () => {
  const fichero = rutaEstado();
  if (!fs.existsSync(fichero)) return VACIO;
  const guardado = JSON.parse(fs.readFileSync(fichero, 'utf8'));
  return guardado.firmas ? migrar(guardado) : { ...VACIO, ...guardado };
};

// Guarda lo que decidir devuelve como `siguiente`, sin elegir campos: asi lo que se anada
// al estado solo hay que anadirlo en un sitio.
const guardar = (siguiente) => {
  const fichero = rutaEstado();
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, JSON.stringify({ ...siguiente, fecha: new Date().toISOString() }, null, 2));
};

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

module.exports = { leer, guardar, comparar, esDiaDeEmbudo };
