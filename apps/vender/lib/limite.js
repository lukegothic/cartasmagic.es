// Límite para el formulario de ManaBox: cada envío dispara una descarga externa y un correo,
// así que sin tope se pueden saturar las dos cosas repitiendo el mismo mazo.
const MAXIMO_POR_HORA = Number(process.env.MANABOX_MAXIMO_POR_HORA ?? 5);
const UNA_HORA_MS = 3600000;

const crearLimitador = ({
  maximo = MAXIMO_POR_HORA,
  ventanaMs = UNA_HORA_MS,
  reloj = Date.now,
  tamanoMaximo = 10000
} = {}) => {
  const intentos = new Map();

  const olvidarCaducados = (ahora) => {
    intentos.forEach(({ desde }, origen) => {
      if (ahora - desde >= ventanaMs) intentos.delete(origen);
    });
  };

  return (origen) => {
    // Sin un origen que distinga a un visitante de otro, limitar significaría meterlos a todos
    // en el mismo cubo y dejar la página bloqueada para cualquiera en cuanto se llene.
    if (!origen) return true;

    const ahora = reloj();
    if (intentos.size >= tamanoMaximo) olvidarCaducados(ahora);

    const previo = intentos.get(origen);
    if (!previo || ahora - previo.desde >= ventanaMs) {
      intentos.set(origen, { desde: ahora, cuenta: 1 });
      return true;
    }

    previo.cuenta += 1;
    return previo.cuenta <= maximo;
  };
};

module.exports = { crearLimitador };
