// Comprueba desde el propio servidor si se puede conectar y enviar. Uso:
//   node scripts/probar-correo.js
const net = require('node:net');
const { crearTransporte, enviarCon } = require('../lib/mailer');

const puertos = [Number(process.env.SMTP_PORT) || 587, 465, 2525];

const alcanzable = (puerto) => new Promise((resolver) => {
  const socket = net.createConnection({ host: process.env.SMTP_HOST, port: puerto });
  const cerrar = (resultado) => { socket.destroy(); resolver(resultado); };
  socket.setTimeout(6000);
  socket.on('data', (d) => cerrar(`responde: ${d.toString().trim().split('\n')[0]}`));
  socket.on('timeout', () => cerrar('BLOQUEADO: conecta pero no contesta'));
  socket.on('error', (e) => cerrar(`BLOQUEADO: ${e.code}`));
});

const main = async () => {
  console.log(`Servidor de correo: ${process.env.SMTP_HOST}`);
  console.log(`Usuario: ${process.env.SMTP_USER || '(sin definir)'}`);
  console.log(`Contraseña: ${process.env.SMTP_PASS ? 'definida' : '(SIN DEFINIR)'}\n`);

  for (const puerto of puertos) {
    console.log(`  puerto ${puerto}: ${await alcanzable(puerto)}`);
  }

  console.log('\nProbando un envío real con la configuración actual...');
  try {
    await enviarCon(crearTransporte(), process.env, {
      subject: 'Prueba de configuración de vendercartasmagic.es',
      text: 'Si lees esto, el envío de correo funciona.'
    });
    console.log(`Enviado a ${process.env.EMAIL_TO}. Revisa la bandeja.`);
  } catch (err) {
    console.log(`Fallo: ${err.code || ''} ${err.message.split('\n')[0]}`);
    if (err.code === 'ETIMEDOUT') console.log('El puerto está bloqueado. Prueba SMTP_PORT=465 con SMTP_SECURE=true');
    if (err.code === 'EAUTH') console.log('Credenciales rechazadas. Hace falta una contraseña de aplicación de Google, no la del correo');
  }
};

main();
