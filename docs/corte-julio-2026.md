# El corte de datos del 20 de julio al 2 de septiembre de 2026

Search Console no tiene ni una fila entre el 20 de julio y el 2 de septiembre de 2026,
en los dos dominios. Queda escrito porque condiciona cualquier lectura de los datos de
ese periodo y porque la causa sigue sin saberse.

## Lo que se ve

El corte es limpio, sin caída previa:

| Día | Impresiones |
|---|---|
| 17 de julio | 28 |
| 18 de julio | 25 |
| 19 de julio | 40 |
| 20 de julio a 2 de septiembre | sin datos |
| 3 de septiembre | 26 |

Antes del corte el tráfico venía creciendo mes a mes desde diciembre de 2025: 146
impresiones en enero, 926 en marzo, 1.430 en mayo. Julio se quedó en 825 porque solo
cuenta hasta el día 19.

## Lo que descarta que sea una caída de posiciones

Una penalización o una pérdida de posiciones deja rastro: las impresiones bajan durante
días o semanas antes de desaparecer. Aquí no hay pendiente, hay un escalón.

Y al volver, el sitio rankea **mejor** que antes:

| Consulta | Posición antes (13-19 jul) | Posición ahora (3-6 sep) |
|---|---|---|
| vender cartas magic | 13,0 | 7,7 |

Las páginas siguen indexadas y responden 200. El `robots.txt` permite el rastreo y los
dos sitemaps listan las URL correctas. No hay nada que reparar en el sitio.

## Lo que apunta a la causa

Los dos dominios cortan y vuelven **el mismo día**. Que dos sitios independientes,
desplegados por separado, coincidan al día es demasiada casualidad para ser un problema
de los sitios: apunta a la cuenta de Search Console, no a las webs.

Las dos propiedades son de tipo dominio (`sc-domain:`), que se verifican por DNS. Si la
verificación se cayó, por ejemplo al tocar los registros DNS, Search Console deja de
acumular datos para las dos a la vez y los recupera al reverificar.

Se comprobó que los datos no estén en otra propiedad de tipo prefijo
(`https://vendercartasmagic.es/`, con `www` y con `http`): ninguna existe o es accesible,
así que el hueco no es que los datos estén en otro sitio.

## Lo que queda por mirar

La investigación se paró aquí a propósito, porque a partir de este punto son
comprobaciones manuales en paneles:

- Si hubo algún cambio de DNS o de registrador alrededor del 19 de julio.
- Si en Search Console aparece algún aviso de verificación perdida y recuperada.
- Si el hosting tuvo una caída larga en esas fechas.

## Qué significa para los datos

Cualquier comparación que cruce el 20 de julio está falseada: parece una caída del 100 %
que no ocurrió. Para leer tendencias hay que comparar el tramo anterior al 19 de julio
con el posterior al 3 de septiembre, sin sumar el hueco.

El informe diario no lo sabe: calcula sus ventanas sobre los últimos noventa días, así
que hasta principios de diciembre de 2026 seguirá arrastrando días vacíos y las medias
saldrán más bajas de lo real.
