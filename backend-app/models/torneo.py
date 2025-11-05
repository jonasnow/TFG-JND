from pydantic import BaseModel
from datetime import datetime

#Clase Torneo
class Torneo(BaseModel):
    nombre: str
    descripcion: str
    precioInscripcion: float
    numeroRondas: int
    duracionRondas: int
    fechaHoraInicio: datetime
    lugarCelebracion: str
    plazasMax: int
    idOrganizador: int
    idFormatoTorneo: int
    idJuego: int
    idFormatoJuego: int
    idLiga: int | None = None  #Un torneo puede no pertenecer a una liga
    premios: str
    estado: str = "PLANIFICADO"