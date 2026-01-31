from fastapi import APIRouter
from core.database import get_connection

router = APIRouter(tags=["Ligas"])
#Listar ligas vigentes
@router.get("/ligas_vigentes")
def listar_ligas_vigentes():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT idLiga, nombre
            FROM Liga
            WHERE fechaFin > NOW()
            ORDER BY nombre ASC;
        """)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected():
            conn.close()

#Endpoints pendientes de uso

#Listar ligas vigentes con hueco
@router.get("/ligas_disponibles")
def listar_ligas_disponibles():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                L.idLiga, L.nombre, L.numeroTorneos, COUNT(T.idTorneo) AS torneos_asociados
            FROM Liga L
            LEFT JOIN Torneo T ON L.idLiga = T.idLiga
            WHERE L.fechaFin > NOW()
            GROUP BY L.idLiga, L.nombre, L.numeroTorneos
            HAVING COUNT(T.idTorneo) < L.numeroTorneos 
            ORDER BY L.nombre ASC; 
        """)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected():
            conn.close()

#Listar torneos de una liga
@router.get("/torneos_liga/{id_liga}")
def listar_torneos_liga(id_liga: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT T.idTorneo, T.nombre
            FROM Torneo T
            WHERE T.idLiga = %s
            ORDER BY T.nombre ASC;
        """, (id_liga,))
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected():
            conn.close()