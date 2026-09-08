// Que ha cambiado entre la foto de ayer y la de hoy, y como se cuenta.
//
// Aqui no se pide nada por la red ni se toca disco: entra lo leido y sale lo que ha cambiado,
// que es lo que hace que esto se pueda probar sin depender de que las tiendas esten en pie.

const { clave } = require('../fuentes/comun');

// Por debajo de esto un cambio de precio es ruido de redondeo o del tipo de cambio, y llenaria
// el informe de lineas que no dicen nada.
const CAMBIO_MINIMO = 0.1;

const porClave = (anuncios) => Object.fromEntries(anuncios.map((a) => [clave(a), a]));

const comparar = (hoy, ayer) => {
  const nuevas = Object.entries(hoy)
    .filter(([k]) => !ayer[k])
    .map(([, a]) => a)
    .sort((a, b) => b.precio - a.precio);

  const retiradas = Object.entries(ayer)
    .filter(([k]) => !hoy[k])
    .map(([, a]) => a);

  const movidas = Object.entries(hoy)
    .filter(([k]) => ayer[k])
    .map(([k, anuncio]) => ({ anuncio, antes: ayer[k].precio, diferencia: anuncio.precio - ayer[k].precio }))
    .filter(({ diferencia }) => Math.abs(diferencia) >= CAMBIO_MINIMO)
    .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));

  return { nuevas, retiradas, movidas };
};

module.exports = { CAMBIO_MINIMO, porClave, comparar };
