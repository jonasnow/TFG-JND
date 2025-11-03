#Imports
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from jose import jwt
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

import mysql.connector
import bcrypt
import os

#Instancia

app = FastAPI()

#JWT

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

#Funciones de generación de tokens
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


#Health check para el frontend
@app.get("/health")
def health_check():
    return {"status": "ok"}

#Peticiones permitidas desde el frontend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # durante desarrollo, acepta cualquier origen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Configuración de la base de datos desde variables de entorno
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "user": os.getenv("DB_USER", "testuser"),
    "password": os.getenv("DB_PASS", "testpass"),
    "database": os.getenv("DB_NAME", "testdb"),
}

@app.get("/")
def read_root():
    return {"message": "Hola mundo"}

#Método de prueba, listar usuarios

@app.get("/usuarios")
def listar_usuarios():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idUsuario, nombre, apellidos FROM Usuario;")
        usuarios = cursor.fetchall()
        return usuarios
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Clase Usuario
class Usuario(BaseModel):
    nombre: str
    apellidos: str
    localidad: str | None = None
    email: str
    password: str
    telefono: str | None = None

# Crear usuario con mensajes distintos para email y teléfono
@app.post("/usuario")
def crear_usuario(usuario: Usuario):
    try:
        password_hash = bcrypt.hashpw(usuario.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn = mysql.connector.connect(**DB_CONFIG)
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
        # e.args[1] contiene el mensaje de MySQL
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


#Clase inicio de sesión

class LoginData(BaseModel):
    email: str
    password: str

#Inicio de sesión
@app.post("/login")
def login(datos: LoginData, response: Response):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Usuario WHERE email = %s", (datos.email,))
        user = cursor.fetchone()

        if not user:
            return {"error": "Usuario no encontrado"}

        if not bcrypt.checkpw(datos.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            return {"error": "Contraseña incorrecta"}

        payload = {"sub": user["email"], "nombre": user["nombre"]}
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True, # En producción, esto debería ser True
            samesite="Lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )

        return {"mensaje": f"Bienvenido {user['nombre']}"}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Refrescar tokens
@app.post("/refresh")
def refresh_token(request: Request, response: Response):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        return {"error": "Token de refresco no proporcionado"}
    try:
        payload = jwt.decode(refresh_token_cookie, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return {"error": "Token de refresco inválido"}

        access_token = create_access_token({
            "sub": payload["sub"],
            "nombre": payload["nombre"]
        })

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        return {"mensaje": "Token de acceso refrescado correctamente"}
    except Exception as e:
        return {"error": f"Token de refresco inválido o expirado: {str(e)}"}


#Comprobar sesión

@app.get("/me")
def me(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return {"error": "No autenticado"}

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"usuario": payload["nombre"], "email": payload["sub"]}
    except Exception:
        return {"error": "Token inválido o expirado"}

#Logout
@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"mensaje": "Sesión cerrada"}


#Clase Torneo
class Torneo(BaseModel):
    nombre: str
    descripcion: str
    precioInscripcion: float
    numeroRondas: int
    duracionRondas: int
    fechaHoraInicio: datetime
    lugarCelebracion: str
    idOrganizador: int
    idFormatoTorneo: int
    idJuego: int
    idFormatoJuego: int
    idLiga: int | None = None  #Un torneo puede no pertenecer a una liga
    premios: str
    estado: str = "PLANIFICADO"

#Listar formatos de torneo

@app.get("/formatos_torneo")
def listar_formatos_torneo():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idFormatoTorneo, nombre FROM FormatoTorneo;")
        formatos = cursor.fetchall()
        return formatos
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Listar juegos
@app.get("/juegos")
def listar_juegos():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idJuego, nombre FROM Juego;")
        juegos = cursor.fetchall()
        return juegos
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Listar formatos de juego

@app.get("/formatos_juego")
def listar_formatos_juego():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idFormatoJuego, nombre FROM FormatoJuego;")
        formatos = cursor.fetchall()
        return formatos
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Listar ligas activas
@app.get("/ligas")
def listar_ligas():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idLiga, nombre FROM Liga WHERE CURDATE() BETWEEN fechaInicio AND fechaFin;")
        ligas = cursor.fetchall()
        return ligas
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Crear torneo
@app.post("/torneo")
def crear_torneo(torneo: Torneo):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Torneo 
            (nombre, descripcion, precioInscripcion, numeroRondas, duracionRondas, fechaHoraInicio, 
             lugarCelebracion, idOrganizador, idFormatoTorneo, idJuego, idFormatoJuego, idLiga, premios, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            torneo.nombre, torneo.descripcion, torneo.precioInscripcion, torneo.numeroRondas,
            torneo.duracionRondas, torneo.fechaHoraInicio, torneo.lugarCelebracion, torneo.idOrganizador,
            torneo.idFormatoTorneo, torneo.idJuego, torneo.idFormatoJuego, torneo.idLiga,
            torneo.premios, torneo.estado
        ))
        conn.commit()
        return {"mensaje": f"Torneo '{torneo.nombre}' creado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


#Listar torneos vigentes

@app.get("/torneos_vigentes")
def listar_torneos_vigentes():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT idTorneo, nombre, descripcion, lugarCelebracion, fechaHoraInicio
            FROM Torneo
            WHERE fechaHoraInicio > NOW()
            ORDER BY fechaHoraInicio ASC;
        """)
        torneos = cursor.fetchall()
        return torneos
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Ver más información de un torneo

@app.get("/torneo/{id_torneo}")
def obtener_torneo(id_torneo: int):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.*, 
                   COALESCE(l.nombre, 'Ninguna') AS nombreLiga
            FROM Torneo t
            LEFT JOIN Liga l ON t.idLiga = l.idLiga
            WHERE t.idTorneo = %s;
        """, (id_torneo,))
        torneo = cursor.fetchone()
        if torneo:
            return torneo
        else:
            return {"error": "Torneo no encontrado"}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Inscribir usuario en torneo
@app.post("/inscribir_usuario")
def inscribir_usuario(datos: dict):
    email = datos.get("email")
    id_torneo = datos.get("idTorneo")

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT equipo.idEquipo FROM Equipo equipo JOIN Usuario usuario ON equipo.nombre = CONCAT(usuario.nombre, ' ', usuario.apellidos) WHERE usuario.email = %s;", (email,))
        equipo = cursor.fetchone()
        if not equipo:
            return {"error": "Usuario no encontrado"}
        #Como el par idEquipo, idTorneo son clave primaria compuesta, si ya existe la inscripción saltará excepción
        cursor.execute("INSERT INTO Equipo_Torneo (idEquipo, idTorneo) VALUES (%s, %s);", (equipo['idEquipo'], id_torneo))
        conn.commit()
        
        return {"mensaje": "Inscrito correctamente en el torneo."}
    
    except mysql.connector.IntegrityError:
        return {"error": "El usuario ya estaba inscrito en este torneo."}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
