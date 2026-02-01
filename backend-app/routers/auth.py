from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import bcrypt
import mysql.connector

from core.security import create_access_token, create_refresh_token, obtener_usuario_actual
from core.database import get_connection
from core.config import settings
from models.usuario import UsuarioRegistro, UsuarioLogin

router = APIRouter(tags=["Autenticación"])

#Registro de usuario
@router.post("/register", status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UsuarioRegistro):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        #Comprobación de email y teléfono únicos
        conflict = False
        cursor.execute("SELECT idUsuario FROM Usuario WHERE email = %s", (usuario.email,))
        if cursor.fetchone():
            conflict = True

        if not conflict and usuario.telefono:
            cursor.execute("SELECT idUsuario FROM Usuario WHERE telefono = %s", (usuario.telefono,))
            if cursor.fetchone():
                conflict = True
        
        #Conflicto = 400.
        if conflict:
            raise HTTPException(
                status_code=400, 
                detail="No se pudo completar el registro. Por favor, verifique que los datos sean correctos."
            )

        #Si todo bien, insertar usuario
        password_hash = bcrypt.hashpw(
            usuario.password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')

        cursor.execute("""
            INSERT INTO Usuario (nombre, apellidos, localidad, email, password_hash, telefono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (usuario.nombre, usuario.apellidos, usuario.localidad, usuario.email, password_hash, usuario.telefono))
        
        new_user_id = cursor.lastrowid

        cursor.execute("INSERT INTO Equipo (nombre) VALUES (NULL);")
        new_team_id = cursor.lastrowid
        #El nombre del equipo será el del usuario cuando se necesite
        cursor.execute("INSERT INTO Usuario_Equipo (idUsuario, idEquipo) VALUES (%s, %s)", (new_user_id, new_team_id))

        conn.commit()
        return {"mensaje": "Usuario registrado correctamente"}

    except HTTPException as he:
        raise he
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error Register: {e}") 
        #Error genérico para cualquier fallo de servidor
        raise HTTPException(status_code=500, detail="Error interno del servidor. Inténtelo más tarde.")
    finally:
        if conn and conn.is_connected(): conn.close()

#Inicio de sesión
@router.post("/login")
def login(datos: UsuarioLogin, response: Response):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM Usuario WHERE email = %s", (datos.email,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        if not bcrypt.checkpw(datos.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        payload = {
            "sub": user["email"], 
            "nombre": user["nombre"], 
            "idUsuario": user["idUsuario"]
        }
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)

        IS_SECURE = False #CAMBIAR A TRUE EN PRODUCCIÓN

        response.set_cookie(
            key="access_token", 
            value=access_token,
            httponly=True, 
            secure=IS_SECURE, 
            samesite="Lax", 
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        response.set_cookie(
            key="refresh_token", 
            value=refresh_token,
            httponly=True, 
            secure=IS_SECURE,
            samesite="Lax", 
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )

        return {"mensaje": f"Bienvenido {user['nombre']}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected(): conn.close()


#Refrescar tokens
@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    refresh_token_cookie = request.cookies.get("refresh_token")
    
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Token de refresco no proporcionado")
    
    try:
        payload = jwt.decode(refresh_token_cookie, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")

        new_payload = {
            "sub": payload["sub"],
            "nombre": payload.get("nombre"),
            "idUsuario": payload.get("idUsuario")
        }
        access_token = create_access_token(new_payload)

        IS_SECURE = False #CAMBIAR A TRUE EN PRODUCCIÓN

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=IS_SECURE,
            samesite="Lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        return {"mensaje": "Token de acceso refrescado correctamente"}
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token de refresco inválido o expirado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Comprobar sesión
@router.get("/me")
def me(response: Response, usuario_actual: dict = Depends(obtener_usuario_actual)):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    return {
        "usuario": usuario_actual["nombre"], 
        "email": usuario_actual["sub"],
        "idUsuario": usuario_actual["idUsuario"]
    }

#Cerrar sesión
@router.post("/logout")
def logout(response: Response):
    IS_SECURE = False #CAMBIAR A TRUE EN PRODUCCIÓN

    response.delete_cookie(
        key="access_token", 
        httponly=True, 
        secure=IS_SECURE, 
        samesite="Lax"
    )
    response.delete_cookie(
        key="refresh_token", 
        httponly=True, 
        secure=IS_SECURE, 
        samesite="Lax"
    )
    
    response.status_code = status.HTTP_200_OK
    return {"mensaje": "Sesión cerrada correctamente"}