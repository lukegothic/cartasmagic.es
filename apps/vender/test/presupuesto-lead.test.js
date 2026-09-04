const test = require('node:test');
const assert = require('node:assert/strict');
const { validarLeadMazo, componerCorreoMazo } = require('../lib/lead');

const valido = { nombre: 'Iván Pérez', email: 'ivan@correo.com', url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' };

test('validarLeadMazo acepta un lead correcto y normaliza el id', () => {
  const { lead, error } = validarLeadMazo(valido);
  assert.equal(error, undefined);
  assert.equal(lead.idMazo, 'AZ7lfIfhflqh2vgQaCEtkg');
  assert.equal(lead.nombre, 'Iván Pérez');
});

test('validarLeadMazo exige nombre y correo válido', () => {
  assert.equal(validarLeadMazo({ ...valido, nombre: '  ' }).error, 'CAMPOS_OBLIGATORIOS');
  assert.equal(validarLeadMazo({ ...valido, email: 'no-es-un-correo' }).error, 'EMAIL_NO_VALIDO');
});

test('validarLeadMazo rechaza un enlace que no es de manabox', () => {
  assert.equal(validarLeadMazo({ ...valido, url: 'https://moxfield.com/decks/abc123' }).error, 'ENLACE_NO_VALIDO');
  assert.equal(validarLeadMazo({ ...valido, url: '' }).error, 'ENLACE_NO_VALIDO');
});

const presupuesto = {
  valorMercado: 1502.38, oferta: 814.8, bajoMinimo: false, totalCartas: 163, totalFoils: 30,
  tramos: [{ id: 'premium', etiqueta: 'Cartas de 20 € o más', cartas: 15, valorMercado: 937.4, oferta: 562.44 }],
  masCaras: [{ nombre: 'Ancient Tomb', precio: 365.28, esFoil: true, set: 'Zendikar Expeditions', cantidad: 1 }]
};

test('componerCorreoMazo lleva la oferta y el valor en el cuerpo', () => {
  const correo = componerCorreoMazo({ lead: { ...valido, idMazo: 'AZ7' }, mazo: { nombre: 'Venta', formato: 'Commander' }, presupuesto });
  assert.match(correo.text, /814,80/);
  assert.match(correo.text, /1\.502,38/);
  assert.match(correo.text, /Ancient Tomb/);
  assert.match(correo.text, /ivan@correo\.com/);
  assert.equal(correo.replyTo, 'ivan@correo.com');
});

test('componerCorreoMazo avisa en el asunto cuando la oferta baja del minimo', () => {
  const correo = componerCorreoMazo({
    lead: { ...valido, idMazo: 'AZ7' }, mazo: { nombre: 'Venta', formato: 'Commander' },
    presupuesto: { ...presupuesto, oferta: 12, bajoMinimo: true }
  });
  assert.match(correo.subject, /bajo mínimo/i);
});
