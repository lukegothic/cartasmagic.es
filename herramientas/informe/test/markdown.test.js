const test = require('node:test');
const assert = require('node:assert');
const { componerMarkdown } = require('../lib/markdown');
const { bloqueGSC } = require('../lib/informe');

// docs/reparto-keywords.md leaves buy intent without a domain on purpose. The gaps section
// still presented it as impressions waiting for a page to claim them, which reads as work
// to do. The demand stays visible, as information.
const withOrphans = (sinDuenno) =>
  componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    acciones: [],
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno, ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [],
    llms: [],
    embudo: null
  });

const gapsSection = (markdown) => markdown.split('## Huecos de contenido')[1].split('\n## ')[0];

const orphan = (consulta, impresiones) => ({
  consulta,
  impresiones,
  clics: 0,
  mejor: { dominio: 'vendercartasmagic.es', posicion: 9 },
  deberia: null
});

test('buy-intent orphans are shown as deliberately unassigned, not as a gap to claim', () => {
  const section = gapsSection(withOrphans([orphan('venta cartas magic', 34), orphan('comprar cartas magic', 12)]));

  assert.doesNotMatch(section, /sin pagina que las reclame/);
  assert.match(section, /compra/);
  assert.match(section, /sin dominio a proposito/);
  assert.match(section, /venta cartas magic/);
  assert.match(section, /comprar cartas magic/);
});

test('orphans with another intent are still a gap to claim', () => {
  const section = gapsSection(withOrphans([orphan('vender cartas', 39), orphan('venta cartas magic', 34)]));

  assert.match(section, /\*\*venta\*\*: 39 impresiones sin pagina que las reclame/);
});

test('the raw data page table lists "/" once when GSC returned several URL variants', async () => {
  const urlRows = [
    { claves: ['https://cartasmagic.es/'], clics: 10, impresiones: 100, ctr: 0.1, posicion: 5 },
    { claves: ['http://cartasmagic.es/'], clics: 2, impresiones: 300, ctr: 0.0067, posicion: 9 },
    { claves: ['https://www.cartasmagic.es/?utm_source=newsletter'], clics: 1, impresiones: 100, ctr: 0.01, posicion: 3 }
  ];
  const askGSC = async (_auth, _domain, { dimensiones }) => (dimensiones?.[0] === 'page' ? urlRows : []);
  const { paginas, total, consultas } = await bloqueGSC(null, 'cartasmagic.es', { desde: 'a', hasta: 'b' }, askGSC);

  const markdown = componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    acciones: [],
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno: [], ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [{ dominio: 'cartasmagic.es', total, consultas, paginas }],
    llms: [],
    embudo: null,
    previas: []
  });
  const pageRows = markdown.split('#### Paginas')[1].split('\n').filter((line) => line.startsWith('| /'));

  assert.equal(pageRows.length, 1);
});

const action = {
  firma: 'canibal:vender cartas',
  impresiones: 50,
  apariciones: [
    { dominio: 'cartasmagic.es', impresiones: 50, clics: 0, posicion: 12 },
    { dominio: 'vendercartasmagic.es', impresiones: 44, clics: 2, posicion: 16.5 }
  ],
  titulo: 'Mover "vender cartas" a vendercartasmagic.es',
  porque: '50 impresiones de demanda',
  donde: [],
  hacer: 'Anadirla al meta keywords',
  esNueva: true,
  esRuido: false
};

const actionsSection = (acciones) =>
  componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    acciones,
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno: [], ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [],
    llms: [],
    embudo: null
  })
    .split('## Acciones')[1]
    .split('\n## ')[0];

test('the actions heading says they are ordered by Demand', () => {
  assert.match(actionsSection([action]), /Ordenadas por demanda\./);
});

test('each action shows impressions and position labelled with their domain', () => {
  const section = actionsSection([action]);

  assert.match(section, /cartasmagic\.es: 50 impr, pos 12,0/);
  assert.match(section, /vendercartasmagic\.es: 44 impr, pos 16,5/);
});
