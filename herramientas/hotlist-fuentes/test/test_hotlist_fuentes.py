"""Pruebas de la extraccion y de la comparacion entre dias.

No tocan la red: el html y el json de ejemplo son recortes reales de cada fuente, guardados
aqui para que una prueba que falla signifique que hemos roto algo nosotros y no que la
tienda estaba caida esa tarde.
"""

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

from fuentes.cardmonster import cardmonster
from fuentes.comun import Anuncio, FuenteCaida
from fuentes.shopify import leer_coleccion
from hotlist_fuentes import comparar, informe

CARDMONSTER_HTML = '''
<div><strong>All Prices are Based On NEAR MINT Conditions!</strong></div>
<img src="https://cdn.shopify.com/s/files/1/0270/files/mtg_logo_2_480x480.png">
<table><tbody>
<tr><td>Commander Legends: Battle for Baldur's Gate</td><td>Ancient Copper Dragon</td>
<td>161</td><td></td><td>Near Mint</td><td>$100.00</td></tr>
<tr><td>Unlimited Edition</td><td>Black Lotus</td><td>233</td><td></td>
<td>Lightly Played</td><td>$15,000.00</td></tr>
<tr><td>Cabecera que no es una carta</td></tr>
</tbody></table>
<img src="https://cdn.shopify.com/s/files/1/0270/files/pokemon_logo_480x480.png">
<table><tbody>
<tr><td>SWSH12: Silver Tempest</td><td>Lugia V</td><td>186</td><td></td>
<td>Near Mint</td><td>$420.00</td></tr>
</tbody></table>
'''

CRYPT_JSON = {
    'products': [
        {
            'title': 'Bloodthirsty Conqueror [Foundations]',
            'handle': 'bloodthirsty-conqueror-foundations',
            'variants': [
                {'title': 'Near Mint', 'price': '58.20'},
                {'title': 'Lightly Played', 'price': '49.50'},
                {'title': 'Near Mint Foil', 'price': '62.30'}
            ]
        },
        {
            'title': 'Sin corchetes de edicion',
            'handle': 'raro',
            'variants': [{'title': 'Near Mint', 'price': '10.00'}]
        }
    ]
}


class LeerCardMonster(unittest.TestCase):
    def test_saca_una_oferta_por_fila_de_seis_columnas(self):
        with patch('fuentes.cardmonster.pedir_texto', return_value=CARDMONSTER_HTML):
            anuncios = cardmonster()

        self.assertEqual(len(anuncios), 2)
        self.assertEqual(anuncios[0].nombre, 'Ancient Copper Dragon')
        self.assertEqual(anuncios[0].edicion, "Commander Legends: Battle for Baldur's Gate")
        self.assertEqual(anuncios[0].precio, 100.0)
        self.assertEqual(anuncios[0].moneda, 'USD')

    def test_la_coma_de_los_millares_no_parte_la_cifra(self):
        """15,000.00 son quince mil dolares, no quince."""
        with patch('fuentes.cardmonster.pedir_texto', return_value=CARDMONSTER_HTML):
            lotus = [a for a in cardmonster() if a.nombre == 'Black Lotus'][0]

        self.assertEqual(lotus.precio, 15000.0)
        self.assertEqual(lotus.estado, 'Lightly Played')

    def test_no_se_cuelan_las_cartas_de_otros_juegos(self):
        """La pagina lista tambien Pokemon y Yu-Gi-Oh, que no compramos."""
        with patch('fuentes.cardmonster.pedir_texto', return_value=CARDMONSTER_HTML):
            nombres = [a.nombre for a in cardmonster()]

        self.assertNotIn('Lugia V', nombres)

    def test_una_tabla_irreconocible_es_un_fallo_y_no_una_lista_vacia(self):
        """Si dieramos la lista por vacia, el informe diria que han dejado de comprar."""
        with patch('fuentes.cardmonster.pedir_texto', return_value='<p>rediseno</p>'):
            with self.assertRaises(FuenteCaida):
                cardmonster()


class LeerShopify(unittest.TestCase):
    def test_separa_el_nombre_de_la_edicion_y_coge_la_variante_limpia(self):
        respuestas = [CRYPT_JSON, {'products': []}]
        with patch('fuentes.shopify.pedir_json', side_effect=respuestas):
            anuncios = leer_coleccion('https://tienda', 'coleccion', 'crypt', 'CAD')

        self.assertEqual(len(anuncios), 1)
        self.assertEqual(anuncios[0].nombre, 'Bloodthirsty Conqueror')
        self.assertEqual(anuncios[0].edicion, 'Foundations')
        # La de foil vale mas y la jugada menos: coger otra variante compararia cosas
        # distintas entre dias.
        self.assertEqual(anuncios[0].precio, 58.20)
        self.assertEqual(anuncios[0].estado, 'Near Mint')


def _anuncio(nombre, precio, fuente='crypt'):
    return Anuncio(fuente=fuente, nombre=nombre, edicion='Revised', estado='Near Mint',
                   precio=precio, moneda='CAD', url='https://tienda/x')


class Comparar(unittest.TestCase):
    def test_distingue_nueva_de_movida_de_retirada(self):
        ayer = {
            'crypt|Tundra|Revised|Near Mint': _anuncio('Tundra', 100.0).como_dict(),
            'crypt|Bayou|Revised|Near Mint': _anuncio('Bayou', 50.0).como_dict()
        }
        hoy = {
            'crypt|Tundra|Revised|Near Mint': _anuncio('Tundra', 130.0),
            'crypt|Mox Diamond|Revised|Near Mint': _anuncio('Mox Diamond', 400.0)
        }

        cambios = comparar(hoy, ayer)

        self.assertEqual([a.nombre for a in cambios['nuevas']], ['Mox Diamond'])
        self.assertEqual([a['nombre'] for a in cambios['retiradas']], ['Bayou'])
        self.assertEqual(len(cambios['movidas']), 1)
        anuncio, antes, diferencia = cambios['movidas'][0]
        self.assertEqual((anuncio.nombre, antes, diferencia), ('Tundra', 100.0, 30.0))

    def test_el_redondeo_no_cuenta_como_cambio(self):
        ayer = {'crypt|Tundra|Revised|Near Mint': _anuncio('Tundra', 100.00).como_dict()}
        hoy = {'crypt|Tundra|Revised|Near Mint': _anuncio('Tundra', 100.02)}

        self.assertEqual(comparar(hoy, ayer)['movidas'], [])

    def test_el_primer_dia_todo_es_nuevo_y_nada_se_ha_retirado(self):
        hoy = {'crypt|Tundra|Revised|Near Mint': _anuncio('Tundra', 100.0)}

        cambios = comparar(hoy, {})

        self.assertEqual(len(cambios['nuevas']), 1)
        self.assertEqual(cambios['retiradas'], [])


class Informe(unittest.TestCase):
    def test_dice_que_los_precios_de_fuera_no_son_para_copiarlos(self):
        texto = informe({'nuevas': [], 'retiradas': [], 'movidas': []}, 0, [])

        self.assertIn('no para copiarlos', texto)

    def test_una_fuente_caida_sale_en_el_informe(self):
        """Callarlo haria leer su ausencia como que esa tienda no busca nada."""
        texto = informe({'nuevas': [], 'retiradas': [], 'movidas': []}, 3, ['crypt: 503'])

        self.assertIn('crypt: 503', texto)


if __name__ == '__main__':
    unittest.main()
