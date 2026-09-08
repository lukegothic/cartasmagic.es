// La foto de ayer, para saber que ha cambiado hoy.
//
// Vive fuera del repositorio, igual que el estado del informe: el clon del servidor se
// actualiza con git pull cada dia y lo que escribamos dentro estorbaria. La ruta se puede
// cambiar con HOTLIST_ESTADO_DIR; por defecto se queda al lado del codigo, que es lo comodo
// al ejecutarlo en la maquina propia.

const fs = require('node:fs');
const path = require('node:path');

const directorio = () => process.env.HOTLIST_ESTADO_DIR || path.join(__dirname, '..', 'datos');

const rutaUltimo = () => path.join(directorio(), 'ultimo.json');

const leer = () => {
  const fichero = rutaUltimo();
  if (!fs.existsSync(fichero)) return {};
  return JSON.parse(fs.readFileSync(fichero, 'utf8'));
};

const guardar = (anuncios) => {
  fs.mkdirSync(directorio(), { recursive: true });
  fs.writeFileSync(rutaUltimo(), JSON.stringify(anuncios, null, 1));
};

const guardarInforme = (texto, dia = new Date()) => {
  fs.mkdirSync(directorio(), { recursive: true });
  const fichero = path.join(directorio(), `cambios-${dia.toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(fichero, texto);
  return fichero;
};

module.exports = { directorio, leer, guardar, guardarInforme };
