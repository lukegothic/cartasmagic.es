const { extraerIdMazo } = require('./manabox');
const { leerDireccion } = require('./direccion');
const { componerCorreoPostal } = require('./correo-postal');

// El corto va al asunto, que se lee de un vistazo en el movil. El largo va a las notas.
const VOLUMENES = {
  'menos-500': { corto: 'menos de 500', largo: 'Menos de 500 cartas' },
  '500-1000': { corto: '500-1.000', largo: 'Entre 500 y 1.000 cartas' },
  'mas-1000': { corto: 'más de 1.000', largo: 'Más de 1.000 cartas (pasa de 2 kg, hay que avisar antes)' },
  'ni-idea': { corto: 'sin concretar', largo: 'Ni idea' }
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limpiar = (valor, maximo) => String(valor ?? '').trim().slice(0, maximo);

const validarLead = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const mensaje = limpiar(body.mensaje, 2000);
  const { volumen } = body;
  const direccion = leerDireccion(body);

  // Lo ya recortado, para repintar el formulario cuando el envio se rechaza: devolver el
  // cuerpo tal cual repondria un texto que despues se corta igualmente.
  const valores = { nombre, email, mensaje, volumen, direccion: direccion?.texto ?? '' };

  if (!nombre) return { error: 'CAMPOS_OBLIGATORIOS', valores };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO', valores };
  if (!VOLUMENES[volumen]) return { error: 'OPCION_NO_VALIDA', valores };

  return { lead: { nombre, email, mensaje, volumen, direccion }, valores };
};

const componerCorreo = ({ nombre, email, mensaje, volumen, direccion }) =>
  componerCorreoPostal({ nombre, email, mensaje, direccion, volumen: VOLUMENES[volumen] });

const validarLeadMazo = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const mensaje = limpiar(body.mensaje, 2000);
  const url = limpiar(body.url, 300);
  const direccion = leerDireccion(body);

  const valores = { nombre, email, mensaje, url, direccion: direccion?.texto ?? '' };

  if (!nombre) return { error: 'CAMPOS_OBLIGATORIOS', valores };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO', valores };

  const idMazo = extraerIdMazo(url);
  if (!idMazo) return { error: 'ENLACE_NO_VALIDO', valores };

  return { lead: { nombre, email, mensaje, url, idMazo, direccion }, valores };
};

module.exports = { validarLead, componerCorreo, validarLeadMazo };
