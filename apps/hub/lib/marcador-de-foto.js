// Dibuja el hueco de una foto que todavia no esta hecha.
//
// Cada foto pendiente esta descrita en docs/fotos-pendientes.md, pero mientras no exista el
// fichero el articulo sale con un hueco roto. Un marcador ocupa ese sitio con la medida
// definitiva, asi que la pagina se puede maquetar y revisar entera antes de tener la camara
// delante.
//
// A proposito no se parece a una foto: fondo plano, aspa y la descripcion del encuadre
// rotulada encima. Un marcador que pasa por foto acaba publicado, que es justo lo que hay
// que evitar.

const escapar = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Los mismos tonos que los graficos, un punto mas apagados: el marcador no compite con el
// texto del articulo, solo reserva el sitio.
const FONDO = '#15151f';
const TRAZO = '#2a2a3a';
const TINTA = '#9393a8';
const TINTA_SUAVE = '#5a5a70';

// El 4:3 horizontal que pide la especificacion comun de la guia de rodaje. El ancho es el
// de los graficos, para que las dos cosas ocupen la misma columna.
const ANCHO = 720;
const ALTO = 540;

// Parte un texto en lineas sin cortar palabras. El SVG no sabe justificar solo, asi que
// cada linea se coloca a mano.
const enLineas = (texto, porLinea) => {
  const lineas = [];
  let linea = '';

  for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
    const tentativa = linea ? `${linea} ${palabra}` : palabra;
    if (tentativa.length > porLinea && linea) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = tentativa;
    }
  }
  if (linea) lineas.push(linea);

  return lineas;
};

// El aspa ocupa el alto entero y deja claro de lejos que ahi no hay una foto.
const aspa = () => `
<rect x="1" y="1" width="${ANCHO - 2}" height="${ALTO - 2}" fill="none" stroke="${TRAZO}" \
stroke-width="2" stroke-dasharray="10 8"/>
<path d="M1 1 L${ANCHO - 1} ${ALTO - 1} M${ANCHO - 1} 1 L1 ${ALTO - 1}" stroke="${TRAZO}" \
stroke-width="2"/>`;

// El texto va sobre una banda opaca porque el aspa pasa justo por detras y sin ella las
// dos cosas se leen mal.
const banda = ({ lineas, ruta }) => {
  const alturaLinea = 26;
  const alto = lineas.length * alturaLinea + 84;
  const y = Math.round((ALTO - alto) / 2);
  const centro = ANCHO / 2;

  const rotulos = lineas
    .map(
      (linea, indice) =>
        `<text x="${centro}" y="${y + 66 + indice * alturaLinea}" fill="${TINTA}" \
font-size="17" text-anchor="middle">${escapar(linea)}</text>`
    )
    .join('\n');

  return `
<rect x="40" y="${y}" width="${ANCHO - 80}" height="${alto}" fill="${FONDO}"/>
<text x="${centro}" y="${y + 34}" fill="${TINTA_SUAVE}" font-size="13" \
letter-spacing="1.5" text-anchor="middle">FOTO PENDIENTE</text>
${rotulos}
<text x="${centro}" y="${y + alto - 18}" fill="${TINTA_SUAVE}" font-size="13" \
font-family="ui-monospace, monospace" text-anchor="middle">${escapar(ruta)}</text>`;
};

// La descripcion es la misma que la guia de rodaje da para esa foto: quien abra la pagina
// ve lo que va a ir ahi sin tener que buscar el documento.
const marcadorDeFoto = ({ ruta, descripcion }) => {
  if (!ruta) throw new Error('el marcador necesita la ruta de la foto');
  if (!descripcion) throw new Error(`el marcador de ${ruta} necesita una descripcion`);

  const lineas = enLineas(descripcion, 52);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" \
viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-labelledby="titulo" \
font-family="Inter, system-ui, sans-serif">
<title id="titulo">Foto pendiente: ${escapar(descripcion)}</title>
<rect width="${ANCHO}" height="${ALTO}" fill="${FONDO}"/>${aspa()}
${banda({ lineas, ruta })}
</svg>
`;
};

module.exports = { marcadorDeFoto, MARCA_DE_MARCADOR: 'FOTO PENDIENTE' };
