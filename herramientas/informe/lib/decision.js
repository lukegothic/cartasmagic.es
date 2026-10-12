const { hallazgos: calcularHallazgos } = require('./informe');
const { derivarAcciones } = require('./acciones');
const { comparar, esDiaDeEmbudo } = require('./estado');
const { instantanea, cooldownDe } = require('./objetivos');
const { fechasDeCambio, juzgarCtrTrasCambio } = require('./postcambio');

// Entre traer los datos y pintarlos. No lee ni escribe nada: la fecha y el estado de ayer
// entran como argumentos y el de hoy sale como resultado, para que quien llama decida
// cuando guardarlo.
//
// El correo depende solo de lo visible: las acciones y las alarmas de medicion. Que cambie
// una candidata descartada no es una novedad que el fundador pueda atender. `alarmas` son
// las firmas de las alarmas de medicion de hoy.
//
// `ultimoCambioGit(fichero)` devuelve la fecha del ultimo cambio de un fichero en git, o
// null. Entra de fuera para que esta funcion siga sin tocar nada: solo se llama la primera
// vez que un Target no tiene entrada en el estado.
//
// `consultasPostCambio` son las filas de GSC de despues del cambio de cada Target, por
// fecha de cambio. Las trae quien llama, con las fechas que le da `fechasPostCambio`.

// Las fechas de cambio de las que `decidir` necesita cifras de despues. Se pregunta antes
// de traer los datos, asi que la foto de Targets se calcula aqui y otra vez en `decidir`;
// git solo se consulta la primera vez de cada Target.
const fechasPostCambio = ({ indice, estado, hoy, ventana, ultimoCambioGit }) => {
  const targets = instantanea({ paginas: indice.paginas, previos: estado.targets, hoy, ultimoCambioGit });
  return fechasDeCambio({ paginas: indice.paginas, targets, ventana, hoy });
};

const decidir = ({
  consultas,
  indice,
  estado,
  hoy,
  ventana,
  ultimoCambioGit,
  alarmas = [],
  consultasPostCambio = {}
}) => {
  const conEmbudo = esDiaDeEmbudo(hoy);

  // El estado anterior a la foto de Targets no trae `targets`.
  const targets = instantanea({ paginas: indice.paginas, previos: estado.targets, hoy, ultimoCambioGit });

  const hallazgosVentana = calcularHallazgos(consultas, indice);
  const hallazgos = {
    ...hallazgosVentana,
    ctrBajo: juzgarCtrTrasCambio({
      ctrBajo: hallazgosVentana.ctrBajo,
      indice,
      targets,
      ventana,
      hoy,
      consultasPostCambio
    })
  };

  const { acciones, descartes, vigilancia } = derivarAcciones(
    hallazgos,
    indice,
    estado.acciones,
    ventana,
    cooldownDe(targets, hoy)
  );

  const firmasAcciones = acciones.map(({ firma }) => firma);
  const delAnterior = comparar(firmasAcciones, estado.acciones);
  const delasAlarmas = comparar(alarmas, estado.alarmas);
  const nuevas = [...delAnterior.nuevas, ...delasAlarmas.nuevas];
  const resueltas = [...delAnterior.resueltas, ...delasAlarmas.resueltas];

  // Si el estado viene del formato anterior, lo que falta en el no se da por resuelto:
  // guardaba hallazgos de todo tipo, asi que no se sabe si aquello llego a verse.
  const hayCambio = nuevas.length > 0 || (!estado.migrado && resueltas.length > 0);

  return {
    acciones,
    descartes,
    vigilancia,
    hallazgos,
    nuevas,
    targets,
    conEmbudo,
    enviar: hayCambio || conEmbudo,
    resumen: { acciones: acciones.length, descartes: descartes.length, vigilancia: vigilancia.length },
    siguiente: { acciones: firmasAcciones, alarmas, targets }
  };
};

module.exports = { decidir, fechasPostCambio };
