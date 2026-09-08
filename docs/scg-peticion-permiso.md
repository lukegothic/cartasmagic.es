# Pedir permiso a Star City Games para leer su hotlist

Su hotlist es la referencia del sector y es la fuente que falta. No se lee sola porque sus
condiciones lo prohíben, no porque sea difícil: técnicamente se resuelve en una tarde.

Este documento es lo que hay que mandarles y por qué. Con el permiso por escrito, darla de
alta en `herramientas/hotlist-fuentes/fuentes.json` es una entrada más.

## Por qué hace falta pedirlo

Sus [condiciones](https://help.starcitygames.com/en-US/terms-and-conditions-1056759), en el
apartado `RESTRICTIONS ON USE`, dicen que su material y sus precios:

> may not be scraped, extracted, downloaded, uploaded, sold, or offered for sale or use in
> any way (including for competitive purposes), without the prior written consent of Star City

y añaden que uno se compromete a no usar:

> any computerized or other manual or automated program or mechanism, tool, or process,
> including any offline reader, site search/retrieval application, scraper, spider robot, to
> access, extract, download, scrape, data mine, display, transmit, or publish, any materials,
> data, or information (including pricing information)

Hay una excepción, y conviene entender hasta dónde llega:

> it shall not be a violation of these Terms and Conditions for an individual to access or
> use Star City's published prices in connection with selling or offering to sell cards to
> Star City

Es decir: **una persona** mirando sus precios **para venderles cartas a ellos** está
permitido. Eso cubre abrir la página y leerla, que es lo que se hace mientras tanto. No cubre
un proceso que corre solo cada mañana y vuelca los datos en nuestra herramienta, ni aunque el
proceso use un navegador automatizado: el texto prohíbe el acceso automatizado por el método,
no por la herramienta concreta, así que un navegador sin ventana entra igual en la
prohibición que una petición a su api.

Su `robots.txt` de `sellyourcards.starcitygames.com` sí permite el paso, pero eso no
contradice lo anterior: un `robots.txt` permisivo es la ausencia de un bloqueo técnico, no un
permiso. Manda el contrato.

## Qué no se hace

Su javascript lleva dentro una clave de api con la que el navegador pide la lista. No se usa:
es una credencial suya, no nuestra, y acabaría escrita en este repositorio. Que sea fácil de
sacar no la convierte en pública.

## Dónde se pide

El formulario de <https://help.starcitygames.com/en-US/contact>. No publican una dirección de
correo directa, así que es la vía que dejan. Asunto: `Selling Cards to SCG`.

## Qué mandarles

> Subject: Permission request - automated read of your public MTG hotlist
>
> Hello,
>
> I run a small business in Spain that buys Magic: The Gathering collections from private
> sellers (vendercartasmagic.es). I have been a Cardmarket seller since 2011.
>
> I would like your written permission to read your public MTG hotlist
> (https://sellyourcards.starcitygames.com/mtg/hotlist) automatically, once per day.
>
> I want to be upfront about why I am asking rather than just doing it: your Terms and
> Conditions require prior written consent for automated access, so I have not done it.
>
> What I would do with the data:
>
> - One request per day, outside peak hours, identifying itself with a descriptive
>   User-Agent and a contact address.
> - Internal use only. I would not republish your prices, display them to my customers, or
>   use them to quote anyone. They would be one signal among several telling me which cards
>   the trade is short of, so I know what to look for in the collections I buy.
> - No resale of the data, and nothing competitive with your storefront: I buy in Spain and
>   sell through Cardmarket in Europe.
>
> If a documented API, partner feed or data export exists for this, I would rather use that
> than scrape the page, and I am happy to work within whatever rate limit or terms you set.
>
> If the answer is no, that is fine and I will keep reading the page by hand.
>
> Thank you for your time,
> Iván Pérez
> contacto@vendercartasmagic.es
> https://vendercartasmagic.es

## Mientras tanto

La fuente está dada de alta en `fuentes.json` con `"tipo": "pendiente"`, así que sale en cada
informe con el motivo al lado. No desaparece ni se olvida: solo no se lee sola.

Leerla a mano una vez por semana está permitido por la excepción de arriba y es lo que hay
que hacer hasta que contesten.

## Si contestan que sí

Cambiar la entrada de `fuentes.json` de `"tipo": "pendiente"` a lo que corresponda, guardar
el permiso (correo o documento) en `docs/`, y anotar aquí la fecha y las condiciones que
pongan. Si ponen un límite de peticiones, respetarlo aunque la herramienta pida menos.
