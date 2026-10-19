// Regenera data/codigos-postales.tsv desde el volcado de GeoNames para España:
//   curl -O https://download.geonames.org/export/zip/ES.zip && unzip ES.zip
//   node scripts/codigos-postales.js ruta/a/ES.txt
// GeoNames lo publica con licencia CC BY 4.0, que pide citarlos: por eso la cabecera.
const fs = require('node:fs');
const path = require('node:path');

const [origen] = process.argv.slice(2);
if (!origen) {
  console.error('Uso: node scripts/codigos-postales.js ruta/a/ES.txt');
  process.exit(1);
}

const CABECERA = '# Códigos postales de España. Fuente: GeoNames (www.geonames.org), CC BY 4.0';
const DESTINO = path.join(__dirname, '..', 'data', 'codigos-postales.tsv');

const filas = fs.readFileSync(origen, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((linea) => linea.split('\t'))
  .map(([, codigo, localidad]) => `${codigo}\t${localidad.trim()}`);

const unicas = [...new Set(filas)].sort();

fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
fs.writeFileSync(DESTINO, [CABECERA, ...unicas, ''].join('\n'));
console.log(`${unicas.length} filas en ${DESTINO}`);
