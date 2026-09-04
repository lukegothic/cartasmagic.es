// Limite por origen para el formulario de ManaBox: cada envio dispara una descarga externa
// y un correo, asi que sin tope un solo visitante puede saturar las dos cosas.
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
