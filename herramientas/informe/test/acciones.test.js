const test = require('node:test');
const assert = require('node:assert');
const { derivarAcciones } = require('../lib/acciones');

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

const paginaHub = { dominio: HUB, ruta: '/', fichero: 'apps/hub/lib/metadatos.js', numeroLinea: 60 };
const paginaVender = {
  dominio: VENDER,
  ruta: '/',
  fichero: 'apps/vender/lib/metadatos.js',
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
  // La declara vender, que es justo el dominio al que no le toca: por eso hay que moverla.
  const porKeyword = new Map([['tasar cartas magic', [paginaVender]]]);
  const [accion] = derivarAcciones(hallazgos, { porKeyword, paginas: indice.paginas });

  assert.match(accion.titulo, /Mover "tasar cartas magic" a cartasmagic\.es/);
  assert.deepEqual(accion.donde, [{ fichero: 'apps/vender/lib/metadatos.js', numeroLinea: 75 }]);
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
  assert.equal(accion.donde[0].fichero, 'apps/vender/lib/metadatos.js');
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

// El adjunto llega cada dia con las mismas acciones hasta que se aplican. Sin marcar
// cuales son nuevas, no hay forma de distinguir lo que ya se hizo de lo que falta.
test('marca como nueva la accion que ayer no estaba', () => {
  const hallazgos = {
    ...vacio,
    sinDuenno: [
      {
        consulta: 'vender cartas',
        impresiones: 97,
        clics: 0,
        mejor: { dominio: VENDER, posicion: 16.1 },
        deberia: VENDER
      },
      {
        consulta: 'venta cartas magic',
        impresiones: 44,
        clics: 1,
        mejor: { dominio: VENDER, posicion: 8.6 },
        deberia: VENDER
      }
    ]
  };
  // Ayer solo estaba "vender cartas", asi que la otra es la nueva.
  const acciones = derivarAcciones(hallazgos, indice, ['huerfana:vender cartas']);
  const porFirma = new Map(acciones.map((a) => [a.firma, a]));

  assert.equal(porFirma.get('huerfana:vender cartas').esNueva, false);
  assert.equal(porFirma.get('huerfana:venta cartas magic').esNueva, true);
});

// Con 48 visitas al mes una consulta de 10 impresiones no distingue una senal de una
// casualidad. La accion tiene que decirlo, no presentarse como una orden.
test('avisa cuando la accion se apoya en pocas impresiones', () => {
  const flojo = {
    ...vacio,
    sinDuenno: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 10,
        clics: 0,
        mejor: { dominio: VENDER, posicion: 15 },
        deberia: HUB
      }
    ]
  };
  const solido = {
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

  assert.equal(derivarAcciones(flojo, indice)[0].esRuido, true);
  assert.equal(derivarAcciones(solido, indice)[0].esRuido, false);
});

// Si quien declara la keyword ya es el dominio correcto, no hay nada que mover: lo que
// pasa es que la pagina todavia no rankea. Decir "quitala de X y anadela en X" mandaba a
// borrar una declaracion que estaba bien.
test('si ya la declara el dominio que toca, no manda moverla', () => {
  const hallazgos = {
    malDominio: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 10,
        actual: { dominio: VENDER, posicion: 15.3 },
        deberia: HUB
      }
    ],
    sinDuenno: [],
    ctrBajo: []
  };
  const porKeyword = new Map([['tasar cartas magic', [paginaHub]]]);
  const [accion] = derivarAcciones(hallazgos, { porKeyword, paginas: [paginaHub, paginaVender] });

  assert.doesNotMatch(accion.hacer, /Quitarla/);
  assert.match(accion.titulo, /^Ganar posicion para "tasar cartas magic" en cartasmagic\.es$/);
  assert.deepEqual(accion.donde, [{ fichero: paginaHub.fichero, numeroLinea: paginaHub.numeroLinea }]);
});

// Una consulta que el reparto deja sin dominio a proposito (la intencion de compra) no
// genera accion: no hay pagina a la que anadirla, y colgarla del dominio que hoy rankea
// era mandar a quien quiere comprar al formulario de venta.
test('lo que el reparto deja sin dominio no se propone reclamar', () => {
  const hallazgos = {
    ...vacio,
    sinDuenno: [
      {
        consulta: 'compra cartas magic',
        impresiones: 12,
        clics: 0,
        mejor: { dominio: VENDER, posicion: 15.8 },
        deberia: null
      }
    ]
  };

  assert.deepEqual(derivarAcciones(hallazgos, indice), []);
});

// El informe del 15 de septiembre de 2026 mando reforzar un articulo publicado el dia 5
// con datos de una ventana que arrancaba el 17 de junio: 80 de los 90 dias medidos son
// anteriores a que la pagina existiera. Quien rankeaba lo hacia por ser el unico que
// habia, no por estar mejor optimizado, y la accion pedia tocar un copy que ya llevaba
// la keyword en el H1.
test('no propone ganar posicion si la pagina se publico despues de empezar la ventana', () => {
  const articulo = {
    dominio: HUB,
    ruta: '/blog/que-colecciones-antiguas-valen-dinero',
    fichero: 'apps/hub/content/que-colecciones-antiguas-valen-dinero.md',
    numeroLinea: 5,
    fecha: '2026-09-05'
  };
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'cartas magic antiguas',
        impresiones: 25,
        actual: { dominio: VENDER, posicion: 16.6 },
        deberia: HUB
      }
    ]
  };
  const porKeyword = new Map([['cartas magic antiguas', [articulo]]]);
  const ventana = { desde: '2026-06-17', hasta: '2026-09-15' };

  const acciones = derivarAcciones(hallazgos, { porKeyword, paginas: [articulo] }, [], ventana);

  assert.deepEqual(acciones, []);
});

// La misma pagina, ya con la ventana entera por detras, si se juzga.
test('una vez la ventana cubre toda la vida de la pagina, la accion vuelve', () => {
  const articulo = {
    dominio: HUB,
    ruta: '/blog/que-colecciones-antiguas-valen-dinero',
    fichero: 'apps/hub/content/que-colecciones-antiguas-valen-dinero.md',
    numeroLinea: 5,
    fecha: '2026-09-05'
  };
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'cartas magic antiguas',
        impresiones: 25,
        actual: { dominio: VENDER, posicion: 16.6 },
        deberia: HUB
      }
    ]
  };
  const porKeyword = new Map([['cartas magic antiguas', [articulo]]]);
  const ventana = { desde: '2026-09-06', hasta: '2026-12-05' };

  const [accion] = derivarAcciones(hallazgos, { porKeyword, paginas: [articulo] }, [], ventana);

  assert.match(accion.titulo, /Ganar posicion para "cartas magic antiguas"/);
});

// Sin ventana, o con paginas que no declaran fecha (los metadatos de las apps), nada
// cambia: el filtro solo se aplica donde hay una fecha que comparar.
test('las paginas sin fecha declarada se siguen proponiendo', () => {
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
  const porKeyword = new Map([['tasar cartas magic', [paginaVender]]]);
  const ventana = { desde: '2026-06-17', hasta: '2026-09-15' };

  const acciones = derivarAcciones(hallazgos, { porKeyword, paginas: indice.paginas }, [], ventana);

  assert.equal(acciones.length, 1);
});
