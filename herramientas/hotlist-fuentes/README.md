# Qué compran las otras tiendas

Mira cada día las hotlists públicas de tiendas de fuera y saca qué cartas han empezado a
buscar y cuáles han cambiado de precio. Sirve para decidir qué entra en nuestra hotlist
(`apps/vender/lib/hotlist-cartas.js`), no para copiar cifras.

## Lo primero: los precios de fuera no son nuestros precios

Las cifras que saca esta herramienta son en dólares y en dólares canadienses, sobre el
mercado americano, con los costes y la demanda de allí. Nuestro precio sale de Cardmarket y
lo decide el negocio carta por carta.

Lo que aporta el informe es la señal, no la cifra: si dos tiendas empiezan a pagar más por
la misma carta la misma semana, conviene ir a mirar esa carta a Cardmarket. Ese es el uso.

## Cómo añadir una tienda

Editando `fuentes.json`. No hay que escribir código: cada entrada dice de dónde se lee y de
qué forma. El `tipo` decide cuánto se saca solo:

| tipo | De dónde | Qué sale |
|---|---|---|
| `shopify` | `/collections/<handle>/products.json` | Todo: carta, edición y precio |
| `tabla` | Una tabla html, diciendo qué columna es cuál | Lo que tenga la tabla |
| `imagen` | Una página con la lista en un cartel | Los enlaces de las imágenes, para mirarlas |
| `html` | Cualquier otra página | El enlace y el tamaño, para mirarla |
| `pendiente` | No se pide nada | Solo el recordatorio de por qué no se lee |

**Ninguna fuente se descarta por no poder leerse entera.** Lo que no se sepa extraer sale en
el informe con su enlace, porque quien revisa esto es una persona y un cartel de noventa
cartas vale más que su ausencia. Esa es la diferencia con la primera versión, que solo servía
para fuentes que se pudieran analizar enteras.

## Uso

```bash
cd herramientas/hotlist-fuentes
node hotlist.js
```

No hay que instalar nada: solo biblioteca estándar de Node. No tiene dependencias, así que
tampoco hace falta `npm ci` antes de ejecutarlo.

| Orden | Qué hace |
|---|---|
| `npm run hotlist` | Recoge las fuentes y saca el informe para revisar a mano |
| `npm run cambios` | Además, compara con la última vez y dice qué ha cambiado |
| `npm run solo-leer` | Guarda la foto del día sin sacar informe, para empezar el histórico |
| `npm test` | Pruebas, sin tocar la red |

La primera vez todo sale como nuevo, porque no hay con qué comparar. Conviene arrancar con
`solo-leer` y empezar a leer los informes al día siguiente.

## Dónde deja lo que genera

Dos ficheros, `ultimo.json` (la foto de hoy, que mañana sirve de comparación) y
`cambios-<fecha>.md` (el informe legible). Van a `datos/` al lado del código, salvo que se
diga otra cosa con `HOTLIST_ESTADO_DIR`.

En el servidor conviene que vayan fuera del repositorio, porque el clon se actualiza con
`git pull` cada día:

```sh
HOTLIST_ESTADO_DIR=/etc/dokploy/hotlist/estado
```

## Para que corra solo cada día

Se despliega como **schedule de tipo servidor** en Dokploy, igual que el informe diario.
Los schedules corren dentro del contenedor de Dokploy, que trae Node y no trae Python: por
eso esta herramienta es de Node y no de Python, para no mantener dos lenguajes en los
schedules ni levantar un contenedor aparte solo para esto.

Cron `30 6 * * *`, a una hora de poco tráfico, con este script:

```sh
cd /etc/dokploy/informe/repo && git pull -q
cd herramientas/hotlist-fuentes
HOTLIST_ESTADO_DIR=/etc/dokploy/hotlist/estado node hotlist.js
```

El repositorio ya está clonado en `/etc/dokploy/informe/repo`, que es el mismo que usa el
informe diario. No hace falta otro clon.

Devuelve 1 si no ha podido leer ni una sola fuente, así que Dokploy avisa si se cae todo. Si
solo se cae una, el informe lo dice en su propia sección y las demás siguen.

## Las cuatro fuentes

| Fuente | Cómo se lee | Estado |
|---|---|---|
| La Crypte (cryptmtg) | `products.json` de la colección de Shopify | Se lee sola, 21 cartas |
| Card Monster Games | Tabla dentro de la página | Se lee sola, 28 cartas |
| 95 Game Center | Cartel en una imagen | Hay que mirarla a ojo |
| Star City Games | Sus condiciones lo prohíben | Pendiente, ver abajo |
| Alchemist's Refuge | No publica la lista | Descartada, no hay nada que leer |

Las listas que van en una imagen son el formato más común entre las tiendas pequeñas: un
cartel con noventa nombres y su precio, sin edición ni estado. No se leen solas, y por eso la
herramienta se limita a dejar el enlace a la vista.

**Alchemist's Refuge** anuncia una hot list en su página de buylist pero no la publica:
remite a preguntar en la tienda. Se comprobaron sus 250 colecciones de Shopify y ninguna
enumera cartas de compra. No es un fallo de la herramienta, es que no hay datos.

**Star City Games** no trae las cartas en el html: las pide un Meilisearch firmando con una
clave de api que viaja dentro de su javascript. Esa clave es suya, no nuestra, y usarla
desde un proceso automático es usar una credencial ajena. No se hace. Los caminos limpios
están en el comentario de `fuentes/starcitygames.js`; el primero es escribirles y pedir
acceso, que tienen programa de socios.

## Cómo se portan las fuentes

- Se identifica el proceso con un User-Agent que lleva el dominio y el correo, para que
  quien reciba las peticiones sepa a quién escribir en vez de tener que bloquear a ciegas.
- Un segundo de espera entre peticiones. Ninguna de las listas cambia en cuestión de
  minutos, así que no hay ninguna prisa que justifique apretar.
- Solo se leen páginas que su `robots.txt` permite. Se comprobó una a una.

## Al añadir una fuente

Un fichero por fuente en `fuentes/`, que devuelva una lista de anuncios con la forma que
describe `fuentes/comun.js`. Cada fuente recibe su lector como parámetro, con el de red por
defecto, y así se prueba sin tocar la red.

Lo único que hay que respetar es la diferencia entre lista vacía y `FuenteCaida`: una tienda
puede quedarse sin cartas que buscar, y eso es un dato, pero que su web esté caída no lo es.
Confundirlos haría que el informe dijera que han dejado de comprar.
