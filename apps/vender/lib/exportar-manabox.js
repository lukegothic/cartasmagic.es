// Las mismas columnas que exporta ManaBox, para que el fichero se importe de vuelta sin mapear nada.
const CABECERAS = ['Name', 'Set code', 'Set name', 'Collector number', 'Foil', 'Rarity', 'Quantity', 'ManaBox ID', 'Scryfall ID', 'Purchase price', 'Misprint', 'Altered', 'Signed', 'Condition', 'Language', 'Proxy', 'Purchase price currency', 'Added'];

// El mazo publico no guarda estado ni idioma. Se ponen los que ManaBox asume al importar.
const ESTADO = 'near_mint';
const IDIOMA = 'en';

// Los nombres vienen de ManaBox, asi que una carta llamada "=..." no debe ejecutarse al abrir la hoja.
const neutralizar = (texto) => (/^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto);

const celda = (valor) => {
  const texto = neutralizar(String(valor));
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const fila = (valores) => valores.map(celda).join(',');

const componerManaboxCsv = (cartas, ahora) =>
  [
    fila(CABECERAS),
    ...cartas.map((carta) => fila([
      carta.nombre,
      carta.codigoSet.toUpperCase(),
      carta.set,
      carta.numero,
      carta.esFoil ? 'foil' : 'normal',
      carta.rareza.toLowerCase(),
      carta.cantidad,
      '',
      carta.scryfallId,
      carta.precio.toFixed(2),
      'false',
      'false',
      'false',
      ESTADO,
      IDIOMA,
      'false',
      'EUR',
      ahora.toISOString()
    ]))
  ].join('\r\n');

module.exports = { componerManaboxCsv };
