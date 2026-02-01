from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, timezone

class Torneo(BaseModel):
    idOrganizador: int
    idLiga: Optional[int] = None
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = Field("", max_length=2000)
    precioInscripcion: float = Field(default=0.0, ge=0)
    numeroRondas: int = Field(..., gt=0)
    duracionRondas: int = Field(default=120, gt=0)
    fechaHoraInicio: datetime 
    lugarCelebracion: str = Field(..., min_length=1, max_length=150)
    plazasMax: Optional[int] = Field(None, gt=1)
    estado: str = "PLANIFICADO"
    premios: Optional[str] = Field("Sin premios especificados", max_length=2000)
    idFormatoTorneo: int
    idJuego: int
    idFormatoJuego: int

    #Validator para fechaHoraInicio, no crear torneos con fecha pasada
    @validator('fechaHoraInicio')
    def validar_fecha_futura(cls, v):

        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        
        #UTC estricto
        ahora_utc = datetime.now(timezone.utc)

        #Error:fecha enviada anterior a ahora en UTC
        if v < ahora_utc:
            raise ValueError('La fecha de inicio no puede estar en el pasado.')
        return v

    #Validator de cadenas vacías a None
    @validator('*', pre=True)
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v

    @validator('estado')
    def validar_estado(cls, v):
        if v not in ['PLANIFICADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO']:
            raise ValueError('Estado incorrecto')
        return v