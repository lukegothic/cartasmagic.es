const { leerTramos, costeEnvioPara, valorarCarta, SIN_PRECIO } = require('./presupuesto');

const CABECERAS = ['Cantidad', 'Carta', 'Edicion', 'Rareza', 'Foil', 'Precio unidad EUR', 'Precio total EUR', 'Tramo', 'Se paga EUR'];

// Excel en espanol espera el punto y coma como separador y la coma como decimal.
const SEPARADOR = ';';

const euros = (valor) => valor.toFixed(2).replace('.', ',');

const redondear = (valor) => Math.round(valor * 100) / 100;

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

const componerDesgloseCsv = (cartas, entorno = process.env) => {
  const tramos = leerTramos(entorno);
  const ordenadas = [...cartas].sort((a, b) => b.precio - a.precio);
  let totalMercado = 0;
  let totalOferta = 0;

  const filas = ordenadas.map((carta) => {
    const { tramo, valorMercado, oferta } = valorarCarta(tramos, carta);
    const sinPrecio = tramo === SIN_PRECIO;

    totalMercado += valorMercado;
    totalOferta += oferta;

    return fila([
      carta.cantidad,
      carta.nombre,
      carta.set,
      carta.rareza,
      carta.esFoil ? 'Si' : 'No',
      sinPrecio ? '' : euros(carta.precio),
      sinPrecio ? '' : euros(valorMercado),
      etiquetaPlana(tramo.etiqueta),
      sinPrecio ? '' : euros(oferta)
    ]);
  });

  // El total tiene que ser la cifra del correo, que ya lleva el envio descontado. Con la
  // fila del envio a la vista, la resta se entiende sin tener que explicarla. Si no se
  // descuenta nada, la fila sobra.
  const costeEnvio = costeEnvioPara(redondear(totalOferta), entorno);
  const totalPagado = Math.max(0, redondear(redondear(totalOferta) - costeEnvio));

  // Sin BOM, Excel abre el fichero en la codificacion del sistema y destroza las tildes.
  return '﻿' + [
    fila(CABECERAS),
    ...filas,
    ...(costeEnvio > 0 ? [fila(['ENVIO', '', '', '', '', '', '', '', euros(-costeEnvio)])] : []),
    fila(['TOTAL', '', '', '', '', '', euros(totalMercado), '', euros(totalPagado)])
  ].join('\r\n');
};

module.exports = { componerDesgloseCsv };
