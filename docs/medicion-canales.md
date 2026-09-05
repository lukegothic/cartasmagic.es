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

## Pendiente

- Regenerar el QR de la tarjeta con la URL de arriba y reimprimir
- Revisar los datos a las ocho semanas desde la primera tarjeta con el QR nuevo
