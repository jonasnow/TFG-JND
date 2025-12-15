from fastapi import APIRouter
import bcrypt
import mysql.connector

from core.database import get_connection
from models.usuario import Usuario

router = APIRouter(tags=["Usuarios"])

#Método de prueba, listar usuarios
@router.get("/usuarios")
def listar_usuarios():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idUsuario, nombre, apellidos FROM Usuario;")
        return cursor.fetchall()
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
# Crear usuario con mensajes distintos para email y teléfono
@router.post("/register")
def crear_usuario(usuario: Usuario):
    try:
        password_hash = bcrypt.hashpw(usuario.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Usuario (nombre, apellidos, localidad, email, password_hash, telefono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (usuario.nombre, usuario.apellidos, usuario.localidad, usuario.email, password_hash, usuario.telefono))
        conn.commit()
        cursor.execute("INSERT INTO Equipo (nombre) VALUES (%s);", (f"{usuario.nombre} {usuario.apellidos}",))
        conn.commit()
        cursor.execute("SELECT idUsuario FROM Usuario WHERE email = %s;", (usuario.email,))
        id_usuario = cursor.fetchone()[0]
        cursor.execute("SELECT idEquipo FROM Equipo WHERE nombre = %s;", (f"{usuario.nombre} {usuario.apellidos}",))
        id_equipo = cursor.fetchone()[0]
        cursor.execute("INSERT INTO Usuario_Equipo (idUsuario, idEquipo) VALUES (%s, %s)", (id_usuario, id_equipo))
        conn.commit()
        return {"mensaje": f"Usuario {usuario.nombre} creado correctamente"}

    except mysql.connector.IntegrityError as e:
        error_msg = str(e)
        if "email" in error_msg:
            return {"error": "Email ya registrado"}
        elif "telefono" in error_msg:
            return {"error": "Teléfono ya registrado"}
        else:
            return {"error": "Error de integridad: " + error_msg}

    except Exception as e:
        return {"error": str(e)}

    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
