# DIAGNÓSTICO

## Situación actual

La idea de negocio es buena y, estratégicamente, tiene una ventaja que muchos competidores no explotan: puedes construir un **ecosistema especializado en Magic** donde cada dominio tenga una función distinta:

**cartasmagic.es → entidad/marca/hub**
**vendercartasmagic.es → captación de vendedores y adquisición de inventario**
**comprarcartasmagic.es → monetización del inventario mediante venta de cartas premium**

Pero haría una corrección importante a tu planteamiento:

> **No debemos pensar en `cartasmagic.es` como una web cuya función principal es “transferir autoridad” a las otras dos.**

Google no funciona de forma tan simple. Los enlaces internos/externos ayudan, pero lo realmente potente es construir una **entidad coherente y reconocible**: una marca experta en compra y venta de Magic en España, con tres propiedades que cumplen funciones distintas.

Ahora mismo veo una oportunidad enorme porque los competidores están atacando el mercado desde posiciones diferentes. Cardmarket tiene una escala gigantesca y una propuesta de marketplace; Itaca compite con una buylist muy desarrollada y precios visibles; Magic Barcelona compite desde tienda física y confianza local. ([Cardmarket][1])

Tu espacio potencial es diferente:

> **“Te compro tu colección sin hacerte perder tiempo.”**

Eso puede convertirse en una propuesta de marca extraordinariamente fuerte.

Además, ya tienes páginas indexadas: Google está mostrando `cartasmagic.es`, `vendercartasmagic.es` y contenidos de esta última en resultados actuales. ([VenderCartasMagic][2])

La boutique, sin embargo, presenta un riesgo técnico inmediato: desde mi entorno `comprarcartasmagic.es` ha devuelto **502 Bad Gateway**, por lo que no he podido auditar íntegramente su contenido. Es algo que comprobaría inmediatamente en servidor, CDN, hosting y Search Console. 

---

## Principales problemas

### 1. El producto real no coincide todavía con la experiencia que necesita el cliente

Has definido muy bien al usuario: **jugador de Magic, perezoso, quiere que otro haga el trabajo**.

Sin embargo, `vendercartasmagic.es` actualmente le pide precisamente trabajo:

> “ordena tu listado por cantidad, nombre, set…”

Ese paso es una fricción enorme para vuestro ICP. ([VenderCartasMagic][2])

Y además la página habla de “valoración gratuita”, pero posteriormente explica que el usuario debe preparar el listado. ([VenderCartasMagic][2])

Esto contradice vuestra ventaja competitiva.

### 2. El competidor más peligroso no es necesariamente Cardmarket

Para **comprar** cartas, sí.

Para **captar colecciones**, el benchmark más preocupante es Itaca.

Itaca tiene un sistema de BuyList con precio visible, idioma, estado, foil/no foil y proceso de compra. Eso genera mucha transparencia y reduce incertidumbre. ([Itaca][3])

También Magic Barcelona comunica claramente:

* valoración;
* 24–48 h;
* posibilidad de enviar;
* posibilidad de desplazamiento para colecciones valiosas. ([Magic Barcelona][4])

Tu propuesta, por tanto, necesita ser **mucho más cómoda**, no simplemente “otra tienda que compra Magic”.

### 3. `cartasmagic.es` actualmente es demasiado pobre para funcionar como entidad

La home actual básicamente dice:

> “Tu ecosistema de cartas Magic en España”

y deriva a compra/venta, pero la parte de compra aparece como “próximamente”. ([CartasMagic.es][5])

Para SEO/GEO esto es una oportunidad desperdiciada.

El dominio debería convertirse en la **fuente editorial y de autoridad de toda la marca**, no en una landing puente.

### 4. Hay una oportunidad GEO muy grande

Para un modelo de negocio así, no me obsesionaría inicialmente con “optimizar para ChatGPT” como una checklist técnica.

Me preocuparía por conseguir que cuando alguien pregunte:

> “¿Dónde vender una colección de Magic en España?”

> “¿Quién compra cartas Magic?”

> “¿Dónde puedo vender cartas Magic sin tener que ponerlas una a una?”

> “¿Cuánto vale mi colección de Magic?”

la web aparezca como **entidad especialista, fuente y opción comercial**.

Para ello necesitaremos contenido que responda de forma extremadamente clara a estas preguntas y, sobre todo, **datos, metodología, experiencia y señales externas de legitimidad**.

---

# SEO

| Problema                                                   | Impacto  | Recomendación                                                              | Prioridad |
| ---------------------------------------------------------- | -------- | -------------------------------------------------------------------------- | --------- |
| Arquitectura basada en 3 dominios                          | Alto     | Crear una arquitectura de marca explícita y coherente entre dominios       | P0        |
| `vendercartasmagic.es` exige demasiado trabajo al vendedor | Muy alto | Diseñar un funnel “envíame fotos → te digo qué necesito → oferta”          | P0        |
| Copy actual bastante genérico                              | Alto     | Crear landings específicas por intención                                   | P0        |
| Hub muy escaso                                             | Alto     | Convertir `cartasmagic.es` en autoridad temática                           | P0        |
| Posible error 502 en boutique                              | Crítico  | Auditar disponibilidad, CDN, servidor, DNS, WAF y GSC                      | P0        |
| Competencia con mayor profundidad                          | Alto     | Construir topical authority alrededor de compra/venta/valoración           | P1        |
| Falta de evidencia visible de expertise                    | Alto     | Añadir metodología, experiencia, operaciones, casos reales y prueba social | P1        |
| Internacional                                              | Bajo     | No invertir: España ya es el mercado objetivo                              | P2        |

### La arquitectura que propondría

No intentaría que `cartasmagic.es` rankease para absolutamente todo.

La repartiría así:

**cartasmagic.es**

* marca
* guía del mercado
* valoración de cartas
* precios y conceptos
* educación
* contenidos de autoridad
* enlaces contextuales hacia compra y venta

**vendercartasmagic.es**

* vender cartas Magic
* vender colección Magic
* comprar colección Magic
* tasar colección Magic
* vender cartas antiguas
* vender Magic Alpha/Beta/Unlimited
* vender cartas Magic de alto valor
* vender colección desde cualquier punto de España
* proceso de envío

**comprarcartasmagic.es**

* cartas Magic >50 €
* cartas premium
* cartas antiguas
* cartas reservadas/coleccionables
* cartas por edición
* cartas por tipo
* fichas de producto

La separación tiene sentido **por intención**, no simplemente por SEO.

---

## El cambio SEO más importante de `vendercartasmagic.es`

Ahora mismo el discurso es:

**“Hazme un listado → envíamelo → lo valoro.”**

Yo intentaría llevarlo a:

**“Mándame fotos de tu colección → nosotros hacemos el trabajo.”**

Después:

**1. Cuéntanos qué tienes**
Fotos / descripción / cantidad aproximada.

**2. Nosotros hacemos la valoración**

**3. Te damos una oferta**

**4. Si aceptas, recogemos o recibimos**

**5. Te pagamos**

Esto es exactamente coherente con el usuario que has definido.

Además, conceptualmente te diferencia de plataformas como Cardmarket, donde el usuario actúa como vendedor dentro de un marketplace, y de sistemas como la BuyList de Itaca, que requieren selección y trabajo por carta. ([Cardmarket Help][6])

---

# GEO

## Problema

Actualmente no veo todavía suficiente infraestructura para que la marca pueda convertirse en una **fuente de referencia** sobre compra/venta de Magic en España.

## Impacto

Alto.

Porque el objetivo GEO no es únicamente:

> “que aparezca mi página”.

Es:

> **“que un motor generativo tenga suficientes motivos para considerarme una entidad fiable cuando sintetiza una respuesta.”**

## Recomendación

Construiría `cartasmagic.es` como **Knowledge Hub de Magic de segunda mano/premium en España**.

Los clusters prioritarios serían:

### Cluster 1 — Venta

* Cómo vender cartas Magic
* Cómo vender una colección Magic
* Dónde vender cartas Magic
* Cómo vender cartas Magic antiguas
* Vender cartas Magic online
* Vender colección Magic en España
* Qué cartas Magic tienen valor
* Qué hacer con una colección antigua de Magic

### Cluster 2 — Valoración

* Cómo saber cuánto vale una carta Magic
* Cómo valorar una colección Magic
* Precio de las cartas Magic
* Factores que determinan el valor
* Estado NM / LP / MP / HP
* Foil vs non-foil
* idioma
* edición
* rareza
* versión

### Cluster 3 — Cartas premium

* cartas Magic caras
* cartas Magic de colección
* Power Nine
* Reserved List
* Alpha / Beta / Unlimited
* Dual Lands
* cartas vintage
* cartas premium

### Cluster 4 — Transaccional

Todo esto debería terminar naturalmente en:

**“¿Quieres venderla? Te la compramos.”**

---

## GEO: qué quiero que construyamos

Cada contenido importante debería ser extremadamente:

**claro + factual + estructurado + verificable + citable.**

Por ejemplo, en vez de un artículo superficial:

> “¿Cuánto vale una carta Magic?”

Crear:

### Cómo calculamos el valor de una carta Magic

**Valor ≠ rareza únicamente.**

Consideramos:

1. edición
2. versión exacta
3. idioma
4. estado
5. foil/non-foil
6. demanda
7. liquidez
8. precio de mercado
9. tendencia
10. disponibilidad

Eso es mucho más reutilizable por motores generativos.

Y una mejora todavía más potente:

### Publicar datos propios

Por ejemplo:

**“Informe mensual del mercado Magic España — septiembre 2026”**

Con datos propios sobre:

* cartas más demandadas;
* categorías con mayor liquidez;
* evolución del precio;
* cartas que compráis;
* diferencias entre precio retail y precio de compra;
* tendencias de coleccionismo.

Ahí empezamos a crear algo que otros sitios pueden citar.

Ese es el GEO que me interesa.

---

# UX/CRO

Aquí está probablemente el mayor dinero.

## Problema 1 — El formulario no debe parecer un trámite

Tu usuario no quiere:

> “prepara tu Excel”.

Quiere:

> **“dime cuánto me das.”**

Tenemos que convertirlo en una experiencia prácticamente de **concierge**.

### Funnel ideal

**¿Qué quieres vender?**

○ Colección completa
○ Algunas cartas
○ Cartas antiguas
○ No lo sé

→

**Sube fotos**

→

**¿Cuántas cartas aproximadamente?**

○ Menos de 100
○ 100–500
○ 500–2.000
○ 2.000+

→

**¿Dónde estás?**

Provincia

→

**Déjanos tus datos**

→

**“Nosotros hacemos el resto.”**

Esto es muchísimo más adecuado al usuario que has descrito.

---

## Problema 2 — Transparencia del 60 %

Hay algo que trabajaría con cuidado.

Has definido:

> compra de colecciones al 60% de su valor

Eso es comercialmente potente, pero puede producir una pregunta inmediata:

> **“¿60% de qué valor?”**

Aquí necesitamos explicar de forma cristalina:

**60% del precio de mercado estimado no significa 60% del precio de venta final de todas las cartas.**

Hay que definir exactamente qué significa el 60%.

Si no lo hacemos, generaremos leads de baja calidad, discusiones y desconfianza.

---

## Problema 3 — Confianza

Para una persona que entrega una colección potencialmente valorada en miles de euros, el principal freno no es SEO.

Es:

> **“¿Y si me ofrecen poco?”**
> **“¿Y si pierden mis cartas?”**
> **“¿Y si me cambian la valoración?”**
> **“¿Cuándo cobro?”**

Por tanto, la página debe responder esto **antes de que el usuario pregunte**.

Necesitamos una sección muy fuerte de:

### Cómo funciona

### Cómo valoramos

### Qué ocurre si no aceptas

### Cuándo cobras

### Cómo protegemos las cartas

### Qué pasa durante el transporte

### Qué ocurre con cartas de alto valor

### Cómo gestionamos diferencias de valoración

---

# PLAN DE ACCIÓN

## 0–30 días

Aquí concentraría prácticamente todo el esfuerzo.

### P0 — Resolver la infraestructura

Primero:

* 502 de `comprarcartasmagic.es`;
* indexación;
* robots.txt;
* sitemaps;
* canonicals;
* status codes;
* redirecciones;
* HTTPS;
* GSC;
* GA4;
* Search Console por cada dominio;
* cobertura/indexación;
* páginas huérfanas;
* Core Web Vitals;
* schema.

### P0 — Rediseñar `vendercartasmagic.es`

El objetivo es que la propuesta sea:

> **“Mándanos tu colección. Nosotros hacemos el trabajo.”**

No:

> “Haz tú primero el trabajo de inventariado.”

### P0 — Crear un funnel de venta de colección

Idealmente:

**Landing → formulario → fotos → contacto → valoración → oferta → aceptación → envío/recogida → pago**

Y medir cada etapa.

### P0 — Rehacer `cartasmagic.es`

Pasaría de “hub corporativo minimalista” a **hub editorial + marca + captación**.

### P1 — Crear arquitectura SEO

Construiría aproximadamente 20–40 URLs inicialmente, pero con intención clara. No quiero 200 artículos generados artificialmente.

### P1 — Crear páginas de confianza

Por ejemplo:

* quiénes somos;
* cómo valoramos;
* cómo compramos;
* cómo pagamos;
* qué cartas buscamos;
* preguntas frecuentes;
* casos reales.

---

## 31–90 días

Aquí empezamos a generar autoridad.

### SEO

Desarrollar:

* clusters temáticos;
* páginas de intención transaccional;
* contenidos sobre colecciones;
* páginas de cartas premium;
* long tail;
* enlazado interno sistemático.

### GEO

Crear contenido específicamente **referenciable**.

Por ejemplo:

> “Guía del valor de las cartas Magic en España”

> “Cómo valorar una colección Magic”

> “Informe trimestral del mercado Magic España”

> “Qué cartas Magic antiguas tienen más demanda”

Además empezaría a trabajar menciones externas, PR digital, comunidades y sitios especializados.

### CRO

Empezar tests:

* formulario corto vs largo;
* fotos obligatorias vs opcionales;
* WhatsApp vs formulario;
* CTA “Valorar colección” vs “Quiero vender mi colección”;
* mostrar 60% arriba vs explicar primero metodología;
* prueba social junto al CTA.

---

## 3–6 meses

Aquí buscaría que el sistema empiece a acumular **moat**.

### Activo clave

Una **base de conocimiento propietaria sobre el mercado español de Magic**.

Eso puede convertirse en un activo SEO + GEO extremadamente potente.

Y además generará contenido que nadie puede copiar fácilmente porque parte de datos propios.

También empezaría a desarrollar:

**landing pages dinámicas por tipo de colección**, siempre que tengan verdadera utilidad.

Ejemplo:

> `/vender-cartas-magic-alpha-beta/`

> `/vender-coleccion-magic-vintage/`

> `/vender-dual-lands/`

> `/vender-power-nine/`

etc.

---

## 6–12 meses

Objetivo:

### Que CartasMagic sea reconocida como una entidad, no simplemente como una web.

Quiero que el ecosistema tenga:

**marca → expertise → contenido → datos → enlaces → menciones → conversiones**

y que cada dominio tenga un papel perfectamente definido.

---

# KPIs

## Métricas SEO

No mediría únicamente tráfico.

Mediría:

**Visibilidad**

* impresiones GSC
* clicks
* CTR
* keywords Top 3
* Top 10
* share of search

**Negocio**

* tráfico orgánico → lead
* tráfico orgánico → venta
* revenue orgánico
* revenue por landing

**Arquitectura**

* páginas indexadas
* páginas con impresiones
* páginas huérfanas
* enlaces internos por URL

---

## Métricas GEO

Aquí necesitamos construir nuestro propio sistema de medición.

### Principal

**Citation / Mention Share**

Conjunto fijo de prompts como:

> ¿Dónde vender cartas Magic en España?

> ¿Dónde vender una colección Magic?

> ¿Quién compra cartas Magic?

> ¿Cómo valorar una colección Magic?

> ¿Dónde comprar cartas Magic caras en España?

Y medir periódicamente:

**¿Aparece CartasMagic?**

**¿Qué dominio aparece?**

**¿Somos citados?**

**¿Somos recomendados?**

**¿Qué competidores aparecen?**

**¿Qué fuentes utiliza el motor?**

Esto nos dará un auténtico **GEO visibility index**.

---

## Métricas UX/CRO

### Funnel de venta

**Visita → inicio formulario → envío formulario → valoración → oferta → aceptación → envío → pago**

Necesitamos conocer:

* conversión de visita a lead;
* abandono por paso;
* porcentaje de leads cualificados;
* porcentaje de ofertas aceptadas;
* valor medio de colección;
* CAC;
* revenue por lead.

---

## Métricas de negocio

La métrica reina no debe ser tráfico.

Debe ser:

> **€ de margen generado por cada 100 visitas orgánicas.**

Y especialmente:

> **€ de inventario adquirido por cada 100 visitas orgánicas.**

Porque puedes aumentar el tráfico un 200% y no mejorar el negocio.

---

# Mi prioridad absoluta

Hay una decisión estratégica que tomaría **ahora mismo**:

### No intentaría competir frontalmente con Cardmarket.

Es una batalla poco rentable.

Tampoco intentaría copiar exactamente el modelo de BuyList de Itaca.

Tu ventaja está en otra cosa:

> **“Tengo una colección de Magic y quiero convertirla en dinero sin perder horas clasificando cartas, buscando compradores, haciendo anuncios ni negociando.”**

Esa promesa puede ser muchísimo más potente.

De hecho, tu verdadero competidor no es solo Cardmarket.

Tu verdadero competidor es:

> **“Ya lo haré algún día.”**

Y el producto que tenemos que vender es **comodidad**.

---

# Mi hipótesis principal

Creo que **el mayor cuello de botella de este proyecto no va a ser el SEO**.

Será el **funnel de adquisición de colecciones**.

Podemos conseguir rankings, tráfico y menciones GEO. Pero si el usuario llega y tiene que hacer trabajo, el sistema perderá gran parte de su valor.

Por eso mi orden sería:

**1. Funnel de venta**
**2. Infraestructura técnica**
**3. Arquitectura SEO**
**4. Autoridad/GEO**
**5. Escala de contenido**

Y no al revés.

La siguiente fase que haría contigo es una **auditoría página por página de los tres dominios**, empezando por `vendercartasmagic.es`, y convertiría esto en un backlog concreto de cambios **P0/P1/P2**, incluyendo títulos, H1, arquitectura, enlazado, CTA, formularios, schema y contenidos.

[1]: https://www.cardmarket.com/es/Magic/?utm_source=chatgpt.com "Cardmarket | Comprar y vender cartas de Magic: The Gathering"
[2]: https://vendercartasmagic.es/ "Compramos Cartas Magic: Vende tus Cartas Hoy | VenderCartasMagic.es"
[3]: https://itaca.gg/featuredBuyList/index?utm_source=chatgpt.com "Vende tus cartas Magic, Riftbound o Lorcana al mejor precio online en Itaca.gg"
[4]: https://www.magicbarcelona.net/vende-tus-cartas/?utm_source=chatgpt.com "Vende tus cartas - Magic Barcelona"
[5]: https://cartasmagic.es/ "CartasMagic.es | Compra y Venta de Cartas Magic en España"
[6]: https://help.cardmarket.com/es/new-user-guide?utm_source=chatgpt.com "Guía del nuevo usuario | Cardmarket"
