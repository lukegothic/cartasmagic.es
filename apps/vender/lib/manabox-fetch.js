const { parsearMazo, fallo } = require('./manabox');

const TIEMPO_MAXIMO_MS = Number(process.env.MANABOX_TIMEOUT_MS ?? 10000);

// El id ya viene validado contra la lista blanca del dominio, así que se reconstruye la url
// en lugar de reenviar la que escribió el usuario.
const descargarMazo = async (idMazo) => {
  const respuesta = await fetch(`https://manabox.app/decks/${idMazo}`, {
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    headers: { 'user-agent': 'vendercartasmagic.es' },
    redirect: 'follow'
  }).catch(() => {
    throw fallo('MAZO_NO_ACCESIBLE');
  });

  if (!respuesta.ok) throw fallo('MAZO_NO_ACCESIBLE');

  return parsearMazo(await respuesta.text());
};

module.exports = { descargarMazo };
