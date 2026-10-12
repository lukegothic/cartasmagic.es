const test = require('node:test');
const assert = require('node:assert');
const { derivarAcciones } = require('../lib/acciones');

const derivar = (...args) => derivarAcciones(...args).acciones;
const motivos = (...args) => derivarAcciones(...args).descartes.map(({ consulta, motivo }) => [consulta, motivo]);

const HUB = 'cartasmagic.es';
const VENDER = 'vendercartasmagic.es';

const paginaHub = { dominio: HUB, ruta: '/', fichero: 'apps/hub/lib/metadatos.js', numeroLinea: 60 };
const paginaVender = {
  dominio: VENDER,
  ruta: '/',
  fichero: 'apps/vender/lib/metadatos.js',
  numeroLinea: 75
};

const vacio = { canibalizacion: [], malDominio: [], sinDuenno: [], ctrBajo: [] };
const indice = { porKeyword: new Map(), paginas: [paginaHub, paginaVender] };

test('sin hallazgos no propone nada', () => {
  assert.deepEqual(derivar(vacio, indice), []);
});

// Lo que hace util el informe: la accion trae el fichero y la linea, para aplicarla sin
// tener que ir a buscar donde estaba declarada la keyword.
test('la accion de mover trae la ubicacion de quien la declara', () => {
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 50,
        actual: { dominio: VENDER, posicion: 15.3 },
        deberia: HUB
      }
    ]
  };
  // La declara vender, que es justo el dominio al que no le toca: por eso hay que moverla.
  const porKeyword = new Map([['tasar cartas magic', [paginaVender]]]);
  const [accion] = derivar(hallazgos, { porKeyword, paginas: indice.paginas });

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
        impresiones: 50,
        actual: { dominio: VENDER, posicion: 16.1 },
        deberia: HUB
      }
    ]
  };
  const [accion] = derivar(hallazgos, indice);

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
  const [accion] = derivar(hallazgos, indice);

  assert.match(accion.titulo, /Reclamar "vender cartas"/);
  assert.equal(accion.donde[0].fichero, 'apps/vender/lib/metadatos.js');
  assert.equal(accion.donde[0].numeroLinea, 75);
});

test('el orden es el de demanda, sea cual sea el tipo', () => {
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 40,
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
        mejor: { dominio: VENDER, impresiones: 44, clics: 1, posicion: 8.6 },
        reclaman: [paginaVender]
      }
    ]
  };
  const acciones = derivar(hallazgos, indice);

  assert.equal(acciones.length, 3);
  assert.match(acciones[0].titulo, /^Reclamar/);
  assert.match(acciones[1].titulo, /^Reescribir/);
  assert.match(acciones[2].titulo, /^Mover/);
});

// Con este volumen una lista de cincuenta acciones no se lee, y por debajo del corte las
// cifras ya no distinguen una senal de una casualidad.
test('recorta las listas largas, y las recortadas salen descartadas', () => {
  const huerfana = (i) => ({
    consulta: `consulta ${i}`,
    impresiones: 100 - i,
    clics: 0,
    mejor: { dominio: VENDER, posicion: 12 },
    deberia: VENDER
  });
  const resultado = derivarAcciones(
    { ...vacio, sinDuenno: Array.from({ length: 30 }, (_, i) => huerfana(i)) },
    indice
  );

  assert.equal(resultado.acciones.length, 10);
  assert.equal(resultado.descartes.length, 20);
  assert.ok(resultado.descartes.every(({ motivo }) => motivo === 'OVER_LIST_LIMIT'));
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
  const acciones = derivar(hallazgos, indice, ['huerfana:vender cartas']);
  const porFirma = new Map(acciones.map((a) => [a.firma, a]));

  assert.equal(porFirma.get('huerfana:vender cartas').esNueva, false);
  assert.equal(porFirma.get('huerfana:venta cartas magic').esNueva, true);
});

// Si quien declara la keyword ya es el dominio correcto, no hay nada que mover: lo que
// pasa es que la pagina todavia no rankea. Decir "quitala de X y anadela en X" mandaba a
// borrar una declaracion que estaba bien.
test('si ya la declara el dominio que toca, no manda moverla', () => {
  const hallazgos = {
    ...vacio,
    malDominio: [
      {
        consulta: 'tasar cartas magic',
        impresiones: 50,
        actual: { dominio: VENDER, posicion: 15.3 },
        deberia: HUB
      }
    ]
  };
  const porKeyword = new Map([['tasar cartas magic', [paginaHub]]]);
  const [accion] = derivar(hallazgos, { porKeyword, paginas: [paginaHub, paginaVender] });

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

  assert.deepEqual(derivar(hallazgos, indice), []);
  assert.deepEqual(motivos(hallazgos, indice), [['compra cartas magic', 'NO_OWNER_DOMAIN']]);
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

  const contexto = { porKeyword, paginas: [articulo] };

  assert.deepEqual(derivar(hallazgos, contexto, [], ventana), []);
  assert.deepEqual(motivos(hallazgos, contexto, [], ventana), [['cartas magic antiguas', 'PAGE_NEWER_THAN_WINDOW']]);
});

test('una canibalizacion con la pagina nueva tambien sale descartada por eso', () => {
  const articulo = { dominio: HUB, ruta: '/blog/x', fichero: 'x.md', numeroLinea: 5, fecha: '2026-09-05' };
  const hallazgos = {
    ...vacio,
    canibalizacion: [
      {
        consulta: 'cartas magic antiguas',
        impresiones: 50,
        apariciones: [
          { dominio: VENDER, impresiones: 50, clics: 0, posicion: 12 },
          { dominio: HUB, impresiones: 30, clics: 0, posicion: 18 }
        ],
        deberia: HUB
      }
    ]
  };
  const contexto = { porKeyword: new Map([['cartas magic antiguas', [articulo]]]), paginas: [articulo] };
  const ventana = { desde: '2026-06-17', hasta: '2026-09-15' };

  assert.deepEqual(motivos(hallazgos, contexto, [], ventana), [['cartas magic antiguas', 'PAGE_NEWER_THAN_WINDOW']]);
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
        impresiones: 50,
        actual: { dominio: VENDER, posicion: 16.6 },
        deberia: HUB
      }
    ]
  };
  const porKeyword = new Map([['cartas magic antiguas', [articulo]]]);
  const ventana = { desde: '2026-09-06', hasta: '2026-12-05' };

  const [accion] = derivar(hallazgos, { porKeyword, paginas: [articulo] }, [], ventana);

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
        impresiones: 50,
        actual: { dominio: VENDER, posicion: 15.3 },
        deberia: HUB
      }
    ]
  };
  const porKeyword = new Map([['tasar cartas magic', [paginaVender]]]);
  const ventana = { desde: '2026-06-17', hasta: '2026-09-15' };

  const acciones = derivar(hallazgos, { porKeyword, paginas: indice.paginas }, [], ventana);

  assert.equal(acciones.length, 1);
});

// Hasta el 26 de septiembre de 2026 la canibalizacion entre dominios se calculaba y se
// firmaba, pero no llegaba ni a las acciones ni al markdown: el correo avisaba de un
// cambio y el adjunto decia que no habia nada que hacer.
test('los dos dominios compitiendo se convierte en accion sobre el que no toca', () => {
  const hallazgos = {
    ...vacio,
    canibalizacion: [
      {
        consulta: 'vender magic',
        impresiones: 50,
        apariciones: [
          { dominio: VENDER, impresiones: 40, clics: 1, posicion: 17 },
          { dominio: HUB, impresiones: 50, clics: 0, posicion: 12 }
        ],
        deberia: VENDER
      }
    ]
  };
  const porKeyword = new Map([['vender magic', [paginaVender]]]);
  const [accion] = derivar(hallazgos, { porKeyword, paginas: indice.paginas }, ['canibal:vender magic']);

  assert.equal(accion.firma, 'canibal:vender magic');
  assert.equal(accion.esNueva, false);
  assert.match(accion.porque, /quien rankea es cartasmagic\.es/);
});

// La intencion de compra no es de nadie, asi que tampoco hay dominio al que darle la razon.
test('la canibalizacion sin dominio que toque no se propone', () => {
  const hallazgos = {
    ...vacio,
    canibalizacion: [
      {
        consulta: 'compra cartas magic',
        impresiones: 12,
        apariciones: [
          { dominio: VENDER, impresiones: 9, clics: 0, posicion: 16 },
          { dominio: HUB, impresiones: 3, clics: 0, posicion: 19 }
        ],
        deberia: null
      }
    ]
  };

  assert.deepEqual(derivar(hallazgos, indice), []);
  assert.deepEqual(motivos(hallazgos, indice), [['compra cartas magic', 'NO_OWNER_DOMAIN']]);
});

// "vender magic" en septiembre de 2026: vender la declara y va delante, y el hub asoma con
// una impresion. No hay nada que ganar ni que quitar, y la accion decia que quien
// rankeaba era el hub.
test('si el dominio que toca la declara y ya va delante, no propone nada', () => {
  const hallazgos = {
    ...vacio,
    canibalizacion: [
      {
        consulta: 'vender magic',
        impresiones: 19,
        apariciones: [
          { dominio: VENDER, impresiones: 18, clics: 3, posicion: 13.5 },
          { dominio: HUB, impresiones: 1, clics: 0, posicion: 18 }
        ],
        deberia: VENDER
      }
    ]
  };
  const porKeyword = new Map([['vender magic', [paginaVender]]]);

  const contexto = { porKeyword, paginas: indice.paginas };

  assert.deepEqual(derivar(hallazgos, contexto), []);
  assert.deepEqual(motivos(hallazgos, contexto), [['vender magic', 'OWNER_ALREADY_FIRST']]);
});
