const MAXIMO = 300;

// No se valida el formato: una direccion postal española admite demasiadas formas y
// rechazar la buena es peor que aceptar la dudosa. Solo se avisa de la que se queda corta,
// para poder pedirla otra vez antes de generar la etiqueta.
// Los dos primeros digitos del codigo postal son la provincia, del 01 al 52. Sin ese tope
// el numero de un portal largo pasaba por codigo postal y arrastraba lo que venia detras.
const CODIGO_POSTAL = /\b(?:0[1-9]|[1-4]\d|5[0-2])\d{3}\b/;
const LARGO_MINIMO = 15;

// Lo que sigue al codigo postal hasta la coma, el parentesis de la provincia o el fin de la
// linea. El pais se quita aparte, que mucha gente lo escribe sin coma delante.
const LOCALIDAD = new RegExp(CODIGO_POSTAL.source + String.raw`\s+([^\n(,]+)`, 'g');
const PAIS = /\s*españa$/i;

// Se coge la ultima coincidencia: en una direccion española el codigo postal va justo antes
// de la localidad y al final del todo, asi que un numero de portal que se le parezca queda
// siempre por delante.
const leerLocalidad = (texto) => {
  const encontradas = [...texto.matchAll(LOCALIDAD)];
  const localidad = encontradas.at(-1)?.[1];
  return localidad?.trim().replace(PAIS, '').trim() || null;
};

const leerDireccion = ({ direccion }) => {
  const texto = String(direccion ?? '').trim().slice(0, MAXIMO);
  if (!texto) return null;

  return {
    texto,
    localidad: leerLocalidad(texto),
    pareceIncompleta: texto.length < LARGO_MINIMO || !CODIGO_POSTAL.test(texto)
  };
};

module.exports = { leerDireccion };
