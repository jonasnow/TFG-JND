from pydantic import BaseModel, EmailStr, Field

#Clase Usuario para registro
class UsuarioRegistro(BaseModel):
    nombre: str
    apellidos: str
    localidad: str | None = None
    email: EmailStr
    password: str = Field(..., min_length=6)
    telefono: str | None = None

#Clase para Login
class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

#Clase Usuario para edición
class UsuarioEditar(BaseModel):
    nombre: str
    apellidos: str
    email: EmailStr
    localidad: str | None = None
    telefono: str | None = None

#Clase para cambio de contraseña
class PasswordChange(BaseModel):
    passwordActual: str
    nuevaPassword: str = Field(..., min_length=6)

#Clase para inscripción a torneo
class UsuarioInscripcion(BaseModel):
    idTorneo: int
    email: str | None = None