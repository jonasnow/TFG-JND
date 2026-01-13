from pydantic import BaseModel
from typing import Optional

class JugadorRonda(BaseModel):
    idEquipo: int
    nombre: str

class MesaRonda(BaseModel):
    idEnfrentamiento: int
    mesa: str
    resultado: Optional[str]
    jugadores: list[JugadorRonda]

class RondaActual(BaseModel):
    idTorneo: int
    nombre: str
    numeroRonda: int
    mesas: list[MesaRonda]
