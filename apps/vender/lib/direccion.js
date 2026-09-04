const MAXIMO = 300;

// No se valida el formato: una direccion postal española admite demasiadas formas y
// rechazar la buena es peor que aceptar la dudosa. Solo se avisa de la que se queda corta,
// para poder pedirla otra vez antes de generar la etiqueta.
const CODIGO_POSTAL = /\b\d{5}\b/;
const LARGO_MINIMO = 15;

const leerDireccion = ({ decidido, direccion }) => {
  if (!decidido) return null;

  const texto = String(direccion ?? '').trim().slice(0, MAXIMO);
  if (!texto) return null;

  return {
    texto,
    pareceIncompleta: texto.length < LARGO_MINIMO || !CODIGO_POSTAL.test(texto)
  };
};

module.exports = { leerDireccion };
