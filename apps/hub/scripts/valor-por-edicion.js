// El valor de una caja de sobres por edicion, con su fecha de salida.
//
// Las cifras son el EV (expected value) que publica https://mtg.dawnglare.com/?p=sets: la
// suma de los precios de las cartas que salen en una caja. Son dolares y se copian a mano,
// porque la pagina no ofrece descarga. Al actualizarlas hay que volver a pasar el script de
// graficos.
//
// Las fechas salen de la API de Scryfall (https://api.scryfall.com/sets) para no tener que
// mantenerlas aqui: solo se guarda el nombre con el que Scryfall conoce cada edicion.
//
// Solo expansiones y ediciones basicas de su epoca. Fuera los productos recopilatorios
// (Masters, From the Vault, duel decks), que no son sobres de la edicion y romperian la
// serie: se imprimieron mucho despues de las cartas que llevan dentro.

const EV_POR_CAJA = [
  ['Arabian Nights', 6534],
  ['Antiquities', 6212],
  ['Legends', 996],
  ['The Dark', 66],
  ['Fallen Empires', 110],
  ['Ice Age', 767],
  ['Alliances', 378],
  ['Mirage', 713],
  ['Visions', 502],
  ['Tempest', 1816],
  ['Stronghold', 1465],
  ["Urza's Saga", 951],
  ["Urza's Legacy", 1040],
  ['Mercadian Masques', 234],
  ['Nemesis', 586],
  ['Invasion', 175],
  ['Planeshift', 188],
  ['Odyssey', 415],
  ['Torment', 463],
  ['Onslaught', 206],
  ['Legions', 402],
  ['Mirrodin', 341],
  ['Darksteel', 436],
  ['Champions of Kamigawa', 229],
  ['Betrayers of Kamigawa', 283],
  ['Ravnica: City of Guilds', 84],
  ['Guildpact', 184],
  ['Time Spiral', 168],
  ['Planar Chaos', 298],
  ['Lorwyn', 321],
  ['Shadowmoor', 283],
  ['Shards of Alara', 108],
  ['Conflux', 95],
  ['Zendikar', 263],
  ['Worldwake', 197],
  ['Scars of Mirrodin', 166],
  ['Mirrodin Besieged', 344],
  ['Innistrad', 31],
  ['Dark Ascension', 156],
  ['Return to Ravnica', 80],
  ['Gatecrash', 20],
  ['Theros', 47],
  ['Born of the Gods', 97],
  ['Khans of Tarkir', 35],
  ['Dragons of Tarkir', 45],
  ['Battle for Zendikar', 57],
  ['Shadows over Innistrad', 57],
  ['Kaladesh', 89],
  ['Amonkhet', 96],
  ['Ixalan', 85],
  ['Dominaria', 92],
  ['Guilds of Ravnica', 102],
  ['Ravnica Allegiance', 104],
  ['Throne of Eldraine', 91],
  ['Theros Beyond Death', 164],
  ['Ikoria: Lair of Behemoths', 141],
  ['Zendikar Rising', 119],
  ['Kaldheim', 131],
  ['Strixhaven: School of Mages', 93],
  ['Innistrad: Midnight Hunt', 68],
  ['Kamigawa: Neon Dynasty', 153],
  ['Streets of New Capenna', 85],
  ['Dominaria United', 81],
  ["The Brothers' War", 131],
  ['Phyrexia: All Will Be One', 109],
  ['March of the Machine', 154],
  ['Wilds of Eldraine', 163],
  ['The Lost Caverns of Ixalan', 138],
  ['Bloomburrow', 181]
];

// La Octava Edicion, que es cuando cambia el marco de las cartas.
const FRONTERA = '2003-07-28';

const SETS = 'https://api.scryfall.com/sets';

const fechasDeSalida = async () => {
  const respuesta = await fetch(SETS, {
    headers: { 'User-Agent': 'cartasmagic.es', Accept: 'application/json' }
  });
  if (!respuesta.ok) throw new Error(`Scryfall respondio ${respuesta.status}`);

  const { data } = await respuesta.json();
  return new Map(data.map((set) => [set.name.toLowerCase(), set.released_at]));
};

const serieDeValor = async () => {
  const fechas = await fechasDeSalida();

  const puntos = EV_POR_CAJA.map(([nombre, valor]) => ({
    nombre,
    valor,
    fecha: fechas.get(nombre.toLowerCase())
  }));

  const sinFecha = puntos.filter(({ fecha }) => !fecha);
  if (sinFecha.length) {
    throw new Error(`Scryfall no reconoce: ${sinFecha.map((p) => p.nombre).join(', ')}`);
  }

  return puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
};

module.exports = { serieDeValor, FRONTERA };
