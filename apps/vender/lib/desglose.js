const { leerTramos, calcularPresupuesto, valorarCarta, SIN_PRECIO } = require('./presupuesto');

const CABECERAS = ['Cantidad', 'Carta', 'Edicion', 'Rareza', 'Foil', 'Precio unidad EUR', 'Precio total EUR', 'Tramo', 'Se paga EUR'];

// Excel en espanol espera el punto y coma como separador y la coma como decimal.
const SEPARADOR = ';';

const euros = (valor) => valor.toFixed(2).replace('.', ',');

// Los nombres vienen de ManaBox, asi que una carta llamada "=..." no debe ejecutarse al abrir la hoja.
// Un importe negativo empieza por guion pero no es una formula, y con el apostrofo Excel lo leeria como texto.
const neutralizar = (texto) => (/^[=+\-@\t\r]/.test(texto) && !/^-\d+,\d{2}$/.test(texto) ? `'${texto}` : texto);

const celda = (valor) => {
  const texto = neutralizar(String(valor));
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const fila = (valores) => valores.map(celda).join(SEPARADOR);

// La etiqueta del tramo lleva el simbolo del euro, que en un csv abierto con otra
// codificacion se ve mal. En el adjunto se escribe la moneda con letras.
const etiquetaPlana = (etiqueta) => etiqueta.replace(/€/g, 'EUR').replace(/á|à/g, 'a').replace(/í/g, 'i').replace(/ás/g, 'as');

const esBulk = (tramo) => tramo.porUnidad !== undefined;

// Redondeada fila a fila, la columna no suma la oferta: una carta de bulk a 0,003 EUR sale a
// 0,00, y los medios centimos de las demas se pierden. Se reparten los centimos de la oferta
// entre las partidas con mas resto, asi que ninguna se aleja un centimo de su valor y la
// columna suma justo lo del correo, sin tocar la oferta, que sigue cuadrando con mtginvestor.
const repartirCentimos = (importes, total) => {
  const exactos = importes.map((importe) => importe * 100);
  const centimos = exactos.map(Math.floor);
  const sobran = Math.round(total * 100) - centimos.reduce((s, c) => s + c, 0);

  exactos
    .map((exacto, i) => ({ resto: exacto - centimos[i], i }))
    .sort((a, b) => b.resto - a.resto)
    .slice(0, sobran)
    .forEach(({ i }) => { centimos[i] += 1; });

  return centimos.map((c) => c / 100);
};

// El bulk se paga por carta, asi que su pago va en un subtotal por tramo y no en cada fila.
// Lleva las cartas y la tarifa para que se pueda comprobar sin calculadora.
const filaSubtotal = ({ tramo, cartas }, pago) =>
  fila(['SUBTOTAL', `${cartas} cartas a ${String(tramo.porUnidad).replace('.', ',')} EUR`, '', '', '', '', '', etiquetaPlana(tramo.etiqueta), euros(pago)]);

const componerDesgloseCsv = (cartas, entorno = process.env) => {
  const tramos = leerTramos(entorno);
  const presupuesto = calcularPresupuesto(cartas, entorno);
  const valoradas = [...cartas]
    .sort((a, b) => b.precio - a.precio)
    .map((carta) => ({ carta, ...valorarCarta(tramos, carta) }));

  const conPagoPropio = valoradas.filter(({ tramo }) => tramo !== SIN_PRECIO && !esBulk(tramo));
  const subtotales = tramos
    .filter(esBulk)
    .map((tramo) => {
      const suyas = valoradas.filter((v) => v.tramo === tramo);
      return {
        tramo,
        cartas: suyas.reduce((s, v) => s + v.carta.cantidad, 0),
        oferta: suyas.reduce((s, v) => s + v.oferta, 0)
      };
    })
    .filter(({ cartas }) => cartas > 0);

  const partidas = [...conPagoPropio, ...subtotales];
  const pagos = repartirCentimos(partidas.map(({ oferta }) => oferta), presupuesto.ofertaCartas);
  const pagoDe = new Map(partidas.map((partida, i) => [partida, pagos[i]]));

  const filas = valoradas.map((valorada) => {
    const { carta, tramo, valorMercado } = valorada;
    const sinPrecio = tramo === SIN_PRECIO;

    return fila([
      carta.cantidad,
      carta.nombre,
      carta.set,
      carta.rareza,
      carta.esFoil ? 'Si' : 'No',
      sinPrecio ? '' : euros(carta.precio),
      sinPrecio ? '' : euros(valorMercado),
      etiquetaPlana(tramo.etiqueta),
      pagoDe.has(valorada) ? euros(pagoDe.get(valorada)) : ''
    ]);
  });

  // El total tiene que ser la cifra del correo, que ya lleva el envio descontado. Con la
  // fila del envio a la vista, la resta se entiende sin tener que explicarla. Si no se
  // descuenta nada, la fila sobra.
  // Sin BOM, Excel abre el fichero en la codificacion del sistema y destroza las tildes.
  return '﻿' + [
    fila(CABECERAS),
    ...filas,
    ...subtotales.map((subtotal) => filaSubtotal(subtotal, pagoDe.get(subtotal))),
    ...(presupuesto.costeEnvio > 0 ? [fila(['ENVIO', '', '', '', '', '', '', '', euros(-presupuesto.costeEnvio)])] : []),
    fila(['TOTAL', '', '', '', '', '', euros(presupuesto.valorMercado), '', euros(presupuesto.oferta)])
  ].join('\r\n');
};

module.exports = { componerDesgloseCsv };
