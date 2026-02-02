from fastapi import APIRouter, HTTPException, Depends
import mysql.connector

from core.database import get_connection
from core.security import obtener_usuario_actual, obtener_usuario_actual_no_excepciones

from models.torneo import Torneo
from models.usuario import UsuarioInscripcion
from models.filtroTorneos import FiltroTorneos

router = APIRouter(tags=["Torneos"])

#Listar torneos vigentes
@router.get("/torneos_vigentes")
def listar_torneos_vigentes():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                t.idTorneo,
                t.idOrganizador,
                t.idLiga,
                t.nombre,
                t.descripcion,
                t.precioInscripcion,
                t.numeroRondas,
                t.duracionRondas,
                t.fechaHoraInicio,
                t.lugarCelebracion,
                t.plazasMax,
                t.estado,
                t.premios,
                t.idFormatoTorneo,
                t.idJuego,
                t.idFormatoJuego,
                t.fechaCreacion,
                COALESCE(l.nombre, 'Ninguna') AS nombreLiga,
                j.nombre AS nombreJuego,
                j.logo AS logoJuego,
                ft.nombre AS nombreFormatoTorneo,
                fj.nombre AS nombreFormatoJuego
            FROM Torneo t
            LEFT JOIN Liga l ON t.idLiga = l.idLiga
            LEFT JOIN Juego j ON t.idJuego = j.idJuego
            LEFT JOIN FormatoTorneo ft ON t.idFormatoTorneo = ft.idFormatoTorneo
            LEFT JOIN FormatoJuego fj ON t.idFormatoJuego = fj.idFormatoJuego
            ORDER BY t.fechaHoraInicio ASC;
        """)
        torneos = cursor.fetchall()
        return torneos
    finally:
        if conn and conn.is_connected():
            conn.close()

#Ver torneos vigentes con un filtro de búsqueda
@router.post("/torneos_vigentes_filtrados")
def listar_torneos_filtrados(filtros: FiltroTorneos):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                t.idTorneo,
                t.idOrganizador,
                t.idLiga,
                t.nombre,
                t.descripcion,
                t.precioInscripcion,
                t.numeroRondas,
                t.duracionRondas,
                t.fechaHoraInicio,
                t.lugarCelebracion,
                t.plazasMax,
                t.estado,
                t.premios,
                t.idFormatoTorneo,
                t.idJuego,
                t.idFormatoJuego,
                t.fechaCreacion,
                COALESCE(l.nombre, 'Ninguna') AS nombreLiga,
                j.nombre AS nombreJuego,
                j.logo AS logoJuego,
                ft.nombre AS nombreFormatoTorneo,
                fj.nombre AS nombreFormatoJuego
            FROM Torneo t
            LEFT JOIN Liga l ON t.idLiga = l.idLiga
            LEFT JOIN Juego j ON t.idJuego = j.idJuego
            LEFT JOIN FormatoTorneo ft ON t.idFormatoTorneo = ft.idFormatoTorneo
            LEFT JOIN FormatoJuego fj ON t.idFormatoJuego = fj.idFormatoJuego
            WHERE t.fechaHoraInicio > UTC_TIMESTAMP()
        """

        params = []

        if filtros.precio_min is not None:
            query += " AND t.precioInscripcion >= %s"
            params.append(filtros.precio_min)

        if filtros.precio_max is not None:
            query += " AND t.precioInscripcion <= %s"
            params.append(filtros.precio_max)

        if filtros.fecha_inicio is not None:
            query += " AND t.fechaHoraInicio >= %s"
            params.append(filtros.fecha_inicio)

        if filtros.fecha_fin is not None:
            query += " AND t.fechaHoraInicio <= %s"
            params.append(filtros.fecha_fin)

        if filtros.lugar is not None:
            query += " AND t.lugarCelebracion LIKE %s"
            params.append(f"%{filtros.lugar}%")

        if filtros.juego is not None:
            query += " AND j.nombre = %s"
            params.append(filtros.juego)

        query += " ORDER BY t.fechaHoraInicio ASC;"

        cursor.execute(query, params)
        torneos = cursor.fetchall()
        return torneos

    finally:
        if "conn" in locals() and conn.is_connected():
            conn.close()

#Ver más información de un torneo

@router.get("/torneo/{id_torneo}")
def obtener_torneo(id_torneo: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                t.idTorneo,
                t.idOrganizador,
                t.idLiga,
                t.nombre,
                t.descripcion,
                t.precioInscripcion,
                t.numeroRondas,
                t.duracionRondas,
                t.fechaHoraInicio,
                t.lugarCelebracion,
                t.plazasMax,
                t.estado,
                t.premios,
                t.idFormatoTorneo,
                t.idJuego,
                t.idFormatoJuego,
                t.fechaCreacion,

                CONCAT(u.nombre, ' ', u.apellidos) AS nombreOrganizador,

                (
                    SELECT COUNT(*)
                    FROM Equipo_Torneo et
                    WHERE et.idTorneo = t.idTorneo
                      AND et.confirmacionInscripcion IN ('PENDIENTE', 'CONFIRMADA')
                ) AS inscripciones,
                              
                COALESCE(l.nombre, 'Ninguna') AS nombreLiga,
                j.nombre AS nombreJuego,
                ft.nombre AS nombreFormatoTorneo,
                fj.nombre AS nombreFormatoJuego
            FROM Torneo t
            LEFT JOIN Usuario u ON t.idOrganizador = u.idUsuario
            LEFT JOIN Liga l ON t.idLiga = l.idLiga
            LEFT JOIN Juego j ON t.idJuego = j.idJuego
            LEFT JOIN FormatoTorneo ft ON t.idFormatoTorneo = ft.idFormatoTorneo
            LEFT JOIN FormatoJuego fj ON t.idFormatoJuego = fj.idFormatoJuego
            WHERE t.idTorneo = %s;
        """, (id_torneo,))

        torneo = cursor.fetchone()
        return torneo if torneo else {"error": "Torneo no encontrado"}
    finally:
        if conn and conn.is_connected():
            conn.close()


#Inscribir usuario en torneo
@router.post("/inscribir_usuario")
def inscribir_usuario(datos: UsuarioInscripcion, usuario_actual: dict = Depends(obtener_usuario_actual)):
    id_torneo = datos.idTorneo
    id_usuario = usuario_actual["idUsuario"] #Tomar datos de la cookie de sesión

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        #Comprobar que el torneo está en estado PLANIFICADO
        cursor.execute("SELECT estado FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        info_torneo = cursor.fetchone()
        
        if not info_torneo:
            raise HTTPException(status_code=404, detail="Torneo no encontrado")
            
        if info_torneo["estado"] != "PLANIFICADO":
            raise HTTPException(status_code=400, detail="El torneo ya no admite inscripciones (ya comenzó o finalizó).")
        
        #Buscar el equipo individual del usuario
        cursor.execute("""
            SELECT idEquipo 
            FROM Usuario_Equipo 
            WHERE idUsuario = %s
            LIMIT 1; 
        """, (id_usuario,))
        
        equipo = cursor.fetchone()
        
        if not equipo: #Fallo de jugador sin equipo, por si acaso
            raise HTTPException(status_code=400, detail="No se encontró un perfil de jugador asociado a este usuario.")

        #Inscripción
        cursor.execute("""
            INSERT INTO Equipo_Torneo (idEquipo, idTorneo, confirmacionInscripcion, confirmacionAsistencia) 
            VALUES (%s, %s, 'PENDIENTE', 'PENDIENTE');
        """, (equipo['idEquipo'], id_torneo))
        
        conn.commit()
        
        return {"mensaje": "Solicitud de inscripción enviada correctamente."}
    
    except mysql.connector.IntegrityError as e:
        #Ya está inscrito
        if e.errno == 1062:
            raise HTTPException(status_code=409, detail="Ya tienes una solicitud activa para este torneo.")
        #El torneo no existe
        if e.errno == 1452:
            raise HTTPException(status_code=404, detail="El torneo indicado no existe.")
        
        print(f"Error SQL: {e}")
        raise HTTPException(status_code=500, detail="Error de base de datos al procesar la inscripción.")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error general: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")
    finally:
        if conn and conn.is_connected():
            conn.close()


#Ver si el usuario que realiza la petición está inscrito en un torneo
@router.get("/estoy_inscrito/{idTorneo}") 
def verificar_inscripcion(idTorneo: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        idUsuario = usuario_actual["idUsuario"]

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT et.confirmacionInscripcion, et.confirmacionAsistencia
            FROM Equipo_Torneo et
            INNER JOIN Equipo e ON et.idEquipo = e.idEquipo
            INNER JOIN Usuario_Equipo ue ON e.idEquipo = ue.idEquipo
            WHERE ue.idUsuario = %s AND et.idTorneo = %s;
        """, (idUsuario, idTorneo))
        
        result = cursor.fetchone()
        
        if result:
            return result
        else:
            return {
                "confirmacionInscripcion": None,
                "confirmacionAsistencia": None
            }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Crear torneo
@router.post("/torneo", status_code=201)
def crear_torneo(torneo: Torneo, usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = get_connection()
    try:
        #Validaciones previas
        if not torneo.nombre or not torneo.nombre.strip():
            raise HTTPException(status_code=400, detail="El nombre del torneo es obligatorio.")
        
        if not torneo.lugarCelebracion or not torneo.lugarCelebracion.strip():
            raise HTTPException(status_code=400, detail="El lugar de celebración es obligatorio.")

        if not torneo.fechaHoraInicio:
            raise HTTPException(status_code=400, detail="La fecha y hora de inicio son obligatorias.")

        if torneo.plazasMax is not None and torneo.plazasMax < 2:
            raise HTTPException(status_code=400, detail="El número de plazas debe ser al menos 2.")

        cursor = conn.cursor()
        
        cursor.execute("SELECT numMaxJugadores FROM FormatoJuego WHERE idFormatoJuego = %s", (torneo.idFormatoJuego,))
        resultado = cursor.fetchone()
        
        if not resultado:
            raise HTTPException(status_code=400, detail="Formato de juego inválido")
            
        num_max_jugadores = resultado[0]

        if torneo.idFormatoTorneo == 3 and num_max_jugadores > 2:
            raise HTTPException(status_code=400, detail="El formato Round Robin solo es válido para juegos de 1vs1 (max 2 jugadores).")

        plazas_finales = torneo.plazasMax
        if plazas_finales is None:
            plazas_finales = num_max_jugadores

        id_organizador = usuario_actual["idUsuario"]

        query = """
            INSERT INTO Torneo 
            (nombre, descripcion, precioInscripcion, numeroRondas, duracionRondas, fechaHoraInicio, 
             lugarCelebracion, plazasMax, idOrganizador, idFormatoTorneo, idJuego, idFormatoJuego, idLiga, premios, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            torneo.nombre.strip(),
            torneo.descripcion, 
            torneo.precioInscripcion, 
            torneo.numeroRondas,
            torneo.duracionRondas, 
            torneo.fechaHoraInicio, 
            torneo.lugarCelebracion.strip(),
            plazas_finales,
            id_organizador, 
            torneo.idFormatoTorneo, 
            torneo.idJuego, 
            torneo.idFormatoJuego,
            torneo.idLiga, 
            torneo.premios, 
            "PLANIFICADO"
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        return {"mensaje": f"Torneo '{torneo.nombre.strip()}' creado correctamente", "id": cursor.lastrowid}

    except HTTPException as he:
        raise he
    except mysql.connector.IntegrityError as e:
        if e.errno == 1452:
            raise HTTPException(status_code=400, detail="Un dato indicado (Juego, Formato, Liga) no existe en la base de datos.")
        print(f"Error Integridad DB: {e}")
        raise HTTPException(status_code=500, detail="Error al guardar el torneo. Verifica los datos.")
    except Exception as e:
        conn.rollback()
        print(f"Error General DB: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()

#Eliminar miembro de un torneo
@router.delete("/eliminar_equipo_torneo/{id_torneo}/{id_equipo}")
def eliminar_equipo_torneo(
    id_torneo: int, 
    id_equipo: int,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo = cursor.fetchone()

        if not torneo:
             raise HTTPException(status_code=404, detail="Torneo no encontrado")
        if not id_equipo:
             raise HTTPException(status_code=400, detail="ID de equipo no encontrado")
        if torneo["idOrganizador"] != usuario_actual["idUsuario"]:
             raise HTTPException(status_code=403, detail="Solo el organizador puede eliminar equipos")
        if torneo["estado"] == "EN_CURSO" or torneo["estado"] == "FINALIZADO":
             raise HTTPException(status_code=400, detail="No se pueden eliminar equipos de torneos en curso o finalizados")
        
        cursor.execute("DELETE FROM Equipo_Torneo WHERE idTorneo = %s AND idEquipo = %s;", (id_torneo, id_equipo))
        conn.commit()
        
        return {"eliminado": True, "mensaje": "Eliminado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Comprobar si todos los usuarios de un torneo están inscritos
@router.get("/comprobar_inscripciones/{id_torneo}")
def comprobar_inscripciones(id_torneo: int):
    conn = None
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
        if conn and conn.is_connected():
            conn.close()

#Devolver formatos de torneo
@router.get("/formatos_torneo")
def formatos_torneo():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idFormatoTorneo, nombre FROM FormatoTorneo;")
        formatos = cursor.fetchall()
        return formatos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Devolver juegos disponibles
@router.get("/juegos")
def juegos():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idJuego, nombre FROM Juego;")
        juegos = cursor.fetchall()
        return juegos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Devolver formatos de juego
@router.get("/formatos_juego/{id_juego}")
def formatos_juego(id_juego: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT idFormatoJuego, nombre FROM FormatoJuego WHERE idJuego = %s;""", (id_juego,))
        formatos = cursor.fetchall()
        return formatos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Devolver el número de inscritos en un torneo
@router.get("/numero_inscritos/{id_torneo}")
def numero_inscritos(id_torneo: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Equipo_Torneo 
            WHERE idTorneo = %s;
        """, (id_torneo,))
        numero = cursor.fetchone()[0]
        return {"numero_inscritos": numero}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()
            
#Devolver inscritos en un torneo
@router.get("/inscritos_torneo/{id_torneo}")
def inscritos_torneo(
    id_torneo: int, 
    usuario_actual: dict | None = Depends(obtener_usuario_actual_no_excepciones) 
):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo = cursor.fetchone()
        if not torneo:
            return {"error": "Torneo no encontrado"}

        es_organizador = False
        if usuario_actual and usuario_actual["idUsuario"] == torneo["idOrganizador"]:
            es_organizador = True
        #Si el nombre del equipo está vacío, se muestra el nombre del usuario que lo creó
        cursor.execute("""
            SELECT 
                e.idEquipo,
                COALESCE(NULLIF(e.nombre, ''), CONCAT(u.nombre, ' ', u.apellidos)) AS nombreEquipo,
                ue.idUsuario,
                u.nombre AS nombreUsuario,
                u.apellidos AS apellidosUsuario,
                u.email AS emailUsuario,
                et.confirmacionInscripcion,
                et.confirmacionAsistencia
            FROM Equipo_Torneo et
            INNER JOIN Equipo e ON et.idEquipo = e.idEquipo
            INNER JOIN Usuario_Equipo ue ON e.idEquipo = ue.idEquipo
            INNER JOIN Usuario u ON ue.idUsuario = u.idUsuario
            WHERE et.idTorneo = %s;
        """, (id_torneo,))
        
        inscritos = cursor.fetchall()
        
        if not es_organizador:
            for inscrito in inscritos:
                inscrito.pop("emailUsuario", None)
                
        return inscritos

    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Confirmar inscripción de un equipo en un torneo
@router.post("/confirmar_inscripcion")
def confirmar_inscripcion(datos: dict, usuario_actual: dict = Depends(obtener_usuario_actual)):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo = cursor.fetchone()
        
        if not torneo:
            raise HTTPException(status_code=404, detail="Torneo no encontrado")
            
        if torneo["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para gestionar este torneo")

        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionInscripcion = 'CONFIRMADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()

        return {"mensaje": "Inscripción confirmada correctamente."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected():
            conn.close()

#Confirmar asistencia de un equipo en un torneo
@router.post("/confirmar_asistencia")
def confirmar_asistencia(datos: dict, usuario_actual: dict = Depends(obtener_usuario_actual)):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo_db = cursor.fetchone()

        if not torneo_db:
            raise HTTPException(status_code=404, detail="El torneo no existe")

        if torneo_db["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para gestionar este torneo")

        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionAsistencia = 'CONFIRMADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        
        conn.commit()
        return {"mensaje": "Asistencia confirmada correctamente."}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()


#Rechazar inscripción de un equipo en un torneo
@router.post("/rechazar_inscripcion")
def rechazar_inscripcion(datos: dict, usuario_actual: dict = Depends(obtener_usuario_actual)):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo_db = cursor.fetchone()

        if not torneo_db:
            raise HTTPException(status_code=404, detail="El torneo no existe")

        if torneo_db["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para gestionar este torneo")

        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionInscripcion = 'RECHAZADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        
        conn.commit()
        return {"mensaje": "Inscripción rechazada correctamente."}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()


#Rechazar asistencia de un equipo en un torneo
@router.post("/rechazar_asistencia")
def rechazar_asistencia(
    datos: dict,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo_db = cursor.fetchone()

        if not torneo_db:
            raise HTTPException(status_code=404, detail="El torneo no existe")

        if torneo_db["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para gestionar este torneo")

        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionAsistencia = 'RECHAZADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        
        conn.commit()
        return {"mensaje": "Asistencia rechazada correctamente."}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()


#Aceptar inscripción de un equipo en un torneo (Reseteo)
@router.post("/aceptar_inscripcion")
def aceptar_inscripcion(
    datos: dict,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo_db = cursor.fetchone()

        if not torneo_db:
            raise HTTPException(status_code=404, detail="El torneo no existe")

        if torneo_db["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para gestionar este torneo")

        cursor.execute("""
            UPDATE Equipo_Torneo
            SET 
                confirmacionInscripcion = 'CONFIRMADA',
                confirmacionAsistencia = 'PENDIENTE'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        
        conn.commit()
        return {"mensaje": "Inscripción aceptada de nuevo"}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Deshacer confirmación de asistencia
@router.post("/deshacer_asistencia")
def deshacer_asistencia(datos: dict, usuario_actual: dict = Depends(obtener_usuario_actual)):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo_db = cursor.fetchone()

        if not torneo_db:
            raise HTTPException(status_code=404, detail="El torneo no existe")

        if torneo_db["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para gestionar este torneo")

        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionAsistencia = 'PENDIENTE'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        
        conn.commit()
        return {"mensaje": "Asistencia devuelta a pendiente."}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Editar datos de un torneo
@router.put("/editar_torneo/{id_torneo}")
def editar_torneo(id_torneo: int, torneo: Torneo, usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:

        #Validaciones previas
        if not torneo.nombre or not torneo.nombre.strip():
            raise HTTPException(status_code=400, detail="El nombre del torneo es obligatorio.")
        if not torneo.lugarCelebracion or not torneo.lugarCelebracion.strip():
            raise HTTPException(status_code=400, detail="El lugar de celebración es obligatorio.")
        if not torneo.fechaHoraInicio:
            raise HTTPException(status_code=400, detail="La fecha y hora de inicio son obligatorias.")
        if torneo.precioInscripcion is None or torneo.precioInscripcion < 0:
            raise HTTPException(status_code=400, detail="El precio de inscripción no es válido.")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT idOrganizador, estado FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo_db = cursor.fetchone()

        if not torneo_db:
            raise HTTPException(status_code=404, detail="El torneo no existe")

        if torneo_db["idOrganizador"] != usuario_actual["idUsuario"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para editar este torneo")

        if torneo_db["estado"] != "PLANIFICADO": #Para cancelar
            if torneo.estado != "CANCELADO":
                raise HTTPException(status_code=400, detail="No se puede editar un torneo iniciado o finalizado.")

        nuevo_estado = torneo_db["estado"] 
        if torneo.estado == "CANCELADO":
            nuevo_estado = "CANCELADO"
        elif torneo_db["estado"] == "PLANIFICADO":
            nuevo_estado = "PLANIFICADO"

        cursor.execute("SELECT numMaxJugadores FROM FormatoJuego WHERE idFormatoJuego = %s", (torneo.idFormatoJuego,))
        res_formato = cursor.fetchone()
        
        if not res_formato:
            raise HTTPException(status_code=400, detail="Formato de juego inválido")
            
        num_max_jugadores = res_formato["numMaxJugadores"]

        if torneo.idFormatoTorneo == 3 and num_max_jugadores > 2:
            raise HTTPException(status_code=400, detail="El formato Round Robin solo es válido para juegos de 1vs1 (max 2 jugadores).")

        plazas_finales = torneo.plazasMax
        if plazas_finales is None:
            plazas_finales = num_max_jugadores
        elif plazas_finales < 2:
             raise HTTPException(status_code=400, detail="El número de plazas debe ser al menos 2.")

        cursor.execute("""
            UPDATE Torneo
            SET nombre = %s, descripcion = %s, precioInscripcion = %s,
                numeroRondas = %s, duracionRondas = %s, fechaHoraInicio = %s,
                lugarCelebracion = %s, plazasMax = %s, idFormatoTorneo = %s,
                idJuego = %s, idFormatoJuego = %s, idLiga = %s,
                premios = %s, estado = %s
            WHERE idTorneo = %s;
        """, (
            torneo.nombre.strip(), 
            torneo.descripcion, 
            torneo.precioInscripcion,
            torneo.numeroRondas, 
            torneo.duracionRondas, 
            torneo.fechaHoraInicio,
            torneo.lugarCelebracion.strip(), 
            plazas_finales,
            torneo.idFormatoTorneo,
            torneo.idJuego, 
            torneo.idFormatoJuego, 
            torneo.idLiga,
            torneo.premios, 
            nuevo_estado, 
            id_torneo
        ))

        conn.commit()
        
        if nuevo_estado == "CANCELADO":
            return {"mensaje": "Torneo cancelado correctamente"}
            
        return {"mensaje": "Torneo actualizado correctamente"}

    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error editar torneo: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected():
            conn.close()