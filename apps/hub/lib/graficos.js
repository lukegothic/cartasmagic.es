// Genera los graficos de los articulos como SVG suelto.
//
// El markdown se renderiza con html:false, asi que un <svg> escrito en el articulo se
// escaparia y saldria como texto. Los graficos se sirven como fichero y se enlazan con la
// sintaxis de imagen de siempre, que ya lleva carga diferida y pie de foto.
//
// Sin interaccion a proposito: un SVG servido como <img> no ejecuta scripts ni responde al
// raton, asi que cada valor que haga falta leer va rotulado o queda en la tabla del
// articulo, nunca escondido en un tooltip.

// El sitio es de fondo oscuro y no tiene modo claro, asi que hay un solo juego de colores.
// El morado es el de la marca; el gris es el que ya usa el texto secundario.
const MARCA = '#7c5cbf';
const APAGADO = '#5a5a70';
const TINTA = '#e8e8f0';
const TINTA_SUAVE = '#9393a8';
const REJILLA = '#2a2a3a';
// El fondo de la pagina, para los aros y la tinta sobre los tonos claros de la rampa.
const FONDO = '#0a0a0f';

const ANCHO = 720;

const escapar = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// toLocaleString no agrupa los numeros de cuatro cifras: 1900 sale sin punto. En castellano
// el separador de millares va desde la primera unidad de millar.
const conMillares = (n) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const enEuros = (n) => `${conMillares(n)} euros`;

const lienzo = ({ alto, titulo, cuerpo }) => `<svg xmlns="http://www.w3.org/2000/svg" \
width="${ANCHO}" height="${alto}" viewBox="0 0 ${ANCHO} ${alto}" role="img" \
aria-labelledby="titulo" font-family="Inter, system-ui, sans-serif">
<title id="titulo">${escapar(titulo)}</title>
${cuerpo}
</svg>
`;

// Una proporcion contra su complemento no es un grafico de sectores de dos porciones sino
// una barra unica: se lee de un vistazo y no obliga a comparar angulos.
const medidor = ({ etiqueta, porcentaje }) => {
  if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    throw new Error(`porcentaje fuera de rango: ${porcentaje}`);
  }

  const alto = 132;
  const carril = { x: 0, y: 54, ancho: ANCHO, alto: 34 };
  const relleno = Math.round((carril.ancho * porcentaje) / 100);
  const resto = porcentaje === 100 ? 0 : carril.ancho - relleno - 2;

  const cuerpo = `
<text x="0" y="22" fill="${TINTA}" font-size="17" font-weight="600">${escapar(etiqueta)}</text>
<rect x="${carril.x}" y="${carril.y}" width="${relleno}" height="${carril.alto}" rx="4" fill="${MARCA}"/>
<rect x="${relleno + 2}" y="${carril.y}" width="${resto}" height="${carril.alto}" rx="4" fill="${REJILLA}"/>
<text x="0" y="${carril.y + carril.alto + 26}" fill="${TINTA}" font-size="19" font-weight="700">${porcentaje} %</text>
<text x="${ANCHO}" y="${carril.y + carril.alto + 26}" fill="${TINTA_SUAVE}" font-size="15" text-anchor="end">\
Bulk, ${100 - porcentaje} %</text>`;

  return lienzo({ alto, titulo: `${etiqueta}: ${porcentaje} %`, cuerpo });
};

// Barras horizontales porque las etiquetas son largas: en vertical no caben sin girarlas.
// Una sola barra lleva el color de marca y el resto va en gris, que es lo que dirige la
// mirada a la comparacion que cuenta el articulo.
const barras = ({ titulo, series, destacada }) => {
  if (!series.some(({ etiqueta }) => etiqueta === destacada)) {
    throw new Error(`la barra destacada no esta en la serie: ${destacada}`);
  }

  const grueso = 22;
  const paso = 40;
  const margenIzquierdo = 232;
  const margenSuperior = 34;
  const anchoUtil = ANCHO - margenIzquierdo - 96;
  const maximo = Math.max(...series.map(({ valor }) => valor));

  // De menor a mayor: el articulo compara importes entre si, y en el orden de la tabla esa
  // comparacion obliga a saltar de una fila a otra.
  const ordenadas = [...series].sort((a, b) => a.valor - b.valor);

  const filas = ordenadas
    .map(({ etiqueta, valor }, i) => {
      const y = margenSuperior + i * paso;
      const largo = Math.max(2, Math.round((anchoUtil * valor) / maximo));
      const color = etiqueta === destacada ? MARCA : APAGADO;
      return `
<text x="${margenIzquierdo - 12}" y="${y + grueso - 6}" fill="${TINTA_SUAVE}" font-size="13" \
text-anchor="end">${escapar(etiqueta)}</text>
<rect class="barra" x="${margenIzquierdo}" y="${y}" width="${largo}" height="${grueso}" rx="4" fill="${color}"/>
<text x="${margenIzquierdo + largo + 10}" y="${y + grueso - 6}" fill="${TINTA}" font-size="13">${enEuros(valor)}</text>`;
    })
    .join('');

  const alto = margenSuperior + series.length * paso + 8;
  const cuerpo = `
<text x="0" y="18" fill="${TINTA}" font-size="16" font-weight="600">${escapar(titulo)}</text>
${filas}`;

  return lienzo({ alto, titulo, cuerpo });
};

// Las lineas horizontales y sus cifras, para los graficos que llevan eje vertical.
const rejillaHorizontal = ({ fracciones, techo, y, margen }) =>
  fracciones
    .map((fraccion) => Math.round(techo * fraccion))
    .map(
      (valor) => `
<line x1="${margen.izquierda}" y1="${y(valor)}" x2="${ANCHO - margen.derecha}" y2="${y(valor)}" \
stroke="${REJILLA}" stroke-width="1"/>
<text x="${margen.izquierda - 10}" y="${y(valor) + 4}" fill="${TINTA_SUAVE}" font-size="12" \
text-anchor="end">${conMillares(valor)}</text>`
    )
    .join('');

// La nube de puntos es el unico modo de enseñar que no hay relacion entre las dos
// magnitudes: en una tabla de minimos y medianas esa ausencia no se ve.
const dispersion = ({ titulo, puntos }) => {
  if (!puntos.length) throw new Error('no hay puntos que dibujar');

  const alto = 400;
  const margen = { izquierda: 62, derecha: 24, arriba: 30, abajo: 52 };
  const anchoUtil = ANCHO - margen.izquierda - margen.derecha;
  const altoUtil = alto - margen.arriba - margen.abajo;

  // Un solo punto dejaria el rango a cero y una division por cero en la escala.
  const techo = (valores) => {
    const maximo = Math.max(...valores);
    const escalon = 10 ** Math.floor(Math.log10(maximo || 1));
    return Math.max(escalon, Math.ceil(maximo / escalon) * escalon);
  };

  const techoCartas = techo(puntos.map((p) => p.cartas));
  const techoPagado = techo(puntos.map((p) => p.pagado));

  const x = (cartas) => margen.izquierda + (anchoUtil * cartas) / techoCartas;
  const y = (pagado) => margen.arriba + altoUtil - (altoUtil * pagado) / techoPagado;

  const rejilla = rejillaHorizontal({
    fracciones: [0, 0.25, 0.5, 0.75, 1],
    techo: techoPagado,
    y,
    margen
  });

  // Solo se rotulan los dos extremos, que son los que sostienen el argumento: rotularlos
  // todos seria ruido.
  const masCartas = puntos.reduce((a, b) => (b.cartas > a.cartas ? b : a));
  const menosCartas = puntos.reduce((a, b) => (b.cartas < a.cartas ? b : a));
  const destacados = new Set([masCartas, menosCartas]);

  const marcas = puntos
    .map((punto) => {
      const cx = x(punto.cartas);
      const cy = y(punto.pagado);
      const rotulo = destacados.has(punto)
        ? `
<text class="rotulo-punto" x="${cx + (cx > ANCHO / 2 ? -12 : 12)}" y="${cy - 12}" fill="${TINTA}" \
font-size="12" text-anchor="${cx > ANCHO / 2 ? 'end' : 'start'}">${punto.cartas} cartas, \
${enEuros(punto.pagado)}</text>`
        : '';
      // El aro del color del fondo mantiene legibles los puntos que se solapan.
      return `
<circle class="punto" cx="${cx}" cy="${cy}" r="6" fill="${MARCA}" stroke="${FONDO}" stroke-width="2"/>${rotulo}`;
    })
    .join('');

  const marcasX = [0, 0.5, 1].map((f) => Math.round(techoCartas * f));
  const ejeX = marcasX
    .map(
      (valor) => `
<text x="${x(valor)}" y="${alto - 26}" fill="${TINTA_SUAVE}" font-size="12" \
text-anchor="middle">${conMillares(valor)}</text>`
    )
    .join('');

  const cuerpo = `
<text x="0" y="16" fill="${TINTA}" font-size="16" font-weight="600">${escapar(titulo)}</text>
${rejilla}
${marcas}
${ejeX}
<text x="${margen.izquierda + anchoUtil / 2}" y="${alto - 6}" fill="${TINTA_SUAVE}" font-size="12" \
text-anchor="middle">Número de cartas de la colección</text>`;

  return lienzo({ alto, titulo, cuerpo });
};

// Rampa de un solo tono, validada contra el fondo del sitio: mas oscuro es menos valor.
// Con seis pasos los saltos de luminosidad se distinguen; con mas, se juntan tanto que dos
// celdas contiguas parecen la misma.
// De claro a oscuro, para que el primer paso sea el valor mas bajo y el ultimo el mas
// alto: mas oscuro, mas cantidad.
const RAMPA = ['#c0aeee', '#a68ee2', '#8f76d4', '#7861c0', '#63509c', '#4e4276'];

// Sobre los tonos claros del principio de la rampa el blanco no llega al contraste minimo.
const tintaSobre = (fondo) => (RAMPA.indexOf(fondo) <= 1 ? FONDO : '#ffffff');

// Una matriz de porcentajes se lee como mapa de calor: el patron de la tabla (las caras
// aguantan mejor, los foils peor) salta a la vista antes de leer ninguna cifra.
const matriz = ({ titulo, columnas, filas }) => {
  const incompleta = filas.find(({ valores }) => valores.length !== columnas.length);
  if (incompleta) {
    throw new Error(`faltan valores en la fila ${incompleta.etiqueta}`);
  }

  const todos = filas.flatMap(({ valores }) => valores);
  const minimo = Math.min(...todos);
  const maximo = Math.max(...todos);

  const tono = (valor) => {
    const posicion = maximo === minimo ? 1 : (valor - minimo) / (maximo - minimo);
    return RAMPA[Math.min(RAMPA.length - 1, Math.floor(posicion * RAMPA.length))];
  };

  const margenIzquierdo = 190;
  const altoFila = 38;
  const margenSuperior = 52;
  const anchoCelda = Math.floor((ANCHO - margenIzquierdo) / columnas.length) - 2;

  const cabecera = columnas
    .map(
      (columna, c) => `
<text x="${margenIzquierdo + c * (anchoCelda + 2) + anchoCelda / 2}" y="${margenSuperior - 12}" \
fill="${TINTA_SUAVE}" font-size="13" text-anchor="middle">${escapar(columna)}</text>`
    )
    .join('');

  const cuerpoFilas = filas
    .map(({ etiqueta, valores }, f) => {
      const y = margenSuperior + f * altoFila;
      const celdas = valores
        .map((valor, c) => {
          const x = margenIzquierdo + c * (anchoCelda + 2);
          const fondo = tono(valor);
          // Dos pixeles de hueco entre celdas: separa sin dibujar un borde encima.
          return `
<rect class="celda" x="${x}" y="${y}" width="${anchoCelda}" height="${altoFila - 2}" rx="4" fill="${fondo}"/>
<text x="${x + anchoCelda / 2}" y="${y + altoFila / 2 + 3}" fill="${tintaSobre(fondo)}" font-size="13" \
text-anchor="middle">${valor} %</text>`;
        })
        .join('');

      return `
<text x="${margenIzquierdo - 12}" y="${y + altoFila / 2 + 3}" fill="${TINTA_SUAVE}" font-size="13" \
text-anchor="end">${escapar(etiqueta)}</text>${celdas}`;
    })
    .join('');

  const alto = margenSuperior + filas.length * altoFila + 8;
  const cuerpo = `
<text x="0" y="18" fill="${TINTA}" font-size="16" font-weight="600">${escapar(titulo)}</text>
${cabecera}
${cuerpoFilas}`;

  return lienzo({ alto, titulo, cuerpo });
};

// El valor de una caja por edicion, de 1993 a hoy. Es la prueba de la regla del borde: el
// escalon cae donde el articulo dice que cae.
//
// Escala logaritmica y no lineal porque el rango va de 20 a 6.534 dolares. En lineal la
// edicion mas barata mediria un pixel: habria que recortar el eje, y recortar esconde justo
// las ediciones modernas de las que habla el articulo.
const serieTemporal = ({ titulo, puntos, corte }) => {
  if (!puntos.length) throw new Error('no hay puntos que dibujar');

  const alto = 360;
  const margen = { izquierda: 54, derecha: 20, arriba: 34, abajo: 54 };
  const anchoUtil = ANCHO - margen.izquierda - margen.derecha;
  const altoUtil = alto - margen.arriba - margen.abajo;

  const ordenados = [...puntos].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const anio = (fecha) => Number(fecha.slice(0, 4)) + Number(fecha.slice(5, 7)) / 12;

  const desde = Math.floor(anio(ordenados[0].fecha));
  const hasta = Math.ceil(anio(ordenados[ordenados.length - 1].fecha));

  // Suelo y techo en potencias de diez, para que las lineas caigan en cifras redondas.
  const suelo = 10;
  const techo = 10 ** Math.ceil(Math.log10(Math.max(...ordenados.map((p) => p.valor))));

  const x = (fecha) => margen.izquierda + (anchoUtil * (anio(fecha) - desde)) / (hasta - desde);
  const y = (valor) => {
    const posicion =
      (Math.log10(Math.max(valor, suelo)) - Math.log10(suelo)) /
      (Math.log10(techo) - Math.log10(suelo));
    return margen.arriba + altoUtil - altoUtil * posicion;
  };

  const decadas = [];
  for (let v = suelo; v <= techo; v *= 10) decadas.push(v);
  const rejilla = decadas
    .map(
      (valor) => `
<line x1="${margen.izquierda}" y1="${y(valor)}" x2="${ANCHO - margen.derecha}" y2="${y(valor)}" \
stroke="${REJILLA}" stroke-width="1"/>
<text x="${margen.izquierda - 8}" y="${y(valor) + 4}" fill="${TINTA_SUAVE}" font-size="11" \
text-anchor="end">${conMillares(valor)}</text>`
    )
    .join('');

  const marcas = ordenados
    .map(({ fecha, valor }) => {
      const antiguo = fecha < corte;
      return `
<circle class="hito-serie" cx="${x(fecha).toFixed(1)}" cy="${y(valor).toFixed(1)}" r="4" \
fill="${antiguo ? MARCA : APAGADO}"/>`;
    })
    .join('');

  const xCorte = x(corte);
  const marcaCorte = `
<line class="corte" x1="${xCorte.toFixed(1)}" y1="${margen.arriba}" x2="${xCorte.toFixed(1)}" \
y2="${margen.arriba + altoUtil}" stroke="${TINTA}" stroke-width="1" stroke-dasharray="4 3"/>
<text x="${(xCorte - 8).toFixed(1)}" y="${margen.arriba + 12}" fill="${TINTA}" font-size="11" \
text-anchor="end">Octava Edición</text>`;

  const anios = [];
  for (let a = desde; a <= hasta; a += 5) anios.push(a);
  const ejeX = anios
    .map(
      (a) => `
<text x="${x(`${a}-01`).toFixed(1)}" y="${alto - 28}" fill="${TINTA_SUAVE}" font-size="11" \
text-anchor="middle">${a}</text>`
    )
    .join('');

  const cuerpo = `
<text x="0" y="18" fill="${TINTA}" font-size="16" font-weight="600">${escapar(titulo)}</text>
${rejilla}
${marcaCorte}
${marcas}
${ejeX}
<text x="${margen.izquierda}" y="${alto - 8}" fill="${TINTA_SUAVE}" font-size="11">\
Cada punto es una edición. Escala logarítmica, en dólares por caja</text>`;

  return lienzo({ alto, titulo, cuerpo });
};

module.exports = { medidor, barras, dispersion, matriz, serieTemporal };
