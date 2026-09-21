const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');

const VISTAS = [
  { vista: 'valoracion-cartas-magic', etiqueta: 'valoracion', metadatos: meta.VALORACION },
  { vista: 'presupuesto-manabox', etiqueta: 'manabox', metadatos: meta.MANABOX }
];

const pintar = ({ vista, etiqueta, metadatos }, extra = {}) => {
  const fichero = path.join(__dirname, `../views/${vista}.ejs`);
  return ejs.render(fs.readFileSync(fichero, 'utf8'), {
    ...metadatos,
    textos,
    faq: null,
    enviado: false,
    errorCode: null,
    mensajeError: null,
    etiquetaConversion: etiqueta,
    valores: {},
    textoRecibido: '',
    ...extra
  }, { filename: fichero });
};

// Los dos formularios responden al POST pintando otra vez la misma vista, asi que el
// partial de medicion se vuelve a cargar con la respuesta del envio. Contando un
// ver_formulario en esa segunda carga, cada lead se apuntaba tambien como una visita
// nueva al formulario: por eso el informe daba 8 leads sobre 7 intentos y una portada a
// formulario del 186 %, dos cifras imposibles. El denominador tiene que contar visitas,
// no respuestas a un envio.
VISTAS.forEach((caso) => {
  test(`${caso.vista} no cuenta una visita al formulario al confirmar el lead`, () => {
    const html = pintar(caso, { enviado: true, textoRecibido: 'ok' });
    assert.match(html, /generate_lead/, 'el lead se sigue apuntando');
    assert.ok(
      !/evento\('ver_formulario'\)/.test(html),
      'la respuesta a un envio no es una visita nueva al formulario'
    );
  });

  test(`${caso.vista} no cuenta una visita al formulario al mostrar un error`, () => {
    const html = pintar(caso, { errorCode: 'DATOS_INVALIDOS', mensajeError: 'error' });
    assert.match(html, /envio_rechazado/, 'el rechazo se sigue apuntando');
    assert.ok(
      !/evento\('ver_formulario'\)/.test(html),
      'la respuesta a un envio rechazado tampoco es una visita nueva'
    );
  });

  test(`${caso.vista} cuenta la visita cuando la pagina se abre sin enviar nada`, () => {
    const html = pintar(caso);
    assert.match(html, /evento\('ver_formulario'\)/);
  });
});
