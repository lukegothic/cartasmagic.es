"""Star City Games: pendiente, y conviene explicar por que.

Su hotlist (https://sellyourcards.starcitygames.com/mtg/hotlist) no trae las cartas en el
html. La pagina llega vacia y las rellena el navegador pidiendoselas a un Meilisearch en
search.starcitygames.com, con el filtro filtered_hotlist_only y game_id=1 para Magic.

Esa peticion va firmada con una clave de api que viaja dentro de su fichero js. La clave es
de ellos, no nuestra: leerla del bundle y usarla desde un proceso automatico es usar una
credencial ajena, con el agravante de que acabaria escrita en este repositorio. No se hace.

Tres caminos legitimos, por orden de preferencia:

  1. Pedirsela a ellos. Tienen programa de afiliados y api para socios; un correo a
     sellyourcards@starcitygames.com explicando el uso es lo primero que hay que probar.
  2. Sacar la lista a mano de vez en cuando. Su hotlist es la de referencia del sector y
     mirarla una vez a la semana no cuesta nada.
  3. Renderizar la pagina con un navegador automatizado. Funciona, pero es fragil y pesado
     para una sola fuente, y sigue apoyandose en su clave aunque no la escribamos nosotros.

Mientras tanto, la herramienta avisa de que esta fuente no se lee en vez de fingir que la
tienda no busca nada.
"""

from .comun import Anuncio


PENDIENTE = (
    'Star City Games necesita una clave de api suya. Ver el comentario de '
    'fuentes/starcitygames.py: hay que pedirsela, no cogerla de su javascript.'
)


def starcitygames() -> list[Anuncio]:
    return []
