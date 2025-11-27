from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
import bcrypt
from jose import jwt

from core.security import create_access_token, create_refresh_token
from core.database import get_connection
from core.config import settings

router = APIRouter(tags=["Autenticación"])

#Clase inicio de sesión

class LoginData(BaseModel):
    email: str
    password: str

#Inicio de sesión
@router.post("/login")
def login(datos: LoginData, response: Response):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Usuario WHERE email = %s", (datos.email,))
        user = cursor.fetchone()

        if not user:
            return {"error": "Usuario no encontrado"}

        if not bcrypt.checkpw(datos.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            return {"error": "Contraseña incorrecta"}

        payload = {"sub": user["email"], "nombre": user["nombre"], "idUsuario": user["idUsuario"]}
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)

        response.set_cookie(
            key="access_token", value=access_token,
            httponly=True, secure=True, # En producción, esto debería ser True
            samesite="Lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        response.set_cookie(
            key="refresh_token", value=refresh_token,
            httponly=True, secure=False,
            samesite="Lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )

        return {"mensaje": f"Bienvenido {user['nombre']}"}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


#Refrescar tokens
@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        return {"error": "Token de refresco no proporcionado"}
    try:
        payload = jwt.decode(refresh_token_cookie, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return {"error": "Token de refresco inválido"}

        access_token = create_access_token({
            "sub": payload["sub"],
            "nombre": payload["nombre"],
            "idUsuario": payload["idUsuario"]
        })

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        return {"mensaje": "Token de acceso refrescado correctamente"}
    except Exception as e:
        return {"error": f"Token de refresco inválido o expirado: {str(e)}"}


#Comprobar sesión

@router.get("/me")
def me(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return {"error": "No autenticado"}

    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return {"usuario": payload["nombre"], "email": payload["sub"], "idUsuario": payload["idUsuario"]}
    except Exception:
        return {"error": "Token inválido o expirado"}

#Logout
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"mensaje": "Sesión cerrada"}
