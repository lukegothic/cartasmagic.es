# Publicar o no los porcentajes que se pagan

Decisión abierta, escrita para discutirla a fondo más adelante. Aquí no hay nada resuelto:
están los datos, las dos posturas y las preguntas que hay que contestar antes de tocar una
sola línea de la web.

El punto de partida es que hoy no se publica ninguna cifra, y eso fue una decisión
deliberada que está escrita en [competidores.md](competidores.md). Lo que ha cambiado desde
entonces es que ahora se sabe lo que publican las tiendas europeas, y que los tramos de
[presupuesto.js](../apps/vender/lib/presupuesto.js) se han subido hasta esa escala.

## Lo que se paga desde el 17 de septiembre de 2026

| Tramo | Corte | Se paga |
|---|---|---|
| premium | 20 € o más | 70 % |
| alta | de 5 a 20 € | 60 % |
| media | de 1 a 5 € | 35 % |
| baja | de 0,50 a 1 € | 20 % |
| bulk de rara o mítica | menos de 0,50 € | 0,05 € por carta |
| bulk de común o infrecuente | menos de 0,50 € | 0,005 € por carta |

## Lo que publica el mercado

De la comparación hecha el 17 de septiembre de 2026 sobre las páginas públicas de cada
tienda. Solo entran aquí las cifras que la tienda publica en su propia web.

| Tienda | País | Alto valor | Hasta 20 € | Hasta 5 € | Bulk de común | Bulk de rara |
|---|---|---|---|---|---|---|
| Card-Jungle | Alemania | hasta 75 % | | | 7 € / 1.000 | 0,10 € |
| Big O Cards | Alemania | 70 a 75 % | | | sin cifra | sin cifra |
| Three For One | Alemania | hasta 70 % | 60 % | 10 a 50 % | 1 € / 1.000 | 0,05 € |
| CardCosmos | Alemania | hasta 70 % | 60 % | 10 a 50 % | 1 € / 1.000 | 0,05 € |
| Magic Corporation | Francia | 50 a 75 % | | | | |
| Playin / Magic Bazar | Francia | sin porcentaje | | | 1 € / 1.000 | 0,05 € |
| Ítaca | España | **no publica** | | | | |
| Magic Event GN | España | **no publica** | | | | |
| Magic Barcelona | España | **no publica** | | | | |

Tres cosas salen de esta tabla y conviene no perderlas de vista:

**En España no publica nadie.** Ninguna de las tres tiendas españolas enseña un porcentaje.
Ítaca publica precios por carta, que permiten deducirlo, pero nunca lo presenta como una
cifra sobre Cardmarket.

**Lo que se paga aquí no está por encima de la media europea: está justo en ella.** El 70 y
el 60 son exactamente los de Three For One y CardCosmos. Card-Jungle paga hasta un 75 % y
además se queda con el porte. Esto importa porque condiciona lo que se puede decir sin
faltar a la verdad.

**Ninguna tienda europea se compromete a una cifra firme.** Todas escriben "hasta el 70 %",
con el estado, el idioma y las existencias como condición. Por encima del corte de los 20 €
no hay publicada ni una sola cifra definitiva en todo el mercado.

## Las dos posturas

### A favor de publicar

El argumento no es la cifra, es que no la enseñe nadie más. Ser la única tienda española
que dice lo que paga es una posición defendible aunque el número solo sea competitivo,
porque el vendedor no tiene ningún otro español con el que compararlo.

Encaja además con lo que dice [competidores.md](competidores.md) que es el cuello de
botella: entran unas 2 colecciones al mes y hacen falta 12, y el problema es que lleguen,
no la capacidad de procesarlas. Una cifra visible quita una fricción antes incluso de que
el vendedor escriba.

### En contra de publicar

Está escrito en [competidores.md](competidores.md) y el argumento sigue siendo bueno: un
porcentaje obliga a defender una cifra que cambia con cada colección, y deja al vendedor
calculando en vez de decidiendo.

Hay además un competidor interno que no conviene olvidar: el presupuesto por ManaBox ya
devuelve un número concreto sobre las cartas del vendedor, que es mejor que cualquier
porcentaje abstracto. Publicar una cifra compite en parte con la propia herramienta.

Y es asimétrico. Una cifra publicada se convierte en aquello a lo que se te agarra el día
que la valoración de una colección concreta sale distinta.

## Lo que hay que decidir

Sin orden de importancia, porque parte de la gracia de la discusión es ponerlos en orden.

**1. Qué se publica: ¿una cifra definitiva o un techo?** Un "hasta el 70 %" es lo que hace todo
el mercado europeo y no compromete a nada. Un 70 % a secas es una promesa más dura que la de
ninguna de las tiendas que se han copiado.

**2. ¿Hay que ponerle techo al tramo premium antes de publicar nada?** Hoy el 70 % se aplica
igual a una carta de 25 € que a una de 400 €, sin tope. Publicar la cifra convierte esto en
un compromiso público, así que esta decisión va antes que la de publicar.

**3. ¿Se publican todos los tramos o solo los de arriba?** El bulk de común, a 0,005 € la
carta, es la cifra más floja de la tabla y la que un competidor podría citar en contra. Pero
publicar solo lo que favorece tiene un coste de credibilidad que no es cero.

**4. ¿Qué se dice del envío pagado?** Es la contrapartida real de las tiendas alemanas, que
solo lo pagan a partir de 300 o 500 €, y aquí se paga siempre. Si se publica el porcentaje
sin decir esto al lado, se está enseñando la parte peor de la comparación.

**5. ¿Dónde vive la cifra?** Portada, página de preguntas frecuentes, `llm.txt`, o varias.
El `llm.txt` tiene un peso particular: [competidores.md](competidores.md) documenta que los
motores generativos ya citan la web por su nombre, y ahí una cifra concreta se repite.

**6. ¿Cada cuánto se revisa?** Una cifra publicada envejece y lo que hoy es la escala
europea dentro de un año puede no serlo. Sin una fecha de revisión, esto se queda escrito y
nadie lo vuelve a mirar.

**7. ¿Se publica el crédito en tienda?** Es lo más parecido a una norma en todo el mercado: Ítaca y
Magic Corporation dan un 20 % más en crédito, CardCosmos y Playin un 10 %. Aquí no existe esa
figura. Crearla es una decisión de producto que va mucho más allá de publicar o no una cifra.

## Lo que falta por comprobar

- **Los precios por carta de Ítaca.** Es la única tienda española con precios legibles por
  máquina, pero su buylist devuelve un 401 y no se pudo muestrear. Sacar unas 30 cartas de
  distintos valores a mano daría la curva real de un competidor español, en vez de usar el
  alemán como aproximación.
- **Las comisiones de Cardmarket desde su propia página.** Se dan por buenas un 5 %, un 3 %
  y un 1,5 % según el tipo de vendedor, con un tope de 100 € por artículo, pero vienen de
  terceros: la página de tarifas devuelve un 403. Esto es justo lo que decide si los
  porcentajes de arriba dejan margen, así que conviene mirarlo en un navegador.
- **Lo que cuesta de verdad revender cada tramo.** Sin esto, los porcentajes son una apuesta
  razonada y no un cálculo. `rendimiento_colecciones.csv` podría servir, pero
  [competidores.md](competidores.md) avisa de que tiene meses sin documentar y una fila con
  el día y el mes cambiados de sitio.
