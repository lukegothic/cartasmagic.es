# Informe de visitas

Lee Search Console y GA4 de los dos dominios y saca qué keywords y qué copys tocar.
No sirve para vigilar el tráfico cada semana: con el volumen actual, cualquier lectura
antes de ocho semanas es ruido. Lo dice `docs/plan-medicion-embudo.md` y sigue valiendo.

## Qué responde

Las cuatro tablas del final son el motivo de que esto exista. Cada una lleva a un
fichero concreto que editar:

| Tabla | Qué significa | Qué se hace con ella |
|---|---|---|
| Los dos dominios compiten | La misma búsqueda saca las dos webs | Quitar la keyword del dominio que no le toca |
| Rankea el dominio que no toca | El hub sale por una transaccional, o vender por una informacional | Mover la keyword según `docs/reparto-keywords.md` |
| Nadie la reclama | Hay impresiones para algo que ninguna página declara | Meterla en las keywords y en el copy de la página que corresponda |
| Buena posición y casi ningún clic | Sale arriba pero el título no convence | Reescribir title y description, no tocar la keyword |

La quinta, la de keywords declaradas sin ni una impresión, dice lo contrario: qué se
está declarando que no busca nadie.

## Antes de la primera vez

Hace falta una cuenta de servicio de Google con acceso de lectura a las dos
propiedades. Son cinco pasos y solo se hacen una vez.

La cuenta `gsc-ga4@cartasmagices.iam.gserviceaccount.com` ya existe y ya lee Search
Console de los dos dominios. De los pasos de abajo solo queda el quinto, el de GA4.

El JSON de esa cuenta estaba en la raiz del repositorio sin ignorar. Ahora lo ignora
`.gitignore` por el patron del nombre, y conviene moverlo fuera del repositorio del
todo. Nunca llego a entrar en el historial de git.

### 1. Crear el proyecto y la cuenta de servicio

En https://console.cloud.google.com, crear un proyecto (vale cualquier nombre, por
ejemplo `cartasmagic-informe`). Dentro, en **IAM y administración > Cuentas de
servicio**, crear una cuenta. No necesita ningún rol dentro del proyecto: los permisos
que importan se dan luego en cada producto.

### 2. Descargar la clave

En la cuenta recién creada, pestaña **Claves > Agregar clave > Crear clave nueva >
JSON**. Se descarga un fichero. Guardarlo fuera del repositorio, por ejemplo en
`W:\APPS_MTG\credenciales\cartasmagic-informe.json`.

Ese fichero es una credencial. No va al repositorio ni se comparte.

### 3. Habilitar las dos APIs

En **APIs y servicios > Biblioteca** del mismo proyecto, buscar y habilitar:

- Google Search Console API
- Google Analytics Data API

### 4. Dar acceso en Search Console

Copiar el `client_email` del JSON, que acaba en `.iam.gserviceaccount.com`.

En https://search.google.com/search-console, por cada uno de los dos dominios:
**Configuración > Usuarios y permisos > Agregar usuario**, pegar ese correo y darle
permiso de **propietario**.

Tiene que ser propietario. Con permiso completo o restringido la API responde 403,
aunque en la interfaz se vean los datos igual.

### 5. Dar acceso en GA4

Los dos dominios comparten una sola propiedad, la `552777806`, cada uno con su flujo de
datos. En el informe se separan filtrando por `hostName`, no por propiedad.

En https://analytics.google.com: **Administrar > Gestión del acceso a la propiedad > +**,
pegar el mismo correo y darle el rol de **lector**. Una vez, no dos.

## Cómo se ejecuta

```bash
cd herramientas/informe
npm install

export GOOGLE_APPLICATION_CREDENTIALS="W:/APPS_MTG/credenciales/cartasmagic-informe.json"
export GA4_PROPIEDAD=552777806

npm run informe
```

En PowerShell las variables se asignan con `$env:GA4_PROPIEDAD = '552777806'`.

Por defecto mira los últimos 90 días. Con `--dias` se cambia la ventana:

```bash
node informe.js --dias 28
```

La ventana de Search Console termina tres días antes de hoy porque no tiene
consolidados los últimos días y contarlos hunde las medias sin motivo. La de GA4 llega
hasta hoy: ahí no hay ese retraso, y de momento casi todo lo que ha recogido está en los
últimos días.

## El aviso diario en Dokploy

`diario.js` es lo que corre cada día. No es el informe entero: compara los hallazgos de
hoy con los de ayer y solo escribe si hay alguno nuevo o si alguno ha dejado de
aparecer. Un correo diario idéntico se deja de leer en una semana, que es lo mismo que
no medir.

Los lunes añade el embudo y las campañas de GA4. Esos ratios necesitan acumular semanas
para decir algo, y mirarlos a diario es justo el error contra el que avisa
`docs/plan-medicion-embudo.md`.

No hace falta dar de alta ningún servicio. Un servicio de Dokploy es un proceso que se
queda escuchando, y esto tarda diez segundos y termina: dado de alta como aplicación,
Dokploy lo tomaría por caído y lo reiniciaría en bucle.

Se configura en **Schedules**, con el tipo **Dokploy Server**. Ese tipo corre dentro del
contenedor de Dokploy, que es el unico sitio del servidor con node y git: el host no
tiene node instalado, y la imagen de vender solo lleva `apps/vender`, asi que ni un
Server Job ni un Application Job pueden ejecutar esto.

Los campos que pide son solo estos, no hay ninguno para variables de entorno:

| Campo | Valor |
|---|---|
| Name | `informe-cartasmagic` |
| Cron Expression | `30 7 * * *` |
| Shell Type | `bash` |
| Script | el de abajo |

Como no hay campo de variables, van en un fichero aparte que el script carga. Asi
tampoco quedan las credenciales guardadas en la base de datos de Dokploy.

```sh
set -a
. /etc/dokploy/informe/entorno
set +a

cd /etc/dokploy/informe/repo && git pull -q
cd herramientas/informe && npm ci --omit=dev --silent
node diario.js
```

`set -a` hace que todo lo que se lea del fichero se exporte al proceso de node. Sin eso
las variables se quedan en el shell y node no las ve.

`/etc/dokploy` esta montado desde el host, asi que lo que se deje ahi sobrevive a que el
contenedor de Dokploy se recree.

### La primera vez

El repositorio ya esta clonado en `/etc/dokploy/informe/repo` y la credencial ya esta
puesta en `/etc/dokploy/informe/google.json`. Falta el fichero de variables:

```sh
ssh vps
D=$(docker ps --filter name=dokploy --format "{{.Names}}" | grep -vE "postgres|redis" | head -1)
docker exec -i $D sh -c 'cat > /etc/dokploy/informe/entorno && chmod 600 /etc/dokploy/informe/entorno' <<'FIN'
GOOGLE_APPLICATION_CREDENTIALS=/etc/dokploy/informe/google.json
INFORME_ESTADO_DIR=/etc/dokploy/informe/estado
GA4_PROPIEDAD=552777806
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
INFORME_EMAIL_TO=
FIN
```

Los valores de SMTP son los mismos que ya usa vender: se copian de su panel de
variables en Dokploy.

`INFORME_ESTADO_DIR` es lo que hace que el aviso no se repita: ahí se guarda qué se
mandó ayer. Si apunta a un sitio que se borra, cada ejecución vuelve a mandar todos los
avisos como si fuera el primer día.

Si `INFORME_EMAIL_TO` no está, se usa `EMAIL_TO`, que es el mismo que ya usa vender.

## El adjunto del correo

Cada correo lleva un `informe-<fecha>.md` adjunto. Es el fichero que se le pasa a un
agente para que aplique los cambios: cada accion lleva el fichero y la linea exacta, asi
que no hay que ir a buscar nada.

Secciones, por orden de utilidad:

1. **Acciones.** Que tocar, por que, en que fichero y en que linea.
2. **Intencion local.** Consultas que mencionan una provincia o ciudad, agrupadas por
   zona, y si alguna tiene volumen para una pagina propia.
3. **Huecos de contenido.** Consultas con impresiones que ninguna pagina reclama,
   agrupadas por tema, para decidir el proximo articulo con datos.
4. **Cobertura de llm.txt.** Consultas reales que el llm.txt no responde. Es la parte
   GEO: un modelo no cita lo que no encuentra escrito.
5. **Canibalizacion interna.** La misma keyword declarada en varias paginas del mismo
   dominio, que se quitan posiciones entre ellas.
6. **Datos en bruto.** Las tablas completas de consultas y paginas.

### Sobre las paginas por provincia

El umbral para proponer una pagina de zona son 150 impresiones. Por debajo, 52 paginas
casi iguales compitiendo entre ellas son doorway pages, que es de lo poco que Google
penaliza de forma explicita. Hoy la zona con mas demanda es Madrid, con 19 impresiones,
asi que el informe dice que no y explica por que. Cuando alguna zona pase del umbral lo
dira solo.

Mientras tanto lo que si cabe es nombrar las zonas con demanda dentro de una pagina que
ya existe, sin crear ninguna nueva.

### Como se calcula la cobertura del llm.txt

Cada palabra de la consulta pesa menos cuanto mas se repite en el texto. Sin eso,
"cartas magic sueltas" salia cubierta al 100 % en el hub solo porque "cartas" y "magic"
aparecen en cada parrafo, aunque de vender sueltas no se hable en ninguna parte.

## Qué mira y qué no

El reparto entre los dos dominios sale de `docs/reparto-keywords.md`: el hub explica y
vender vende. El informe lo comprueba contra las keywords que cada página declara de
verdad, leyéndolas de `apps/*/routes/main.js` y del front matter de cada artículo, así
que un artículo nuevo entra solo.

Cuando una página declara una keyword, eso manda sobre el patrón de palabras. Es lo que
hace que `valoracion cartas magic` cuente como de vender: no lleva ningún verbo de venta
y por las palabras parecería del hub, pero su página la reclama.

Por debajo de diez impresiones no se avisa de nada. Con 48 visitas al mes, una consulta
de dos impresiones no distingue una tendencia de una casualidad.

## Los tests

```bash
npm test
```

Cubren el clasificador de intención contra las dos listas de `docs/reparto-keywords.md`.
Si alguien cambia el reparto en el documento y no aquí, los tests lo cantan.
