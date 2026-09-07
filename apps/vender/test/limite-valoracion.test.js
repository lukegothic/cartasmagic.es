const test = require('node:test');
const assert = require('node:assert/strict');

// El bloqueo del navegador frena el doble clic, pero no a quien manda el POST con curl, con
// dos pestanas o con el javascript desactivado. Sin un tope en el servidor, cada envio
// repetido sigue siendo un correo mas, que es justo lo que se queria evitar.
const arrancar = async () => {
  const correos = [];
  // Se sustituye el modulo en la cache antes de cargar las rutas: asi el POST recorre el
  // camino de verdad sin llegar a mandar nada.
  const rutaMailer = require.resolve('../lib/mailer');
  require.cache[rutaMailer] = {
    id: rutaMailer,
    filename: rutaMailer,
    loaded: true,
    exports: { enviarAviso: async (correo) => { correos.push(correo); } }
  };

  delete require.cache[require.resolve('../routes/main')];
  const express = require('express');
  const expressLayouts = require('express-ejs-layouts');
  const path = require('node:path');

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.use(express.urlencoded({ extended: false }));
  require('../routes/main')(app);

  const servidor = app.listen(0);
  await new Promise((listo) => servidor.once('listening', listo));

  return {
    correos,
    puerto: servidor.address().port,
    cerrar: () => new Promise((listo) => servidor.close(listo))
  };
};

const enviarValoracion = (puerto, email) =>
  fetch(`http://127.0.0.1:${puerto}/valoracion-cartas-magic`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ nombre: 'Iván Pérez', email, volumen: 'menos-500' }),
    redirect: 'manual'
  });

test('el mismo correo no puede pedir la etiqueta sin parar', async (t) => {
  const { puerto, correos, cerrar } = await arrancar();
  t.after(cerrar);

  const codigos = [];
  for (let i = 0; i < 7; i += 1) {
    const respuesta = await enviarValoracion(puerto, 'ivan@correo.com');
    codigos.push(respuesta.status);
  }

  assert.ok(codigos.includes(429), `ningun envio se freno: ${codigos.join(', ')}`);
  assert.ok(correos.length < 7, 'se mandaron todos los correos pese al limite');
});

// Limitar por ip meteria en el mismo cubo a todos los que salen por un movil o un proxy
// compartido, asi que el tope no puede alcanzar a quien no ha repetido nada.
test('el limite no alcanza a otra persona que envia a la vez', async (t) => {
  const { puerto, cerrar } = await arrancar();
  t.after(cerrar);

  for (let i = 0; i < 7; i += 1) await enviarValoracion(puerto, 'primero@correo.com');

  const otra = await enviarValoracion(puerto, 'segunda@correo.com');
  assert.notEqual(otra.status, 429);
});
