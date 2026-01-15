from fastapi import APIRouter
import mysql.connector

from core.database import get_connection

router = APIRouter(tags=["Perfil"])

#Ver torneos organizados por un usuario
@router.get("/torneos_organizador/{idUsuario}")
def torneos_organizador(idUsuario: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT 
            t.idTorneo AS idTorneo,
            t.nombre AS Nombre,
            j.nombre AS Juego,
            j.logo AS logoJuego,
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
            WHERE t.idOrganizador = %s
            ORDER BY t.fechaHoraInicio ASC;""", (idUsuario,))
        torneos = cursor.fetchall()
        return torneos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Ver torneos en los que está inscrito un usuario
@router.get("/torneos_usuario/{idUsuario}")
def torneos_usuario(idUsuario: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT 
            t.idTorneo AS idTorneo,
            t.nombre AS Nombre,
            j.nombre AS Juego,
            j.logo AS logoJuego,
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
              AND u.idUsuario = %s
            ORDER BY t.fechaHoraInicio ASC;""", (idUsuario,))
        torneos = cursor.fetchall()
        return torneos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Ver datos personales de un usuario
@router.get("/datos_usuario/{idUsuario}")
def datos_usuario(idUsuario: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT 
            nombre,
            apellidos,
            email,
            localidad,
            telefono,
            fechaRegistro
            FROM Usuario
            WHERE idUsuario = %s;""", (idUsuario,))
        usuario = cursor.fetchone()
        return usuario
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Ver historial del usuario (torneos finalizados)
@router.get("/historial_usuario/{idUsuario}")
def historial_usuario(idUsuario: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                t.idTorneo AS idTorneo,
                t.nombre AS nombreTorneo,
                t.fechaHoraInicio AS fechaHoraInicio,
                t.lugarCelebracion AS lugarCelebracion,

                j.nombre AS juego,
                fj.nombre AS formatoJuego,
                ft.nombre AS formatoTorneo,

                et.posicion AS posicionFinal,
                et.puntosAcumulados AS puntos,
                et.fechaInscripcion AS fechaInscripcion

            FROM Torneo t
            INNER JOIN FormatoTorneo ft 
                ON t.idFormatoTorneo = ft.idFormatoTorneo
            INNER JOIN FormatoJuego fj 
                ON t.idFormatoJuego = fj.idFormatoJuego
            INNER JOIN Juego j 
                ON t.idJuego = j.idJuego

            INNER JOIN Equipo_Torneo et 
                ON t.idTorneo = et.idTorneo
            INNER JOIN Equipo e 
                ON et.idEquipo = e.idEquipo
            INNER JOIN Usuario_Equipo ue 
                ON e.idEquipo = ue.idEquipo
            INNER JOIN Usuario u 
                ON ue.idUsuario = u.idUsuario

            WHERE t.estado = 'FINALIZADO'
              AND u.idUsuario = %s

            ORDER BY t.fechaHoraInicio DESC;
        """, (idUsuario,))

        historial = cursor.fetchall()
        return historial

    except Exception as e:
        return {"error": str(e)}

    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
