const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { VALORACION } = require('../lib/textos');

const avisoLegal = fs.readFileSync(path.join(__dirname, '../views/aviso-legal.ejs'), 'utf8');

// La etiqueta se paga por adelantado y sin conocer a quien la pide, asi que alguien puede
// usarla para mandar cualquier cosa. El aviso legal cubria el rechazo del precio y el
// paquete que se pasa de peso, pero no el envio que no trae cartas: sin decir que pasa, la
// unica respuesta posible ante un caso asi es improvisar.
test('el aviso legal dice que pasa si el envio no trae cartas', () => {
  assert.match(avisoLegal, /Uso de la etiqueta/);
});

// Que no se valora y que la devolucion no la asume quien la manda: si el coste corriera de
// nuestra cuenta, mandar un calcetin saldria gratis.
test('el mal uso de la etiqueta no sale gratis a quien lo hace', () => {
  const seccion = avisoLegal.slice(avisoLegal.indexOf('Uso de la etiqueta'));
  assert.match(seccion, /no se valora/i);
  assert.match(seccion, /lo asume quien lo mandó/i);
});

// La pregunta que hay que contestar no es de quien es el coste, sino que se hace con el
// paquete: sin un plazo y un destino, un envio que nadie reclama se queda en una caja para
// siempre y la clausula no resuelve el caso que la motiva.
test('dice que pasa con el contenido que nadie reclama', () => {
  const seccion = avisoLegal.slice(avisoLegal.indexOf('Uso de la etiqueta'));
  assert.match(seccion, /15 días naturales/);
  assert.match(seccion, /se destruye/);
});

// El visitante honrado no lee el aviso legal entero, asi que la condicion tiene que estar
// tambien en la lista de la pagina de valoracion, que es donde se pide la etiqueta.
test('la pagina de valoracion avisa de para que sirve la etiqueta', () => {
  const puntos = VALORACION.condiciones.puntos.join(' ');
  assert.match(puntos, /etiqueta/i);
});
