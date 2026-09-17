// Cortes de tramo por precio de carta. No se configuran: mueven la forma del calculo,
// no su agresividad, y esa es la parte que casi nunca cambia.
// Las cartas de bulk se pagan a tanto alzado por unidad y no por porcentaje, porque el
// porcentaje sobre céntimos no compensa el trabajo de clasificarlas.
//
// La etiqueta llega al cliente, en el csv del presupuesto, pero no se lleva a
// textos-correo.js: describe el corte de su propia fila y se lee al lado de el. Separarlas
// deja cambiar un corte sin tocar su etiqueta, y el csv pasaria a mentir sin que falle nada.
// El bulk se parte en dos porque una rara de bulk se revende y una comun no. Es lo que
// hacen las tiendas europeas que publican sus tarifas, con un factor de diez entre una y
// otra. La rareza la trae ManaBox en cada carta, asi que el corte no cuesta nada.
const TRAMOS = [
  { id: 'premium', desde: 20, variable: 'TRAMO_PREMIUM_PCT', porDefecto: 70, etiqueta: 'Cartas de 20 € o más' },
  { id: 'alta', desde: 5, variable: 'TRAMO_ALTA_PCT', porDefecto: 60, etiqueta: 'Cartas de 5 a 20 €' },
  { id: 'media', desde: 1, variable: 'TRAMO_MEDIA_PCT', porDefecto: 35, etiqueta: 'Cartas de 1 a 5 €' },
  { id: 'baja', desde: 0.5, variable: 'TRAMO_BAJA_PCT', porDefecto: 20, etiqueta: 'Cartas de 0,50 a 1 €' },
  { id: 'bulkRara', desde: 0, soloRaras: true, variable: 'TRAMO_BULK_RARA_EUR', porDefecto: 0.05, porUnidad: true, etiqueta: 'Bulk de rara o mítica (menos de 0,50 €)' },
  { id: 'bulk', desde: 0, variable: 'TRAMO_BULK_EUR', porDefecto: 0.005, porUnidad: true, etiqueta: 'Bulk de común o infrecuente (menos de 0,50 €)' }
];

// Las que ManaBox marca como rara o mitica. Una carta sin rareza cae en la tarifa de
// comun: el dato que falta nunca debe cobrar de mas.
const RAREZAS_ALTAS = ['rare', 'mythic'];

const esRara = (rareza) => RAREZAS_ALTAS.includes(String(rareza ?? '').trim().toLowerCase());

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
  TRAMOS.map(({ id, desde, soloRaras, variable, porDefecto, porUnidad, etiqueta }) => {
    const valor = numeroValido(entorno[variable], porDefecto, porUnidad ? Infinity : PORCENTAJE_MAXIMO);
    return porUnidad
      ? { id, desde, soloRaras, etiqueta, porUnidad: valor }
      : { id, desde, soloRaras, etiqueta, porcentaje: valor / 100 };
  });

const leerOfertaMinima = (entorno = process.env) =>
  numeroValido(entorno.OFERTA_MINIMA, OFERTA_MINIMA_POR_DEFECTO, Infinity);

const redondear = (valor) => Math.round(valor * 100) / 100;

const ofertaPorCarta = (tramo, precio) =>
  tramo.porUnidad !== undefined ? tramo.porUnidad : precio * tramo.porcentaje;

const calcularPresupuesto = (cartas, entorno = process.env) => {
  const tramos = leerTramos(entorno);
  const acumulado = new Map(tramos.map(({ id }) => [id, { cartas: 0, valorMercado: 0, oferta: 0 }]));

  cartas.forEach(({ precio, cantidad, rareza }) => {
    const tramo = tramos.find(({ desde, soloRaras }) => precio >= desde && (!soloRaras || esRara(rareza)));
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
