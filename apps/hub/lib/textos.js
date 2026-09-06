// Copy de interfaz del hub. Las vistas no llevan texto suelto: lo piden aqui, asi que
// cambiar una frase no obliga a abrir la plantilla ni a recordar en que .ejs vivia.
// Los metadatos de cada pagina viven en metadatos.js, que es otra cosa.

const MARCA = {
  nombre: 'CartasMagic',
  tld: '.es',
  lema: 'Cuánto valen tus cartas Magic'
};

const NAV = {
  etiqueta: 'Navegación principal',
  guias: 'Guías',
  vender: 'Vender'
};

const PIE = {
  // El año se deja fijo a proposito: lo pinta el copyright, no una fecha de sistema.
  copyright: '2026 CartasMagic.es',
  titular: 'Iván Pérez, NIF 72808254Y, Pamplona',
  correo: 'contacto@vendercartasmagic.es'
};

const MANA = {
  etiqueta: 'Los cinco colores de maná de Magic',
  colores: [
    { clase: 'ms-w', titulo: 'Maná blanco' },
    { clase: 'ms-u', titulo: 'Maná azul' },
    { clase: 'ms-b', titulo: 'Maná negro' },
    { clase: 'ms-r', titulo: 'Maná rojo' },
    { clase: 'ms-g', titulo: 'Maná verde' }
  ]
};

const PORTADA = {
  intro: {
    titulo: 'Cuánto valen tus cartas Magic',
    cuerpo:
      'Casi nadie sabe qué tiene guardado en el armario. Una colección de los años noventa puede valer cuatro mil euros o cuarenta, y la diferencia casi nunca está donde la gente cree: no la marcan las cartas más vistosas sino la edición, el estado y si se juegan hoy. Aquí explicamos cómo se calcula ese precio, con las mismas referencias que usamos cuando compramos una colección.'
  },
  guias: {
    titulo: 'Guías sobre el valor de las cartas',
    intro: 'Lo que determina el precio de una carta, explicado sin tecnicismos'
  },
  prueba: {
    titulo: 'Quién está detrás de esto',
    cuerpo:
      'Iván Pérez, vendedor en Cardmarket desde 2011 con más de 3.200 valoraciones positivas y certificado como Professional Seller. Compramos colecciones de Magic en toda España.'
  }
};

const BLOG = {
  titulo: 'Guías',
  lema: 'Cómo se calcula el valor de una carta Magic',
  vacio: {
    antes: 'Aún no hay guías publicadas. Mientras tanto, puedes ver',
    enlace: 'cómo funciona vender una colección'
  }
};

const NO_ENCONTRADA = {
  titulo: '404',
  lema: 'Esta página no existe',
  cuerpo: {
    antes: 'Puede que el enlace esté mal escrito o que la página ya no esté. Desde la',
    enlacePortada: 'portada',
    entre: 'se llega a todo, y las',
    enlaceGuias: 'guías',
    despues: 'están todas juntas.'
  }
};

// El cierre se pinta al pie de la portada, del indice del blog, de cada articulo y del 404,
// asi que su texto vive en un solo sitio aunque el enlace cambie por pagina.
const CIERRE = {
  etiqueta: 'Vender una colección',
  llamada: 'Saber cuánto vale mi colección',
  nota: 'Se tarda un minuto y es gratis',
  // La portada explica ademas el proceso y enlaza a como funciona; el resto se queda corto.
  resumen:
    'Compramos colecciones enteras en toda España: envío pagado, precio definitivo en un día laborable y pago por transferencia. Sin listar las cartas ni fotografiarlas.',
  portada: {
    antes: 'Compramos la colección entera: te mandamos la etiqueta de envío prepagada y cobras por transferencia. O mira antes',
    enlace: 'cómo funciona vender una colección de cartas Magic',
    despues: ': el proceso, los plazos y qué compramos.'
  }
};

module.exports = { MARCA, NAV, PIE, MANA, PORTADA, BLOG, NO_ENCONTRADA, CIERRE };
