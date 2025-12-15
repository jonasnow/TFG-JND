from pydantic import BaseModel
from typing import Optional

#Clase Filtro Torneos

class FiltroTorneos(BaseModel):
    precio_min: Optional[float] = None
    precio_max: Optional[float] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    lugar: Optional[str] = None
    juego: Optional[str] = None