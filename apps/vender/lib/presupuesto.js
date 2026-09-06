// Cortes de tramo por precio de carta. No se configuran: mueven la forma del calculo,
// no su agresividad, y esa es la parte que casi nunca cambia.
// Las cartas de bulk se pagan a tanto alzado por unidad y no por porcentaje, porque el
// porcentaje sobre céntimos no compensa el trabajo de clasificarlas.
//
// La etiqueta llega al cliente, en el csv del presupuesto, pero no se lleva a
// textos-correo.js: describe el corte de su propia fila y se lee al lado de el. Separarlas
// deja cambiar un corte sin tocar su etiqueta, y el csv pasaria a mentir sin que falle nada.
const TRAMOS = [
  { id: 'premium', desde: 20, variable: 'TRAMO_PREMIUM_PCT', porDefecto: 60, etiqueta: 'Cartas de 20 € o más' },
  { id: 'alta', desde: 5, variable: 'TRAMO_ALTA_PCT', porDefecto: 50, etiqueta: 'Cartas de 5 a 20 €' },
  { id: 'media', desde: 1, variable: 'TRAMO_MEDIA_PCT', porDefecto: 35, etiqueta: 'Cartas de 1 a 5 €' },
  { id: 'baja', desde: 0.3, variable: 'TRAMO_BAJA_PCT', porDefecto: 20, etiqueta: 'Cartas de 0,30 a 1 €' },
  { id: 'bulk', desde: 0, variable: 'TRAMO_BULK_EUR', porDefecto: 0.02, porUnidad: true, etiqueta: 'Bulk (menos de 0,30 €)' }
];

const OFERTA_MINIMA_POR_DEFECTO = 50;
const PORCENTAJE_MAXIMO = 100;

// Una variable mal escrita no debe cambiar la oferta sin avisar: se ignora y se avisa por el log.
const numeroValido = (bruto, porDefecto, maximo) => {
  if (bruto === undefined || String(bruto).trim() === '') return porDefecto;

  const valor = Number(bruto);
  if (!Number.isFinite(valor) || valor < 0 || valor > maximo) {
    console.warn(`Valor no válido para la configuración del presupuesto: ${bruto}. Se usa ${porDefecto}`);
    return porDefecto;
  }

  return valor;
};

const leerTramos = (entorno = process.env) =>
  TRAMOS.map(({ id, desde, variable, porDefecto, porUnidad, etiqueta }) => {
    const valor = numeroValido(entorno[variable], porDefecto, porUnidad ? Infinity : PORCENTAJE_MAXIMO);
    return porUnidad
      ? { id, desde, etiqueta, porUnidad: valor }
      : { id, desde, etiqueta, porcentaje: valor / 100 };
  });

const leerOfertaMinima = (entorno = process.env) =>
  numeroValido(entorno.OFERTA_MINIMA, OFERTA_MINIMA_POR_DEFECTO, Infinity);

const redondear = (valor) => Math.round(valor * 100) / 100;

const ofertaPorCarta = (tramo, precio) =>
  tramo.porUnidad !== undefined ? tramo.porUnidad : precio * tramo.porcentaje;

const calcularPresupuesto = (cartas, entorno = process.env) => {
  const tramos = leerTramos(entorno);
  const acumulado = new Map(tramos.map(({ id }) => [id, { cartas: 0, valorMercado: 0, oferta: 0 }]));

  cartas.forEach(({ precio, cantidad }) => {
    const tramo = tramos.find(({ desde }) => precio >= desde);
    const fila = acumulado.get(tramo.id);
    fila.cartas += cantidad;
    fila.valorMercado += precio * cantidad;
    fila.oferta += ofertaPorCarta(tramo, precio) * cantidad;
  });

  const valorMercado = redondear([...acumulado.values()].reduce((s, f) => s + f.valorMercado, 0));
  const oferta = redondear([...acumulado.values()].reduce((s, f) => s + f.oferta, 0));

  return {
    valorMercado,
    oferta,
    bajoMinimo: oferta < leerOfertaMinima(entorno),
    totalCartas: cartas.reduce((s, c) => s + c.cantidad, 0),
    totalFoils: cartas.filter((c) => c.esFoil).reduce((s, c) => s + c.cantidad, 0),
    masCaras: [...cartas].sort((a, b) => b.precio - a.precio),
    tramos: tramos.map(({ id, etiqueta }) => {
      const fila = acumulado.get(id);
      return {
        id,
        etiqueta,
        cartas: fila.cartas,
        valorMercado: redondear(fila.valorMercado),
        oferta: redondear(fila.oferta)
      };
    })
  };
};

module.exports = { calcularPresupuesto, leerTramos, leerOfertaMinima };
