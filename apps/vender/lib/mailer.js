const nodemailer = require('nodemailer');

// Sin topes explicitos nodemailer espera hasta dos minutos a conectar y diez a que el socket
// conteste, asi que un servidor de correo caido dejaba la peticion del visitante colgada.
const TIEMPO_MAXIMO_MS = 8000;

const crearTransporte = (entorno = process.env) => {
  const tope = Number(entorno.SMTP_TIMEOUT_MS ?? TIEMPO_MAXIMO_MS);

  return nodemailer.createTransport({
    host: entorno.SMTP_HOST,
    port: Number(entorno.SMTP_PORT),
    secure: entorno.SMTP_SECURE === 'true',
    auth: entorno.SMTP_USER ? { user: entorno.SMTP_USER, pass: entorno.SMTP_PASS } : undefined,
    connectionTimeout: tope,
    greetingTimeout: tope,
    socketTimeout: tope * 2
  });
};

const enviarCon = (transporte, entorno, { subject, text, html, replyTo, attachments }) =>
  transporte.sendMail({
    from: entorno.EMAIL_FROM,
    to: entorno.EMAIL_TO,
    replyTo,
    subject,
    text,
    html,
    attachments
  });

let transporte;

const enviarAviso = (correo) => {
  transporte = transporte ?? crearTransporte();
  return enviarCon(transporte, process.env, correo);
};

module.exports = { enviarAviso, crearTransporte, enviarCon };
