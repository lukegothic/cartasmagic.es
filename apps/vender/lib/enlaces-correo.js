// Pone los parametros de medicion a los enlaces que viajan dentro de los correos al
// cliente. Todos pasan por aqui, igual que los del hub pasan por apps/hub/lib/enlaces.js:
// un enlace que no pase no se mide, y una visita desde la bandeja de entrada llega como
// trafico directo, indistinguible del que teclea el dominio.
//
// La campaña dice de que correo sale el enlace y cual de ellos es: 'correo-manabox-estados'.

const CAMPANA_VALIDA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const enlaceCorreo = (destino, campana) => {
  if (!campana || !CAMPANA_VALIDA.test(campana)) {
    throw new Error(
      `La campaña "${campana}" no vale: solo minusculas, numeros y guiones (ej. "correo-postal-firma")`
    );
  }

  const url = new URL(destino);
  url.searchParams.set('utm_source', 'correo');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', campana);

  return url.toString();
};

module.exports = { enlaceCorreo };
