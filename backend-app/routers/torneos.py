from fastapi import APIRouter
import mysql.connector

from core.database import get_connection
from models.torneo import Torneo

router = APIRouter(tags=["Torneos"])

#Listar torneos vigentes

@router.get("/torneos_vigentes")
def listar_torneos_vigentes():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT idTorneo, nombre, descripcion, lugarCelebracion, fechaHoraInicio
            FROM Torneo
            WHERE fechaHoraInicio > NOW()
            ORDER BY fechaHoraInicio ASC;
        """)
        torneos = cursor.fetchall()
        return torneos
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Ver más información de un torneo

@router.get("/torneo/{id_torneo}")
def obtener_torneo(id_torneo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.*, 
                   COALESCE(l.nombre, 'Ninguna') AS nombreLiga
            FROM Torneo t
            LEFT JOIN Liga l ON t.idLiga = l.idLiga
            WHERE t.idTorneo = %s;
        """, (id_torneo,))
        torneo = cursor.fetchone()
        if torneo:
            return torneo
        else:
            return {"error": "Torneo no encontrado"}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Inscribir usuario en torneo
@router.post("/inscribir_usuario")
def inscribir_usuario(datos: dict):
    email = datos.get("email")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT equipo.idEquipo FROM Equipo equipo JOIN Usuario usuario ON equipo.nombre = CONCAT(usuario.nombre, ' ', usuario.apellidos) WHERE usuario.email = %s;", (email,))
        equipo = cursor.fetchone()
        if not equipo:
            return {"error": "Usuario no encontrado"}
        #Como el par idEquipo, idTorneo son clave primaria compuesta, si ya existe la inscripción saltará excepción
        cursor.execute("INSERT INTO Equipo_Torneo (idEquipo, idTorneo) VALUES (%s, %s);", (equipo['idEquipo'], id_torneo))
        #añadir timestamp de inscripción que sea la fecha de inscripción
        conn.commit()
        
        return {"mensaje": "Inscrito correctamente en el torneo."}
    
    except mysql.connector.IntegrityError:
        return {"error": "El usuario ya estaba inscrito en este torneo."}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Ver torneos en los que está inscrito un usuario
@router.get("/torneos_usuario/{email}")
def torneos_usuario(email: str):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT 
            t.idTorneo AS idTorneo,
            t.nombre AS Nombre,
            j.nombre AS Juego,
            fj.nombre AS FormatoJuego,
            ft.nombre AS FormatoTorneo,
            t.descripcion AS Descripcion,
            t.precioInscripcion AS Precio,
            t.numeroRondas AS Rondas,
            t.duracionRondas AS DuracionRondas,
            t.fechaHoraInicio AS FechaHoraInicio,
            t.lugarCelebracion AS LugarCelebracion,
            t.plazasMax AS PlazasMax,
            t.estado AS Estado,
            t.premios AS Premios
            FROM Torneo t
            INNER JOIN FormatoTorneo ft ON t.idFormatoTorneo = ft.idFormatoTorneo
            INNER JOIN FormatoJuego fj ON t.idFormatoJuego = fj.idFormatoJuego
            INNER JOIN Juego j ON t.idJuego = j.idJuego
            INNER JOIN Equipo_Torneo et ON t.idTorneo = et.idTorneo
            INNER JOIN Equipo e ON et.idEquipo = e.idEquipo
            INNER JOIN Usuario_Equipo ue ON e.idEquipo = ue.idEquipo
            INNER JOIN Usuario u ON ue.idUsuario = u.idUsuario
            WHERE t.estado <> 'FINALIZADO'
              AND t.fechaHoraInicio > NOW()
              AND u.email = %s
            ORDER BY t.fechaHoraInicio ASC;""", (email,))
        torneos = cursor.fetchall()
        return torneos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Crear torneo
@router.post("/torneo")
def crear_torneo(torneo: Torneo):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Torneo 
            (nombre, descripcion, precioInscripcion, numeroRondas, duracionRondas, fechaHoraInicio, 
             lugarCelebracion, plazasMax, idOrganizador, idFormatoTorneo, idJuego, idFormatoJuego, idLiga, premios, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            torneo.nombre, torneo.descripcion, torneo.precioInscripcion, torneo.numeroRondas,
            torneo.duracionRondas, torneo.fechaHoraInicio, torneo.lugarCelebracion, torneo.plazasMax, torneo.idOrganizador,
            torneo.idFormatoTorneo, torneo.idJuego, torneo.idFormatoJuego, torneo.idLiga,
            torneo.premios, torneo.estado
        ))
        conn.commit()
        return {"mensaje": f"Torneo '{torneo.nombre}' creado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Eliminar miembro de un torneo
@router.delete("/eliminar_equipo_torneo/{id_torneo}/{id_equipo}")
def eliminar_equipo_torneo(id_torneo: int, id_equipo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Equipo_Torneo 
            WHERE idTorneo = %s AND idEquipo = %s;
        """, (id_torneo, id_equipo))
        existe = cursor.fetchone()
        #Si no existe el registro, no se puede eliminar
        if existe == 0:
            return {"eliminado": False, "motivo": "No estaba inscrito"}
        else:
        # Eliminar el registro del equipo en el torneo
            cursor.execute("""
                DELETE FROM Equipo_Torneo
                WHERE idTorneo = %s AND idEquipo = %s;
            """, (id_torneo, id_equipo))
            conn.commit()

        return {"eliminado": True, "mensaje": "Eliminado correctamente"}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Comprobar si todos los usuarios de un torneo están inscritos
@router.get("/comprobar_inscripciones/{id_torneo}")
def comprobar_inscripciones(id_torneo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM Equipo_Torneo
            WHERE idTorneo = %s;
        """, (id_torneo,))
        total = cursor.fetchone()['total']

        if total == 0:
            return {"todas_confirmadas": False, "motivo": "No hay inscripciones"}

        cursor.execute("""
            SELECT COUNT(*) AS confirmados
            FROM Equipo_Torneo
            WHERE idTorneo = %s
              AND confirmacionAsistencia = 'CONFIRMADA'
              AND confirmacionInscripcion = 'CONFIRMADA';
        """, (id_torneo,))
        confirmados = cursor.fetchone()['confirmados']

        # Comprobar si todos están confirmados
        if confirmados == total:
            return {"todas_confirmadas": True}
        else:
            return {
                "todas_confirmadas": False,
                "confirmados": confirmados,
                "total": total
            }

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


#Generar ronda suizo
