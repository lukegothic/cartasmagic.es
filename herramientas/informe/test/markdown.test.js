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
    descartes: [],
    vigilancia: [],
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
    descartes: [],
    vigilancia: [],
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno: [], ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [{ dominio: 'cartasmagic.es', total, consultas, paginas }],
    llms: [],
    embudo: null
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
  esNueva: true
};

const actionsSection = (acciones) =>
  componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    acciones,
    descartes: [],
    vigilancia: [],
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

const render = (extra) =>
  componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    acciones: [],
    descartes: [],
    vigilancia: [],
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno: [], ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [],
    llms: [],
    embudo: null,
    ...extra
  });

const sectionOf = (markdown, heading) => markdown.split(`\n## ${heading}`)[1].split('\n## ')[0];

const WATCHED = {
  titulo: 'Sin declarar "tasar cartas magic"',
  consulta: 'tasar cartas magic',
  impresiones: 25,
  apariciones: [
    { dominio: 'cartasmagic.es', impresiones: 25, clics: 0, posicion: 12 },
    { dominio: 'vendercartasmagic.es', impresiones: 18, clics: 0, posicion: 16.5 }
  ],
  motivo: 'TOO_LITTLE_DEMAND'
};

const NEWER_PAGE = {
  titulo: 'Dominio equivocado "cartas magic antiguas"',
  consulta: 'cartas magic antiguas',
  impresiones: 60,
  apariciones: [{ dominio: 'vendercartasmagic.es', impresiones: 60, clics: 0, posicion: 16.6 }],
  motivo: 'PAGE_NEWER_THAN_WINDOW'
};

test('the discards section lists each Candidate with its Discard reason code and Demand, next to an empty actions section', () => {
  const markdown = render({ descartes: [NEWER_PAGE, WATCHED] });

  assert.match(sectionOf(markdown, 'Acciones'), /Sin acciones pendientes/);
  const discards = sectionOf(markdown, 'Descartes');
  assert.match(discards, /Dominio equivocado "cartas magic antiguas" \| PAGE_NEWER_THAN_WINDOW \| 60/);
  assert.match(discards, /Sin declarar "tasar cartas magic" \| TOO_LITTLE_DEMAND \| 25/);
});

test('the discards section says so when nothing was discarded', () => {
  assert.match(sectionOf(render({}), 'Descartes'), /Ningun candidato descartado/);
});

test('the Watch list shows impressions and position per domain, with no Hacer line', () => {
  const section = sectionOf(render({ vigilancia: [WATCHED], descartes: [WATCHED] }), 'Vigilancia');

  assert.match(section, /tasar cartas magic/);
  assert.match(section, /cartasmagic\.es: 25 impr, pos 12,0/);
  assert.match(section, /vendercartasmagic\.es: 18 impr, pos 16,5/);
  assert.doesNotMatch(section, /Hacer/);
});

test('the report no longer mentions POCO VOLUMEN', () => {
  assert.doesNotMatch(render({ acciones: [action], vigilancia: [WATCHED], descartes: [WATCHED] }), /POCO VOLUMEN/);
});

test('each action shows impressions and position labelled with their domain', () => {
  const section = actionsSection([action]);

  assert.match(section, /cartasmagic\.es: 50 impr, pos 12,0/);
  assert.match(section, /vendercartasmagic\.es: 44 impr, pos 16,5/);
});

const alarm = {
  firma: 'embudo:vendercartasmagic.es:generate_lead:mas-eventos-que-el-anterior',
  dominio: 'vendercartasmagic.es',
  etiqueta: 'Lead'
};

const withAlarms = (alarmas) =>
  componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    acciones: [],
    descartes: [],
    vigilancia: [],
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno: [], ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [],
    llms: [],
    alarmas,
    embudo: null
  });

// On a weekday there is no funnel in the report, so the alarm has to say by itself why the
// email went out.
test('a Measurement alarm is named in the report even without the funnel section', () => {
  const markdown = withAlarms([alarm]);

  assert.match(markdown, /## Alarmas de medicion/);
  assert.match(markdown, /vendercartasmagic\.es: Lead tiene mas eventos que el paso anterior/);
});

test('no Measurement alarm section when none is raised', () => {
  assert.doesNotMatch(withAlarms([]), /Alarmas de medicion/);
});
