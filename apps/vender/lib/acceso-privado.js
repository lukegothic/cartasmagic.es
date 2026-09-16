const { timingSafeEqual } = require('node:crypto');

const PREFIJO = 'Basic ';

// Comparar con === deja escapar por el tiempo de respuesta cuantos caracteres iniciales
// acierta quien prueba claves. Las longitudes distintas si se distinguen antes, porque
// timingSafeEqual exige buffers iguales y la longitud no es lo que se protege aqui.
const igualesSinFiltrarTiempo = (a, b) => {
  const uno = Buffer.from(a);
  const otro = Buffer.from(b);
  return uno.length === otro.length && timingSafeEqual(uno, otro);
};

// El usuario no se mira: la clave es lo unico que hay que saber, y pedir tambien un nombre
// seria una segunda cosa que memorizar sin ganar nada.
const claveDeLaCabecera = (cabecera) => {
  const texto = String(cabecera ?? '');
  if (!texto.startsWith(PREFIJO)) return null;

  const descifrada = Buffer.from(texto.slice(PREFIJO.length), 'base64').toString('utf8');
  const separador = descifrada.indexOf(':');
  return separador === -1 ? null : descifrada.slice(separador + 1);
};

// Sin clave en el entorno no se abre: un despliegue al que se le olvido la variable dejaria
// la pagina publica, que es justo lo contrario de lo que se pide.
const comprobarAcceso = (cabecera, claveEsperada) => {
  if (!claveEsperada) return false;

  const clave = claveDeLaCabecera(cabecera);
  return clave !== null && igualesSinFiltrarTiempo(clave, claveEsperada);
};

module.exports = { comprobarAcceso };
