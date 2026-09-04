// Tramos ordenados de mayor a menor precio: se aplica el primero en el que encaja la carta.
// Las cartas de bulk no se pagan por porcentaje sino a tanto alzado por unidad, porque el
// porcentaje sobre céntimos no compensa el trabajo de clasificarlas.
const TRAMOS = [
  { id: 'premium', desde: 20, porcentaje: 0.60, etiqueta: 'Cartas de 20 € o más' },
  { id: 'alta', desde: 5, porcentaje: 0.50, etiqueta: 'Cartas de 5 a 20 €' },
  { id: 'media', desde: 1, porcentaje: 0.35, etiqueta: 'Cartas de 1 a 5 €' },
  { id: 'baja', desde: 0.3, porcentaje: 0.20, etiqueta: 'Cartas de 0,30 a 1 €' },
  { id: 'bulk', desde: 0, porUnidad: 0.02, etiqueta: 'Bulk (menos de 0,30 €)' }
];

const OFERTA_MINIMA = Number(process.env.OFERTA_MINIMA ?? 50);

const redondear = (valor) => Math.round(valor * 100) / 100;

const tramoDe = (precio) => TRAMOS.find(({ desde }) => precio >= desde);

const ofertaPorCarta = (tramo, precio) =>
  tramo.porUnidad !== undefined ? tramo.porUnidad : precio * tramo.porcentaje;

const calcularPresupuesto = (cartas) => {
  const acumulado = new Map(TRAMOS.map(({ id }) => [id, { cartas: 0, valorMercado: 0, oferta: 0 }]));

  cartas.forEach(({ precio, cantidad }) => {
    const tramo = tramoDe(precio);
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
    bajoMinimo: oferta < OFERTA_MINIMA,
    totalCartas: cartas.reduce((s, c) => s + c.cantidad, 0),
    totalFoils: cartas.filter((c) => c.esFoil).reduce((s, c) => s + c.cantidad, 0),
    masCaras: [...cartas].sort((a, b) => b.precio - a.precio),
    tramos: TRAMOS.map(({ id, etiqueta }) => {
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

module.exports = { calcularPresupuesto, OFERTA_MINIMA };
