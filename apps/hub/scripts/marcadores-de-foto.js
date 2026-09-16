// Escribe un marcador por cada foto que sigue pendiente en docs/fotos-pendientes.md.
//
//   node scripts/marcadores-de-foto.js
//
// La lista de pendientes manda: el script no lleva rutas propias. Al copiar una foto de
// verdad y borrar su linea de la guia, este script deja de escribir su marcador, y con
// --limpiar se borra el que quedo de la vez anterior.
//
// Los marcadores se guardan en el repositorio como los graficos, porque el servidor solo
// sirve ficheros. No pueden llegar a produccion: eso lo comprueba test/marcadores.test.js.

const fs = require('node:fs');
const path = require('node:path');

const { marcadorDeFoto } = require('../lib/marcador-de-foto');

const PUBLICO = path.join(__dirname, '..', 'public');
const PENDIENTES = path.join(__dirname, '..', '..', '..', 'docs', 'fotos-pendientes.md');

// La misma forma de linea que reconoce test/fotos-existen.test.js, seguida de las lineas
// sangradas de su ficha. De la ficha se saca el **Que:**, que es la descripcion del
// encuadre; el **Donde:** dice en que parte del articulo va y aqui no hace falta.
// El retorno de carro es obligatorio: el documento se edita en Windows y se guarda con
// CRLF, asi que sin el la ficha de cada foto no engancha y no se escribe ni un marcador.
const TAREA = /^- \[ \] `(\/blog\/[^`]+)`\r?\n((?:[ \t]+.*(?:\r?\n)?)*)/gm;

const descripcionDe = (ficha) => {
  const marca = ficha.match(/\*\*Qué:\*\*\s*([\s\S]*?)(?=\n\s*\*\*|$)/);
  if (!marca) return null;
  return marca[1].replace(/\s+/g, ' ').trim();
};

// El marcador se escribe como SVG aunque la foto vaya a ser un JPEG: se dibuja con texto,
// no hay que arrastrar una libreria de imagen y el articulo ya enlaza SVG y JPEG por igual.
//
// El sufijo .pendiente.svg no es decorativo: es lo que .dockerignore busca para dejar los
// marcadores fuera de la imagen. Al cambiarlo hay que cambiar tambien la regla de ahi.
const rutaDelMarcador = (ruta) => ruta.replace(/\.jpg$/, '.pendiente.svg');

const fotosPendientes = () => {
  const texto = fs.readFileSync(PENDIENTES, 'utf8');

  return [...texto.matchAll(TAREA)].map(([, ruta, ficha]) => ({
    ruta,
    descripcion: descripcionDe(ficha)
  }));
};

const escribir = ({ ruta, descripcion }) => {
  const destino = path.join(PUBLICO, rutaDelMarcador(ruta));
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, marcadorDeFoto({ ruta, descripcion }));
  return path.relative(path.join(__dirname, '..'), destino);
};

const main = () => {
  const pendientes = fotosPendientes();

  const sinDescripcion = pendientes.filter(({ descripcion }) => !descripcion);
  if (sinDescripcion.length) {
    console.error('estas fotos no traen un **Qué:** en la guia de rodaje:');
    for (const { ruta } of sinDescripcion) console.error(`  ${ruta}`);
    process.exitCode = 1;
    return;
  }

  for (const foto of pendientes) console.log(`escrito ${escribir(foto)}`);
  console.log(`${pendientes.length} marcadores`);
};

main();
