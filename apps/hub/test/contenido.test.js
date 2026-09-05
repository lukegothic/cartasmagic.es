const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { leerEntradas, formatearFecha } = require('../lib/contenido');

// Cada caso trabaja sobre su propio directorio para que el orden de ejecucion no
// importe y los ficheros de un test no se cuelen en otro.
const conDirectorio = (ficheros) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-contenido-'));
  Object.entries(ficheros).forEach(([nombre, texto]) => {
    fs.writeFileSync(path.join(dir, nombre), texto);
  });
  return dir;
};

const ARTICULO = `---
titulo: Cómo saber cuánto vale una carta Magic
descripcion: Los siete factores que fijan el precio
fecha: 2026-09-05
---

## Los factores

El primero es la edición.
`;

test('lee una entrada con su frontmatter y su cuerpo en HTML', () => {
  const dir = conDirectorio({ 'valor-carta.md': ARTICULO });

  const [entrada] = leerEntradas(dir);

  assert.equal(entrada.slug, 'valor-carta');
  assert.equal(entrada.titulo, 'Cómo saber cuánto vale una carta Magic');
  assert.equal(entrada.descripcion, 'Los siete factores que fijan el precio');
  assert.equal(entrada.fecha, '2026-09-05');
  assert.match(entrada.html, /<h2>Los factores<\/h2>/);
});

test('ordena las entradas de la más reciente a la más antigua', () => {
  const dir = conDirectorio({
    'antigua.md': '---\ntitulo: Antigua\ndescripcion: d\nfecha: 2026-01-01\n---\n\nTexto.\n',
    'reciente.md': '---\ntitulo: Reciente\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'media.md': '---\ntitulo: Media\ndescripcion: d\nfecha: 2026-05-01\n---\n\nTexto.\n'
  });

  assert.deepEqual(
    leerEntradas(dir).map((e) => e.titulo),
    ['Reciente', 'Media', 'Antigua']
  );
});

test('descarta las entradas marcadas como borrador', () => {
  const dir = conDirectorio({
    'publicada.md': '---\ntitulo: Publicada\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'borrador.md': '---\ntitulo: Borrador\ndescripcion: d\nfecha: 2026-09-05\nborrador: true\n---\n\nTexto.\n'
  });

  assert.deepEqual(
    leerEntradas(dir).map((e) => e.titulo),
    ['Publicada']
  );
});

// El pipeline automatizado escribe estos ficheros sin supervision: una entrada a medio
// generar no puede tumbar el sitio entero ni publicarse con el titulo vacio.
test('descarta las entradas sin titulo, descripcion o fecha', () => {
  const dir = conDirectorio({
    'buena.md': '---\ntitulo: Buena\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'sin-titulo.md': '---\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'sin-fecha.md': '---\ntitulo: Sin fecha\ndescripcion: d\n---\n\nTexto.\n',
    'sin-descripcion.md': '---\ntitulo: Sin descripcion\nfecha: 2026-09-05\n---\n\nTexto.\n'
  });

  assert.deepEqual(
    leerEntradas(dir).map((e) => e.titulo),
    ['Buena']
  );
});

test('descarta las entradas con una fecha que no es una fecha', () => {
  const dir = conDirectorio({
    'mala.md': '---\ntitulo: Mala\ndescripcion: d\nfecha: pasado mañana\n---\n\nTexto.\n'
  });

  assert.deepEqual(leerEntradas(dir), []);
});

// Los slugs salen del nombre del fichero y acaban en la URL. Uno con caracteres raros
// produciria una URL que no coincide con su propio canonical.
test('descarta los ficheros cuyo nombre no sirve como slug', () => {
  const dir = conDirectorio({
    'slug-valido.md': '---\ntitulo: Valido\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'Slug Inválido.md': '---\ntitulo: Invalido\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n'
  });

  assert.deepEqual(
    leerEntradas(dir).map((e) => e.slug),
    ['slug-valido']
  );
});

test('ignora los ficheros que no son markdown', () => {
  const dir = conDirectorio({
    'articulo.md': '---\ntitulo: Articulo\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'notas.txt': 'Esto no es una entrada.',
    'borrador.md.bak': 'Ni esto.'
  });

  assert.equal(leerEntradas(dir).length, 1);
});

test('devuelve una lista vacia si el directorio no existe', () => {
  assert.deepEqual(leerEntradas(path.join(os.tmpdir(), 'no-existe-jamas')), []);
});

// El contenido lo genera un LLM: si un articulo trae HTML, se escapa en vez de pintarse.
test('escapa el HTML que venga dentro del markdown', () => {
  const dir = conDirectorio({
    'con-html.md': '---\ntitulo: Con HTML\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto <script>alert(1)</script> más texto.\n'
  });

  const [entrada] = leerEntradas(dir);

  assert.ok(!entrada.html.includes('<script>'));
  assert.match(entrada.html, /&lt;script&gt;/);
});

// Un frontmatter con YAML invalido (dos puntos sin comillas, por ejemplo) no puede
// tumbar el blog entero: la entrada rota se descarta y las demas se publican.
test('descarta las entradas con el frontmatter roto sin arrastrar a las demas', () => {
  const dir = conDirectorio({
    'buena.md': '---\ntitulo: Buena\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n',
    'rota.md': '---\ntitulo: Estado: NM, LP\ndescripcion: d\nfecha: 2026-09-05\n---\n\nTexto.\n'
  });

  assert.deepEqual(
    leerEntradas(dir).map((e) => e.titulo),
    ['Buena']
  );
});

test('formatea la fecha en castellano', () => {
  assert.equal(formatearFecha('2026-09-05'), '5 de septiembre de 2026');
});

// Los enlaces a vender que se escriben dentro del markdown tienen que salir medidos
// igual que los de las plantillas, o el articulo que los lleve no se puede atribuir.
test('anade los parametros de medicion a los enlaces hacia vender', () => {
  const dir = conDirectorio({
    'valor.md':
      '---\ntitulo: T\ndescripcion: d\nfecha: 2026-09-05\n---\n\n' +
      'Mira [la valoracion](https://vendercartasmagic.es/valoracion-cartas-magic).\n'
  });

  const [entrada] = leerEntradas(dir);

  assert.match(entrada.html, /utm_source=cartasmagic/);
  assert.match(entrada.html, /utm_campaign=articulo-valor/);
});

test('no toca los enlaces internos del propio hub', () => {
  const dir = conDirectorio({
    'a.md':
      '---\ntitulo: T\ndescripcion: d\nfecha: 2026-09-05\n---\n\n' +
      'Ver [la otra guia](/blog/otra-guia).\n'
  });

  const [entrada] = leerEntradas(dir);

  assert.match(entrada.html, /href="\/blog\/otra-guia"/);
  assert.ok(!entrada.html.includes('utm_'));
});
