"""Tiendas montadas sobre Shopify: Crypt y Alchemist's Refuge.

Shopify publica cada coleccion en /collections/<nombre>/products.json sin pedir clave ni
saltarse nada: es el mismo listado que sirve la web, en json en vez de en html. Se usa eso
en lugar de leer el html porque el html cambia cada vez que la tienda toca su plantilla y
el json no.

El titulo trae la edicion entre corchetes ("Tundra [Revised Edition]"), y cada variante es
una combinacion de estado, acabado e idioma con su precio.
"""

import re

from .comun import Anuncio, FuenteCaida, pedir_json

# El titulo de Shopify mete la edicion entre corchetes al final. Lo que va antes es el
# nombre de la carta, que puede llevar parentesis propios ("Ancient Copper Dragon
# (Borderless)") y por eso no se corta por el primer separador que aparezca.
TITULO = re.compile(r'^(?P<nombre>.+?)\s*\[(?P<edicion>[^\]]+)\]\s*$')

# Solo interesa la carta en ingles, sin foil y en el mejor estado: es lo que publica
# nuestra hotlist, y comparar contra una variante en frances o jugada seria comparar
# cosas distintas.
VARIANTE_LIMPIA = 'Near Mint'

MAXIMO_POR_PAGINA = 250


def _anuncio(producto: dict, fuente: str, moneda: str, tienda: str) -> Anuncio | None:
    encaje = TITULO.match(producto.get('title', ''))
    if not encaje:
        return None

    variantes = producto.get('variants', [])
    limpia = next((v for v in variantes if v.get('title') == VARIANTE_LIMPIA), None)
    if not limpia or limpia.get('price') is None:
        return None

    return Anuncio(
        fuente=fuente,
        nombre=encaje.group('nombre').strip(),
        edicion=encaje.group('edicion').strip(),
        estado=VARIANTE_LIMPIA,
        precio=float(limpia['price']),
        moneda=moneda,
        url=f"{tienda}/products/{producto.get('handle', '')}"
    )


def leer_coleccion(tienda: str, coleccion: str, fuente: str, moneda: str) -> list[Anuncio]:
    """Recorre las paginas de una coleccion de Shopify hasta que deja de devolver cartas."""
    anuncios: list[Anuncio] = []
    pagina = 1

    while True:
        url = f'{tienda}/collections/{coleccion}/products.json?limit={MAXIMO_POR_PAGINA}&page={pagina}'
        datos = pedir_json(url)
        if not isinstance(datos, dict) or 'products' not in datos:
            raise FuenteCaida(f'{url}: no trae products')

        productos = datos['products']
        if not productos:
            return anuncios

        anuncios.extend(a for p in productos if (a := _anuncio(p, fuente, moneda, tienda)))
        pagina += 1

        # Una coleccion que no se acaba nunca solo puede ser un bucle: Shopify devuelve la
        # misma pagina cuando el parametro deja de tener sentido para ella.
        if pagina > 40:
            return anuncios


def crypt() -> list[Anuncio]:
    return leer_coleccion('https://cryptmtg.com', 'mtg-hotlist', 'crypt', 'CAD')


# Alchemist's Refuge no tiene funcion propia a proposito. Su pagina de buylist anuncia una
# "hot list" pero no la publica: dice que hay que preguntar en la tienda o por telefono. Se
# comprobaron sus 250 colecciones y ninguna enumera cartas de compra, asi que no hay nada
# que leer. Si algun dia la publican, se anade aqui una linea con leer_coleccion.
