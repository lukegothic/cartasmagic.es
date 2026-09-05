const { validarLead, componerCorreo, validarLeadMazo } = require('../lib/lead');
const { componerCorreoMazo } = require('../lib/correo-manabox');
const { descargarMazo } = require('../lib/manabox-fetch');
const { crearLimitador } = require('../lib/limite');
const { enviarAviso } = require('../lib/mailer');
const { mensajeDeError } = require('../lib/mensajes-error');

const PROCESO_FAQ = [
  {
    q: '¿Cómo vendo mi colección de cartas Magic?',
    a: 'Rellenas el formulario en un minuto: nombre, correo y cuántas cartas son. Te mandamos una etiqueta de Correos que pagamos nosotros, envías el paquete y un día laborable después de que llegue recibes un precio por correo. Si lo aceptas, cobras por transferencia en 24 horas. No hay listados que preparar ni negociación.'
  },
  {
    q: '¿Tengo que hacer un listado de mis cartas?',
    a: 'No. No hace falta ordenar, clasificar ni contar nada. Metes los mazos y los álbumes en una caja y los envías. De eso se trata: el trabajo lo hacemos nosotros.'
  },
  {
    q: '¿Cuánto tardáis en valorar la colección?',
    a: 'Un día laborable desde que el paquete llega. Recibes un precio cerrado por correo, sin condiciones ni letra pequeña.'
  },
  {
    q: '¿Quién paga el envío?',
    a: 'El envío de ida lo pagamos nosotros: te mandamos una etiqueta de Correos prepagada. No hace falta ni imprimirla, la enseñas en el móvil en cualquier oficina.'
  },
  {
    q: '¿Y si no me gusta el precio?',
    a: 'Se te devuelve la colección entera. La devolución cuesta 11,90 €, que es lo que suman el envío de ida y el de vuelta, y los paga quien rechaza la oferta. Si la colección no es lo que esperábamos por nuestra parte o decidimos no valorarla, la devolución la pagamos nosotros.'
  },
  {
    q: '¿Qué colecciones compráis?',
    a: 'Mazos montados, álbumes y colecciones completas de Magic: The Gathering. No compramos cajas de bulk sin clasificar, cartas de otros juegos ni falsificaciones.'
  },
  {
    q: '¿Cuánto valen mis cartas Magic?',
    a: 'Depende del estado, de la antigüedad de los sets y de si hay cartas de formatos que se juegan hoy. Valoramos con los precios de Cardmarket del día que llega el paquete.'
  },
  {
    q: '¿Cuándo cobro?',
    a: 'Por transferencia bancaria, dentro de las 24 horas siguientes a que aceptes el precio.'
  }
];

const faqSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a }
  }))
});

const NEGOCIO = {
  '@type': 'Organization',
  '@id': 'https://vendercartasmagic.es/#negocio',
  name: 'VenderCartasMagic',
  url: 'https://vendercartasmagic.es',
  email: 'contacto@vendercartasmagic.es',
  telephone: '+34644154365',
  founder: { '@type': 'Person', name: 'Iván Pérez' },
  foundingDate: '2011',
  areaServed: { '@type': 'Country', name: 'España' },
  description: 'Compramos colecciones de cartas Magic: The Gathering en toda España. Envío pagado, valoración en 24 horas y pago por transferencia.'
};

// El mensaje se deriva del codigo ya fusionado, asi que ninguna llamada puede pintar un
// aviso vacio por olvidarse de pasarlo.
const conMensaje = (datos) => ({ ...datos, mensajeError: datos.errorCode ? mensajeDeError(datos.errorCode) : null });

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index', {
      title: 'Vender cartas Magic: mándalas y cobra sin listar nada | VenderCartasMagic.es',
      description: 'Compramos tu colección de cartas Magic. Pides la etiqueta en un minuto, la mandas gratis y cobras por transferencia. Sin listados, sin fotos y sin negociación.',
      keywords: 'vender cartas magic, vender coleccion cartas magic, donde vender cartas magic, vender cartas magic españa, comprar colecciones magic',
      canonical: 'https://vendercartasmagic.es',
      og_title: 'Vender cartas Magic: mándalas y cobra sin listar nada',
      og_description: 'Compramos tu colección de cartas Magic. Envío pagado, valoración en 24 horas y pago por transferencia.',
      og_url: 'https://vendercartasmagic.es',
      faq: PROCESO_FAQ,
      ld_json: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          NEGOCIO,
          {
            '@type': 'Service',
            name: 'Compra de colecciones de cartas Magic',
            provider: { '@id': 'https://vendercartasmagic.es/#negocio' },
            areaServed: { '@type': 'Country', name: 'España' },
            serviceType: 'Compra de colecciones de cartas coleccionables'
          },
          faqSchema(PROCESO_FAQ)
        ]
      })
    });
  });

  app.get('/como-vender-cartas-magic', (req, res) => {
    res.render('como-vender-cartas-magic', {
      title: 'Cómo vender cartas Magic en España: las 4 opciones reales | VenderCartasMagic.es',
      description: 'Tiendas, Cardmarket, Wallapop o venderla entera de una vez. Qué cuesta cada opción en tiempo y en dinero, y cuál conviene según lo que tengas.',
      keywords: 'como vender cartas magic, donde vender cartas magic, vender cartas magic online, vender coleccion magic',
      canonical: 'https://vendercartasmagic.es/como-vender-cartas-magic',
      og_title: 'Cómo vender cartas Magic en España: las 4 opciones reales',
      og_description: 'Tiendas, Cardmarket, Wallapop o venderla entera. Qué cuesta cada una en tiempo y en dinero.',
      og_url: 'https://vendercartasmagic.es/como-vender-cartas-magic',
      faq: null,
      ld_json: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          NEGOCIO,
          {
            '@type': 'HowTo',
            name: 'Cómo vender una colección de cartas Magic',
            description: 'Proceso para vender una colección de cartas Magic sin prepararla ni listarla.',
            totalTime: 'P3D',
            step: [
              { '@type': 'HowToStep', position: 1, name: 'Cuenta qué tienes', text: 'Rellenas el formulario: nombre, correo y cuántas cartas son. Si dejas también la dirección, la etiqueta llega en el primer correo.' },
              { '@type': 'HowToStep', position: 2, name: 'Recibe la etiqueta', text: 'Te mandamos una etiqueta de Correos prepagada. El envío lo pagamos nosotros.' },
              { '@type': 'HowToStep', position: 3, name: 'Envía la caja', text: 'Metes las cartas en una caja, pegas la etiqueta y la dejas en una oficina de Correos.' },
              { '@type': 'HowToStep', position: 4, name: 'Recibe el precio', text: 'En un día laborable desde que llega el paquete recibes un precio cerrado por correo.' },
              { '@type': 'HowToStep', position: 5, name: 'Cobra', text: 'Si aceptas, cobras por transferencia en 24 horas.' }
            ]
          }
        ]
      })
    });
  });

  const vistaValoracion = (res, extra = {}) =>
    res.render('valoracion-cartas-magic', conMensaje({
      title: 'Cuánto vale mi colección de cartas Magic | Valoración en 24 horas',
      description: 'Te decimos cuánto vale tu colección de cartas Magic un día laborable después de que llegue. Envío pagado, precio cerrado y pago por transferencia.',
      keywords: 'cuanto valen mis cartas magic, valorar coleccion cartas magic, valoracion cartas magic, tasacion cartas magic',
      canonical: 'https://vendercartasmagic.es/valoracion-cartas-magic',
      og_title: 'Cuánto vale mi colección de cartas Magic',
      og_description: 'Valoración en 24 horas desde que llega el paquete. Envío pagado y pago por transferencia.',
      og_url: 'https://vendercartasmagic.es/valoracion-cartas-magic',
      faq: null,
      ld_json: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          NEGOCIO,
          {
            '@type': 'ContactPage',
            name: 'Valorar una colección de cartas Magic',
            url: 'https://vendercartasmagic.es/valoracion-cartas-magic',
            mainEntity: { '@id': 'https://vendercartasmagic.es/#negocio' }
          }
        ]
      }),
      enviado: false,
      errorCode: null,
      etiquetaConversion: 'valoracion',
      textoRecibido: 'Te escribimos a tu correo con la etiqueta de envío y la dirección. Si no lo ves en unas horas, mira la carpeta de spam.',
      ...extra
    }));

  app.get('/valoracion-cartas-magic', (req, res) => vistaValoracion(res));

  app.post('/valoracion-cartas-magic', async (req, res) => {
    const { error, lead } = validarLead(req.body);
    if (error) return vistaValoracion(res.status(400), { errorCode: error });

    try {
      await enviarAviso(componerCorreo(lead));
    } catch (err) {
      console.error('Fallo al enviar el aviso de lead:', err);
      return vistaValoracion(res.status(500), { errorCode: 'ENVIO_FALLIDO' });
    }

    vistaValoracion(res, { enviado: true });
  });

  const vistaManabox = (res, extra = {}) =>
    res.render('presupuesto-manabox', conMensaje({
      title: 'Presupuesto con tu lista de ManaBox | VenderCartasMagic.es',
      description: 'Pega el enlace de tu mazo de ManaBox y recibe un presupuesto por correo en unos minutos. Sin fotos ni listados a mano.',
      keywords: 'vender coleccion manabox, presupuesto cartas magic manabox, vender mazo magic online',
      canonical: 'https://vendercartasmagic.es/presupuesto-manabox',
      og_title: 'Presupuesto con tu lista de ManaBox',
      og_description: 'Pega el enlace de tu mazo de ManaBox y recibe un presupuesto por correo en unos minutos.',
      og_url: 'https://vendercartasmagic.es/presupuesto-manabox',
      faq: null,
      ld_json: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          NEGOCIO,
          {
            '@type': 'ContactPage',
            name: 'Presupuesto a partir de una lista de ManaBox',
            url: 'https://vendercartasmagic.es/presupuesto-manabox',
            mainEntity: { '@id': 'https://vendercartasmagic.es/#negocio' }
          }
        ]
      }),
      enviado: false,
      errorCode: null,
      etiquetaConversion: 'manabox',
      textoRecibido: 'Ya tenemos tu lista. Te llegará el presupuesto al correo en unos minutos. Si no lo ves, mira la carpeta de spam.',
      url: '',
      ...extra
    }));

  const permitirPresupuesto = crearLimitador();

  app.get('/presupuesto-manabox', (req, res) => vistaManabox(res));

  app.post('/presupuesto-manabox', async (req, res) => {
    const { error, lead } = validarLeadMazo(req.body);
    if (error) return vistaManabox(res.status(400), { errorCode: error, url: req.body.url });

    // Se limita por mazo y no por ip: detrás de un proxy, de un operador móvil o de una red
    // compartida, muchos visitantes distintos llegan con la misma ip, y un limite por ip
    // bloquearía a gente que no ha hecho nada. Repetir el mismo mazo si es abuso.
    if (!permitirPresupuesto(`mazo:${lead.idMazo}`)) {
      return vistaManabox(res.status(429), { errorCode: 'DEMASIADOS_INTENTOS', url: lead.url });
    }

    let mazo;
    try {
      mazo = await descargarMazo(lead.idMazo);
    } catch (err) {
      // Un fallo aquí es casi siempre un mazo privado o borrado, así que es un 400 y no un 500.
      return vistaManabox(res.status(400), { errorCode: err.code ?? 'MAZO_NO_ACCESIBLE', url: lead.url });
    }

    try {
      await enviarAviso(componerCorreoMazo({ lead, mazo, cartas: mazo.cartas }));
    } catch (err) {
      console.error('Fallo al enviar el presupuesto de ManaBox:', err);
      return vistaManabox(res.status(500), { errorCode: 'ENVIO_FALLIDO', url: lead.url });
    }

    vistaManabox(res, { enviado: true });
  });

  app.get('/aviso-legal', (req, res) => {
    res.render('aviso-legal', {
      title: 'Aviso legal y condiciones del servicio | VenderCartasMagic.es',
      description: 'Datos identificativos, condiciones de compra de colecciones, plazos, devoluciones y política de privacidad.',
      keywords: 'aviso legal vendercartasmagic, condiciones venta cartas magic',
      canonical: 'https://vendercartasmagic.es/aviso-legal',
      og_title: 'Aviso legal y condiciones del servicio',
      og_description: 'Datos identificativos, condiciones de compra, plazos y devoluciones.',
      og_url: 'https://vendercartasmagic.es/aviso-legal',
      faq: null,
      noindex: true,
      ld_json: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Aviso legal' })
    });
  });
};
