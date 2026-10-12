const crypto = require('node:crypto');

// 3 dias de retraso de GSC mas el tiempo que tarda Google en volver a rastrear la pagina.
// Mientras dura, las cifras de un Target describen su version anterior.
const COOLDOWN_DIAS = 28;

const CAMPOS = ['title', 'description', 'keywords', 'copy'];

const DIA_MS = 86400000;

const iso = (fecha) => fecha.toISOString().slice(0, 10);

const claveObjetivo = ({ dominio, ruta }, campo) => `${dominio}${ruta}#${campo}`;

const textoDe = (pagina, campo) =>
  campo === 'keywords' ? pagina.keywords.join(', ') : (pagina.texto?.[campo] ?? '');

// Los saltos de linea se igualan para que un checkout con CRLF no cuente como cambio.
const huellaDe = (texto) =>
  crypto.createHash('sha1').update(texto.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);

// Los ficheros que declaran un Target: los metadatos para title, description y keywords, y
// los que pintan la pagina para el copy.
const ficherosDe = (pagina, campo) =>
  campo === 'copy' && pagina.ficherosCopy?.length ? pagina.ficherosCopy : [pagina.fichero];

// La foto de hoy de cada Target: su huella y el ultimo dia que cambio. Si la huella es la
// de ayer conserva la fecha; si difiere, cambio hoy; si no hay entrada, la fecha sale del
// ultimo cambio del fichero en git, que solo se pregunta la primera vez de cada Target.
const instantanea = ({ paginas, previos = {}, hoy, ultimoCambioGit }) => {
  const hoyIso = iso(hoy);
  const fechasGit = new Map();
  const fechaGit = (fichero) => {
    if (!fechasGit.has(fichero)) fechasGit.set(fichero, ultimoCambioGit(fichero));
    return fechasGit.get(fichero);
  };

  const cambioInicial = (pagina, campo) =>
    ficherosDe(pagina, campo)
      .map(fechaGit)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  return Object.fromEntries(
    paginas.flatMap((pagina) =>
      CAMPOS.map((campo) => {
        const clave = claveObjetivo(pagina, campo);
        const huella = huellaDe(textoDe(pagina, campo));
        const previo = previos[clave];
        if (!previo) return [clave, { huella, cambio: cambioInicial(pagina, campo) }];
        return [clave, previo.huella === huella ? previo : { huella, cambio: hoyIso }];
      })
    )
  );
};

// Una fecha de cambio desconocida (git sin historial) no pone nada en Cooldown: sin saber
// cuando cambio no hay base para descartar.
const enCooldown = (cambio, hoy) =>
  Boolean(cambio) && (Date.parse(iso(hoy)) - Date.parse(cambio)) / DIA_MS <= COOLDOWN_DIAS;

const cooldownDe = (targets, hoy) => (paginas, campos) =>
  paginas.some((pagina) =>
    campos.some((campo) => enCooldown(targets[claveObjetivo(pagina, campo)]?.cambio, hoy))
  );

module.exports = { instantanea, cooldownDe, enCooldown, claveObjetivo, COOLDOWN_DIAS };
