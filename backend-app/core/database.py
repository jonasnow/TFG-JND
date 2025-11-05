import mysql.connector
from core.config import settings

def get_connection():
    return mysql.connector.connect(**settings.DB_CONFIG)
