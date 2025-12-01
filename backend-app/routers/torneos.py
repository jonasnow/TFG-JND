from fastapi import APIRouter
import mysql.connector

from datetime import datetime
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
@router.get("/torneos_usuario/{idUsuario}")
def torneos_usuario(idUsuario: int):
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
              AND u.idUsuario = %s
            ORDER BY t.fechaHoraInicio ASC;""", (idUsuario,))
        torneos = cursor.fetchall()
        return torneos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

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

#Crear torneo

def convert_torneo(raw: Torneo) -> dict:
    errores = {}
    torneo = {}

    # Campos numéricos
    numeric_fields = [
        "idOrganizador", "idLiga", "precioInscripcion", "numeroRondas",
        "duracionRondas", "plazasMax", "idFormatoTorneo", "idJuego", "idFormatoJuego"
    ]

    for field in numeric_fields:
        value = getattr(raw, field)
        if value is None or value == "":
            torneo[field] = None
        else:
            try:
                torneo[field] = int(value)
            except ValueError:
                try:
                    torneo[field] = float(value)
                except ValueError:
                    errores[field] = "Debe ser un número válido"

    # Campos de texto
    texto_fields = ["nombre", "descripcion", "lugarCelebracion", "estado", "premios"]
    for field in texto_fields:
        torneo[field] = getattr(raw, field) or ""

    # Fecha y hora
    raw_fecha = getattr(raw, "fechaHoraInicio", None)
    if isinstance(raw_fecha, str) and raw_fecha:
        for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
            try:
                torneo["fechaHoraInicio"] = datetime.strptime(raw_fecha, fmt)
                break
            except ValueError:
                torneo["fechaHoraInicio"] = None
        if torneo["fechaHoraInicio"] is None:
            errores["fechaHoraInicio"] = "Fecha y hora inválida"
        else:
            # Formatear para la base de datos
            torneo["fechaHoraInicio"] = torneo["fechaHoraInicio"].strftime("%Y-%m-%d %H:%M:%S")
    else:
        torneo["fechaHoraInicio"] = None

    return torneo, errores




@router.post("/torneo")
def crear_torneo(torneo: Torneo):

    torneo, errores = convert_torneo(torneo)

    #Campos obligatorios
    campos_obligatorios = ["idOrganizador", "nombre", "fechaHoraInicio", "lugarCelebracion", "idFormatoTorneo", "idJuego", "idFormatoJuego"]
    for campo in campos_obligatorios:
        if not torneo.get(campo):
            errores[campo] = "Este campo es obligatorio"
    #Si falta o hay algún error en los campos obligatorios, devolver errores
    if errores:
        return {"errores": errores}
    
    #Validar campos numéricos
    if torneo.get("precioInscripcion") < 0:
        errores["precioInscripcion"] = "Debe ser un número positivo"
    if torneo.get("numeroRondas") <= 0:
        errores["numeroRondas"] = "Debe ser un número positivo"
    if torneo.get("duracionRondas") <= 0:
        errores["duracionRondas"] = "Debe ser un número positivo"
    if torneo.get("plazasMax") <= 0:
        errores["plazasMax"] = "Debe ser un número positivo"
    else:
        #Comprobar plazasMax según el juego seleccionado
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT numMaxJugadores FROM FormatoJuego WHERE idFormatoJuego = %s;", (torneo["idFormatoJuego"],))
            max_jugadores = cursor.fetchone()
            if max_jugadores:
                torneo["plazasMax"] = max_jugadores[0]
            else:
                errores["plazasMax"] = "No se pudo obtener el número máximo de jugadores para el juego seleccionado"
        finally:
            if 'conn' in locals() and conn.is_connected():
                conn.close()
    print(torneo)
    #Devuelve errores si los hay
    if errores:
        return {"errores": errores}

   #Insertar en la base de datos
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Torneo 
            (nombre, descripcion, precioInscripcion, numeroRondas, duracionRondas, fechaHoraInicio, 
             lugarCelebracion, plazasMax, idOrganizador, idFormatoTorneo, idJuego, idFormatoJuego, idLiga, premios, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (torneo["nombre"], torneo["descripcion"], torneo["precioInscripcion"], torneo["numeroRondas"],
            torneo["duracionRondas"], torneo["fechaHoraInicio"], torneo["lugarCelebracion"], torneo["plazasMax"],
            torneo["idOrganizador"], torneo["idFormatoTorneo"], torneo["idJuego"], torneo["idFormatoJuego"],
            torneo.get("idLiga"), torneo["premios"], torneo["estado"]
            ))
        conn.commit()
        return {"mensaje": f"Torneo '{torneo.nombre}' creado correctamente"}

    except Exception as e:
        return {"error": f"Error al crear torneo: {str(e)}"}

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
