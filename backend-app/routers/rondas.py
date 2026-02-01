from fastapi import APIRouter, HTTPException, Depends
from typing import List
import random, math
import json
from core.database import get_connection
from routers.auth import obtener_usuario_actual 
from models.ronda import RondaActual, ResultadoMesa, AccionRonda
router = APIRouter(prefix="/rondas", tags=["Rondas"])

#Funciones auxiliares

#Calcular número de rondas según formato y participantes
def calcular_numero_rondas(num_participantes: int, id_formato_torneo: int) -> int:
    if num_participantes < 2: return 1
    if id_formato_torneo == 3: return num_participantes - 1 if num_participantes % 2 == 0 else num_participantes
    return math.ceil(math.log2(num_participantes))

#Repartir participantes en la ronda uno 
def repartir_participantes_ronda_uno(equipos: list[int], max_jugadores: int):
    equipos_barajados = equipos.copy()
    random.shuffle(equipos_barajados)
    grupos = []
    if max_jugadores == 2:
        i = 0
        while i < len(equipos_barajados):
            grupos.append(equipos_barajados[i:i+2])
            i += 2
    else:
        num_mesas = math.ceil(len(equipos_barajados) / max_jugadores)
        grupos = [[] for _ in range(num_mesas)]
        for i, eq in enumerate(equipos_barajados):
            grupos[i % num_mesas].append(eq)
    return grupos

#Verificar permisos de organizador
def verificar_permiso_organizador(cursor, id_torneo: int, id_usuario: int):
    cursor.execute("SELECT idOrganizador, estado FROM Torneo WHERE idTorneo = %s", (id_torneo,))
    torneo = cursor.fetchone()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    if torneo["idOrganizador"] != id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos de organizador")
    if torneo["estado"] == "FINALIZADO":
         raise HTTPException(status_code=400, detail="El torneo ya ha finalizado")

#Endpoints

#Validación inicial para comenzar torneo
@router.post("/validacion_inicial_torneo/{id_torneo}")
def validacion_inicial_torneo(id_torneo: int, current_user: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        #Seguridad
        verificar_permiso_organizador(cursor, id_torneo, current_user["idUsuario"])

        cursor.execute("SELECT estado, idFormatoJuego FROM Torneo WHERE idTorneo = %s", (id_torneo,))
        torneo = cursor.fetchone()
        
        if torneo["estado"] != "PLANIFICADO": 
            return {"ok": False, "motivo": "El torneo no está en fase PLANIFICADO"}
        
        cursor.execute("SELECT COUNT(*) as total FROM Equipo_Torneo WHERE idTorneo=%s AND confirmacionAsistencia='CONFIRMADA'", (id_torneo,))
        if cursor.fetchone()["total"] < 2: 
            return {"ok": False, "motivo": "Mínimo 2 participantes confirmados (asistencia)."}
        
        return {"ok": True}
    except HTTPException as he: raise he
    except Exception as e: return {"ok": False, "motivo": str(e)}
    finally: 
        if conn and conn.is_connected(): conn.close()

#Comenzar torneo
@router.post("/comenzar_torneo/{id_torneo}")
def comenzar_torneo(id_torneo: int, current_user: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        conn = get_connection()
        conn.start_transaction()

        cursor = conn.cursor(dictionary=True)
        
        verificar_permiso_organizador(cursor, id_torneo, current_user["idUsuario"])
        
        
        cursor.execute("SELECT idFormatoTorneo, idFormatoJuego, numeroRondas FROM Torneo WHERE idTorneo=%s", (id_torneo,))
        torneo = cursor.fetchone()
        cursor.execute("SELECT numMaxJugadores FROM FormatoJuego WHERE idFormatoJuego=%s", (torneo["idFormatoJuego"],))
        max_jug = cursor.fetchone()["numMaxJugadores"]
        
        cursor.execute("SELECT idEquipo FROM Equipo_Torneo WHERE idTorneo=%s AND confirmacionAsistencia='CONFIRMADA'", (id_torneo,))
        equipos = [e["idEquipo"] for e in cursor.fetchall()]
        
        rondas = torneo["numeroRondas"]
        if not rondas: rondas = calcular_numero_rondas(len(equipos), torneo["idFormatoTorneo"])
        
        cursor.execute("UPDATE Torneo SET estado='EN_CURSO', numeroRondas=%s WHERE idTorneo=%s", (rondas, id_torneo))
        
        grupos = repartir_participantes_ronda_uno(equipos, max_jug)
        for idx, grupo in enumerate(grupos, 1):
            cursor.execute("INSERT INTO Enfrentamiento (sitioAsignado, numeroRonda, idTorneo) VALUES (%s, 1, %s)", (f"Mesa {idx}", id_torneo))
            id_enf = cursor.lastrowid
            for eq in grupo:
                cursor.execute("INSERT INTO Equipo_Enfrentamiento (idEquipo, idEnfrentamiento) VALUES (%s, %s)", (eq, id_enf))
        
        conn.commit()
        return {"mensaje": "Torneo iniciado"}
    except HTTPException as he:
        if conn: conn.rollback()
        raise he
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected(): conn.close()

#Obtener ronda actual
@router.get("/{id_torneo}/ronda-actual", response_model=RondaActual)
def obtener_ronda_actual(id_torneo: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT MAX(numeroRonda) as rondaActual FROM Enfrentamiento WHERE idTorneo = %s", (id_torneo,))
        res = cursor.fetchone()
        if not res or not res["rondaActual"]: raise HTTPException(status_code=404, detail="No se han generado rondas para este torneo")
        ronda = res["rondaActual"]
        
        cursor.execute("""
            SELECT COUNT(*) as pendientes FROM Enfrentamiento 
            WHERE idTorneo=%s AND numeroRonda=%s AND resultado IS NULL
        """, (id_torneo, ronda))
        ronda_finalizada = (cursor.fetchone()["pendientes"] == 0)

        cursor.execute("""
            SELECT e.idEnfrentamiento, e.sitioAsignado, eq.idEquipo, u.idUsuario,
                COALESCE(NULLIF(eq.nombre, ''), CONCAT(u.nombre, ' ', u.apellidos)) as nombreJugador,
                ee.puntosObtenidos
            FROM Enfrentamiento e
            JOIN Equipo_Enfrentamiento ee ON e.idEnfrentamiento = ee.idEnfrentamiento
            JOIN Equipo eq ON ee.idEquipo = eq.idEquipo
            JOIN Usuario_Equipo ue ON eq.idEquipo = ue.idEquipo
            JOIN Usuario u ON ue.idUsuario = u.idUsuario
            WHERE e.idTorneo = %s AND e.numeroRonda = %s
            ORDER BY e.idEnfrentamiento ASC
        """, (id_torneo, ronda))
        
        filas = cursor.fetchall()
        mesas_dict = {}
        for fila in filas:
            id_enf = fila["idEnfrentamiento"]
            if id_enf not in mesas_dict:
                mesas_dict[id_enf] = {"idEnfrentamiento": id_enf, "mesa": fila["sitioAsignado"], "jugadores": []}
            mesas_dict[id_enf]["jugadores"].append({"idEquipo": fila["idEquipo"], "nombre": fila["nombreJugador"], "idUsuario": fila["idUsuario"], "puntos": fila["puntosObtenidos"]})
            
        return {"numeroRonda": ronda, "nombre": f"Ronda {ronda}", "rondaFinalizada": ronda_finalizada, "mesas": list(mesas_dict.values())}
    except HTTPException as he:
        raise he 
    except Exception as e:
        print(f"Error interno: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected(): conn.close()

#Guardar resultados de los enfrentamientos
@router.post("/enfrentamiento/guardar-resultado")
def guardar_resultado(datos: ResultadoMesa, current_user: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        conn = get_connection()
        conn.start_transaction()

        cursor = conn.cursor(dictionary=True)
        
        #Obtener info del torneo a través del enfrentamiento
        cursor.execute("""
            SELECT t.idTorneo, t.idFormatoTorneo 
            FROM Torneo t
            JOIN Enfrentamiento e ON t.idTorneo = e.idTorneo
            WHERE e.idEnfrentamiento = %s
        """, (datos.idEnfrentamiento,))
        info = cursor.fetchone()
        
        if not info: raise HTTPException(status_code=404, detail="Enfrentamiento no encontrado")
        
        verificar_permiso_organizador(cursor, info["idTorneo"], current_user["idUsuario"])

        #Lógica de Puntuación
        id_formato = info["idFormatoTorneo"]
        num_jugadores = len(datos.resultados)
        puntos_torneo_asignados = {} 

        #A) Multijugador en Suizo/Aleatorio (Podio escalonado)
        if num_jugadores > 2 and id_formato in [1, 4]:
            ranking_mesa = sorted(datos.resultados, key=lambda x: x.puntos, reverse=True)
            for i, res in enumerate(ranking_mesa):
                puntos_por_posicion = max(0, 3 - i) #3, 2, 1, 0...
                #Empates: copiar puntos del anterior
                if i > 0 and res.puntos == ranking_mesa[i-1].puntos:
                    puntos_finales = puntos_torneo_asignados[ranking_mesa[i-1].idEquipo]
                else:
                    puntos_finales = puntos_por_posicion
                puntos_torneo_asignados[res.idEquipo] = puntos_finales
        
        #B) 1vs1, Eliminación o Round Robin
        else:
            max_puntos_real = max(r.puntos for r in datos.resultados)
            ganadores_ids = [r.idEquipo for r in datos.resultados if r.puntos == max_puntos_real]
            es_empate = len(ganadores_ids) > 1 and len(datos.resultados) > 1
            
            if id_formato == 2: #Eliminación
                puntos_win, puntos_draw, puntos_loss = 1, 0, 0
            else: #Estándar
                puntos_win, puntos_draw, puntos_loss = 3, 1, 0
            
            for res in datos.resultados:
                if len(datos.resultados) == 1: puntos_torneo_asignados[res.idEquipo] = 3 #Bye
                elif res.idEquipo in ganadores_ids:
                    puntos_torneo_asignados[res.idEquipo] = puntos_draw if es_empate else puntos_win
                else:
                    puntos_torneo_asignados[res.idEquipo] = puntos_loss

        #3. Guardado en DB
        ranking_ordenado = sorted(datos.resultados, key=lambda x: x.puntos, reverse=True)
        json_data = json.dumps({
            "orden": [r.idEquipo for r in ranking_ordenado],
            "puntos": {str(r.idEquipo): r.puntos for r in datos.resultados},
            "bye": num_jugadores == 1
        })
        
        #Guardar JSON visual
        cursor.execute("UPDATE Enfrentamiento SET marcador=%s, resultado='FINALIZADO' WHERE idEnfrentamiento=%s", (json_data, datos.idEnfrentamiento))
        
        #Guardar Puntos SQL
        for res in datos.resultados:
            puntos_a_guardar = puntos_torneo_asignados.get(res.idEquipo, 0)
            cursor.execute("UPDATE Equipo_Enfrentamiento SET puntosObtenidos = %s WHERE idEnfrentamiento = %s AND idEquipo = %s", (puntos_a_guardar, datos.idEnfrentamiento, res.idEquipo))
            
        conn.commit()
        return {"mensaje": "Guardado"}
    
    except HTTPException as he:
        if conn: conn.rollback()
        raise he
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and conn.is_connected(): conn.close()

#Cerrar ronda
@router.post("/cerrar-ronda")
def cerrar_ronda(datos: AccionRonda, current_user: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        conn = get_connection()
        conn.start_transaction()

        cursor = conn.cursor(dictionary=True)
        
        #Seguridad
        verificar_permiso_organizador(cursor, datos.idTorneo, current_user["idUsuario"])
        
        #1. Calcular puntos totales actuales
        cursor.execute("""
            SELECT idEquipo, SUM(puntosObtenidos) as total FROM Equipo_Enfrentamiento ee
            JOIN Enfrentamiento e ON ee.idEnfrentamiento = e.idEnfrentamiento
            WHERE e.idTorneo = %s GROUP BY idEquipo
        """, (datos.idTorneo,))
        puntos_equipos = cursor.fetchall()
        
        #2. Actualizar puntos acumulados en Equipo_Torneo
        cursor.execute("UPDATE Equipo_Torneo SET puntosAcumulados = 0 WHERE idTorneo = %s", (datos.idTorneo,))
        for fila in puntos_equipos:
            total = fila["total"] if fila["total"] is not None else 0
            cursor.execute("UPDATE Equipo_Torneo SET puntosAcumulados = %s WHERE idTorneo = %s AND idEquipo = %s", (total, datos.idTorneo, fila["idEquipo"]))
        
        #3. Verificar fin del torneo
        cursor.execute("SELECT numeroRondas FROM Torneo WHERE idTorneo=%s", (datos.idTorneo,))
        max_rondas = cursor.fetchone()["numeroRondas"]
        
        cursor.execute("SELECT MAX(numeroRonda) as actual FROM Enfrentamiento WHERE idTorneo=%s", (datos.idTorneo,))
        ronda_actual = cursor.fetchone()["actual"]
        
        finalizado = False
        if ronda_actual >= max_rondas:
            #A) Marcar como finalizado
            cursor.execute("UPDATE Torneo SET estado='FINALIZADO' WHERE idTorneo=%s", (datos.idTorneo,))
            finalizado = True
            
            #B)Calcular posiciones finales
            cursor.execute("""
                SELECT idEquipo FROM Equipo_Torneo 
                WHERE idTorneo = %s 
                ORDER BY puntosAcumulados DESC
            """, (datos.idTorneo,))
            
            ranking_final = cursor.fetchall()
            
            #Iteramos y guardamos la posición (1º, 2º, 3º...)
            for i, equipo in enumerate(ranking_final, 1):
                cursor.execute("""
                    UPDATE Equipo_Torneo SET posicion = %s 
                    WHERE idEquipo = %s AND idTorneo = %s
                """, (i, equipo["idEquipo"], datos.idTorneo))
            
        conn.commit()
        return {"ok": True, "finalizado": finalizado}
    except HTTPException as he:
        if conn: conn.rollback()
        raise he
    except Exception as e:
        if conn: conn.rollback()
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected(): conn.close()

#Generar siguiente ronda
@router.post("/generar-siguiente-ronda")
def generar_siguiente_ronda(datos: AccionRonda, current_user: dict = Depends(obtener_usuario_actual)):
    conn = None
    try:
        conn = get_connection()
        conn.start_transaction()

        cursor = conn.cursor(dictionary=True)
        
        verificar_permiso_organizador(cursor, datos.idTorneo, current_user["idUsuario"])
        
        #1. Datos básicos
        cursor.execute("""
            SELECT t.idFormatoTorneo, fj.numMaxJugadores 
            FROM Torneo t JOIN FormatoJuego fj ON t.idFormatoJuego = fj.idFormatoJuego 
            WHERE t.idTorneo = %s
        """, (datos.idTorneo,))
        info = cursor.fetchone()
        id_formato = info["idFormatoTorneo"]
        max_jug = info["numMaxJugadores"]

        cursor.execute("SELECT MAX(numeroRonda) as actual FROM Enfrentamiento WHERE idTorneo=%s", (datos.idTorneo,))
        ronda_actual = cursor.fetchone()["actual"]
        
        #2. Selección de los jugadores (Eliminación vs Suizo)
        ranking = []
        if id_formato == 2: #Eliminación: Solo pasan ganadores (>0 puntos esta ronda)
            cursor.execute("""
                SELECT ee.idEquipo FROM Equipo_Enfrentamiento ee
                JOIN Enfrentamiento e ON ee.idEnfrentamiento = e.idEnfrentamiento
                WHERE e.idTorneo = %s AND e.numeroRonda = %s AND ee.puntosObtenidos > 0
                ORDER BY ee.puntosObtenidos DESC
            """, (datos.idTorneo, ronda_actual))
            ranking = [e["idEquipo"] for e in cursor.fetchall()]
            if len(ranking) < 2: 
                #Si queda 1 o 0, fin del torneo
                cursor.execute("UPDATE Torneo SET estado='FINALIZADO' WHERE idTorneo=%s", (datos.idTorneo,))
                conn.commit()
                return {"mensaje": "Torneo finalizado", "finalizado": True}
        else: #Suizo/Liga: Pasan todos
            cursor.execute("""
                SELECT et.idEquipo FROM Equipo_Torneo et 
                LEFT JOIN Equipo e ON et.idEquipo = e.idEquipo 
                WHERE et.idTorneo=%s 
                ORDER BY et.puntosAcumulados DESC, e.nombre ASC
            """, (datos.idTorneo,))
            ranking = [e["idEquipo"] for e in cursor.fetchall()]
        
        #3. Emparejamiento
        grupos = []
        chunk = max_jug if max_jug > 2 else 2
        for i in range(0, len(ranking), chunk):
            grupos.append(ranking[i:i+chunk])
            
        siguiente = ronda_actual + 1
        for idx, grupo in enumerate(grupos, 1):
            cursor.execute("INSERT INTO Enfrentamiento (sitioAsignado, numeroRonda, idTorneo) VALUES (%s, %s, %s)", (f"Mesa {idx}", siguiente, datos.idTorneo))
            id_enf = cursor.lastrowid
            for eq in grupo:
                cursor.execute("INSERT INTO Equipo_Enfrentamiento (idEquipo, idEnfrentamiento) VALUES (%s, %s)", (eq, id_enf))
                
        conn.commit()
        return {"mensaje": f"Ronda {siguiente} generada"}
    except HTTPException as he:
        if conn: conn.rollback()
        raise he
    except Exception as e:
        if conn: conn.rollback()
        return {"error": str(e)}
    finally:
        if conn and conn.is_connected(): conn.close()

#Obtener clasificación actual del torneo
@router.get("/{id_torneo}/clasificacion")
def obtener_clasificacion(id_torneo: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.idEquipo, COALESCE(NULLIF(e.nombre, ''), CONCAT(u.nombre, ' ', u.apellidos)) as nombre, et.puntosAcumulados
            FROM Equipo_Torneo et
            JOIN Equipo e ON et.idEquipo=e.idEquipo
            JOIN Usuario_Equipo ue ON e.idEquipo=ue.idEquipo
            JOIN Usuario u ON ue.idUsuario=u.idUsuario
            WHERE et.idTorneo=%s
            ORDER BY et.puntosAcumulados DESC
        """, (id_torneo,))
        return cursor.fetchall()
    except Exception as e: return {"error": str(e)}
    finally:
        if conn and conn.is_connected(): conn.close()

#Obtener ronda específica
@router.get("/{id_torneo}/ronda/{numero_ronda}", response_model=RondaActual)
def obtener_ronda_especifica(id_torneo: int, numero_ronda: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT idEnfrentamiento FROM Enfrentamiento WHERE idTorneo=%s AND numeroRonda=%s LIMIT 1", (id_torneo, numero_ronda))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Ronda no encontrada")

        cursor.execute("""
            SELECT e.idEnfrentamiento, e.sitioAsignado, eq.idEquipo, 
                u.idUsuario,
                COALESCE(NULLIF(eq.nombre, ''), CONCAT(u.nombre, ' ', u.apellidos)) as nombreJugador,
                ee.puntosObtenidos,
                e.marcador
            FROM Enfrentamiento e
            JOIN Equipo_Enfrentamiento ee ON e.idEnfrentamiento = ee.idEnfrentamiento
            JOIN Equipo eq ON ee.idEquipo = eq.idEquipo
            JOIN Usuario_Equipo ue ON eq.idEquipo = ue.idEquipo
            JOIN Usuario u ON ue.idUsuario = u.idUsuario
            WHERE e.idTorneo = %s AND e.numeroRonda = %s
            ORDER BY e.idEnfrentamiento ASC
        """, (id_torneo, numero_ronda))
        
        filas = cursor.fetchall()
        mesas_dict = {}
        for fila in filas:
            id_enf = fila["idEnfrentamiento"]
            if id_enf not in mesas_dict:
                mesas_dict[id_enf] = {
                    "idEnfrentamiento": id_enf, 
                    "mesa": fila["sitioAsignado"], 
                    "marcador": json.loads(fila["marcador"]) if fila["marcador"] else None,
                    "jugadores": []
                }
            
            mesas_dict[id_enf]["jugadores"].append({
                "idEquipo": fila["idEquipo"], 
                "nombre": fila["nombreJugador"],
                "idUsuario": fila["idUsuario"],
                "puntos": fila["puntosObtenidos"]
            })
            
        return {
            "numeroRonda": numero_ronda, 
            "nombre": f"Ronda {numero_ronda}", 
            "mesas": list(mesas_dict.values())
        }
    except Exception as e: return {"error": str(e)}
    finally:
        if conn and conn.is_connected(): conn.close()