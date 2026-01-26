from fastapi import APIRouter, HTTPException

from core.database import get_connection
from models.torneo import Torneo
from models.filtroTorneos import FiltroTorneos

router = APIRouter(tags=["Torneos"])

#Listar torneos vigentes

@router.get("/torneos_vigentes")
def listar_torneos_vigentes():
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
            WHERE t.fechaHoraInicio > NOW()
            ORDER BY t.fechaHoraInicio ASC;
        """)
        torneos = cursor.fetchall()
        return torneos
    finally:
        if 'conn' in locals() and conn.is_connected():
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
            WHERE t.fechaHoraInicio > NOW()
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
                      AND et.confirmacionAsistencia = 'CONFIRMADA'
                ) AS asistenciasConfirmadas,
                              
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
        if conn.is_connected():
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



#Ver si un usuario está inscrito en un torneo
@router.get("/usuario_inscrito/{idUsuario}/{idTorneo}")
def usuario_inscrito(idUsuario: int, idTorneo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT et.confirmacionInscripcion, et.confirmacionAsistencia
                       FROM Equipo_Torneo et
                       INNER JOIN Equipo e ON et.idEquipo = e.idEquipo
                       INNER JOIN Usuario_Equipo ue ON e.idEquipo = ue.idEquipo
                       WHERE ue.idUsuario = %s AND et.idTorneo = %s;
                       """, (idUsuario, idTorneo))
        result = cursor.fetchone()
        if result:
            return {
                "confirmacionInscripcion": result["confirmacionInscripcion"],
                "confirmacionAsistencia": result["confirmacionAsistencia"]
            }
        else:
            return {
                "confirmacionInscripcion": None,
                "confirmacionAsistencia": None
            }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Crear torneo
@router.post("/torneo", status_code=201) # 201 Created
def crear_torneo(torneo: Torneo): # FastAPI ya ha validado tipos y rangos aquí
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Validaciones de lógica de negocio (BD)
        cursor.execute("SELECT numMaxJugadores FROM FormatoJuego WHERE idFormatoJuego = %s", (torneo.idFormatoJuego,))
        resultado = cursor.fetchone()
        
        if not resultado:
            # Retornar error 400 o 422 en lugar de un JSON con 200 OK
            raise HTTPException(status_code=400, detail="Formato de juego inválido")
            
        num_max_jugadores = resultado[0]

        # Validación Round Robin
        if torneo.idFormatoTorneo == 3 and num_max_jugadores > 2:
            raise HTTPException(status_code=400, detail="El formato Round Robin solo es válido para juegos de 2 jugadores")

        # Autocorrección plazas
        plazas_finales = torneo.plazasMax
        if plazas_finales is None:
            plazas_finales = num_max_jugadores

        # 2. Insertar
        query = """
            INSERT INTO Torneo 
            (nombre, descripcion, precioInscripcion, numeroRondas, duracionRondas, fechaHoraInicio, 
             lugarCelebracion, plazasMax, idOrganizador, idFormatoTorneo, idJuego, idFormatoJuego, idLiga, premios, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            torneo.nombre, torneo.descripcion, torneo.precioInscripcion, torneo.numeroRondas,
            torneo.duracionRondas, torneo.fechaHoraInicio, torneo.lugarCelebracion, plazas_finales,
            torneo.idOrganizador, torneo.idFormatoTorneo, torneo.idJuego, torneo.idFormatoJuego,
            torneo.idLiga, torneo.premios, torneo.estado
        )
        print(torneo)
        cursor.execute(query, values)
        conn.commit()
        
        return {"mensaje": f"Torneo '{torneo.nombre}' creado correctamente", "id": cursor.lastrowid}

    except HTTPException as he:
        raise he # Re-lanzar excepciones HTTP controladas
    except Exception as e:
        conn.rollback()
        print(f"Error DB: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor al crear torneo")
    finally:
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

#Devolver formatos de torneo
@router.get("/formatos_torneo")
def formatos_torneo():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idFormatoTorneo, nombre FROM FormatoTorneo;")
        formatos = cursor.fetchall()
        return formatos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
#Devolver juegos disponibles
@router.get("/juegos")
def juegos():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT idJuego, nombre FROM Juego;")
        juegos = cursor.fetchall()
        return juegos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Devolver formatos de juego
@router.get("/formatos_juego/{id_juego}")
def formatos_juego(id_juego: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT idFormatoJuego, nombre FROM FormatoJuego WHERE idJuego = %s;""", (id_juego,))
        formatos = cursor.fetchall()
        return formatos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Devolver el número de inscritos en un torneo
@router.get("/numero_inscritos/{id_torneo}")
def numero_inscritos(id_torneo: int):
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
        if 'conn' in locals() and conn.is_connected():
            conn.close()
            
#Devolver inscritos en un torneo
@router.get("/inscritos_torneo/{id_torneo}")
def inscritos_torneo(id_torneo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                e.idEquipo,
                e.nombre AS nombreEquipo,
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
        return inscritos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Confirmar inscripción de un equipo en un torneo
@router.post("/confirmar_inscripcion")
def confirmar_inscripcion(datos: dict):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionInscripcion = 'CONFIRMADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()

        return {"mensaje": "Inscripción confirmada correctamente."}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Confirmar asistencia de un equipo en un torneo
@router.post("/confirmar_asistencia")
def confirmar_asistencia(datos: dict):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionAsistencia = 'CONFIRMADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()

        return {"mensaje": "Asistencia confirmada correctamente."}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Rechazar inscripción de un equipo en un torneo
@router.post("/rechazar_inscripcion")
def rechazar_inscripcion(datos: dict):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionInscripcion = 'RECHAZADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()

        return {"mensaje": "Inscripción rechazada correctamente."}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Rechazar asistencia de un equipo en un torneo
@router.post("/rechazar_asistencia")
def rechazar_asistencia(datos: dict):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionAsistencia = 'RECHAZADA'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()

        return {"mensaje": "Asistencia rechazada correctamente."}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

#Aceptar inscripción de un equipo en un torneo
@router.post("/aceptar_inscripcion")
def aceptar_inscripcion(datos: dict):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Equipo_Torneo
            SET 
                confirmacionInscripcion = 'CONFIRMADA',
                confirmacionAsistencia = 'PENDIENTE'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()
        return {"mensaje": "Inscripción aceptada de nuevo"}
    finally:
        if conn.is_connected():
            conn.close()


#Deshacer confirmación de asistencia de un equipo en un torneo
@router.post("/deshacer_asistencia")
def deshacer_asistencia(datos: dict):
    id_equipo = datos.get("idEquipo")
    id_torneo = datos.get("idTorneo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Equipo_Torneo
            SET confirmacionAsistencia = 'PENDIENTE'
            WHERE idEquipo = %s AND idTorneo = %s;
        """, (id_equipo, id_torneo))
        conn.commit()

        return {"mensaje": "Asistencia devuelta a pendiente."}

    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn.is_connected():
            conn.close()

