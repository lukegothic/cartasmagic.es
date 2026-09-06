# Unificar los dos dominios: qué costaría y por qué todavía no

La idea es mover `vendercartasmagic.es` a `cartasmagic.es/vender` con un 301 y quedarse
con una sola marca. Queda escrito con los números delante para no tener que rehacer el
razonamiento dentro de tres meses.

**Decisión de septiembre de 2026: no se hace todavía.** No es un no definitivo, es un no
por ahora, y más abajo está lo que tendría que cambiar para que fuera un sí.

## El número que manda

Los tres meses hasta el 3 de septiembre de 2026:

| Dominio | Impresiones | Clics |
|---|---|---|
| vendercartasmagic.es | 1.673 (solo la portada) | 128 |
| cartasmagic.es | 13 | 0 |

Vender es unas 128 veces el hub. El 301 llevaría el dominio fuerte al débil, que es al
revés de como se suele consolidar: normalmente se redirige hacia donde está la autoridad,
no desde ella.

## Qué costaría

Un 301 conserva casi toda la autoridad que dan los enlaces, pero Google vuelve a evaluar
el destino desde cero. Lo razonable es contar con perder entre el 20 % y el 40 % del tráfico durante dos a
cuatro meses, y recuperar después el nivel anterior si no se tuerce nada. Sobre 128 clics
al mes son unos 30 a 50 clics menos al mes durante un trimestre, que con una conversión
del 7 % salen dos o tres leads.

Hay un agravante propio de este caso. `vendercartasmagic.es` es un dominio de coincidencia
exacta con la mejor consulta del sitio, "vender cartas magic", con 268 impresiones y
posición 7,7. Parte de por qué rankea es el nombre del dominio. Al pasar a
`cartasmagic.es/vender` eso se pierde, así que la recuperación puede quedarse por debajo
del punto de partida. Ese coste no es temporal, es permanente.

## Por qué ahora no

1. **Hay un corte de datos sin explicar** entre el 20 de julio y el 2 de septiembre de
   2026, en [corte-julio-2026.md](corte-julio-2026.md). No se migra un sitio que viene de
   una anomalía que todavía no se entiende.
2. **El hub no tiene autoridad para recibir nada.** Sus cuatro artículos se publicaron el
   5 de septiembre de 2026 y no están ni indexados.
3. **Se entrega un dominio de coincidencia exacta** de la consulta que más tráfico trae.
4. **La marca única es una ventaja estratégica, no urgente.** Dos dominios no cuestan nada
   hoy.

## Qué tendría que pasar para hacerlo

En este orden, no en otro:

1. Que el corte de julio tenga explicación y no se repita.
2. Que el hub rankee por su cuenta, con sus artículos indexados y trayendo tráfico
   informacional propio durante tres a seis meses.
3. Que el hub llegue a un volumen que haga discutible cuál de los dos es el dominio
   fuerte.

Si el hub crece hasta ahí, la conversación cambia y merece la pena volver a mirarlo. Si no
crece, no se ha perdido nada: se tiene un sitio de contenido y un sitio que vende, cada
uno en lo suyo.

## Si se hace, cómo

Nunca la portada primero. La secuencia segura es mover una página de poco valor, ver qué
pasa y solo entonces seguir:

1. Migrar `/presupuesto-manabox`, que tiene cero impresiones y no arriesga nada.
2. Esperar de cuatro a seis semanas y comprobar que la URL nueva recupera lo que tenía la
   vieja.
3. Seguir con `/como-vender-cartas-magic` y repetir la espera.
4. La portada, la última, y solo si los dos pasos anteriores salieron limpios.

## Lo que sí conviene hacer mientras tanto

El reparto de keywords por intención, el de
[reparto-keywords.md](reparto-keywords.md), sirve igual con uno o con dos dominios: si
algún día se unifican, cada página se lleva sus keywords y solo cambia de URL. Trabajar
ese reparto no es trabajo perdido en ninguno de los dos escenarios, y es lo que hay que
hacer ahora en vez de mover dominios.
