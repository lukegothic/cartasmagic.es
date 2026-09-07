const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const textos = require('../lib/textos');
const meta = require('../lib/metadatos');

const leer = (relativa) => fs.readFileSync(path.join(__dirname, '..', relativa), 'utf8');

const partial = leer('views/partials/bloqueo-envio.ejs');
const estilos = leer('public/style.css');

const VISTAS = [
  { vista: 'valoracion-cartas-magic', etiqueta: 'valoracion', metadatos: meta.VALORACION },
  { vista: 'presupuesto-manabox', etiqueta: 'manabox', metadatos: meta.MANABOX }
];

// Se pinta la vista de verdad en lugar de mirar si el include esta escrito: asi el test
// tambien se cae si el partial deja de recibir alguna de las variables que necesita.
const pintar = ({ vista, etiqueta, metadatos }) => {
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
    textoRecibido: ''
  }, { filename: fichero });
};

// Los dos formularios mandaban el mismo lead tantas veces como se pulsara el boton, porque
// nada bloqueaba el segundo clic. El de ManaBox ademas descarga el mazo, asi que cada
// repeticion es una peticion externa de mas.
VISTAS.forEach((caso) => {
  test(`${caso.vista} bloquea el reenvio y dice en que esta`, () => {
    const html = pintar(caso);
    assert.match(html, /envio-spinner/);
    assert.ok(html.includes(textos.ENVIANDO[caso.etiqueta]));
  });
});

// medicion-embudo apunta un intento_envio por cada submit. Si se registra antes que el
// bloqueo, el clic repetido que no llega a salir se cuenta igual y abre un hueco falso
// contra el generate_lead con el que se compara, que es justo la medida que el plan del
// embudo usa para detectar fallos tecnicos.
VISTAS.forEach(({ vista }) => {
  test(`${vista} registra el bloqueo antes que la medicion`, () => {
    const fuente = leer(`views/${vista}.ejs`);
    assert.ok(
      fuente.indexOf("include('partials/bloqueo-envio')") < fuente.indexOf("include('partials/medicion-embudo')"),
      'el bloqueo tiene que ir antes para poder cortar el submit repetido'
    );
  });
});

test('el clic repetido no llega a los demas oyentes del submit', () => {
  assert.match(partial, /stopImmediatePropagation\(\)/);
});

// El aviso acaba dentro de una cadena de JavaScript, no en el HTML. Escapado con <%= sale
// como &#39; y &amp;, que ahi no los interpreta nadie: el visitante los leeria tal cual en
// el boton. Se comprueba pintando con un texto que lleva justo esos caracteres.
test('un aviso con comilla y ampersand se lee tal cual', () => {
  const conComilla = { ...textos, ENVIANDO: { manabox: "Leyendo la 'lista' & esperando" } };
  const fichero = path.join(__dirname, '../views/presupuesto-manabox.ejs');
  const html = ejs.render(fs.readFileSync(fichero, 'utf8'), {
    ...meta.MANABOX,
    textos: conComilla,
    faq: null,
    enviado: false,
    errorCode: null,
    mensajeError: null,
    etiquetaConversion: 'manabox',
    valores: {},
    textoRecibido: ''
  }, { filename: fichero });

  const script = html.split('<script>').find((trozo) => trozo.includes('stopImmediatePropagation'));
  const cuerpo = script.split('</script>')[0];

  // El texto tiene que viajar entero hasta el boton, sin entidades por el camino.
  const linea = cuerpo.split('\n').find((l) => l.includes('Leyendo la'));
  assert.ok(linea, 'el aviso no llega al script');
  assert.ok(linea.includes("Leyendo la 'lista' & esperando"));
  assert.doesNotMatch(linea, /&#39;|&amp;/);
});

test('el spinner hereda el color del texto del boton', () => {
  assert.match(estilos, /\.envio-spinner\s*\{[^}]*border-bottom-color:\s*currentColor/);
});

test('el bloqueo deshabilita el boton al enviar', () => {
  assert.match(partial, /disabled\s*=\s*true/);
});

// Un boton deshabilitado no manda su valor, pero aqui no hace falta ninguno: lo que importa
// es que el navegador no repita el POST. Aun asi el guardia va antes del disabled, porque
// Safari dispara submit otra vez si la validacion nativa frena el primero.
test('el bloqueo frena el segundo envio aunque el primero no salga', () => {
  assert.match(partial, /checkValidity\(\)/);
  assert.match(partial, /preventDefault\(\)/);
});

test('cada formulario anuncia en que esta trabajando', () => {
  assert.equal(typeof textos.ENVIANDO.valoracion, 'string');
  assert.equal(typeof textos.ENVIANDO.manabox, 'string');
  assert.notEqual(textos.ENVIANDO.valoracion, textos.ENVIANDO.manabox);
});

// El aviso lo tiene que cantar un lector de pantalla: si solo cambia el texto del boton,
// quien no ve la pantalla se queda sin saber que el envio sigue en marcha.
test('el aviso de envio se anuncia a los lectores de pantalla', () => {
  assert.match(partial, /role="status"/);
  assert.match(partial, /aria-busy/);
});

test('el spinner se pinta con la paleta del sitio', () => {
  assert.match(estilos, /\.envio-spinner\b/);
  assert.match(estilos, /@keyframes\s+giro-envio/);
});

// Windows con los efectos de animacion desactivados entra por esta rama, asi que la ve mas
// gente de la que parece. Parar el aro del todo la dejaba sin ninguna senal de que el envio
// seguia vivo: se frena, pero no se para.
test('con prefers-reduced-motion el aro se frena pero no se para', () => {
  const bloque = estilos.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/);
  assert.ok(bloque, 'no hay bloque de prefers-reduced-motion');
  assert.doesNotMatch(bloque[0], /animation:\s*none|animation-name:\s*none/);
  assert.match(bloque[0], /animation-duration:/);
});
