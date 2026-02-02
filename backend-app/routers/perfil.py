from fastapi import APIRouter, HTTPException, Depends
import mysql.connector
import bcrypt
from core.database import get_connection
from core.security import obtener_usuario_actual
from models.usuario import UsuarioEditar, PasswordChange

router = APIRouter(tags=["Perfil"])

#Ver torneos organizados por un usuario
@router.get("/torneos_organizador")
def torneos_organizador(usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        idUsuario = usuario_actual["idUsuario"]
        
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
        if conn and conn.is_connected():
            conn.close()

#Ver torneos en los que está inscrito un usuario
@router.get("/torneos_usuario")
def torneos_usuario(usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        idUsuario = usuario_actual["idUsuario"]

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                et.confirmacionInscripcion AS EstadoInscripcion,
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
              AND u.idUsuario = %s
            ORDER BY t.fechaHoraInicio ASC;
        """, (idUsuario,))
        
        torneos = cursor.fetchall()
        return torneos
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()


#Ver datos personales de un usuario
@router.get("/perfil")
def datos_usuario(usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        idUsuario = usuario_actual["idUsuario"]

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
        
        if not usuario:
             raise HTTPException(status_code=404, detail="Usuario no encontrado")
             
        return usuario
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected():
            conn.close()

#Editar perfil
@router.put("/editar_perfil")
def editar_datos_usuario(datos: UsuarioEditar, usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        #Validaciones manuales de nombre y apellidos
        if not datos.nombre or not datos.nombre.strip():
            raise HTTPException(status_code=400, detail="El nombre es obligatorio.")
        
        if not datos.apellidos or not datos.apellidos.strip():
            raise HTTPException(status_code=400, detail="Los apellidos son obligatorios.")

        idUsuario = usuario_actual["idUsuario"]
        conn = get_connection()
        cursor = conn.cursor()

        #Validar Email duplicado
        cursor.execute("SELECT idUsuario FROM Usuario WHERE email = %s AND idUsuario != %s", (datos.email.strip(), idUsuario))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="El email ya está registrado por otro usuario.")

        #Validar Teléfono duplicado
        if datos.telefono:
            cursor.execute("SELECT idUsuario FROM Usuario WHERE telefono = %s AND idUsuario != %s", (datos.telefono.strip(), idUsuario))
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="El teléfono ya está registrado por otro usuario.")

        cursor.execute("""
            UPDATE Usuario
            SET nombre = %s, apellidos = %s, email = %s, localidad = %s, telefono = %s
            WHERE idUsuario = %s;
        """, (
            datos.nombre.strip(), 
            datos.apellidos.strip(), 
            datos.email.strip(), 
            datos.localidad.strip() if datos.localidad else None, 
            datos.telefono.strip(), 
            idUsuario
        ))

        conn.commit()
        return {"message": "Datos actualizados correctamente"}

    except HTTPException as he:
        raise he
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error Editar Perfil: {e}")
        raise HTTPException(status_code=500, detail="Ha ocurrido un error al guardar los datos.")
    finally:
        if conn and conn.is_connected(): conn.close()


#Cambiar contraseña
@router.post("/cambiar_password")
def cambiar_password(datos: PasswordChange, usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        if datos.passwordActual == datos.nuevaPassword:
            raise HTTPException(status_code=400, detail="La nueva contraseña no puede ser igual a la actual.")

        idUsuario = usuario_actual["idUsuario"]
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT password_hash FROM Usuario WHERE idUsuario = %s",
            (idUsuario,)
        )
        user = cursor.fetchone()

        if not user or not bcrypt.checkpw(
            datos.passwordActual.encode('utf-8'),
            user["password_hash"].encode('utf-8')
        ):
            raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")

        nueva_hash = bcrypt.hashpw(
            datos.nuevaPassword.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        cursor.execute(
            "UPDATE Usuario SET password_hash = %s WHERE idUsuario = %s",
            (nueva_hash, idUsuario)
        )
        conn.commit()

        return {"message": "Contraseña actualizada correctamente"}

    except HTTPException as he:
        raise he
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected():
            conn.close()


#Ver historial del usuario (torneos finalizados en los que ha participado)
@router.get("/historial_usuario")
def historial_usuario(usuario_actual: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        idUsuario = usuario_actual["idUsuario"]

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

                et.posicion AS posicion,
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
        if conn and conn.is_connected():
            conn.close()