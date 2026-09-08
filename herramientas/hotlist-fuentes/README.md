# Qué compran las otras tiendas

Mira cada día las hotlists públicas de tiendas de fuera y saca qué cartas han empezado a
buscar y cuáles han cambiado de precio. Sirve para decidir qué entra en nuestra hotlist
(`apps/vender/lib/hotlist-cartas.js`), no para copiar cifras.

## Lo primero: los precios de fuera no son nuestros precios

Las cifras que saca esta herramienta son en dólares y en dólares canadienses, sobre el
mercado americano, con los costes y la demanda de allí. Nuestro precio sale de Cardmarket
y lo decide el negocio carta por carta.

Lo que aporta el informe es la señal, no la cifra: si tres tiendas empiezan a pagar más por
la misma carta la misma semana, conviene ir a mirar esa carta a Cardmarket. Ese es el uso.

## Uso

```bash
cd herramientas/hotlist-fuentes
python hotlist_fuentes.py
```

No hace falta instalar nada: solo biblioteca estándar de Python 3.12.

| Orden | Qué hace |
|---|---|
| `python hotlist_fuentes.py` | Lee las fuentes, compara con la última vez y saca el informe |
| `python hotlist_fuentes.py --solo-leer` | Guarda la foto del día sin sacar informe, para empezar el histórico |
| `python -m unittest discover -s test` | Pruebas, sin tocar la red |

Deja dos ficheros en `datos/`, que no van al repositorio:

- `ultimo.json`, la foto de hoy, que mañana sirve de comparación
- `cambios-<fecha>.md`, el informe legible del día

La primera vez todo sale como nuevo, porque no hay con qué comparar. Conviene arrancar con
`--solo-leer` y empezar a leer los informes al día siguiente.

## Para que corra solo cada día

En el servidor, con cron, a una hora de poco tráfico:

```cron
30 6 * * * cd /ruta/cartasmagic.es/herramientas/hotlist-fuentes && python hotlist_fuentes.py >> datos/registro.log 2>&1
```

Devuelve 1 si no ha podido leer ni una sola fuente, así que cron avisa si se cae todo. Si
solo se cae una, el informe lo dice en su propia sección y las demás siguen.

## Las cuatro fuentes

| Fuente | Cómo se lee | Estado |
|---|---|---|
| Card Monster Games | Tabla escrita a mano dentro de la página | Funciona, 28 cartas de Magic |
| La Crypte (cryptmtg) | `products.json` de la colección de Shopify | Funciona, 21 cartas |
| Alchemist's Refuge | No publica la lista | No hay nada que leer |
| Star City Games | Meilisearch con clave propia | Pendiente, ver abajo |

**Alchemist's Refuge** anuncia una hot list en su página de buylist pero no la publica:
remite a preguntar en la tienda. Se comprobaron sus 250 colecciones de Shopify y ninguna
enumera cartas de compra. No es un fallo de la herramienta, es que no hay datos.

**Star City Games** no trae las cartas en el html: las pide un Meilisearch firmando con una
clave de api que viaja dentro de su javascript. Esa clave es suya, no nuestra, y usarla
desde un proceso automático es usar una credencial ajena. No se hace. Los caminos limpios
están en el comentario de `fuentes/starcitygames.py`; el primero es escribirles y pedir
acceso, que tienen programa de socios.

## Cómo se portan las fuentes

- Se identifica el proceso con un User-Agent que lleva el dominio y el correo, para que
  quien reciba las peticiones sepa a quién escribir en vez de tener que bloquear a ciegas.
- Un segundo de espera entre peticiones. Ninguna de las listas cambia en cuestión de
  minutos, así que no hay ninguna prisa que justifique apretar.
- Solo se leen páginas que su `robots.txt` permite. Se comprobó una a una.

## Al añadir una fuente

Un fichero por fuente en `fuentes/`, que devuelva una lista de `Anuncio`. Lo único que hay
que respetar es la diferencia entre lista vacía y `FuenteCaida`: una tienda puede quedarse
sin cartas que buscar, y eso es un dato, pero que su web esté caída no lo es. Confundirlos
haría que el informe dijera que han dejado de comprar.
