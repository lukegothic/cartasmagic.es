# Casos de uso de vendercartasmagic.es

Los cuatro casos que puede recibir la bandeja de entrada, qué hay que hacer con cada
uno y qué lleva el correo que sale. Y dos estados que cruzan la rejilla y cambian la
acción siguiente sin cambiar de caso.

Ninguno de los correos que genera la aplicación se manda al cliente. Todos llegan a
`EMAIL_TO` con el cliente en `replyTo`, y el cuerpo ya viene redactado para reenviarlo
tal cual. Los datos del formulario viajan aparte, en un adjunto de notas que se borra
antes de reenviar.

## La rejilla

Dos vías de entrada, y en cada una la dirección es opcional:

| | Sin dirección | Con dirección |
|---|---|---|
| **Postal** (`/valoracion-cartas-magic`) | Caso 1 | Caso 2 |
| **ManaBox** (`/presupuesto-manabox`) | Caso 3 | Caso 4 |

La vía postal es la de quien quiere vender una colección entera y todavía no hay cifra
que darle. La de ManaBox es la de quien manda una lista y recibe ya una oferta
calculada.

## Caso 1: postal sin dirección

**Qué hace la aplicación.** Valida el formulario, aplica el límite por correo y compone
el aviso. No hay ninguna llamada a un tercero, así que aquí no falla nada salvo el envío.

**Asunto que llega.** `Nueva colección: <nombre> (<volumen>)`

**Cuerpo que sale.** Saludo, cómo funciona valorar una colección entera, el proceso
completo con los 10 € de la devolución, la petición de la dirección de remitente, los
límites del paquete, el plazo de la etiqueta y la invitación a llenar la caja.

**Acción siguiente.** Reenviar y esperar la dirección. La etiqueta no se puede generar
todavía.

## Caso 2: postal con dirección

**Qué hace la aplicación.** Lo mismo, y además saca la localidad de la dirección para
ponerla en el asunto.

**Asunto que llega.** `Nueva colección: <nombre> (<volumen>, <localidad>) - con dirección`

**Cuerpo que sale.** Igual que el caso 1, pero en vez de pedir la dirección habla de la
etiqueta como si viniese adjunta: los tres pasos del envío, el número de seguimiento y
los límites del paquete.

**Acción siguiente.** Generar la etiqueta en Packlink, adjuntarla y reenviar. El correo
ya dice que va adjunta, así que reenviarlo sin ella deja al cliente esperando algo que
no está.

## Caso 3: ManaBox sin dirección

**Qué hace la aplicación.** Valida el enlace, descarga el mazo, calcula la oferta por
tramos y compone el correo con dos adjuntos: las notas y el desglose en csv.

**Asunto que llega.** `Presupuesto para <nombre>: <oferta> EUR`

**Cuerpo que sale.** Saludo, la cifra destacada con el total de cartas, qué incluye la
oferta, la advertencia de que el precio da por hecho inglés y Near Mint, los dos enlaces
que explican por qué una carta baja, la petición de la dirección, los límites del
paquete, el plazo de oferta y etiqueta, y la invitación a llenar la caja.

**Acción siguiente.** Decidir si el desglose en csv va al cliente y reenviar. Después,
esperar la dirección.

## Caso 4: ManaBox con dirección

**Asunto que llega.** `Presupuesto para <nombre> (<localidad>): <oferta> EUR - con dirección`

**Cuerpo que sale.** Igual que el caso 3, pero con el bloque de la etiqueta en lugar de
la petición de la dirección.

**Acción siguiente.** Generar la etiqueta, decidir sobre el csv, adjuntar las dos cosas
y reenviar. Es el único caso con dos adjuntos que decidir a la vez.

## Lo que cruza la rejilla

### Dirección que parece incompleta

Afecta a los casos 2 y 4. Una dirección se marca como dudosa cuando no llega a 15
caracteres o cuando no se le encuentra un código postal español. No se rechaza: una
dirección postal admite demasiadas formas y rechazar la buena es peor que aceptar la
dudosa.

El aviso sale solo en una línea del adjunto de notas, debajo de la dirección. El cuerpo
del correo no cambia: sigue hablando de la etiqueta como si viniese adjunta.

**Acción siguiente.** No reenviar tal cual. Hay que editar el correo antes de mandarlo:
quitar el bloque de la etiqueta y pedir la dirección otra vez. Es el único caso que pide
tocar el cuerpo a mano, y por eso conviene mirar el adjunto de notas antes de reenviar
nada de los casos 2 y 4.

### Oferta por debajo del mínimo

Afecta solo a los casos 3 y 4: en la vía postal no hay cifra todavía. Salta cuando la
oferta calculada no llega a `OFERTA_MINIMA`. Se avisa en el asunto y en las notas.

El cuerpo no cambia: la cifra sale destacada igual que en cualquier otro presupuesto.

**Acción siguiente: sin decidir.** Hoy no hay procedimiento fijo. Lo que hay que tener
en cuenta al decidirlo es que un envío por debajo del mínimo no se paga solo, y que el
correo ya trae la cifra redactada como definitiva, así que declinar después obliga a
escribir a mano.

## Dónde vive cada cosa

| Qué | Fichero |
|---|---|
| Prosa de los correos | `apps/vender/lib/textos-correo.js` |
| Maquetación y bloques comunes | `apps/vender/lib/correo-plantilla.js` |
| Cuerpo de la vía postal | `apps/vender/lib/correo-postal.js` |
| Cuerpo de la vía de ManaBox | `apps/vender/lib/correo-manabox.js` |
| Adjunto de notas y pasos del reenvío | `apps/vender/lib/notas.js` |
| Lectura de la dirección | `apps/vender/lib/direccion.js` |
| Cálculo de la oferta por tramos | `apps/vender/lib/presupuesto.js` |

Los pasos concretos del reenvío no se repiten aquí a propósito: viajan dentro del
adjunto de notas de cada correo y se adaptan al caso, así que se leen con el caso
delante y no en un documento aparte.
