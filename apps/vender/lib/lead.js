const { extraerIdMazo } = require('./manabox');
const { leerDireccion } = require('./direccion');
const { leerCodigoPostal } = require('./codigo-postal');
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

// Vacio y mal escrito se distinguen porque el aviso es distinto: uno pide rellenarlo y el
// otro explica que tiene que ser un codigo de España.
const errorCodigoPostal = (texto, codigoPostal) => {
  if (!texto) return 'CAMPOS_OBLIGATORIOS';
  if (!codigoPostal) return 'CODIGO_POSTAL_NO_VALIDO';
  return null;
};

const leerCampoCodigoPostal = (body) => {
  const texto = limpiar(body.codigoPostal, 100);
  const codigoPostal = leerCodigoPostal(texto);
  return { texto, codigoPostal, error: errorCodigoPostal(texto, codigoPostal) };
};

const validarLead = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const mensaje = limpiar(body.mensaje, 2000);
  const { volumen } = body;
  const campoCodigoPostal = leerCampoCodigoPostal(body);

  // Lo ya recortado, para repintar el formulario cuando el envio se rechaza: devolver el
  // cuerpo tal cual repondria un texto que despues se corta igualmente.
  const valores = { nombre, email, mensaje, volumen, codigoPostal: campoCodigoPostal.texto, direccion: limpiar(body.direccion, 300) };

  if (!nombre) return { error: 'CAMPOS_OBLIGATORIOS', valores };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO', valores };
  if (campoCodigoPostal.error) return { error: campoCodigoPostal.error, valores };
  if (!VOLUMENES[volumen]) return { error: 'OPCION_NO_VALIDA', valores };

  const { codigoPostal } = campoCodigoPostal;
  const direccion = leerDireccion(body, codigoPostal);
  return { lead: { nombre, email, mensaje, volumen, codigoPostal, direccion }, valores };
};

const componerCorreo = ({ nombre, email, mensaje, volumen, codigoPostal, direccion }) =>
  componerCorreoPostal({ nombre, email, mensaje, codigoPostal, direccion, volumen: VOLUMENES[volumen] });

const validarLeadMazo = (body) => {
  const nombre = limpiar(body.nombre, 100);
  const email = limpiar(body.email, 150);
  const mensaje = limpiar(body.mensaje, 2000);
  const url = limpiar(body.url, 300);
  const campoCodigoPostal = leerCampoCodigoPostal(body);

  const valores = { nombre, email, mensaje, url, codigoPostal: campoCodigoPostal.texto, direccion: limpiar(body.direccion, 300) };

  if (!nombre) return { error: 'CAMPOS_OBLIGATORIOS', valores };
  if (!EMAIL_VALIDO.test(email)) return { error: 'EMAIL_NO_VALIDO', valores };
  if (campoCodigoPostal.error) return { error: campoCodigoPostal.error, valores };

  const idMazo = extraerIdMazo(url);
  if (!idMazo) return { error: 'ENLACE_NO_VALIDO', valores };

  const { codigoPostal } = campoCodigoPostal;
  const direccion = leerDireccion(body, codigoPostal);
  return { lead: { nombre, email, mensaje, url, idMazo, codigoPostal, direccion }, valores };
};

module.exports = { validarLead, componerCorreo, validarLeadMazo };
