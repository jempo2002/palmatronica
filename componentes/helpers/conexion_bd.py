import mysql.connector
from mysql.connector import Error

def obtener_conexion():
    """Crea y devuelve una conexion a la base de datos."""
    try:
        conexion = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="palmatronica",
        )
        return conexion
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None
