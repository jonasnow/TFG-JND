#Imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, usuarios, torneos, ligas
#Instancia

app = FastAPI()

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"], #Durante desarrollo, el frontend corre en este origen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Incluir routers
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(torneos.router)
app.include_router(ligas.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Hola mundo"}

#Listar formatos de torneo
#
#@app.get("/formatos_torneo")
#def listar_formatos_torneo():
#    try:
#        conn = mysql.connector.connect(**DB_CONFIG)
#        cursor = conn.cursor(dictionary=True)
#        cursor.execute("SELECT idFormatoTorneo, nombre FROM FormatoTorneo;")
#        formatos = cursor.fetchall()
#        return formatos
#    finally:
#        if 'conn' in locals() and conn.is_connected():
#            conn.close()
#
##Listar juegos
#@app.get("/juegos")
#def listar_juegos():
#    try:
#        conn = mysql.connector.connect(**DB_CONFIG)
#        cursor = conn.cursor(dictionary=True)
#        cursor.execute("SELECT idJuego, nombre FROM Juego;")
#        juegos = cursor.fetchall()
#        return juegos
#    finally:
#        if 'conn' in locals() and conn.is_connected():
#            conn.close()
#
##Listar formatos de juego
#
#@app.get("/formatos_juego")
#def listar_formatos_juego():
#    try:
#        conn = mysql.connector.connect(**DB_CONFIG)
#        cursor = conn.cursor(dictionary=True)
#        cursor.execute("SELECT idFormatoJuego, nombre FROM FormatoJuego;")
#        formatos = cursor.fetchall()
#        return formatos
#    finally:
#        if 'conn' in locals() and conn.is_connected():
#            conn.close()
#
##Listar ligas activas
#@app.get("/ligas")
#def listar_ligas():
#    try:
#        conn = mysql.connector.connect(**DB_CONFIG)
#        cursor = conn.cursor(dictionary=True)
#        cursor.execute("SELECT idLiga, nombre FROM Liga WHERE CURDATE() BETWEEN fechaInicio AND fechaFin;")
#        ligas = cursor.fetchall()
#        return ligas
#    finally:
#        if 'conn' in locals() and conn.is_connected():
#            conn.close()





