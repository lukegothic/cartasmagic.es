const test = require('node:test');
const assert = require('node:assert');
const { derivarAcciones } = require('../lib/acciones');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

const paginaHub = { dominio: HUB, ruta: '/', fichero: 'apps/hub/routes/main.js', numeroLinea: 60 };
const paginaVender = {
  dominio: VENDER,
  ruta: '/',
  fichero: 'apps/vender/routes/main.js',
  numeroLinea: 75
};

const vacio = { malDominio: [], sinDuenno: [], ctrBajo: [] };
const indice = { porKeyword: new Map(), paginas: [paginaHub, paginaVender] };

test('sin hallazgos no propone nada', () => {
  assert.deepEqual(derivarAcciones(vacio, indice), []);
});

// Lo que hace util el informe: la accion trae el fichero y la linea, para aplicarla sin
// tener que ir a buscar donde estaba declarada la keyword.
test('la accion de mover trae la ubicacion de quien la declara', () => {
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 10,
        actual: { dominio: VENDER, posicion: 15.3 },
        deberia: HUB
      }
    ]
  };
  const porKeyword = new Map([['tasar cartas magic', [paginaHub]]]);
  const [accion] = derivarAcciones(hallazgos, { porKeyword, paginas: indice.paginas });

  assert.match(accion.titulo, /Mover "tasar cartas magic" a cartasmagic\.es/);
  assert.deepEqual(accion.donde, [{ fichero: 'apps/hub/routes/main.js', numeroLinea: 60 }]);
  assert.match(accion.hacer, /Quitarla del meta keywords de \//);
});

test('si nadie la declara, dice que hay que anadirla en vez de quitarla', () => {
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'cartas magic antiguas',
        impresiones: 25,
        actual: { dominio: VENDER, posicion: 16.1 },
        deberia: HUB
      }
    ]
  };
  const [accion] = derivarAcciones(hallazgos, indice);

  assert.deepEqual(accion.donde, []);
  assert.match(accion.hacer, /Anadirla al meta keywords/);
});

test('la accion de reclamar apunta a una pagina del dominio que toca', () => {
  const hallazgos = {
    ...vacio,
    sinDuenno: [
      {
        consulta: 'vender cartas',
        impresiones: 97,
        clics: 0,
        mejor: { dominio: VENDER, posicion: 16.1 },
        deberia: VENDER
      }
    ]
  };
  const [accion] = derivarAcciones(hallazgos, indice);

  assert.match(accion.titulo, /Reclamar "vender cartas"/);
  assert.equal(accion.donde[0].fichero, 'apps/vender/routes/main.js');
  assert.equal(accion.donde[0].numeroLinea, 75);
});

test('el orden es primero lo que cuesta mas trafico', () => {
  const hallazgos = {
    malDominio: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 10,
        actual: { dominio: VENDER, posicion: 15.3 },
        deberia: HUB
      }
    ],
    sinDuenno: [
      {
        consulta: 'vender cartas',
        impresiones: 97,
        clics: 0,
        mejor: { dominio: VENDER, posicion: 16.1 },
        deberia: VENDER
      }
    ],
    ctrBajo: [
      {
        consulta: 'venta cartas magic',
        impresiones: 44,
        clics: 1,
        mejor: { dominio: VENDER, posicion: 8.6 },
        reclaman: [paginaVender]
      }
    ]
  };
  const acciones = derivarAcciones(hallazgos, indice);

  assert.equal(acciones.length, 3);
  assert.match(acciones[0].titulo, /^Mover/);
  assert.match(acciones[1].titulo, /^Reclamar/);
  assert.match(acciones[2].titulo, /^Reescribir/);
});

// Con este volumen una lista de cincuenta acciones no se lee, y por debajo del corte las
// cifras ya no distinguen una senal de una casualidad.
test('recorta las listas largas', () => {
  const huerfana = (i) => ({
    consulta: `consulta ${i}`,
    impresiones: 50 - i,
    clics: 0,
    mejor: { dominio: VENDER, posicion: 12 },
    deberia: VENDER
  });
  const acciones = derivarAcciones(
    { ...vacio, sinDuenno: Array.from({ length: 30 }, (_, i) => huerfana(i)) },
    indice
  );

  assert.equal(acciones.length, 10);
});
