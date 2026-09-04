const { extraerIdMazo } = require('./manabox');
const { componerCorreoPostal } = require('./correo-postal');
const { componerCorreoMazo } = require('./correo-manabox');

const TIPOS = {
  'coleccion-completa': 'Una colección completa',
  'mazos-albumes': 'Mazos montados y álbumes',
  'cartas-valor': 'Solo las cartas que sabe que valen algo',
  'no-lo-se': 'No lo sabe, lo heredó o se lo dejaron'
};

const VOLUMENES = {
  'menos-500': 'Menos de 500 cartas',
  '500-1200': 'Entre 500 y 1.200 cartas',
  'mas-1200': 'Más de 1.200 cartas (más de 2 kg, hay que avisar antes)',
  'ni-idea': 'Ni idea'
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const componerCorreo = ({ nombre, email, provincia, mensaje, tipo, volumen }) =>
  componerCorreoPostal({
    nombre,
    email,
    provincia,
    mensaje,
    queTiene: TIPOS[tipo],
    volumen: VOLUMENES[volumen]
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

module.exports = { validarLead, componerCorreo, validarLeadMazo, componerCorreoMazo };
