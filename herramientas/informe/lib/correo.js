const nodemailer = require('nodemailer');

// Mismo contrato de variables que vender, para no tener dos configuraciones de correo
// distintas en el mismo Dokploy. El tope es mas generoso porque aqui no hay ningun
// visitante esperando: si el servidor de correo tarda, que tarde.
const TIEMPO_MAXIMO_MS = 20000;

const crearTransporte = (entorno = process.env) =>
  nodemailer.createTransport({
    host: entorno.SMTP_HOST,
    port: Number(entorno.SMTP_PORT),
    secure: entorno.SMTP_SECURE === 'true',
    auth: entorno.SMTP_USER ? { user: entorno.SMTP_USER, pass: entorno.SMTP_PASS } : undefined,
    connectionTimeout: TIEMPO_MAXIMO_MS,
    greetingTimeout: TIEMPO_MAXIMO_MS,
    socketTimeout: TIEMPO_MAXIMO_MS * 2
  });

const enviar = async ({ asunto, texto }, entorno = process.env) => {
  if (!entorno.SMTP_HOST) throw new Error('Falta SMTP_HOST: sin correo el informe no llega a ningun sitio');

  await crearTransporte(entorno).sendMail({
    from: entorno.EMAIL_FROM,
    to: entorno.INFORME_EMAIL_TO || entorno.EMAIL_TO,
    subject: asunto,
    text: texto
  });
};

module.exports = { enviar, crearTransporte };
