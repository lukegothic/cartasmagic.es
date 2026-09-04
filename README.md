# CartasMagic

Monorepo del ecosistema CartasMagic. Cada aplicación se despliega por separado en
Dokploy apuntando a este mismo repositorio con un build path diferente.

## Estructura

```
apps/
├── hub/      cartasmagic.es        portada estática, sin build
└── vender/   vendercartasmagic.es  Express 5 + EJS
```

## Aplicaciones

### hub

Una sola página estática (`index.html`). No tiene dependencias ni paso de build:
se sirve tal cual.

### vender

Aplicación Express con vistas EJS. Para trabajar en local:

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

## Despliegue

Ambos dominios son independientes y cada uno conserva su propio posicionamiento.
No hay redirecciones entre ellos: `vendercartasmagic.es` recibe tráfico orgánico
propio y se mantiene como dominio de pleno derecho.
