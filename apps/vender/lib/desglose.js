const { leerTramos } = require('./presupuesto');

const CABECERAS = ['Cantidad', 'Carta', 'Edicion', 'Rareza', 'Foil', 'Precio unidad EUR', 'Precio total EUR', 'Tramo', 'Se paga EUR'];

// Excel en espanol espera el punto y coma como separador y la coma como decimal.
const SEPARADOR = ';';

const euros = (valor) => valor.toFixed(2).replace('.', ',');

// Los nombres vienen de ManaBox, asi que una carta llamada "=..." no debe ejecutarse al abrir la hoja.
const neutralizar = (texto) => (/^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto);

const celda = (valor) => {
  const texto = neutralizar(String(valor));
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const fila = (valores) => valores.map(celda).join(SEPARADOR);

// La etiqueta del tramo lleva el simbolo del euro, que en un csv abierto con otra
// codificacion se ve mal. En el adjunto se escribe la moneda con letras.
const etiquetaPlana = (etiqueta) => etiqueta.replace(/€/g, 'EUR').replace(/á|à/g, 'a').replace(/í/g, 'i').replace(/ás/g, 'as');

const componerDesgloseCsv = (cartas, entorno = process.env) => {
  const tramos = leerTramos(entorno);
  const ordenadas = [...cartas].sort((a, b) => b.precio - a.precio);

  let totalMercado = 0;
  let totalOferta = 0;

  const filas = ordenadas.map((carta) => {
    const tramo = tramos.find(({ desde }) => carta.precio >= desde);
    const mercado = carta.precio * carta.cantidad;
    const pagado = (tramo.porUnidad ?? carta.precio * tramo.porcentaje) * carta.cantidad;

    totalMercado += mercado;
    totalOferta += pagado;

    return fila([
      carta.cantidad,
      carta.nombre,
      carta.set,
      carta.rareza,
      carta.esFoil ? 'Si' : 'No',
      euros(carta.precio),
      euros(mercado),
      etiquetaPlana(tramo.etiqueta),
      euros(pagado)
    ]);
  });

  // Sin BOM, Excel abre el fichero en la codificacion del sistema y destroza las tildes.
  return '﻿' + [
    fila(CABECERAS),
    ...filas,
    fila(['TOTAL', '', '', '', '', '', euros(totalMercado), '', euros(totalOferta)])
  ].join('\r\n');
};

module.exports = { componerDesgloseCsv };
