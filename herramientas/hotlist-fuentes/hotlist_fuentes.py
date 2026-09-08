"""Mira cada dia que compran las tiendas de referencia y saca que ha cambiado.

Lo que responde es "que cartas han empezado a buscar y cuales han subido de precio", no
"cuanto pagan". Los precios de fuera son en dolares y en dolares canadienses, sobre otro
mercado y con otros costes, asi que no sirven para poner los nuestros: sirven como aviso de
que algo se esta moviendo, para ir a mirarlo a Cardmarket.

Uso:
    python hotlist_fuentes.py                 lee las fuentes y compara con la ultima vez
    python hotlist_fuentes.py --solo-leer     lee y escribe el historico, sin informe

Deja dos cosas en datos/:
    ultimo.json      la foto de hoy, que manana sirve de comparacion
    cambios-<fecha>.md  el informe legible del dia
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

from fuentes.cardmonster import cardmonster
from fuentes.comun import Anuncio, FuenteCaida
from fuentes.shopify import crypt
from fuentes.starcitygames import PENDIENTE, starcitygames

DATOS = Path(__file__).parent / 'datos'
ULTIMO = DATOS / 'ultimo.json'

FUENTES = {
    'cardmonster': cardmonster,
    'crypt': crypt,
    'starcitygames': starcitygames
}

# Por debajo de esto un cambio de precio es ruido de redondeo o del tipo de cambio, y
# llenaria el informe de lineas que no dicen nada.
CAMBIO_MINIMO = 0.10


def recoger() -> tuple[dict[str, Anuncio], list[str]]:
    """Lee todas las fuentes. Una caida no cancela las demas: se anota y se sigue."""
    anuncios: dict[str, Anuncio] = {}
    fallos: list[str] = []

    for nombre, leer in FUENTES.items():
        try:
            for anuncio in leer():
                anuncios['|'.join(anuncio.clave())] = anuncio
        except FuenteCaida as error:
            fallos.append(f'{nombre}: {error}')

    return anuncios, fallos


def leer_historico() -> dict[str, dict]:
    if not ULTIMO.exists():
        return {}
    return json.loads(ULTIMO.read_text(encoding='utf-8'))


def guardar_historico(anuncios: dict[str, Anuncio]) -> None:
    DATOS.mkdir(exist_ok=True)
    ULTIMO.write_text(
        json.dumps({k: a.como_dict() for k, a in anuncios.items()}, indent=1, ensure_ascii=False),
        encoding='utf-8'
    )


def comparar(hoy: dict[str, Anuncio], ayer: dict[str, dict]) -> dict[str, list]:
    """Que hay hoy que no estuviera ayer, y que ha cambiado de precio."""
    nuevas = [a for clave, a in hoy.items() if clave not in ayer]
    retiradas = [ayer[c] for c in ayer if c not in hoy]

    movidas = []
    for clave, anuncio in hoy.items():
        anterior = ayer.get(clave)
        if not anterior:
            continue
        diferencia = anuncio.precio - anterior['precio']
        if abs(diferencia) >= CAMBIO_MINIMO:
            movidas.append((anuncio, anterior['precio'], diferencia))

    movidas.sort(key=lambda m: abs(m[2]), reverse=True)
    nuevas.sort(key=lambda a: a.precio, reverse=True)

    return {'nuevas': nuevas, 'retiradas': retiradas, 'movidas': movidas}


def _tabla(titulo: str, cabeceras: list[str], filas: list[list[str]]) -> list[str]:
    if not filas:
        return [f'## {titulo}', '', 'Nada.', '']
    return [
        f'## {titulo}', '',
        '| ' + ' | '.join(cabeceras) + ' |',
        '|' + '|'.join(['---'] * len(cabeceras)) + '|',
        *['| ' + ' | '.join(f) + ' |' for f in filas],
        ''
    ]


def informe(cambios: dict[str, list], total: int, fallos: list[str]) -> str:
    hoy = date.today().strftime('%d/%m/%Y')
    lineas = [
        f'# Que compran las otras tiendas, {hoy}',
        '',
        f'{total} ofertas leidas. Los precios son de cada tienda y en su moneda: sirven para '
        'ver que se mueve, no para copiarlos.',
        ''
    ]

    lineas += _tabla(
        'Cartas que han empezado a buscar',
        ['Carta', 'Edicion', 'Tienda', 'Paga'],
        [[a.nombre, a.edicion, a.fuente, f'{a.precio:.2f} {a.moneda}'] for a in cambios['nuevas'][:40]]
    )

    lineas += _tabla(
        'Cartas que han cambiado de precio',
        ['Carta', 'Edicion', 'Tienda', 'Antes', 'Ahora', 'Cambio'],
        [[a.nombre, a.edicion, a.fuente, f'{antes:.2f}', f'{a.precio:.2f} {a.moneda}',
          f'{dif:+.2f}'] for a, antes, dif in cambios['movidas'][:40]]
    )

    lineas += _tabla(
        'Cartas que han dejado de buscar',
        ['Carta', 'Edicion', 'Tienda'],
        [[a['nombre'], a['edicion'], a['fuente']] for a in cambios['retiradas'][:20]]
    )

    if fallos:
        lineas += ['## Fuentes que no se han podido leer', '']
        lineas += [f'- {f}' for f in fallos] + ['']

    lineas += ['## Fuentes pendientes', '', f'- {PENDIENTE}', '']
    return '\n'.join(lineas)


def main() -> int:
    opciones = argparse.ArgumentParser(description='Vigila las hotlists de otras tiendas')
    opciones.add_argument('--solo-leer', action='store_true', help='guarda la foto sin sacar informe')
    argumentos = opciones.parse_args()

    hoy, fallos = recoger()
    if not hoy:
        # Sin una sola oferta no hay nada que comparar, y guardar la foto vacia haria que
        # manana todas las cartas parecieran nuevas.
        for fallo in fallos:
            print(f'  {fallo}', file=sys.stderr)
        print('Ninguna fuente ha devuelto nada. No se toca el historico.', file=sys.stderr)
        return 1

    ayer = leer_historico()
    guardar_historico(hoy)

    if argumentos.solo_leer:
        print(f'{len(hoy)} ofertas guardadas.')
        return 0

    cambios = comparar(hoy, ayer)
    texto = informe(cambios, len(hoy), fallos)

    destino = DATOS / f"cambios-{date.today().strftime('%Y-%m-%d')}.md"
    destino.write_text(texto, encoding='utf-8')

    print(texto)
    print(f'\nGuardado en {destino}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
