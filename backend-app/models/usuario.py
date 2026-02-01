from pydantic import BaseModel, EmailStr, Field

#Clase Usuario para registro
class UsuarioRegistro(BaseModel):
    nombre: str = Field(..., max_length=100)      #varchar(100)
    apellidos: str = Field(..., max_length=150)   #varchar(150)
    localidad: str | None = Field(None, max_length=100) #varchar(100)
    email: EmailStr = Field(..., max_length=150)  #varchar(150)
    password: str = Field(..., min_length=6, max_length=70)      #Negocio: Mínimo 6 caracteres
    telefono: str = Field(..., min_length=9, max_length=20, pattern=r"^\d+$") #varchar(20)

#Clase para Login
class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

#Clase Usuario para edición
class UsuarioEditar(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellidos: str = Field(..., min_length=1, max_length=150)
    email: EmailStr = Field(..., max_length=150) 
    localidad: str | None = Field(None, max_length=100)
    telefono: str = Field(..., min_length=9, max_length=20, pattern=r"^\d+$")

#Clase para cambio de contraseña
class PasswordChange(BaseModel):
    passwordActual: str
    nuevaPassword: str = Field(..., min_length=6, max_length=70)

#Clase para inscripción a torneo
class UsuarioInscripcion(BaseModel):
    idTorneo: int
    email: str | None = None