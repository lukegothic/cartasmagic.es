"""Lo que comparten las cuatro fuentes: el tipo de dato y como se piden las paginas.

Cada fuente devuelve una lista de Anuncio. El precio se guarda en la moneda de origen sin
convertir: la conversion depende del dia y mezclarla con la extraccion haria imposible
saber si una diferencia viene del vendedor o del tipo de cambio.
"""

from dataclasses import dataclass, asdict
from typing import Any
import time
import urllib.error
import urllib.request
import json

# Identificarse es lo minimo al pedir paginas ajenas a diario: si molestamos, que sepan a
# quien escribir en vez de tener que bloquear a ciegas.
AGENTE = 'cartasmagic-hotlist/1.0 (+https://vendercartasmagic.es; contacto@vendercartasmagic.es)'

# Ninguna de las cuatro fuentes cambia sus precios en cuestion de minutos, asi que no hay
# ninguna prisa que justifique apretar. Un segundo entre peticiones mantiene la carga por
# debajo de lo que hace cualquier visitante navegando.
ESPERA_ENTRE_PETICIONES = 1.0

TIEMPO_LIMITE = 30


@dataclass(frozen=True)
class Anuncio:
    """Una carta que una tienda dice que compra, y a cuanto."""

    fuente: str
    nombre: str
    edicion: str
    estado: str
    precio: float
    moneda: str
    # Distingue una carta que la tienda ya no busca de una que nunca estuvo: sin esto, una
    # fuente que falle a medias se lee como si hubiera retirado media lista.
    url: str

    def clave(self) -> tuple[str, str, str, str]:
        """Identifica la oferta entre dias distintos, para saber que ha cambiado."""
        return (self.fuente, self.nombre, self.edicion, self.estado)

    def como_dict(self) -> dict[str, Any]:
        return asdict(self)


class FuenteCaida(Exception):
    """La fuente no ha contestado o ha contestado algo que no se puede leer.

    Se distingue de una lista vacia a proposito. Una tienda puede quedarse sin cartas que
    buscar, y eso es un dato; que su web este caida no lo es, y confundirlos borraria la
    fuente del informe como si hubiera retirado todas sus ofertas.
    """


def pedir(url: str, cabeceras: dict[str, str] | None = None) -> bytes:
    peticion = urllib.request.Request(url, headers={'User-Agent': AGENTE, **(cabeceras or {})})
    try:
        with urllib.request.urlopen(peticion, timeout=TIEMPO_LIMITE) as respuesta:
            return respuesta.read()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
        raise FuenteCaida(f'{url}: {error}') from error
    finally:
        time.sleep(ESPERA_ENTRE_PETICIONES)


def pedir_json(url: str) -> Any:
    crudo = pedir(url, {'Accept': 'application/json'})
    try:
        return json.loads(crudo)
    except json.JSONDecodeError as error:
        raise FuenteCaida(f'{url}: no devuelve json') from error


def pedir_texto(url: str) -> str:
    return pedir(url).decode('utf-8', errors='replace')
