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

## Demanda de compra, que hoy no se atiende

En el trimestre hasta septiembre de 2026 aparecen consultas de gente que quiere
**comprar**, no vender:

| Consulta | Impresiones | Posición |
|---|---|---|
| compra venta cartas magic | 19 | 6,0 |
| compra cartas magic | 11 | 15,5 |
| compro cartas magic | 7 | 8,9 |
| comprar cartas de magic | 2 | 26,0 |
| comprar cartas magic online | 2 | 18,0 |
| comprar cartas magic sueltas | 2 | 19,0 |

Suman unas 43 impresiones, y en el hub salen otras seis consultas del mismo tipo
("cartas magic comprar", "comprar magic the gathering") que aterrizan en una portada que
no vende nada. Son visitas que llegan, no encuentran lo que buscan y se van.

El volumen todavía es pequeño, pero la intención es inequívoca y ninguna página la
atiende. La idea a medio plazo es `comprarcartasmagic.es`, una tienda pequeña, que
cerraría el círculo: se compran colecciones enteras por un lado y se venden las cartas
sueltas por otro.

Mientras no exista, esas keywords **no se reparten**: no se le dan ni al hub ni a vender,
porque ninguno de los dos puede responder a lo que se busca. Rankear para "comprar cartas
magic" y llevar a quien busca a un formulario de venta es una visita perdida y una señal
mala para Google.

Cuando la tienda exista, el reparto pasa a tres:

- **cartasmagic.es**, informacional. Qué vale y por qué.
- **vendercartasmagic.es**, transaccional de venta. Quien tiene cartas y quiere dinero.
- **comprarcartasmagic.es**, transaccional de compra. Quien quiere cartas y tiene dinero.

Conviene revisar la cifra cada par de meses en el informe diario: la sección de huecos de
contenido ya agrupa estas consultas bajo el tema "compra". Si pasan de unas 150
impresiones al trimestre, la tienda deja de ser una idea y pasa a ser una decisión con
datos detrás.
