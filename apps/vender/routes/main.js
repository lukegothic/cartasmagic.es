module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index', {
      title: 'Compramos Cartas Magic: Vende tus Cartas Hoy | VenderCartasMagic.es',
      description: 'Vende tus cartas Magic al mejor precio. Valoración gratuita, pago rápido y seguro. Envíos desde toda España. Dónde vender cartas Magic en España.',
      keywords: 'comprar cartas magic, vender cartas magic, comprar mtg, vender mtg, cartas magic españa, donde vender cartas magic',
      canonical: 'https://vendercartasmagic.es',
      og_title: 'Vender Cartas Magic en España: Vende tus Cartas Hoy | VenderCartasMagic.es',
      og_description: 'Vende tus cartas Magic al mejor precio. Valoración gratuita, pago rápido y seguro. Envíos desde toda España.',
      og_url: 'https://vendercartasmagic.es',
      ld_json: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "VenderCartasMagic",
        "url": "https://vendercartasmagic.es",
        "description": "Compramos cartas Magic al mejor precio. Valoración gratuita, pago rápido y seguro.",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "contacto@vendercartasmagic.es",
          "contactType": "customer service"
        }
      })
    });
  });

  app.get('/como-vender-cartas-magic', (req, res) => {
    res.render('como-vender-cartas-magic', {
      title: 'Cómo Vender Cartas Magic | Guía Paso a Paso | VenderCartasMagic.es',
      description: 'Aprende cómo vender tus cartas Magic al mejor precio. Guía completa para vender cartas Magic en España.',
      keywords: 'como vender cartas magic, vender cartas magic, guia vender cartas magic',
      canonical: 'https://vendercartasmagic.es/como-vender-cartas-magic',
      og_title: 'Cómo Vender Cartas Magic | Guía Paso a Paso | VenderCartasMagic.es',
      og_description: 'Aprende cómo vender tus cartas Magic al mejor precio. Guía completa para vender cartas Magic en España.',
      og_url: 'https://vendercartasmagic.es/como-vender-cartas-magic',
      ld_json: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Cómo Vender Cartas Magic",
        "url": "https://vendercartasmagic.es/como-vender-cartas-magic",
        "description": "Guía paso a paso para vender cartas Magic."
      })
    });
  });

  app.get('/valoracion-cartas-magic', (req, res) => {
    res.render('valoracion-cartas-magic', {
      title: 'Vender Cartas Magic - Contacta con Nosotros | VenderCartasMagic.es',
      description: 'Contacta con nosotros por WhatsApp o Email para vender tus cartas Magic. Respuesta en menos de 24 horas. Pago rápido y seguro.',
      keywords: 'vender cartas magic, contacto cartas magic, whatsapp cartas magic, comprar mtg',
      canonical: 'https://vendercartasmagic.es/valoracion-cartas-magic',
      og_title: 'Vender Cartas Magic - Contacta con Nosotros | VenderCartasMagic.es',
      og_description: 'Contacta con nosotros por WhatsApp o Email para vender tus cartas Magic. Respuesta en menos de 24 horas.',
      og_url: 'https://vendercartasmagic.es/valoracion-cartas-magic',
      ld_json: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contacto - Vender Cartas Magic",
        "url": "https://vendercartasmagic.es/valoracion-cartas-magic",
        "description": "Contacta con nosotros para vender tus cartas Magic.",
        "mainEntity": {
          "@type": "Organization",
          "name": "VenderCartasMagic",
          "telephone": "+34644154365",
          "email": "contacto@vendercartasmagic.es"
        }
      })
    });
  });
};