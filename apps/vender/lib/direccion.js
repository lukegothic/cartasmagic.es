const { PATRON_CODIGO, lineaCodigoPostal } = require('./codigo-postal');

const MAXIMO = 300;

// No se valida el formato: una direccion postal española admite demasiadas formas y
// rechazar la buena es peor que aceptar la dudosa. Solo se avisa de la que no trae numero
// de portal, para poder pedirla otra vez antes de generar la etiqueta. El codigo postal
// tiene su propio campo, asi que su numero no cuenta como portal si tambien va escrito aqui.
const CON_NUMERO = /\d|\bs\/n\b/i;
const CODIGOS_ESCRITOS = new RegExp(String.raw`\b${PATRON_CODIGO}\b`, 'g');

// La etiqueta se genera copiando la direccion de las notas, asi que se le añade la linea del
// codigo postal salvo que el cliente ya la haya escrito por costumbre.
const leerDireccion = ({ direccion }, codigoPostal) => {
  const calle = String(direccion ?? '').trim().slice(0, MAXIMO);
  if (!calle) return null;

  const codigosEscritos = calle.match(CODIGOS_ESCRITOS) ?? [];
  const llevaElCodigo = codigosEscritos.includes(codigoPostal.codigo);

  return {
    texto: llevaElCodigo ? calle : `${calle}\n${lineaCodigoPostal(codigoPostal)}`,
    pareceIncompleta: !CON_NUMERO.test(calle.replace(codigoPostal.codigo, '')),
    tieneOtroCodigoPostal: codigosEscritos.some((codigo) => codigo !== codigoPostal.codigo)
  };
};

module.exports = { leerDireccion };
