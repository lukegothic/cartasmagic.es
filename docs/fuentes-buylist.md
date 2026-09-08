# De dónde salen las hotlists que lee la herramienta

Comprobado el 8 de septiembre de 2026 pidiendo cada página desde aquí, una a una. Los
endpoints y las condiciones de uso de las tiendas cambian sin avisar: antes de dar de alta
ninguna fuente a partir de este documento, volver a pedir la url y comprobar que sigue
devolviendo lo que aquí se describe.

Lo que se buscaba son fuentes para `herramientas/hotlist-fuentes/`, que hoy lee 49 ofertas
de dos tiendas y necesita más para poder curar una hotlist propia de 50 a 100 cartas.

## La distinción que ordena todo el documento

No todas las páginas donde una tienda pone precios de compra sirven. Hay dos formas muy
diferentes y solo una es útil:

- **Hotlist curada.** Una selección corta y deliberada de cartas que la tienda necesita
  ahora. Eso es señal: alguien ha decidido que esas cartas y no otras merecen subir el
  precio esta semana. Es lo que la herramienta existe para detectar.
- **Catálogo completo.** Todas las cartas que la tienda aceptaría alguna vez, con un precio
  al lado. No hay señal: una carta que necesitan con urgencia y otra que cogerían a
  regañadientes por céntimos se ven exactamente igual.

La prueba no es la palabra que use la página. Una página titulada "Buylist" con 60 cartas
elegidas a mano es justo lo que interesa. Una titulada "Hotlist" que resulta ser el
inventario entero, no.

Por eso el objetivo de 50 a 100 cartas se alcanza sumando muchas listas curadas, no
tragándose un catálogo grande.

## Star City Games

Su hotlist (https://sellyourcards.starcitygames.com/mtg/hotlist) se pinta en el navegador.
Se pidió el html y llega con 2.314 bytes, un `<div id="app"></div>` vacío y un solo script,
`/js/app.js`. Las cartas las trae después un Meilisearch firmando con una clave que viaja
dentro de ese javascript. **Esa clave es suya, no nuestra, y no se toca**: no se ha leído,
no aparece aquí y no se va a construir nada que dependa de ella.

### Qué dicen sus condiciones

Y aquí está lo que zanja el asunto, porque no es una cuestión técnica sino de permiso. Sus
condiciones (https://help.starcitygames.com/terms-and-conditions, actualizadas el 28 de
febrero de 2019) tienen un apartado llamado RESTRICTIONS ON USE que dice, literalmente:

> Material, services, data, and information (including pricing information) from, on, or
> offered through the Site [...] may not be scraped, extracted, downloaded, uploaded, sold,
> or offered for sale or use in any way (including for competitive purposes), without the
> prior written consent of Star City.

Y por si quedara duda sobre los procesos automáticos:

> you agree not to use, or cause to be used, any computerized or other manual or automated
> program or mechanism, tool, or process, including any offline reader, site
> search/retrieval application, scraper, spider robot, to access, extract, download,
> scrape, data mine, display, transmit, or publish, any materials, data, or information
> (including pricing information) on any Star City Website

El mismo párrafo deja una excepción, y conviene leerla entera porque es estrecha:

> it shall not be a violation of these Terms and Conditions for an individual to access or
> use Star City's published prices in connection with selling or offering to sell cards to
> Star City

Es decir: una persona puede mirar sus precios si es para venderles cartas a ellos. Un
proceso diario que copia su lista para decidir nuestra propia hotlist no encaja ahí, ni por
el "individual" ni por la finalidad.

**Hay un conflicto entre su robots.txt y sus condiciones, y gana el texto.** El
`robots.txt` de `sellyourcards.starcitygames.com` es permisivo del todo:

```
User-agent: *
Disallow:
```

Pero el del dominio principal, `starcitygames.com`, sí prohíbe `/search/` y `/pages/`, y
sobre todo las condiciones prohíben expresamente lo que el robots.txt no impide. Un
robots.txt permisivo no es una autorización: es la ausencia de un bloqueo técnico. Cuando
el contrato dice que no, el que manda es el contrato.

### Qué se probó buscando una vía sin clave

Cuatro peticiones, con un segundo entre ellas y un User-Agent que identifica el proyecto:

| Prueba | Resultado |
|---|---|
| `/mtg/hotlist?format=json` | 200 pero `text/html`, los mismos 2.314 bytes de la página vacía |
| `/mtg/hotlist.json` | 200 y `text/html`, 2.936 bytes, tampoco datos |
| `/api/hotlist` | error 500 |
| `/sitemap.xml` | devuelve la portada del SPA, no hay sitemap |

No hay versión servida desde el servidor, ni feed, ni exportación. Se revisó también su
centro de ayuda (https://help.starcitygames.com/en-US/articles/sell-to-us-229858) entero:
hay artículos sobre cómo venderles, sobre condiciones de las cartas y sobre subir un CSV,
pero **no publican ninguna API, ni feed de socios, ni programa de afiliados con acceso a
datos**. El único CSV que mencionan va en dirección contraria, del vendedor hacia ellos, y
descargarse el suyo exige estar registrado:

> Accessing the CSV Upload page requires logging in to the Star City Games website.
> (https://help.starcitygames.com/en-US/use-a-csv-file-to-add-to-your-sell-cart-1056948)

### El navegador automatizado tampoco vale

Renderizar la página con Playwright funcionaría técnicamente, pero no resuelve nada. Sigue
siendo un proceso automático leyendo sus datos, que es exactamente lo que sus condiciones
prohíben, y sigue apoyándose en su clave aunque no la escribamos nosotros. Además cuesta
caro: la herramienta hoy no tiene ni una dependencia y corre dentro del contenedor de
Dokploy, que trae Node 24 y ningún navegador. Meter Chromium y unos cuantos cientos de
megas para una sola fuente que encima no se puede usar no sale a cuenta por ningún lado.

### Qué se recomienda

**No hay ninguna vía automática legítima hoy.** Conviene decirlo claro para que nadie
vuelva a investigarlo dentro de seis meses pensando que se le escapó algo.

Quedan dos caminos, y el orden importa:

1. **Escribirles y pedir permiso.** No tienen dirección de correo publicada: el contacto va
   por el formulario de https://help.starcitygames.com/en-US/contact, que trae un asunto
   llamado "Selling Cards to SCG". Lo que hay que pedir es concreto, no un acceso genérico:
   permiso por escrito para leer a diario su hotlist de Magic, diciendo que es para decidir
   qué compramos en España, que no se revenden sus datos y que no competimos con ellos en
   su mercado. El apartado de restricciones admite ese permiso expresamente ("without the
   prior written consent of Star City"), así que la figura existe.
2. **Mirarla a mano de vez en cuando.** Su hotlist es la referencia del sector y abrirla una
   vez por semana no cuesta nada. Una persona mirando una página pública no es un proceso
   automático, y para curar 50 o 100 cartas con esto basta.

Mientras tanto la herramienta hace lo correcto: avisa de que esta fuente no se lee, en vez
de fingir que la tienda no busca nada.

## Fuentes verificadas

Ordenadas por utilidad, que aquí quiere decir calidad del dato y estabilidad al leerlo, no
número de cartas. Todas se pidieron desde aquí el 8 de septiembre de 2026.

| Tienda | País | Tipo | Cómo se lee | Cartas | Moneda | robots.txt |
|---|---|---|---|---|---|---|
| **La Crypte** (cryptmtg.com) | Canadá | Hotlist curada | `products.json` de Shopify | 21 | CAD | `Allow: /` |
| **Card Monster Games** | EE. UU. | Hotlist curada | Tabla html escrita a mano | 28 | USD | `Allow: /` |

Son las dos que la herramienta ya lee, y las dos siguen funcionando. **No se encontró
ninguna tercera fuente curada nueva**, y conviene explicar por qué en vez de disimularlo.

**La Crypte** es la mejor forma que puede tener una fuente. La url exacta es
`https://cryptmtg.com/collections/mtg-hotlist/products.json?limit=250`, devolvió 21
productos, y cada uno trae el nombre y la edición entre corchetes más un precio por cada
estado. Una muestra literal: `Boseiju, Who Endures [Kamigawa: Neon Dynasty]`, con Near Mint
a 79,40, Lightly Played a 67,50 y Moderately Played a 55,60. Tienen además
`lorcana-most-wanted` y una hotlist de Riftbound, que no interesan porque solo se compra
Magic; se separan solas por url, así que no estorban.

**Card Monster Games** sigue igual que cuando se escribió el parser:
`https://cardmonstergames.com/pages/hotlist` devuelve 180.718 bytes con 45 filas de tabla,
seis columnas por fila, y la sección de Magic empieza en el byte 135.491 marcada por
`mtg_logo`. Una muestra literal: `Commander Legends: Battle for Baldur's Gate` /
`Ancient Copper Dragon` / `161` / vacío / `Near Mint` / `$100.00`. Mezcla Pokémon y
Yu-Gi-Oh en la misma página, y el parser ya los recorta por el logo; es justo el caso que
avisa el encargo, y está resuelto.

## Fuentes descartadas, y por qué

Esta sección importa más que la anterior, porque evita que la próxima persona repita el
trabajo.

**Card Kingdom: catálogo completo, no sirve.** Es el error fácil de cometer y por eso va el
primero. `https://www.cardkingdom.com/purchasing/mtg_singles` está servido desde el
servidor, con el html entero y sin javascript de por medio: 25 cartas por página, nombre,
edición, rareza, número de coleccionista y dos precios, el de efectivo y el de crédito
(`Volcanic Island`, 3rd Edition, 725,00 dólares en efectivo y 942,50 en crédito). Su
`robots.txt` permite `/purchasing/`. Técnicamente es la fuente más cómoda que se ha visto.
**Y aun así no vale**, porque son más de 20.000 cartas: su catálogo entero con un precio al
lado. Ahí no hay ninguna señal que extraer. Además el parámetro `?page=` no pagina de
verdad: se pidieron las páginas 2, 3 y 400 y las tres devolvieron los mismos 362.667 bytes
con las mismas cartas, así que ni siquiera sería cómodo de recorrer.

**BinderPOS: cerrado con login, y afecta a muchas tiendas a la vez.** Es el motor de buylist
más extendido entre tiendas de Magic, así que merecía la pena seguirlo hasta el final. Se
hizo con The Mythic Store: su página de buylist carga BinderPOS, y el endpoint
`https://api.binderpos.com/external/shopify/storeDetails?storeUrl=the-mythic-store.myshopify.com`
es público y sin credencial, devuelve el identificador de la tienda. Pero la lista en sí
vive en `https://portal.binderpos.com/external/shopify/<id>/buylist`, y al pedirla contesta
con "Please login to use the Buylist". **Toda la familia BinderPOS queda fuera por lo
mismo**, y eso explica buena parte de por qué hay tan pocas hotlists públicas.

**Axion Now** (Reino Unido) tiene una colección `buylist` en Shopify, pero
`https://www.axionnow.com/collections/buylist/products.json?limit=250` devuelve cero
productos: el nombre existe y está vacío.

**Alchemist's Refuge** sigue sin publicar la lista, tal como ya decía el README. Su dominio
ni siquiera resolvió en esta comprobación.

**mtgbuylist.com** es Shopify y responde, pero sus 11 colecciones están casi todas a cero
productos. Es una tienda que vende, no una que publique lo que compra.

**Cash Cards Unlimited** devolvió 89 colecciones de Shopify y ninguna es de compra: todas
son de venta, y mezclan Pokémon, deportes y Funko con Magic.

**Tiendas que no resolvieron o devolvieron error** al pedirles
`/collections.json?limit=250`: Ítaca (401), Magic Barcelona, Hykercardhouse (404),
Metrópolis Center (302), Face2Face (530), Kessel Run (402), Card Kingdom, ABU Games,
CoolStuffInc y Channel Fireball (no son Shopify). CardZone sí es Shopify y devolvió 120
colecciones, pero ninguna de compra: solo venden.

**Sobre Europa, en una línea, que es lo que merece:** se probaron tiendas de España, Reino
Unido, Alemania y Países Bajos y no apareció ni una buylist pública; se confirma lo que ya
se sospechaba, que aquí la compra se organiza por want-lists de Cardmarket y no por páginas
propias. No merece más peticiones.

## Qué haría falta para llegar a 50 o 100 cartas

Hoy hay 49 ofertas de dos tiendas, y con esas dos no se llega. Sumando las dos listas y
quitando las cartas repetidas, el material real ronda las 40 cartas diferentes.

Tres formas de cerrar el hueco, de más a menos rentable:

**Pedirle acceso a Star City Games.** Es la lista de referencia del sector y la que más
movería el resultado. Cuesta un formulario y una espera, y puede salir que no. Aun así es lo
primero que hay que hacer, porque el resto de opciones son más trabajo por menos señal.

**Meter la hotlist de SCG a mano una vez por semana.** No hace falta esperar a que
contesten. Una lectura semanal a mano da la señal que se busca sin ningún problema de
permisos, y encaja con el ritmo real del negocio: la hotlist propia no cambia a diario.

**Buscar tiendas del tamaño de La Crypte, no de Card Kingdom.** El patrón que funciona es
una tienda mediana sobre Shopify que mantiene a mano una colección llamada hotlist o
parecida. Card Monster y La Crypte son ese perfil. El problema es encontrarlas: no salen
buscando en Google, porque nadie enlaza esas páginas, y adivinar dominios sale mal, como se
vio aquí. La vía razonable es ir anotándolas cuando aparezcan de otra forma, no dedicar una
tarde a buscarlas.

Conviene asumir una cosa: **puede que 50 a 100 cartas de señal ajena no exista como material
público**. Las buylists curadas son pocas justamente porque son trabajo manual, y las que
hay grandes están detrás de un login o son catálogos sin señal. Si al final la hotlist
propia se cura con dos fuentes automáticas más una lectura semanal a mano, eso no es un
fracaso de la herramienta: es el tamaño real del dato disponible.

## Qué mirar la próxima vez

- **Si Star City Games contesta.** Es lo único que cambiaría el planteamiento de verdad.
- **Si BinderPOS abre algo público.** Hoy todo pasa por login, pero su endpoint
  `storeDetails` ya es abierto. Si algún día publican la lista sin sesión, se desbloquean
  muchas tiendas de golpe, no una.
- **Que La Crypte y Card Monster sigan vivas.** Son el 100 % de lo que se lee hoy, así que
  cualquiera de las dos que se caiga deja la herramienta a la mitad. La de Card Monster es
  la más frágil: depende de que la sección de Magic siga marcada con `mtg_logo` y de que la
  tabla siga teniendo seis columnas.
- **Cuidado con confundir catálogo y hotlist al añadir fuentes.** Es el error que este
  documento existe para evitar. Antes de dar de alta nada, contar cuántas cartas trae: si
  son miles, no es señal.
