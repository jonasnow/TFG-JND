from pydantic import BaseModel

#Clase Usuario
class Usuario(BaseModel):
    nombre: str
    apellidos: str
    localidad: str | None = None
    email: str
    password: str
    telefono: str | None = None