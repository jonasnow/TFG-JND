from pydantic import BaseModel
from typing import Optional

#Clase Torneo
class Torneo(BaseModel):

    idOrganizador: int = None
    idLiga: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precioInscripcion: Optional[str] = "0.0"
    numeroRondas: Optional[str] = None
    duracionRondas: Optional[str] = "120"
    fechaHoraInicio: Optional[str] = None
    lugarCelebracion: Optional[str] = None
    plazasMax: Optional[str] = None
    estado: str = "PLANIFICADO"
    premios: Optional[str] = "Sin premios especificados"
    idFormatoTorneo: Optional[str] = None
    idJuego: Optional[str] = None
    idFormatoJuego: Optional[str] = None