import hashlib
from componentes.helpers.conexion_bd import obtener_conexion

def md5_hash(texto: str) -> str:
    """Calcula el hash MD5 de un texto."""
    return hashlib.md5(texto.encode("utf-8")).hexdigest()

def autenticar_usuario(correo: str, contrasena: str) -> str | None:
    """
    Comprueba si el usuario existe y la contraseña coincide.
    Devuelve el rol ('admin' o 'cliente') o None si falla.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT contresena AS pwd, rol FROM usuarios WHERE correo = %s",
        (correo,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conexion.close()

    if usuario and usuario["pwd"] == md5_hash(contrasena):
        return usuario["rol"]
    return None