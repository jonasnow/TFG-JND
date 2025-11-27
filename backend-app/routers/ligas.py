from fastapi import APIRouter
import mysql.connector

from core.database import get_connection

router = APIRouter(tags=["Ligas"])

#Listar ligas vigentes
@router.get("/ligas_vigentes")
def listar_ligas_vigentes():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT idLiga, nombre
            FROM Liga
            WHERE fechaFin > NOW()
            ORDER BY nombre ASC;
        """)
        ligas = cursor.fetchall()
        return ligas
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Listar ligas vigentes que tienen hueco para más torneos
@router.get("/ligas_disponibles")
def listar_ligas_disponibles():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT
                       L.idLiga, L.nombre, L.numeroTorneos, COUNT(T.idTorneo) AS torneos_asociados FROM Liga L
                       LEFT JOIN Torneo T ON L.idLiga = T.idLiga
                       WHERE
                       L.fechaFin > NOW()
                       GROUP BY
                       L.idLiga, L.nombre, L.numeroTorneos
                       HAVING COUNT(T.idTorneo) <> L.numeroTorneos
                       ORDER BY
                       L.nombre ASC; """)
        ligas = cursor.fetchall()
        return ligas
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
#Listar torneos asociados a una liga
@router.get("/torneos_liga/{id_liga}")
def listar_torneos_liga(id_liga: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT T.idTorneo, T.nombre
            FROM Torneo T
            WHERE T.idLiga = %s
            ORDER BY T.nombre ASC;
        """, (id_liga,))
        torneos = cursor.fetchall()
        return torneos
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()