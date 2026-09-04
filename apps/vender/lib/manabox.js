const URL_MAZO = /^https?:\/\/(?:www\.)?manabox\.app\/decks\/([A-Za-z0-9_-]+)/;

const extraerIdMazo = (url) => {
  const encontrado = URL_MAZO.exec(String(url ?? '').trim());
  return encontrado ? encontrado[1] : null;
};

const fallo = (code) => Object.assign(new Error(code), { code });

const ENTIDADES = { quot: '"', amp: '&', lt: '<', gt: '>', '#39': "'", apos: "'", nbsp: ' ' };

const desescapar = (texto) =>
  texto.replace(/&(quot|amp|lt|gt|#39|apos|nbsp);/g, (_, e) => ENTIDADES[e]);

// Astro serializa cada valor como [etiquetaDeTipo, valor]. El tipo 0 es un valor plano y el 1 un array.
const desenvolver = (valor) => {
  if (!Array.isArray(valor)) return valor;
  const [tipo, contenido] = valor;
  if (tipo === 1) return contenido.map(desenvolver);
  if (tipo === 0 && contenido && typeof contenido === 'object') {
    return Object.fromEntries(Object.entries(contenido).map(([k, v]) => [k, desenvolver(v)]));
  }
  // ManaBox escapa entidades dentro del propio JSON, así que sobreviven al desescapado del atributo.
  return typeof contenido === 'string' ? desescapar(contenido) : contenido;
};

// El mazo viaja dentro del atributo props de una isla de Astro. Es el props más largo de la página.
const propsMasLargo = (html) => {
  const candidatos = [...html.matchAll(/props="([^"]*)"/g)].map(([, p]) => p);
  if (!candidatos.length) return null;
  return candidatos.reduce((a, b) => (b.length > a.length ? b : a));
};

const parsearMazo = (html) => {
  const props = propsMasLargo(html);
  if (!props) throw fallo('MAZO_NO_LEIBLE');

  let deck;
  try {
    deck = desenvolver(JSON.parse(desescapar(props)).deck);
  } catch {
    throw fallo('MAZO_NO_LEIBLE');
  }

  if (!deck || !Array.isArray(deck.cards)) throw fallo('MAZO_NO_LEIBLE');
  if (!deck.cards.length) throw fallo('MAZO_VACIO');

  return {
    nombre: deck.name ?? '',
    formato: deck.format ?? '',
    cartas: deck.cards.map((c) => ({
      nombre: c.name ?? '',
      cantidad: Number(c.quantity) || 0,
      esFoil: c.variant === 'Foil',
      set: c.setName ?? '',
      rareza: c.rarity ?? '',
      precio: c.pricing?.cardmarket?.value ?? 0
    }))
  };
};

module.exports = { extraerIdMazo, parsearMazo, fallo };
