# CartasMagic

Monorepo del ecosistema CartasMagic. Cada aplicación se despliega por separado en
Dokploy apuntando a este mismo repositorio con un build path diferente.

## Estructura

```
apps/
├── hub/      cartasmagic.es        portada estática, sin build
└── vender/   vendercartasmagic.es  Express 5 + EJS

herramientas/
└── informe/  lee Search Console y GA4 y saca qué keywords y copys tocar
```

## Aplicaciones

### hub

Una sola página estática (`index.html`). No tiene dependencias ni paso de build:
se sirve tal cual.

### vender

Aplicación Express con vistas EJS. Para levantarla en la máquina propia:

```bash
cd apps/vender
npm install
npm start
```

Queda escuchando en el puerto 3000, configurable con la variable de entorno `PORT`.

El fichero `.env` no está versionado. Al clonar el repositorio hay que crearlo a
partir de la copia que vive fuera del control de versiones.

## Analítica

Cada dominio tiene su propio flujo de datos dentro de una única propiedad de GA4:

| Aplicación | Dominio | ID de medición |
|---|---|---|
| hub | cartasmagic.es | G-F2JK45VQS3 |
| vender | vendercartasmagic.es | G-6PJYPF57RF |

Los dos flujos van a la misma propiedad de GA4, la `552777806`. En el informe se separan
filtrando por `hostName`, no por propiedad.

`herramientas/informe` manda cada mañana un correo con un markdown adjunto: qué keyword
está en el dominio que no le toca, qué consultas no reclama ninguna página y qué falta en
cada `llm.txt`, cada una con el fichero y la línea donde se cambia. Corre en Dokploy como
Schedule de tipo Dokploy Server. Los detalles están en
[herramientas/informe/README.md](herramientas/informe/README.md).

## Decisiones y contexto

Lo que hay en `docs/` y conviene leer antes de tocar keywords o dominios:

| Documento | Qué responde |
|---|---|
| [reparto-keywords.md](docs/reparto-keywords.md) | Qué keyword es de cada dominio, y la demanda de compra que hoy no se atiende |
| [consolidar-dominios.md](docs/consolidar-dominios.md) | Por qué no se unifican los dos dominios todavía y qué costaría |
| [corte-julio-2026.md](docs/corte-julio-2026.md) | El hueco de datos del 20 de julio al 2 de septiembre de 2026 |
| [plan-medicion-embudo.md](docs/plan-medicion-embudo.md) | Qué se mide del embudo y por qué no se lee antes de ocho semanas |
| [medicion-canales.md](docs/medicion-canales.md) | Cómo se atribuye cada colección al canal que la trajo |

## Despliegue

Ambos dominios son independientes y cada uno conserva su propio posicionamiento.
No hay redirecciones entre ellos: `vendercartasmagic.es` recibe tráfico orgánico
propio y se mantiene como dominio de pleno derecho.
