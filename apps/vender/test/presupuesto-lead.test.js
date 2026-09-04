const test = require('node:test');
const assert = require('node:assert/strict');
const { validarLeadMazo } = require('../lib/lead');

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
