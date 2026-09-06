const { cliente } = require('./lib/google');
const { construirIndice } = require('./lib/keywords');
const { SITIOS, fechas, bloqueGSC, bloqueGA4, bloqueKeywords } = require('./lib/informe');
const { titulo } = require('./lib/formato');

const argumento = (nombre, pordefecto) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i === -1 ? pordefecto : process.argv[i + 1];
};

const principal = async () => {
  const dias = Number(argumento('dias', 90));
  const ventana = fechas(dias);
  const auth = await cliente();
  const indice = construirIndice();

  const partes = [
    titulo(`Informe cartasmagic  ${ventana.desde} a ${ventana.hasta}  (${dias} dias)`),
    `\n${indice.paginas.length} paginas con keywords declaradas.`
  ];

  const consultas = [];
  for (const sitio of SITIOS) {
    const gsc = await bloqueGSC(auth, sitio.dominio, ventana);
    partes.push(gsc.texto);
    consultas.push(...gsc.consultas);
    partes.push(await bloqueGA4(auth, sitio, ventana));
  }

  partes.push(bloqueKeywords(consultas, indice));
  console.log(partes.join('\n'));
};

principal().catch(({ message }) => {
  console.error(`\n${message}\n`);
  process.exit(1);
});
