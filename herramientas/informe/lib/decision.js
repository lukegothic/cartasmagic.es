const { hallazgos: calcularHallazgos } = require('./informe');
const { derivarAcciones } = require('./acciones');
const { firmar, comparar, esDiaDeEmbudo } = require('./estado');

// Entre traer los datos y pintarlos. No lee ni escribe nada: la fecha y el estado de ayer
// entran como argumentos y el de hoy sale como resultado, para que quien llama decida
// cuando guardarlo.
const decidir = ({ consultas, indice, estado, hoy, ventana }) => {
  const hallazgos = calcularHallazgos(consultas, indice);
  const firmas = firmar(hallazgos);
  const { nuevas, resueltas } = comparar(firmas, estado.firmas);
  const conEmbudo = esDiaDeEmbudo(hoy);

  const { acciones, descartes, vigilancia } = derivarAcciones(hallazgos, indice, estado.firmas, ventana);

  return {
    acciones,
    descartes,
    vigilancia,
    hallazgos,
    nuevas,
    conEmbudo,
    enviar: nuevas.length > 0 || resueltas.length > 0 || conEmbudo,
    siguiente: { firmas }
  };
};

module.exports = { decidir };
