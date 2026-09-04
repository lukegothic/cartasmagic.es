const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { crearTransporte, enviarCon } = require('../lib/mailer');

test('el transporte lleva topes de tiempo, para no dejar la peticion colgada', () => {
  const { options } = crearTransporte({ SMTP_HOST: 'h', SMTP_PORT: '587' }).transporter;
  assert.ok(options.connectionTimeout <= 10000, 'la conexión debe rendirse pronto');
  assert.ok(options.greetingTimeout <= 10000);
  assert.ok(options.socketTimeout <= 20000);
});

test('un servidor de correo que no contesta corta y no cuelga la peticion', async (t) => {
  // Un socket que acepta la conexion y jamas responde: es el caso que dejaba la peticion pendiente.
  const mudo = net.createServer(() => {});
  await new Promise((listo) => mudo.listen(0, '127.0.0.1', listo));
  t.after(() => mudo.close());

  const entorno = {
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(mudo.address().port),
    SMTP_SECURE: 'false',
    SMTP_TIMEOUT_MS: '600'
  };

  const empezo = Date.now();
  await assert.rejects(enviarCon(crearTransporte(entorno), entorno, { subject: 's', text: 't' }));
  assert.ok(Date.now() - empezo < 5000, 'debe rendirse en menos de cinco segundos');
});

test('el envio conserva el cuerpo html y los adjuntos', () => {
  const enviados = [];
  const transporte = { sendMail: (m) => { enviados.push(m); return Promise.resolve(); } };
  enviarCon(transporte, { EMAIL_FROM: 'de@x.es', EMAIL_TO: 'a@x.es' }, {
    subject: 's', text: 't', html: '<p>hola</p>',
    attachments: [{ filename: 'd.csv', content: 'a;b' }]
  });

  const [enviado] = enviados;
  assert.equal(enviado.html, '<p>hola</p>');
  assert.equal(enviado.attachments[0].filename, 'd.csv');
  assert.equal(enviado.text, 't', 'el texto plano sigue viajando para los clientes que no pintan html');
});
