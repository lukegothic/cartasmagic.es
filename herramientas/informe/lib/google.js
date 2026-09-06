const { GoogleAuth } = require('google-auth-library');

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
];

// Un unico cliente para las dos APIs: las dos son REST y firman igual, asi que no hace
// falta el wrapper oficial de ninguna de ellas.
const cliente = () => {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) {
    throw new Error(
      'Falta GOOGLE_APPLICATION_CREDENTIALS con la ruta al JSON de la cuenta de servicio.\n' +
        'Los pasos para crearla estan en herramientas/informe/README.md'
    );
  }
  return new GoogleAuth({ keyFile, scopes: SCOPES }).getClient();
};

const pedir = async (auth, url, body) => {
  const res = await auth.request({ url, method: 'POST', data: body });
  return res.data;
};

// GSC indexa las propiedades de dominio como sc-domain:, no como https://. Las dos
// formas conviven en la consola y solo una responde, asi que se prueba la de dominio.
const consultaGSC = async (auth, dominio, { desde, hasta, dimensiones, limite = 200 }) => {
  const sitio = encodeURIComponent(`sc-domain:${dominio}`);
  const datos = await pedir(
    auth,
    `https://www.googleapis.com/webmasters/v3/sites/${sitio}/searchAnalytics/query`,
    { startDate: desde, endDate: hasta, dimensions: dimensiones, rowLimit: limite }
  );

  return (datos.rows || []).map(({ keys, clicks, impressions, ctr, position }) => ({
    claves: keys,
    clics: clicks,
    impresiones: impressions,
    ctr,
    posicion: position
  }));
};

// Los dos dominios mandan a la misma propiedad, asi que sin filtro por hostName cada
// uno saldria con las cifras de los dos sumadas.
const filtroDominio = (dominio) => ({
  filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: dominio } }
});

const consultaGA4 = async (
  auth,
  propiedad,
  { desde, hasta, dimensiones = [], metricas, limite = 200, dominio }
) => {
  const datos = await pedir(
    auth,
    `https://analyticsdata.googleapis.com/v1beta/properties/${propiedad}:runReport`,
    {
      dateRanges: [{ startDate: desde, endDate: hasta }],
      dimensions: dimensiones.map((name) => ({ name })),
      metrics: metricas.map((name) => ({ name })),
      ...(dominio ? { dimensionFilter: filtroDominio(dominio) } : {}),
      limit: limite
    }
  );

  return (datos.rows || []).map((fila) => ({
    claves: (fila.dimensionValues || []).map(({ value }) => value),
    valores: (fila.metricValues || []).map(({ value }) => Number(value))
  }));
};

module.exports = { cliente, consultaGSC, consultaGA4 };
