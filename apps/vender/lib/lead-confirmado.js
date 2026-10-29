const { provinciaDeCodigo } = require('./codigo-postal');

// El evento que cuenta los leads por semana. Lo manda el servidor, asi que cuenta tambien a
// quien rechaza las cookies: por eso no lleva nada de la persona, solo lo que sirve para
// leer el embudo por formulario, tamano y zona.

// Los mismos cortes que las opciones de volumen de lib/lead.js, para que un mazo de ManaBox
// caiga en el mismo rango que si hubiese elegido su volumen en el desplegable.
const rangoDeCartas = (total) => {
  if (total < 500) return 'menos-500';
  if (total <= 1000) return '500-1000';
  return 'mas-1000';
};

const componerLeadConfirmado = ({ formulario, rangoCartas, codigoPostal, clientId }) => ({
  client_id: clientId,
  events: [{
    name: 'lead_confirmado',
    params: { formulario, rango_cartas: rangoCartas, provincia: provinciaDeCodigo(codigoPostal.codigo) }
  }]
});

module.exports = { componerLeadConfirmado, rangoDeCartas };
