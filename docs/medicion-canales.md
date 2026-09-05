# Medición de canales de captación

Documenta cómo se atribuye cada colección comprada al canal que la trajo. El objetivo
es saber qué canal merece inversión antes de gastar meses en contenido.

## Contexto

Por volumen declarado, el orden de los canales de captación es:

1. Boca a boca
2. Tarjeta de visita incluida en los paquetes de Cardmarket
3. Búsqueda orgánica

Ninguno estaba medido. La tarjeta es el único de los tres que se puede instrumentar
sin trabajo adicional por venta, porque ya se incluye en cada paquete.

Cardmarket prohíbe captar a sus usuarios fuera de la plataforma. La tarjeta no
infringe esa norma: quien la recibe ya ha completado una compra y es cliente propio
a partir de ese momento. No se hace ningún envío de correo ni contacto directo.

## Enlace de la tarjeta

El QR de la tarjeta apunta a:

```
https://vendercartasmagic.es/valoracion-cartas-magic?utm_source=business-card&utm_medium=parcel&utm_campaign=cardmarket
```

Desglose de los parámetros:

| Parámetro | Valor | Por qué |
|---|---|---|
| `utm_source` | `business-card` | El soporte físico que lleva el enlace |
| `utm_medium` | `parcel` | La vía por la que llega, dentro del paquete |
| `utm_campaign` | `cardmarket` | El origen de la venta que genera el envío |

El destino es la página de valoración, no la portada: quien escanea el QR ya tiene
intención, y hacerle pasar por la portada añade un paso que puede perderlo.

## Cómo leer los datos

En GA4, propiedad de `vendercartasmagic.es` (flujo `G-6PJYPF57RF`), filtrando por
`session_source = business-card`.

Lo que interesa no es la cifra de sesiones sino la de formularios enviados: una
sesión sin envío no informa de nada porque el canal no tiene alternativa de
navegación.

## Qué decide este dato

Con dos meses de datos se responde a una pregunta que hoy está abierta: si la tarjeta
ya convierte, imprimir más tarjetas rinde más que escribir artículos durante los
próximos seis meses. Si no convierte, el esfuerzo de captación se va a contenido.

Hasta tener esa respuesta, el plan de contenido se mantiene en el tamaño mínimo que
cubre la capacidad real de compra, entre cuatro y doce colecciones al mes.

## Enlaces entre los dos dominios

Los dos sitios se enlazan mutuamente y todos los enlaces llevan parametros de medicion,
para saber que pieza de contenido trae cada lead.

### Del hub hacia vender

Los construye `apps/hub/lib/enlaces.js`. Ninguna plantilla escribe la URL a mano: si un
enlace no pasa por ahi, no se mide, y el modulo obliga a declarar la campaña.

Los enlaces escritos dentro del markdown de un articulo tambien se reescriben al
renderizar, asi que una guia nueva no puede olvidarse de medir.

| Origen | utm_campaign |
|---|---|
| Portada, boton principal | `home-cta` |
| Portada, enlace al proceso | `home-proceso` |
| Indice del blog | `blog-indice` |
| Cada articulo | `articulo-<slug>` |
| Pagina 404 | `404` |

Todos comparten `utm_source=cartasmagic` y `utm_medium=hub`.

### De vender hacia el hub

Un enlace en el pie hacia las guias, con `utm_source=vendercartasmagic`,
`utm_medium=footer` y `utm_campaign=guias`. Sin el, el enlazado solo iba en una
direccion y el blog no recibia nada del trafico que vender ya tiene.

### Que se responde con esto

En GA4, filtrando por `session_campaign`, se puede saber que articulo trae visitas que
acaban rellenando el formulario. Es lo que decide si merece la pena seguir escribiendo, y
sobre que temas.

## Pendiente

- Revisar los datos a las ocho semanas desde la primera tarjeta con el QR nuevo
