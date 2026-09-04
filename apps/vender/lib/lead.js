const { extraerIdMazo } = require('./manabox');

const TIPOS = {
  'coleccion-completa': 'Una colección completa',
  'mazos-albumes': 'Mazos montados y álbumes',
  'cartas-valor': 'Solo las cartas que sabe que valen algo',
  'no-lo-se': 'No lo sabe, lo heredó o se lo dejaron'
};

const VOLUMENES = {
  'menos-500': 'Menos de 500 cartas',
  '500-1200': 'Entre 500 y 1.200 cartas',
  'mas-1200': 'Más de 1.200 cartas (más de 2 kg, requiere aviso)',
  'ni-idea': 'Ni idea'
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_CARTAS_LISTADAS = 15;

const limpiar = (valor, maximo) => String(valor ?? '').trim().slice(0, maximo);

const validarLead = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const provincia = limpiar(body.provincia, 80);
  const mensaje = limpiar(body.mensaje, 2000);
  const { tipo, volumen } = body;

  if (!nombre || !provincia) return { error: 'CAMPOS_OBLIGATORIOS' };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO' };
  if (!TIPOS[tipo] || !VOLUMENES[volumen]) return { error: 'OPCION_NO_VALIDA' };

  return { lead: { nombre, email, provincia, mensaje, tipo, volumen } };
};

const componerCorreo = ({ nombre, email, provincia, mensaje, tipo, volumen }) => ({
  subject: `Nueva colección: ${nombre} (${provincia})`,
  replyTo: email,
  text: [
    `Nombre: ${nombre}`,
    `Correo: ${email}`,
    `Provincia: ${provincia}`,
    `Qué tiene: ${TIPOS[tipo]}`,
    `Volumen: ${VOLUMENES[volumen]}`,
    '',
    mensaje || '(sin mensaje adicional)'
  ].join('\n')
});

const validarLeadMazo = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const mensaje = limpiar(body.mensaje, 2000);
  const url = limpiar(body.url, 300);

  if (!nombre) return { error: 'CAMPOS_OBLIGATORIOS' };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO' };

  const idMazo = extraerIdMazo(url);
  if (!idMazo) return { error: 'ENLACE_NO_VALIDO' };

  return { lead: { nombre, email, mensaje, url, idMazo } };
};

const euros = (valor) => valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

const componerCorreoMazo = ({ lead, mazo, presupuesto }) => ({
  subject: `Presupuesto ManaBox: ${lead.nombre} - ${euros(presupuesto.oferta)} EUR${presupuesto.bajoMinimo ? ' (bajo mínimo)' : ''}`,
  replyTo: lead.email,
  text: [
    `Nombre: ${lead.nombre}`,
    `Correo: ${lead.email}`,
    `Enlace: ${lead.url}`,
    '',
    `Mazo: ${mazo.nombre} (${mazo.formato})`,
    `Cartas: ${presupuesto.totalCartas}, de las cuales ${presupuesto.totalFoils} son foil`,
    '',
    `Valor en Cardmarket: ${euros(presupuesto.valorMercado)} EUR`,
    `OFERTA A ENVIAR: ${euros(presupuesto.oferta)} EUR`,
    presupuesto.bajoMinimo ? 'AVISO: la oferta queda por debajo del mínimo configurado' : '',
    '',
    'Desglose por tramo:',
    ...presupuesto.tramos
      .filter(({ cartas }) => cartas > 0)
      .map(({ etiqueta, cartas, valorMercado, oferta }) =>
        `  ${etiqueta}: ${cartas} cartas, ${euros(valorMercado)} EUR de mercado, se pagan ${euros(oferta)} EUR`),
    '',
    'Cartas más caras:',
    ...presupuesto.masCaras
      .slice(0, MAX_CARTAS_LISTADAS)
      .map(({ nombre, precio, esFoil, set, cantidad }) =>
        `  ${cantidad}x ${nombre} (${set})${esFoil ? ' [foil]' : ''}: ${euros(precio)} EUR`),
    '',
    lead.mensaje || '(sin mensaje adicional)'
  ].filter((linea) => linea !== '').join('\n')
});

module.exports = { validarLead, componerCorreo, validarLeadMazo, componerCorreoMazo };
