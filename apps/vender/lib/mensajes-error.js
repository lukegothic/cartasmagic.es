// Un unico sitio donde vive el texto de cada error. Las vistas solo piden el mensaje por su
// codigo, asi que anadir una validacion nueva no obliga a tocar cada formulario.
const MENSAJES = {
  CAMPOS_OBLIGATORIOS: 'Faltan campos por rellenar',
  EMAIL_NO_VALIDO: 'El correo no es válido',
  OPCION_NO_VALIDA: 'Elige una opción en las dos listas',
  ENLACE_NO_VALIDO: 'El enlace no es de un mazo de ManaBox. Tiene que empezar por manabox.app/decks/',
  MAZO_NO_ACCESIBLE: 'No se ha podido abrir el mazo. Comprueba que el enlace es público y vuelve a probar',
  MAZO_NO_LEIBLE: 'No se ha podido leer la lista de cartas. Comprueba que el enlace es público y vuelve a probar',
  MAZO_VACIO: 'Ese mazo no tiene cartas',
  DEMASIADOS_INTENTOS: 'Has pedido varios presupuestos seguidos. Espera un rato y vuelve a probar',
  ENVIO_FALLIDO: 'No se ha podido enviar. Prueba otra vez o escribe a contacto@vendercartasmagic.es'
};

// Un codigo sin mensaje pintaba un recuadro vacio, asi que el visitante no sabia ni que habia
// fallado ni por donde seguir. El generico al menos le da una salida.
const GENERICO = 'No se ha podido completar la operación. Prueba otra vez o escribe a contacto@vendercartasmagic.es';

const mensajeDeError = (codigo) => MENSAJES[codigo] ?? GENERICO;

module.exports = { mensajeDeError, MENSAJES };
