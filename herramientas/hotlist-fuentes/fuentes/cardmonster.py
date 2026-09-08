"""Card Monster Games: la hotlist va escrita a mano en una tabla dentro de la pagina.

No hay json que pedir, asi que toca leer el html. La tabla tiene seis columnas y siempre en
el mismo orden: edicion, carta, numero de coleccion, una columna vacia, estado y precio.
La cuarta esta en blanco en todas las filas vistas; se conserva en el recuento de columnas
para que, si algun dia la rellenan, la fila deje de encajar y salte el aviso en vez de
colarse un dato en la casilla equivocada.

Se analiza con html.parser de la biblioteca estandar y no con BeautifulSoup para no meter
una dependencia por una sola tabla.
"""

from html.parser import HTMLParser
import re

from .comun import Anuncio, FuenteCaida, pedir_texto

PAGINA = 'https://cardmonstergames.com/pages/hotlist'

# La pagina lista los tres juegos que vende la tienda, cada uno con su tabla y precedido de
# su logo. Solo interesa Magic: sin recortar, se colaban Pokemon y Yu-Gi-Oh, que no
# compramos, y el informe acababa proponiendo mirar un Lugia V en Cardmarket.
LOGO_MAGIC = 'mtg_logo'
LOGO_SIGUIENTE = re.compile(r'files/(?!mtg_logo)[a-z0-9_]+_logo')

COLUMNAS = 6
EDICION, NOMBRE, NUMERO, _RESERVADA, ESTADO, PRECIO = range(COLUMNAS)

# "$3,400.00" -> 3400.00. La coma es separador de millares, que es como escribe las cifras
# una tienda estadounidense.
CIFRA = re.compile(r'\$\s*([0-9,]+(?:\.[0-9]{2})?)')


class _LectorDeTablas(HTMLParser):
    """Junta el texto de cada celda y cierra la fila al llegar a </tr>."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.filas: list[list[str]] = []
        self._fila: list[str] = []
        self._celda: list[str] | None = None

    def handle_starttag(self, etiqueta: str, atributos: list) -> None:
        if etiqueta == 'td':
            self._celda = []
        elif etiqueta == 'tr':
            self._fila = []

    def handle_endtag(self, etiqueta: str) -> None:
        if etiqueta == 'td' and self._celda is not None:
            self._fila.append(''.join(self._celda).strip())
            self._celda = None
        elif etiqueta == 'tr' and self._fila:
            self.filas.append(self._fila)
            self._fila = []

    def handle_data(self, dato: str) -> None:
        if self._celda is not None:
            self._celda.append(dato)


def _precio(celda: str) -> float | None:
    encaje = CIFRA.search(celda)
    if not encaje:
        return None
    return float(encaje.group(1).replace(',', ''))


def _tabla_de_magic(html: str) -> str:
    """Recorta el trozo entre el logo de Magic y el logo del juego siguiente."""
    inicio = html.find(LOGO_MAGIC)
    if inicio == -1:
        raise FuenteCaida(f'{PAGINA}: no se encuentra la seccion de Magic')

    siguiente = LOGO_SIGUIENTE.search(html, inicio + len(LOGO_MAGIC))
    return html[inicio:siguiente.start()] if siguiente else html[inicio:]


def cardmonster() -> list[Anuncio]:
    lector = _LectorDeTablas()
    lector.feed(_tabla_de_magic(pedir_texto(PAGINA)))

    # Quedarse con las filas de seis columnas y precio legible deja fuera las de cabecera
    # y cualquier tabla suelta que no tenga esta forma.
    anuncios = []
    for fila in lector.filas:
        if len(fila) != COLUMNAS:
            continue
        precio = _precio(fila[PRECIO])
        if precio is None or not fila[NOMBRE] or not fila[EDICION]:
            continue

        anuncios.append(Anuncio(
            fuente='cardmonster',
            nombre=fila[NOMBRE],
            edicion=fila[EDICION],
            estado=fila[ESTADO] or 'Near Mint',
            precio=precio,
            moneda='USD',
            url=PAGINA
        ))

    # La pagina siempre ha tenido decenas de cartas. Si no sale ninguna es que han cambiado
    # la maquetacion, y eso hay que saberlo: dar la lista por vacia diria que han dejado de
    # comprar, que es lo contrario de lo que pasa.
    if not anuncios:
        raise FuenteCaida(f'{PAGINA}: la tabla ya no tiene la forma esperada')

    return anuncios
