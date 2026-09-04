# Revisión de los textos de las páginas

Rellena o corrige la columna **propuesta**. Lo que taches no se aplica.

Categorías: `acentos` · `false-friend` · `puntuación` · `léxico` · `voz` · `seo`

---

## Resumen

No hay traducciones literales ni false friends en el cuerpo de las páginas. La copia
está escrita en castellano nativo. Los dos hallazgos reales están en otro sitio: los
ficheros `llm.txt` no llevan ni una tilde, y las plantillas EJS mezclan tres formas
distintas de escribir los caracteres acentuados.

---

## 1. apps/vender/public/llm.txt — SEO

Todo el fichero está sin acentuar: 78 líneas, ni una tilde ni una eñe. Es el fichero
que leen los crawlers de los modelos de lenguaje. Se corrige entero de una vez, no
línea a línea.

| línea | actual                                                                                 | problema                                | propuesta                                                                          |
| ----- | -------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| 3-78  | `Espana`, `coleccion`, `envia`, `dia`, `Ivan Perez`, `albumes`, `telefono`, `Pokemon`… | `acentos` — fichero entero sin acentuar | Reescribir con acentos y eñes correctos, sin tocar la estructura ni el vocabulario |

## 2. apps/hub/llm.txt — SEO

Mismo caso, 37 líneas.

| línea | actual                                                                  | problema                                | propuesta                               |
| ----- | ----------------------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| 3-38  | `Espana`, `coleccion`, `envia`, `dia`, `Ivan Perez`, `esta`, `todavia`… | `acentos` — fichero entero sin acentuar | Reescribir con acentos y eñes correctos |

## 3. apps/hub/index.html — SEO y cuerpo

El fichero usa entidades HTML (`&oacute;`) para los acentos aunque declara
`<meta charset="UTF-8">` en la línea 12. Funciona, pero es ilegible al editar y
convive con acentos literales en el JSON-LD de la línea 454 y en la 452. Tres
convenciones en un mismo fichero.

| línea   | actual                                                                                               | problema                        | propuesta                                 |
| ------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| 14      | `colecci&oacute;n de cartas Magic en Espa&ntilde;a`                                                  | `seo` — entidades innecesarias  | `colección de cartas Magic en España`     |
| 15      | `Env&iacute;o pagado, valoraci&oacute;n en 24 horas`                                                 | `seo`                           | `Envío prepagado, valoración en 24 horas` |
| 16      | `magic the gathering espa&ntilde;a`                                                                  | `seo`                           | `magic the gathering españa`              |
| 22, 31  | `colecci&oacute;n`                                                                                   | `seo`                           | `colección`                               |
| 465-502 | `Espa&ntilde;a`, `man&aacute;`, `&aacute;lbumes`, `env&iacute;o`, `d&iacute;a`, `m&aacute;s`, `Iv&aacute;n P&eacute;rez`, `Pr&oacute;ximamente` | cuerpo — entidades innecesarias | Sustituir por los caracteres literales    |
| 41      | `Espa\u00f1a` (dentro del JSON-LD)                                                                   | `seo` — escape JSON innecesario | `España`                                  |

**Nota:** cambio puramente mecánico, el texto renderizado es idéntico. Si prefieres
no tocar `hub/index.html`, táchalo entero y no pasa nada.

## 4. apps/vender/views/valoracion-cartas-magic.ejs

| línea | actual                                                        | problema                                                                   | propuesta                                       |
| ----- | ------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| 16    | `la etiqueta de env&iacute;o prepagada y la direcci&oacute;n` | entidades sueltas en un fichero que usa acentos literales en todo lo demás | `la etiqueta de envío prepagada y la dirección` |

## 5. apps/vender/lib/lead.js — cadena de backend

Correo interno, no lo ve el cliente. Lo incluyo porque es el único false friend real
del repo.

| línea | actual                                              | problema                                  | propuesta                                                 |
| ----- | --------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| 13    | `Más de 1.000 cartas (más de 2 kg, requiere aviso)` | `false-friend` — `requerir` por `require` | `Más de 1.000 cartas (más de 2 kg, hay que avisar antes)` |

---

## Revisado y sin hallazgos

- `apps/vender/views/index.ejs`
- `apps/vender/views/como-vender-cartas-magic.ejs`
- `apps/vender/views/presupuesto-manabox.ejs`
- `apps/vender/views/layout.ejs`
- `apps/vender/views/aviso-legal.ejs` (marcado como solo-lectura; nada que señalar)
- `apps/vender/routes/main.js` — títulos, descripciones, FAQ y JSON-LD
- `apps/vender/lib/` — el resto de cadenas

## Fuera de alcance

`public/calculator.html` y `public/efecto_foil.html` son herramientas internas, están
en inglés y `robots.txt` las excluye de la indexación.

---

## Sobre el tuteo

Las páginas tutean de principio a fin ("Metes los mazos", "Cuéntanos qué tienes").
Tu regla global pide forma impersonal. No lo he marcado como error: en una página de
venta a particulares el tuteo es una decisión de voz, y es coherente en las cinco
páginas. Si quieres cambiarlo, es un ticket aparte y bastante más grande que este.