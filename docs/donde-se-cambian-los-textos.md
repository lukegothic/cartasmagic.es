# Dónde se cambian los textos

Guía para cambiar, añadir o quitar cualquier texto de las dos aplicaciones. La regla de
partida es sencilla: **el texto no vive en las plantillas**. Las vistas `.ejs` solo
colocan lo que reciben, así que cambiar una frase casi nunca obliga a abrir una vista.

Antes de escribir nada en castellano, leer `~/.claude/rules/spanish-writing.md`. Al
terminar, pasar el linter (ver [Comprobaciones](#comprobaciones)).

## Los tres ficheros de cada aplicación

Cada aplicación tiene los suyos y no se comparten. Lo que decide el fichero es **para qué
sirve el texto**, no dónde se ve.

| Fichero | Qué lleva | hub | vender |
|---|---|---|---|
| `lib/textos.js` | Copy de interfaz: titulares, párrafos, botones, etiquetas de formulario, opciones de los desplegables, mensajes de error | sí | sí |
| `lib/textos-correo.js` | Prosa de los correos que se mandan al cliente | no manda correos | sí |
| `lib/metadatos.js` | `title`, `description`, `keywords`, `canonical`, `og_*` y el JSON-LD de schema.org | sí | sí |

Los ficheros están en `apps/hub/lib/` y `apps/vender/lib/`.

### Por qué están separados

Los tres se editan por motivos distintos y con criterios distintos. La copy de interfaz se
cambia para que se entienda mejor; los metadatos, para posicionar, con la longitud contada;
los correos se leen en la bandeja de entrada, sin la página delante. Juntarlos obliga a
pensar en los tres criterios a la vez.

## Cómo elegir fichero

1. ¿Lo lee el visitante **en la web**? Va en `textos.js`.
2. ¿Lo lee el cliente **en un correo**? Va en `textos-correo.js`.
3. ¿No lo lee nadie, lo leen Google o las redes sociales? Va en `metadatos.js`.

Los mensajes de error son copy de interfaz: viven en `ERRORES`, dentro de `textos.js`. La
función que resuelve el código y elige el mensaje es otra cosa y se queda en
`lib/mensajes-error.js`.

## Cambiar un texto que ya existe

Buscar la frase con grep dentro de `apps/<aplicación>/lib/` y cambiarla ahí. Con eso basta:
la vista ya la está pidiendo por su clave.

```bash
grep -rn "la frase que sea" apps/vender/lib/
```

Si la frase no aparece, mirar las [excepciones](#excepciones-textos-que-no-están-en-esos-ficheros).

## Añadir un texto nuevo

1. Añadir la clave en el fichero que toque, dentro del bloque de su página.
2. Pintarla en la vista con `<%= textos.LOQUESEA.clave %>`.

Mantener el orden de las claves igual que el orden de la página. El fichero se lee de
arriba abajo como se lee la página, y es lo que permite detectar que dos frases seguidas
chirrían juntas.

### Cuándo hace falta `<%-` en vez de `<%=`

`<%=` escapa el HTML y es lo que se usa casi siempre. Solo se usa `<%-` cuando el texto
lleva una entidad que tiene que llegar entera al navegador:

```js
notaMinuto: 'Se tarda un minuto &middot; sin compromiso'   // necesita <%-
placeholder: 'ej. Calle Mayor 1, 3º B&#10;28001 Madrid'    // necesita <%-
```

Regla práctica: si el texto lleva un `&algo;`, va con `<%-`. Si no, con `<%=`.

### Texto con negrita en medio

No se mete HTML dentro del texto. Se parte en dos claves y la vista pone la etiqueta:

```js
// en textos.js
{ destacado: 'Es un precio, no una negociación.', resto: 'Se manda un número por el lote...' }
```

```html
<!-- en la vista -->
<li><strong><%= destacado %></strong> <%= resto %></li>
```

### Listas y pasos numerados

Van como array y la vista los recorre. Añadir un paso es añadir un elemento al array; no se
toca la plantilla, y la numeración sale sola de la posición:

```js
pasos: [
  { titulo: 'Cuentas qué tienes', cuerpo: 'Son cuatro palabras...' },
  { titulo: 'Envías la caja', cuerpo: 'Pegas la etiqueta...' }
]
```

## Quitar un texto

Borrar la clave y borrar de la vista la línea que la pinta. Si al quitarla el fichero se
queda con una sección vacía, quitar también la sección.

## Añadir una página entera

En **vender**, hay que tocar cuatro sitios:

1. `lib/textos.js`: la copy de la página.
2. `lib/metadatos.js`: sus metadatos y su nodo de schema.org.
3. `routes/main.js`: la ruta, que pasa `...meta.LOQUESEA` y `textos` a la vista.
4. `public/sitemap.xml`, que **se mantiene a mano**. Una página nueva que no se añada aquí
   no la encuentra Google.

En **hub** no hay paso 4: el sitemap se genera del contenido real en `routes/main.js`.

## Excepciones: textos que no están en esos ficheros

Son deliberadas. No hay que moverlas.

| Dónde | Qué es | Por qué se queda ahí |
|---|---|---|
| `apps/vender/views/aviso-legal.ejs` | El aviso legal entero | Es un documento continuo, se lee y se revisa seguido. Trocearlo en claves lo vuelve ilegible y no se reutiliza en ningún otro sitio. Solo el `h1` y el botón final están en `textos.js` |
| `apps/hub/content/*.md` | Los artículos del blog | Cada artículo es un fichero con su frontmatter (`titulo`, `descripcion`, `fecha`, `keywords`). Para añadir uno, se añade el `.md`: la portada, el índice y el sitemap se actualizan solos |
| `apps/vender/lib/presupuesto.js` | Las etiquetas de tramo (`'Cartas de 20 € o más'`) | Llegan al cliente en el csv del presupuesto, pero cada una describe el corte de su propia fila y se lee al lado de él. Separarlas deja cambiar un corte sin tocar su etiqueta, y el csv pasaría a mentir sin que falle nada |
| `apps/vender/lib/lead.js` | Las descripciones de volumen (`VOLUMENES`) | Van pegadas a la validación: son los valores que el formulario acepta, no prosa suelta |
| `apps/*/public/llm.txt` | La descripción del servicio para los modelos de lenguaje | Formato propio, se edita entero como documento |
| `apps/*/public/robots.txt` | Directivas para los rastreadores | No es copy |

Si se cambia un texto de cara al cliente en `textos.js`, conviene mirar si dice lo mismo
que el `llm.txt` de esa aplicación, que no se actualiza solo.

## Comprobaciones

Después de tocar textos, desde `apps/hub` o `apps/vender`:

```bash
npm run lint:textos   # false friends, anglicismos, caracteres prohibidos
npm test              # que no se haya roto nada
```

El linter cubre lo sistemático, no el criterio. Las colocaciones calcadas (`precio cerrado`
por "closed price", `en local` por "locally") se le escapan salvo que estén dadas de alta
una a una, y solo se detectan leyendo. Cuando aparezca una, se añade con su test a
`W:\APPS_MTG\lint-castellano` para que no vuelva.

Dos avisos sobre los tests:

- `test/opciones-formulario.test.js` comprueba que las opciones del desplegable de volumen
  las acepta el validador. Lee `FORMULARIO.volumen.opciones` de `textos.js`, así que
  **añadir una opción ahí sin darla de alta en `lib/lead.js` rompe el test a propósito**:
  el formulario estaría ofreciendo algo que el backend rechaza.
- `test/valores-tras-error.test.js` renderiza vistas a mano y les pasa `textos`. Si se crea
  un test nuevo que renderice una vista, hay que pasárselo igual que hace la ruta.

## Qué no hacer

- **No escribir texto suelto en un `.ejs`.** Si hace falta una frase nueva, va al fichero
  de textos y la vista la pide por su clave.
- **No duplicar una frase entre `textos.js` y `metadatos.js`.** Si el mismo texto sirve para
  las dos cosas, vive en `textos.js` y `metadatos.js` hace `require`. Es lo que se hace con
  `PROCESO_FAQ` en vender: la portada la pinta y el `FAQPage` de schema.org la serializa,
  las dos desde la misma fuente.
- **No dejar en inglés lo que tiene forma natural en castellano**, salvo los términos
  técnicos ya asentados. La lista está en `~/.claude/rules/spanish-writing.md`.
