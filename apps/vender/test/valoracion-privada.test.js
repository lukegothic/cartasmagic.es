const test = require('node:test');
const assert = require('node:assert/strict');
const { montarValoracionPrivada } = require('../routes/valoracion-privada');

const CLAVE = 'clave-de-prueba';

const cabecera = (clave) => `Basic ${Buffer.from(`x:${clave}`).toString('base64')}`;

const MAZO = {
  nombre: 'Colección de Juan',
  formato: 'Commander',
  cartas: [
    { nombre: 'Mox Diamond', cantidad: 1, esFoil: false, set: 'Stronghold', rareza: 'Rare', precio: 40 },
    { nombre: 'Sol Ring', cantidad: 4, esFoil: true, set: 'C21', rareza: 'Uncommon', precio: 1.5 },
    { nombre: 'Isla', cantidad: 10, esFoil: false, set: 'C21', rareza: 'Common', precio: 0.05 }
  ]
};

// Un doble de express que se queda con lo que la ruta registra, para probar los handlers
// sin levantar un servidor ni pedir un puerto.
const appFalsa = () => {
  const rutas = new Map();
  return {
    app: { get: (ruta, handler) => rutas.set(ruta, handler) },
    llamar: (ruta, req) => {
      const res = { codigo: 200, cabeceras: {} };
      const respuesta = new Promise((resolve) => {
        res.status = (codigo) => { res.codigo = codigo; return res; };
        res.set = (clave, valor) => { res.cabeceras[clave] = valor; return res; };
        res.render = (vista, datos) => resolve({ ...res, vista, datos });
        res.send = (cuerpo) => resolve({ ...res, cuerpo });
      });
      rutas.get(ruta)({ query: {}, headers: {}, ...req }, res);
      return respuesta;
    }
  };
};

const montar = ({ descargarMazo = async () => MAZO, clave = CLAVE } = {}) => {
  const { app, llamar } = appFalsa();
  montarValoracionPrivada(app, { descargarMazo, entorno: { VALORACION_PRIVADA_PASSWORD: clave } });
  return llamar;
};

test('sin cabecera pide la clave con un 401 y no descarga nada', async () => {
  let pedido = false;
  const llamar = montar({ descargarMazo: async () => { pedido = true; return MAZO; } });

  const res = await llamar('/interno/valoracion', {});

  assert.equal(res.codigo, 401);
  assert.match(res.cabeceras['WWW-Authenticate'], /^Basic /);
  assert.equal(pedido, false);
});

test('con una clave equivocada tambien responde 401', async () => {
  const llamar = montar();
  const res = await llamar('/interno/valoracion', { headers: { authorization: cabecera('otra') } });
  assert.equal(res.codigo, 401);
});

test('sin clave en el entorno la pagina no se abre ni con cabecera', async () => {
  const llamar = montar({ clave: '' });
  const res = await llamar('/interno/valoracion', { headers: { authorization: cabecera('') } });
  assert.equal(res.codigo, 401);
});

test('con la clave correcta y sin url pinta el formulario vacio', async () => {
  const llamar = montar();
  const res = await llamar('/interno/valoracion', { headers: { authorization: cabecera(CLAVE) } });

  assert.equal(res.codigo, 200);
  assert.equal(res.vista, 'valoracion-privada');
  assert.equal(res.datos.presupuesto, null);
  assert.equal(res.datos.noindex, true);
});

test('con un enlace valido devuelve las cifras del presupuesto', async () => {
  const llamar = montar();
  const res = await llamar('/interno/valoracion', {
    headers: { authorization: cabecera(CLAVE) },
    query: { url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' }
  });

  assert.equal(res.codigo, 200);
  assert.equal(res.datos.presupuesto.totalCartas, 15);
  assert.equal(res.datos.presupuesto.totalFoils, 4);
  assert.equal(res.datos.mazo.nombre, 'Colección de Juan');
  assert.ok(res.datos.presupuesto.valorMercado > 0);
});

test('un enlace que no es de manabox se rechaza sin descargar', async () => {
  let pedido = false;
  const llamar = montar({ descargarMazo: async () => { pedido = true; return MAZO; } });

  const res = await llamar('/interno/valoracion', {
    headers: { authorization: cabecera(CLAVE) },
    query: { url: 'https://example.com/decks/abc' }
  });

  assert.equal(res.codigo, 400);
  assert.equal(res.datos.errorCode, 'ENLACE_NO_VALIDO');
  assert.equal(pedido, false);
});

test('un mazo que no se puede abrir pinta el error sin romper la pagina', async () => {
  const llamar = montar({
    descargarMazo: async () => { throw Object.assign(new Error('MAZO_VACIO'), { code: 'MAZO_VACIO' }); }
  });

  const res = await llamar('/interno/valoracion', {
    headers: { authorization: cabecera(CLAVE) },
    query: { url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' }
  });

  assert.equal(res.codigo, 400);
  assert.equal(res.datos.errorCode, 'MAZO_VACIO');
  assert.equal(res.datos.presupuesto, null);
});

test('el csv sale con la cabecera de descarga y una fila por carta', async () => {
  const llamar = montar();
  const res = await llamar('/interno/valoracion.csv', {
    headers: { authorization: cabecera(CLAVE) },
    query: { url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' }
  });

  assert.equal(res.codigo, 200);
  assert.match(res.cabeceras['Content-Disposition'], /attachment/);
  assert.match(res.cabeceras['Content-Type'], /text\/csv/);
  assert.match(res.cuerpo, /Mox Diamond/);
});

test('el csv tambien esta detras de la clave', async () => {
  const llamar = montar();
  const res = await llamar('/interno/valoracion.csv', {
    query: { url: 'https://manabox.app/decks/AZ7lfIfhflqh2vgQaCEtkg' }
  });
  assert.equal(res.codigo, 401);
});
