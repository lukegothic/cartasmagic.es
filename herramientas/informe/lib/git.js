const { execFileSync } = require('node:child_process');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

// Fecha (AAAA-MM-DD) del ultimo commit que toco el fichero, o null si git no lo conoce o
// no esta disponible. Solo se usa el primer dia: despues el estado guarda la fecha de
// cambio de cada Target y ya no hace falta preguntar.
const ultimoCambioGit = (fichero) => {
  try {
    const fecha = execFileSync('git', ['log', '-1', '--format=%cs', '--', fichero], {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return fecha || null;
  } catch {
    // En el contenedor puede no haber git ni historial; sin fecha, el Target no se da
    // por cambiado.
    return null;
  }
};

module.exports = { ultimoCambioGit };
