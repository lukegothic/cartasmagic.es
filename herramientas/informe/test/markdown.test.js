const test = require('node:test');
const assert = require('node:assert');
const { componerMarkdown } = require('../lib/markdown');

// docs/reparto-keywords.md leaves buy intent without a domain on purpose. The gaps section
// still presented it as impressions waiting for a page to claim them, which reads as work
// to do. The demand stays visible, as information.
const withOrphans = (sinDuenno) =>
  componerMarkdown({
    ventana: { desde: '2026-07-10', hasta: '2026-10-07' },
    indice: { paginas: [], porKeyword: new Map() },
    hallazgos: { canibalizacion: [], malDominio: [], sinDuenno, ctrBajo: [], muertas: [] },
    consultas: [],
    porDominio: [],
    llms: [],
    embudo: null,
    previas: []
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
