from pydantic import BaseModel
from typing import List, Optional, Any

# Clases salida
class JugadorRonda(BaseModel):
    idEquipo: int
    nombre: str
    puntos: Optional[int] = None

class MesaRonda(BaseModel):
    idEnfrentamiento: int
    mesa: str
    jugadores: List[JugadorRonda]
    marcador: Optional[Any] = None

class RondaActual(BaseModel):
    numeroRonda: int
    nombre: str
    rondaFinalizada: Optional[bool] = False
    mesas: List[MesaRonda]

#Clases entrada
class ResultadoJugador(BaseModel):
    idEquipo: int
    puntos: int

class ResultadoMesa(BaseModel):
    idEnfrentamiento: int
    resultados: List[ResultadoJugador]

class AccionRonda(BaseModel):
    idTorneo: int