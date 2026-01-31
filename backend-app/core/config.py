import os
from dotenv import load_dotenv  
load_dotenv()

class Settings:
#Configuración de la base de datos desde variables de entorno
    DB_CONFIG = {
        "host": os.getenv("DB_HOST", "db"),
        "user": os.getenv("DB_USER", "testuser"),
        "password": os.getenv("DB_PASS", "testpass"),
        "database": os.getenv("DB_NAME", "testdb"),
    }
    #JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "ClaveSecretaJWT")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

settings = Settings()