# Plan de contenido del blog

Qué falta por escribir en cartasmagic.es, por orden de prioridad. El criterio no es el
volumen de búsquedas sino cuántas colecciones puede traer cada pieza.

Hoy entran unas dos colecciones al mes y caben doce, así que el cuello de botella es la
demanda y no la capacidad: cada pieza que traiga un vendedor más sirve para algo. Las doce
son un objetivo de 2027, porque la búsqueda orgánica sola no multiplica por seis lo que
entra. El razonamiento y el recuento por meses están en
[competidores.md](competidores.md).

## Lo que ya está publicado

| Artículo | Qué cubre |
|---|---|
| Cómo saber cuánto vale una carta Magic | Los siete factores del precio |
| Estado de la carta: NM, EX, GD y LP | Las categorías de estado y sus descuentos |
| Qué colecciones antiguas valen dinero | La regla del borde y las ediciones que se pagan |
| Qué compramos y a cuánto | Datos propios de las colecciones compradas |

El bloque de valoración está cubierto. Los huecos están en las otras tres intenciones que
lleva quien busca: comparar opciones, resolver dudas del proceso y salir de dudas sobre
casos concretos.

## Prioridad 1: los que faltan y traen ventas

### 1. Descartado: dónde vender cartas Magic en España

Estaba propuesto como la pieza más importante y los datos de Search Console lo
desaconsejan. "donde vender cartas magic" ya rankea en vendercartasmagic.es en la
posición 6 y "como vender cartas magic" en la 9, con la página `como-vender-cartas-magic`
ya publicada.

Escribirlo en el hub sería competir contra la propia casa por posiciones que ya se
tienen. Lo que conviene en su lugar es mejorar esa página de vender, que acumula 203
impresiones en la posición 32.

Ver `reparto-keywords.md` para la frontera entre los dos dominios.

### 2. Cuánto tarda y cómo se cobra al vender una colección

Las dudas que frenan a quien está a punto de decidirse son de proceso, no de precio: qué
pasa si no acepto, quién paga la vuelta, cuándo cobro, qué pasa si se pierde el paquete.
Están respondidas en el FAQ de vender, pero no como contenido que Google pueda mostrar
por sí solo.

Es el artículo con más probabilidad de convertir de toda la lista, porque quien lo busca
ya está decidido a vender y solo le falta confiar.

### 3. Qué hacer con la colección de Magic de un familiar

Un segmento entero sin atender: quien hereda o recibe una colección y no juega. No sabe
qué tiene, no sabe si le están engañando y no tiene a quién preguntar. Suele ser además
el caso con colecciones más antiguas, que es donde está el dinero.

Nadie en España escribe para este lector, y llega en el peor momento posible para
ponerse a aprender de Magic.

## Prioridad 2: captan búsquedas y refuerzan la autoridad

### 4. Las cartas Magic más caras que puedes tener en casa

Capta intención de compra, que no podemos servir, y la reconvierte: quien busca cartas
caras quiere saber si tiene alguna. Es el artículo que más tráfico traerá y el que peor
convierte, así que va después de los tres primeros.

Debe apoyarse en las cartas que aparecen de verdad en las colecciones que compramos, no
en la lista de las diez más caras del mundo que ya está escrita cuatrocientas veces.

### 5. Cómo se guarda una colección de Magic para que no pierda valor

Contenido de servicio puro, sin intención comercial directa. Es el tipo de pieza que se
enlaza y se comparte en comunidades, y refuerza la posición de quien sabe del tema.
Aprovecha lo que ya está escrito en el artículo de estados sobre gomas, humedad y sol.

### 6. Qué es el bulk y por qué casi toda colección es bulk

Explica la cifra del 86 % con la profundidad que el artículo de datos no tiene. Sirve
para gestionar expectativas antes de la valoración, que es donde se pierden las
conversaciones: quien espera cobrar por las mil cartas y cobra por treinta se siente
engañado aunque el precio sea correcto.

## Prioridad 3: cuando haya tiempo

### 7. Cómo saber si una carta Magic es falsa

Búsqueda con volumen y muy poca competencia buena en castellano. Aparecen falsificaciones
en las colecciones reales, así que hay experiencia propia que contar.

### 8. Actualización trimestral de los datos de compras

No es un artículo nuevo sino mantener vivo el de datos. Cada tanda de colecciones
compradas mueve las cifras, y `scripts/agregados-compras.js` las recalcula. Un artículo
con datos que se actualizan vale mucho más que uno congelado.

## Qué no escribir

- **Guías de cómo jugar, mazos o reglas.** Atraen a jugadores activos, que son
  exactamente quienes no venden su colección.
- **Noticias de lanzamientos.** Caducan en semanas y compiten con medios especializados
  que publican a diario.
- **Listas genéricas del tipo "las 10 cartas más caras de la historia".** Ya están
  escritas mil veces y no hay nada que aportar sin datos propios.

## Sobre el proceso automatizado

Los cuatro artículos publicados se escribieron a mano y ninguno se habría podido generar
sin criterio propio: la regla del borde, los porcentajes de descuento y las cifras de
compras salen de la experiencia, no de fuentes públicas.

Eso sugiere repartir el trabajo así: automatizar la recopilación de datos, los precios y
la actualización de las cifras, y escribir la prosa a mano. Un artículo generado entero
sobre un tema que cualquiera puede escribir no aporta nada que un motor generativo tenga
motivo para citar.
