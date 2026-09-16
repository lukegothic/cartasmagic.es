const { extraerIdMazo } = require('../lib/manabox');
const { descargarMazo: descargarMazoReal } = require('../lib/manabox-fetch');
const { calcularPresupuesto } = require('../lib/presupuesto');
const { componerDesgloseCsv } = require('../lib/desglose');
const { comprobarAcceso } = require('../lib/acceso-privado');
const { mensajeDeError } = require('../lib/mensajes-error');
const { euros } = require('../lib/correo-plantilla');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');

// Cuantas cartas se listan en la tabla de las mas caras. Es una pagina para mirar de un
// vistazo mientras se negocia, no el desglose entero: ese esta en el csv.
const MAS_CARAS = 25;

const VENTANA = 'Basic realm="Valoración interna", charset="UTF-8"';

const pedirClave = (res) => res.status(401).set('WWW-Authenticate', VENTANA).send('');

// El id ya se valida contra el dominio de manabox, asi que un enlace de fuera se para aqui
// y no llega a salir ninguna peticion.
const leerMazo = async (url, descargarMazo) => {
  const idMazo = extraerIdMazo(url);
  if (!idMazo) throw Object.assign(new Error('ENLACE_NO_VALIDO'), { code: 'ENLACE_NO_VALIDO' });
  return descargarMazo(idMazo);
};

const montarValoracionPrivada = (app, { descargarMazo = descargarMazoReal, entorno = process.env } = {}) => {
  // La clave se lee en cada peticion y no al arrancar, para que el doble de los tests pueda
  // pasar la suya sin tocar el entorno del proceso.
  const autorizado = (req) => comprobarAcceso(req.headers.authorization, entorno.VALORACION_PRIVADA_PASSWORD);

  const vista = (res, extra = {}) =>
    res.render('valoracion-privada', {
      ...meta.PRIVADA,
      ld_json: '{}',
      textos,
      faq: null,
      noindex: true,
      url: '',
      errorCode: null,
      mensajeError: null,
      presupuesto: null,
      mazo: null,
      masCaras: [],
      porcentaje: 0,
      euros,
      ...extra
    });

  app.get('/interno/valoracion', async (req, res) => {
    if (!autorizado(req)) return pedirClave(res);

    const url = String(req.query.url ?? '').trim();
    if (!url) return vista(res);

    let mazo;
    try {
      mazo = await leerMazo(url, descargarMazo);
    } catch (err) {
      return vista(res.status(400), { url, errorCode: err.code ?? 'MAZO_NO_ACCESIBLE', mensajeError: mensajeDeError(err.code) });
    }

    const presupuesto = calcularPresupuesto(mazo.cartas, entorno);

    vista(res, {
      url,
      mazo,
      presupuesto,
      masCaras: presupuesto.masCaras.slice(0, MAS_CARAS),
      // Sin mercado no hay porcentaje que sacar, y dividir entre cero pintaria NaN en la pagina.
      porcentaje: presupuesto.valorMercado ? Math.round((presupuesto.oferta / presupuesto.valorMercado) * 100) : 0
    });
  });

  app.get('/interno/valoracion.csv', async (req, res) => {
    if (!autorizado(req)) return pedirClave(res);

    let mazo;
    try {
      mazo = await leerMazo(String(req.query.url ?? '').trim(), descargarMazo);
    } catch (err) {
      return res.status(400).send(mensajeDeError(err.code));
    }

    res
      .status(200)
      .set('Content-Type', 'text/csv; charset=utf-8')
      .set('Content-Disposition', 'attachment; filename="desglose-valoracion.csv"')
      .send(componerDesgloseCsv(mazo.cartas, entorno));
  });
};

module.exports = { montarValoracionPrivada };
