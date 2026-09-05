// Construye los enlaces salientes hacia vendercartasmagic.es con los parametros de
// medicion puestos. Todos los enlaces del hub hacia vender pasan por aqui: es la unica
// forma de saber que pieza de contenido trae los leads, y de que no se escape ninguno
// sin medir por olvido.
//
// La campaña identifica la pieza concreta, no el sitio: 'home-cta', 'articulo-valor'.

const DOMINIO = 'https://vendercartasmagic.es';

const VENDER = '/';
const VALORACION = '/valoracion-cartas-magic';

const CAMPANA_VALIDA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const enlaceVender = (ruta, campana) => {
  if (!campana || !CAMPANA_VALIDA.test(campana)) {
    throw new Error(
      `La campaña "${campana}" no vale: solo minusculas, numeros y guiones (ej. "home-cta")`
    );
  }

  const url = new URL(ruta, DOMINIO);
  url.searchParams.set('utm_source', 'cartasmagic');
  url.searchParams.set('utm_medium', 'hub');
  url.searchParams.set('utm_campaign', campana);

  return url.toString();
};

module.exports = { enlaceVender, VENDER, VALORACION };
