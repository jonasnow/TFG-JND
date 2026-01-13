from fastapi import APIRouter
import random, math
import json

from core.database import get_connection

from models.ronda import JugadorRonda, MesaRonda, RondaActual

router = APIRouter(tags=["Rondas"])

#Validación antes de iniciar torneo
@router.post("/validacion_inicial_torneo/{id_torneo}")
def validacion_inicial_torneo(id_torneo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT estado, idFormatoJuego
            FROM Torneo
            WHERE idTorneo = %s;
        """, (id_torneo,))
        torneo = cursor.fetchone()

        if not torneo:
            return {"ok": False, "motivo": "TORNEO_NO_EXISTE"}

        if torneo["estado"] != "PLANIFICADO":
            return {
                "ok": False,
                "motivo": "ESTADO_INVALIDO",
                "estado": torneo["estado"]
            }

        cursor.execute("""
            SELECT numMaxJugadores
            FROM FormatoJuego
            WHERE idFormatoJuego = %s;
        """, (torneo["idFormatoJuego"],))
        formato = cursor.fetchone()

        if not formato:
            return {"ok": False, "motivo": "FORMATO_JUEGO_INVALIDO"}

        num_max = formato["numMaxJugadores"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM Equipo_Torneo
            WHERE idTorneo = %s
              AND confirmacionInscripcion = 'CONFIRMADA'
              AND confirmacionAsistencia = 'CONFIRMADA';
        """, (id_torneo,))
        participantes = cursor.fetchone()["total"]

        if participantes == 0:
            return {
                "ok": False,
                "motivo": "SIN_PARTICIPANTES"
            }

        return {
            "ok": True,
            "estado": "PLANIFICADO",
            "participantes": participantes,
            "numMaxJugadores": num_max
        }

    except Exception as e:
        return {"ok": False, "error": str(e)}

    finally:
        if conn.is_connected():
            conn.close()

#Función auxiliar para repartir participantes en la primera ronda
def repartir_participantes_ronda_uno(equipos, max_jugadores):
    random.shuffle(equipos)
    grupos = []

    if max_jugadores == 2:
        while len(equipos) >= 2:
            grupos.append([equipos.pop(), equipos.pop()])
        if equipos:
            grupos.append([equipos.pop()])  #Si hay impares, hay un bye
    else:
        num_mesas = math.ceil(len(equipos) / max_jugadores) 
        grupos = [[] for _ in range(num_mesas)]
        for i, equipo in enumerate(equipos):
            grupos[i % num_mesas].append(equipo)

    return grupos

#Comenzar torneo
@router.post("/comenzar_torneo/{id_torneo}")
def comenzar_torneo(id_torneo: int):
    try:
        conn = get_connection()
        conn.start_transaction()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT estado, idFormatoJuego
            FROM Torneo
            WHERE idTorneo = %s;
        """, (id_torneo,))
        torneo = cursor.fetchone()

        if not torneo or torneo["estado"] != "PLANIFICADO":
            conn.rollback()
            return {"error": "El torneo no puede iniciarse"}

        cursor.execute("""
            SELECT numMaxJugadores
            FROM FormatoJuego
            WHERE idFormatoJuego = %s;
        """, (torneo["idFormatoJuego"],))
        max_jugadores = cursor.fetchone()["numMaxJugadores"]

        cursor.execute("""
            SELECT idEquipo
            FROM Equipo_Torneo
            WHERE idTorneo = %s
              AND confirmacionInscripcion = 'CONFIRMADA'
              AND confirmacionAsistencia = 'CONFIRMADA';
        """, (id_torneo,))
        equipos = [e["idEquipo"] for e in cursor.fetchall()]

        if not equipos:
            conn.rollback()
            return {"error": "No hay participantes"}

        cursor.execute("""
            UPDATE Torneo
            SET estado = 'EN_CURSO'
            WHERE idTorneo = %s;
        """, (id_torneo,))

        grupos = repartir_participantes_ronda_uno(equipos, max_jugadores)

        for idx, grupo in enumerate(grupos, start=1):
            cursor.execute("""
                INSERT INTO Enfrentamiento
                (sitioAsignado, numeroRonda, resultado, marcador, idTorneo)
                VALUES (%s, 1, NULL, NULL, %s);
            """, (f"Mesa {idx}", id_torneo))

            id_enfrentamiento = cursor.lastrowid

            for id_equipo in grupo:
                cursor.execute("""
                    INSERT INTO Equipo_Enfrentamiento (idEquipo, idEnfrentamiento)
                    VALUES (%s, %s);
                """, (id_equipo, id_enfrentamiento))

        conn.commit()
        return {"mensaje": "Torneo iniciado y primera ronda generada"}

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        if conn.is_connected():
            conn.close()

#Ver el estado de la ronda de un torneo en curso que se está gestionando
@router.get("/rondas/{id_torneo}/ronda-actual")
def ronda_actual(id_torneo: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        #Validar EN_CURSO
        cursor.execute("""
            SELECT idTorneo, nombre, estado
            FROM Torneo
            WHERE idTorneo = %s;
        """, (id_torneo,))
        torneo = cursor.fetchone()

        if not torneo or torneo["estado"] != "EN_CURSO":
            return {"error": "El torneo no está en curso o no existe"}

        #Ronda = MAX(numeroRonda)
        cursor.execute("""
            SELECT MAX(numeroRonda) AS rondaActual
            FROM Enfrentamiento
            WHERE idTorneo = %s;
        """, (id_torneo,))
        ronda = cursor.fetchone()["rondaActual"]

        if not ronda:
            return {"error": "No hay enfrentamientos generados"}

        #Obtener enfrentamientos de la ronda
        cursor.execute("""
            SELECT idEnfrentamiento, sitioAsignado, resultado
            FROM Enfrentamiento
            WHERE idTorneo = %s AND numeroRonda = %s
            ORDER BY sitioAsignado;
        """, (id_torneo, ronda))
        enfrentamientos = cursor.fetchall()

        #Obtener equipos por enfrentamiento
        cursor.execute("""
            SELECT 
                ee.idEnfrentamiento,
                e.idEquipo,
                e.nombre AS nombreEquipo
            FROM Equipo_Enfrentamiento ee
            INNER JOIN Equipo e ON ee.idEquipo = e.idEquipo
            WHERE ee.idEnfrentamiento IN (
                SELECT idEnfrentamiento
                FROM Enfrentamiento
                WHERE idTorneo = %s AND numeroRonda = %s
            );
        """, (id_torneo, ronda))
        relaciones = cursor.fetchall()

        #Agrupar jugadores por enfrentamiento
        jugadores_por_enfrentamiento = {}

        for rel in relaciones:
            jugadores_por_enfrentamiento.setdefault(
                rel["idEnfrentamiento"], []
            ).append(
                JugadorRonda(
                    idEquipo=rel["idEquipo"],
                    nombre=rel["nombreEquipo"]
                )
            )

        #Construir mesas
        mesas = []

        for enf in enfrentamientos:
            mesas.append(
                MesaRonda(
                    idEnfrentamiento=enf["idEnfrentamiento"],
                    mesa=enf["sitioAsignado"],
                    resultado = (json.loads(enf["resultado"])
                        if enf["resultado"] else None
                    ),
                    jugadores=jugadores_por_enfrentamiento.get(
                        enf["idEnfrentamiento"], []
                    )
                )
            )

        #Respuesta final
        return RondaActual(
            idTorneo=torneo["idTorneo"],
            nombre=torneo["nombre"],
            numeroRonda=ronda,
            mesas=mesas
        )

    except Exception as e:
        return {"error": str(e)}

    finally:
        if conn.is_connected():
            conn.close()

@router.post("/enfrentamiento/guardar-resultado")
def guardar_resultado_mesa(data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        id_enf = data["idEnfrentamiento"]
        resultados = data["resultados"]

        #Comprobar enfrentamiento
        cursor.execute("""
            SELECT e.idTorneo, t.estado, e.resultado
            FROM Enfrentamiento e
            INNER JOIN Torneo t ON e.idTorneo = t.idTorneo
            WHERE e.idEnfrentamiento = %s;
        """, (id_enf,))
        enf = cursor.fetchone()

        if enf.get("resultado") is not None:
            return {"error": "El resultado ya fue registrado"}

        if not enf or enf["estado"] != "EN_CURSO":
            return {"error": "Enfrentamiento no válido"}

        #Equipos del enfrentamiento
        cursor.execute("""
            SELECT idEquipo
            FROM Equipo_Enfrentamiento
            WHERE idEnfrentamiento = %s;
        """, (id_enf,))
        equipos_bd = {e["idEquipo"] for e in cursor.fetchall()}
        equipos_req = {r["idEquipo"] for r in resultados}

        if equipos_bd != equipos_req:
            return {"error": "Resultados incompletos o incorrectos"}

        #Construcción resultado
        resultado_json = {
            str(r["idEquipo"]): r["puntos"] for r in resultados
        }
        marcador = "-".join(
            str(r["puntos"]) for r in resultados
        )

        cursor.execute("""
            UPDATE Enfrentamiento
            SET resultado = %s,
                marcador = %s
            WHERE idEnfrentamiento = %s;
        """, (
            json.dumps(resultado_json),
            marcador,
            id_enf
        ))

        conn.commit()
        return {"ok": True}

    except Exception as e:
        return {"error": str(e)}

    finally:
        if conn.is_connected():
            conn.close()

#Cerrar ronda

@router.post("/rondas/cerrar-ronda")
def cerrar_ronda(data: dict):
    try:
        
        conn = get_connection()
        conn.start_transaction() #evita dejar la ronda a medias
        cursor = conn.cursor(dictionary=True)


        id_torneo = data["idTorneo"]

        cursor.execute("""
            SELECT numeroRondas
            FROM Torneo
            WHERE idTorneo = %s AND estado = 'EN_CURSO';
        """, (id_torneo,))
        torneo = cursor.fetchone()

        if not torneo:
            return {"error": "Torneo no válido"}

        cursor.execute("""
            SELECT MAX(numeroRonda) AS ronda
            FROM Enfrentamiento
            WHERE idTorneo = %s;
        """, (id_torneo,))
        ronda_actual = cursor.fetchone()["ronda"]

        cursor.execute("""
            SELECT COUNT(*) AS pendientes
            FROM Enfrentamiento
            WHERE idTorneo = %s
              AND numeroRonda = %s
              AND resultado IS NULL;
        """, (id_torneo, ronda_actual))
        
        if cursor.fetchone()["pendientes"] > 0:
            return {"error": "Hay mesas sin resultado"}

        if ronda_actual >= torneo["numeroRondas"]:
            cursor.execute("""
                UPDATE Torneo
                SET estado = 'FINALIZADO'
                WHERE idTorneo = %s;
            """, (id_torneo,))
            conn.commit()
            return {"finalizado": True}

        #Generar siguiente ronda
        #Cambiar, por ahora no se genera la siguiente ronda
        #generate_next_round(id_torneo, ronda_actual + 1)
        conn.commit()
        return {
            "ok": True,
            "nuevaRonda": ronda_actual + 1
        }

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        if conn.is_connected():
            conn.close()
