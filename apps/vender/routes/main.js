const { validarLead, componerCorreo, validarLeadMazo } = require('../lib/lead');
const { componerCorreoMazo } = require('../lib/correo-manabox');
const { descargarMazo } = require('../lib/manabox-fetch');
const { crearLimitador } = require('../lib/limite');
const { enviarAviso } = require('../lib/mailer');
const { mensajeDeError } = require('../lib/mensajes-error');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');

// El mensaje se deriva del codigo ya fusionado, asi que ninguna llamada puede pintar un
// aviso vacio por olvidarse de pasarlo.
const conMensaje = (datos) => ({ ...datos, mensajeError: datos.errorCode ? mensajeDeError(datos.errorCode) : null });

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index', {
      ...meta.INDEX,
      ld_json: meta.indexLdJson(),
      textos,
      faq: textos.PROCESO_FAQ
    });
  });

  app.get('/como-vender-cartas-magic', (req, res) => {
    res.render('como-vender-cartas-magic', {
      ...meta.COMPARATIVA,
      ld_json: meta.comparativaLdJson(),
      textos,
      faq: null
    });
  });

  const vistaValoracion = (res, extra = {}) =>
    res.render('valoracion-cartas-magic', conMensaje({
      ...meta.VALORACION,
      ld_json: meta.valoracionLdJson(),
      textos,
      faq: null,
      enviado: false,
      errorCode: null,
      etiquetaConversion: 'valoracion',
      valores: {},
      textoRecibido: textos.VALORACION.textoRecibido,
      ...extra
    }));

  app.get('/valoracion-cartas-magic', (req, res) => vistaValoracion(res));

  app.post('/valoracion-cartas-magic', async (req, res) => {
    const { error, lead, valores } = validarLead(req.body);
    if (error) return vistaValoracion(res.status(400), { errorCode: error, valores });

    try {
      await enviarAviso(componerCorreo(lead));
    } catch (err) {
      console.error('Fallo al enviar el aviso de lead:', err);
      return vistaValoracion(res.status(500), { errorCode: 'ENVIO_FALLIDO', valores });
    }

    vistaValoracion(res, { enviado: true });
  });

  const vistaManabox = (res, extra = {}) =>
    res.render('presupuesto-manabox', conMensaje({
      ...meta.MANABOX,
      ld_json: meta.manaboxLdJson(),
      textos,
      faq: null,
      enviado: false,
      errorCode: null,
      etiquetaConversion: 'manabox',
      valores: {},
      textoRecibido: textos.MANABOX.textoRecibido,
      ...extra
    }));

  const permitirPresupuesto = crearLimitador();

  app.get('/presupuesto-manabox', (req, res) => vistaManabox(res));

  app.post('/presupuesto-manabox', async (req, res) => {
    const { error, lead, valores } = validarLeadMazo(req.body);
    if (error) return vistaManabox(res.status(400), { errorCode: error, valores });

    // Se limita por mazo y no por ip: detrás de un proxy, de un operador móvil o de una red
    // compartida, muchos visitantes distintos llegan con la misma ip, y un limite por ip
    // bloquearía a gente que no ha hecho nada. Repetir el mismo mazo si es abuso.
    if (!permitirPresupuesto(`mazo:${lead.idMazo}`)) {
      return vistaManabox(res.status(429), { errorCode: 'DEMASIADOS_INTENTOS', valores });
    }

    let mazo;
    try {
      mazo = await descargarMazo(lead.idMazo);
    } catch (err) {
      // Un fallo aquí es casi siempre un mazo privado o borrado, así que es un 400 y no un 500.
      return vistaManabox(res.status(400), { errorCode: err.code ?? 'MAZO_NO_ACCESIBLE', valores });
    }

    try {
      await enviarAviso(componerCorreoMazo({ lead, mazo, cartas: mazo.cartas }));
    } catch (err) {
      console.error('Fallo al enviar el presupuesto de ManaBox:', err);
      return vistaManabox(res.status(500), { errorCode: 'ENVIO_FALLIDO', valores });
    }

    vistaManabox(res, { enviado: true });
  });

  app.get('/aviso-legal', (req, res) => {
    res.render('aviso-legal', {
      ...meta.AVISO_LEGAL,
      ld_json: meta.avisoLegalLdJson(),
      textos,
      faq: null,
      noindex: true
    });
  });
};
