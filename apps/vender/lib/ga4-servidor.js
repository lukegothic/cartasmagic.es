// Eventos de GA4 que manda el servidor por el Measurement Protocol. No pasan por el
// navegador, asi que no dependen del aviso de cookies ni ponen ninguna cookie.
//
// GA4 contesta 2xx aunque el evento venga mal formado: para comprobar un cuerpo nuevo hay
// que mandarlo antes a https://www.google-analytics.com/debug/mp/collect, que si lo valida.
const ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const TIEMPO_MAXIMO_MS = 5000;

// Nunca lanza: quien llama ya ha aceptado el lead y no tiene nada que hacer con el fallo.
const enviarEventoGa4 = async (cuerpo, { entorno = process.env, pedir = fetch } = {}) => {
  const { GA4_MEASUREMENT_ID, GA4_API_SECRET } = entorno;
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return;

  const url = new URL(ENDPOINT);
  url.searchParams.set('measurement_id', GA4_MEASUREMENT_ID);
  url.searchParams.set('api_secret', GA4_API_SECRET);

  try {
    const respuesta = await pedir(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS)
    });
    if (!respuesta.ok) console.error(`GA4 rechazo el evento ${cuerpo.events[0]?.name}: HTTP ${respuesta.status}`);
  } catch (err) {
    // Solo el mensaje: el error de fetch puede llevar la url, y la url lleva el secreto.
    console.error(`No se pudo mandar el evento ${cuerpo.events[0]?.name} a GA4: ${err.message}`);
  }
};

module.exports = { enviarEventoGa4 };
