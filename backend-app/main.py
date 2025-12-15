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





