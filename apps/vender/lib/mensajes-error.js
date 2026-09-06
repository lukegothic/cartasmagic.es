const { ERRORES, ERROR_GENERICO } = require('./textos');

// Las vistas solo piden el mensaje por su codigo, asi que anadir una validacion nueva no
// obliga a tocar cada formulario. El texto de cada uno vive en textos.js, con el resto de
// la copy.
const mensajeDeError = (codigo) => ERRORES[codigo] ?? ERROR_GENERICO;

module.exports = { mensajeDeError };
