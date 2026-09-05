# Reparto de keywords entre los dos dominios

Regla de una línea: **el hub explica, vender vende.** Ninguna keyword transaccional en
cartasmagic.es, ninguna informacional en vendercartasmagic.es.

## Por qué hace falta la regla

Al reposicionar el hub como sitio de contenido se le pusieron keywords que ya eran de
vender, entre ellas "vender cartas magic" y "cuanto valen mis cartas magic". Con un blog
que va a crecer, cada artículo nuevo es otra ocasión de pisar el mismo terreno sin que
nadie se dé cuenta hasta que caen las posiciones.

## Lo que dicen los datos

De los tres meses hasta septiembre de 2026 en vendercartasmagic.es:

| Intención | Impresiones | Clics |
|---|---|---|
| Vender (transaccional) | 604, el 70 % | 53 |
| Comprar | 61, el 7 % | 4 |
| Valor y tasación (informacional) | 36, el 4 % | 0 |

Vender domina lo transaccional con claridad: "vender cartas magic" en posición 10,
"donde vender cartas magic" en la 6, "vender cartas magic online" en la 4.

En cambio no rankea nada en lo informacional. "valorar cartas magic" está en la posición
12 y "tasar cartas magic" en la 15, ambas con cero clics. Ese territorio está libre y es
el que le toca al hub.

## El reparto

### cartasmagic.es, informacional

Qué determina el precio, cómo se calcula, qué vale y qué no. El lector todavía no ha
decidido vender.

- valor cartas magic, cuanto vale una carta magic
- valorar cartas magic, tasar cartas magic
- precio cartas magic antiguas
- estado cartas magic, near mint magic
- cartas magic antiguas valor, ediciones magic caras

### vendercartasmagic.es, transaccional

Cómo se vende, cuánto se cobra, cuándo llega el dinero. El lector ya ha decidido y busca
a quién.

- vender cartas magic, vender coleccion cartas magic
- donde vender cartas magic, como vender cartas magic
- vender cartas magic online, vender cartas magic españa
- cuanto valen mis cartas magic, valoracion cartas magic

El posesivo marca la frontera: "valor cartas magic" es del hub, "cuanto valen **mis**
cartas magic" es de vender, porque quien lo escribe ya tiene una colección y quiere
saber qué le dan por ella.

## Antes de publicar un artículo

Comprobar que ninguna de sus keywords aparece en las de vender, en
`apps/vender/routes/main.js`. Si el tema pide una keyword transaccional, no es un
artículo del hub: es una página de vender.

## El caso que hay que revisar

`como-vender-cartas-magic` de vender compara las cuatro formas de vender una colección, y
el plan de contenido propone un artículo del hub sobre dónde vender en España. Se pisan.

Con los datos delante la respuesta es que ese artículo **no debe escribirse en el hub**:
"como vender cartas magic" y "donde vender cartas magic" ya rankean en vender, en
posiciones 9 y 6. La página existe y funciona. Escribir la versión del hub sería competir
contra la propia casa por una posición que ya se tiene.

Lo que sí conviene es mejorar la página de vender, que está en la posición 32 pese a
tener 203 impresiones.
