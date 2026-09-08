const { test, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Las fotos de los articulos viven en public/blog/<slug>/, que es la misma ruta que
// sirven las rutas del blog. express.static va antes que las rutas y redirige cualquier
// URL que coincida con un directorio real, asi que estas comprobaciones tienen que pasar
// por HTTP: leyendo los ficheros no se ve la colision.

// El puerto es fijo porque el servidor anuncia por consola el que le pidieron, no el que
// acaba escuchando: con PORT=0 no habria forma de saber a donde apuntar. Se puede mover
// desde fuera si en la maquina que corre los tests ese puerto esta ocupado.
const PUERTO = Number(process.env.PUERTO_TEST) || 3987;
const BASE = `http://127.0.0.1:${PUERTO}`;
let servidor;

before(async () => {
  servidor = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PUERTO) },
    stdio: 'ignore'
  });

  for (let intento = 0; intento < 50; intento += 1) {
    try {
      await fetch(`${BASE}/health`);
      return;
    } catch {
      await new Promise((cumplir) => setTimeout(cumplir, 100));
    }
  }

  // Si no llego a levantarse queda un proceso suelto: after no corre cuando before
  // lanza, asi que se mata aqui antes de rendirse.
  servidor.kill();
  throw new Error('el servidor no llego a levantarse');
});

after(() => servidor?.kill());

test('el indice del blog responde sin redirigir', async () => {
  const respuesta = await fetch(`${BASE}/blog`, { redirect: 'manual' });
  assert.equal(respuesta.status, 200);
});

test('un articulo con fotos responde sin redirigir', async () => {
  const respuesta = await fetch(`${BASE}/blog/cartas-magic-falsas-como-detectarlas`, {
    redirect: 'manual'
  });

  assert.equal(respuesta.status, 200);
  assert.match(await respuesta.text(), /Cartas Magic falsas/);
});

test('las fotos de un articulo se sirven como imagen', async () => {
  const respuesta = await fetch(
    `${BASE}/blog/cartas-magic-falsas-como-detectarlas/punto-verde-autentica.jpg`
  );

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.headers.get('content-type'), 'image/jpeg');
});
