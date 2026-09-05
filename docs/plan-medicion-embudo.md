# Plan para saber dónde se cae la gente

Hoy se mide el final del embudo, el evento `generate_lead` cuando el formulario se
envía, y nada de lo que ocurre antes. Con eso no se puede saber si quien no convierte se
fue en la portada, abandonó el formulario a medias o falló al enviarlo.

## El punto de partida

| Dato | Valor |
|---|---|
| Visitas orgánicas al mes | unas 48 |
| Leads al mes | entre 3 y 4 |
| Conversión | entre el 6 % y el 8 % |

Conviene tener esa conversión presente antes de tocar nada: para un formulario que pide
confiar una colección de miles de euros a un desconocido, está muy por encima de lo
normal. El problema no es que la web convierta mal, es que llega poca gente.

Esto cambia para qué sirve medir el embudo. No es para arreglar una fuga sino para
descartar que exista, y para tener una línea base antes de mover el tráfico.

## El aviso importante sobre el volumen

Con 48 visitas al mes, la diferencia entre un 6 % y un 8 % de conversión es **un lead**.
Cualquier lectura antes de ocho semanas va a ser ruido, y actuar sobre ella es peor que
no medir.

Por eso el plan mide de una vez y espera, en lugar de revisar cada semana y reaccionar.

## Fase 1: instrumentar el embudo (hecho el 5 de septiembre de 2026)

Cinco eventos, del más general al más concreto. Antes solo existía `generate_lead`.

| Evento | Cuándo se dispara | Qué revela |
|---|---|---|
| `ver_formulario` | La página del formulario se carga | Cuántos llegan a la puerta |
| `empezar_formulario` | Primer campo que se rellena | Cuántos se sientan a escribir |
| `intento_envio` | Se pulsa el botón de enviar | Cuántos terminan |
| `generate_lead` | El envío se completa | Cuántos lo consiguen |
| `envio_rechazado` | El backend rechaza el envío | Qué validación lo frena |

La distancia entre `intento_envio` y `generate_lead` es la más reveladora: si hay hueco,
alguien está intentando enviar y fallando, y eso es un error corregible, no una decisión
del visitante. `envio_rechazado` lleva el `errorCode` del backend, así que dice qué
validación concreta lo frena.

Viven en `views/partials/medicion-embudo.ejs`, incluido en los dos formularios. El evento
de empezar salta con el primer campo que se toca, por delegación, así que sigue valiendo
si mañana se añade otro campo.

## Fase 2: la caída anterior al formulario (hecho el 5 de septiembre de 2026)

El embudo no empieza en el formulario sino en la portada, que es la página que recibe
casi todo el tráfico: 144 de los 149 clics del trimestre.

El evento `clic_cta` salta al pulsar cualquiera de los botones que llevan a la valoración
o al presupuesto, con la posición del botón y la página de origen. La portada tiene tres
botones al mismo destino y así se sabe cuál funciona. Está en el layout, así que cubre
todas las páginas.

Eso responde a la pregunta que hoy no se puede responder: de cada cien que entran por la
portada, cuántos llegan siquiera a ver el formulario.

## Fase 3: leer los datos

A las ocho semanas, no antes. Las cifras que interesan:

- **Portada a formulario.** Si baja del 20 %, el problema está en la portada y no en el
  formulario.
- **Formulario visto a formulario empezado.** Si baja del 40 %, el formulario asusta
  nada más verlo.
- **Empezado a enviado.** Si baja del 60 %, hay un campo que molesta. El desplegable de
  volumen y el mensaje libre son los sospechosos.
- **Intento de envío a lead.** Si no es prácticamente el 100 %, hay un fallo técnico y es
  lo primero que hay que arreglar.

## Qué no hacer

**No hacer tests A/B.** Con 48 visitas al mes, distinguir dos versiones de un formulario
exigiría más de un año para tener significancia. Cualquier resultado antes de eso es
azar, y decidir sobre azar es peor que no decidir.

**No rediseñar el formulario todavía.** Los CTA de vender llevaban desde el principio con
el texto del mismo color que el fondo para cualquier visitante recurrente, y eso se
corrigió el 5 de septiembre de 2026. Los datos de antes de esa fecha están contaminados
por ese fallo y no sirven de comparación.

**No perseguir décimas de conversión.** Duplicar el tráfico y duplicar la conversión dan
el mismo número de leads, pero con una conversión ya en el 7 % lo primero es mucho más
fácil que lo segundo.

## El orden que tiene sentido

1. Instrumentar, que es media jornada de trabajo
2. Dejar correr ocho semanas sin tocar nada
3. Leer, junto con los datos del QR de la tarjeta, que empiezan a llegar por las mismas
   fechas
4. Decidir entonces con dos fuentes de datos en la mano en lugar de una

Mientras tanto, el esfuerzo va a lo que sí mueve la aguja hoy, que es traer más gente:
el blog y las páginas internas de vender, que están en posiciones 32 y 43 y no reciben
prácticamente nada.
