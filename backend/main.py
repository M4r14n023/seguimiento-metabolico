from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 PEGA TU URL DE SUPABASE AQUÍ (Asegúrate de poner tu contraseña real)
DATABASE_URL = "postgresql://postgres.onbmnhdatgjfvyslqxqr:y2)%3DoV3cvo%40%40%3Bipa%2BQGv@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# --- CONFIGURACIÓN Y MIGRACIÓN AUTOMÁTICA DE BASE DE DATOS ---
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Crear tablas si no existen
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registros_peso (
            id SERIAL PRIMARY KEY,
            fecha TEXT,
            peso REAL,
            cintura REAL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS configuracion (
            usuario TEXT PRIMARY KEY,
            peso_inicial REAL,
            cintura_inicial REAL,
            grasa_actual REAL,
            grasa_objetivo REAL
        )
    ''')
    
    # 2. Actualizar tabla registros_peso (Agregar nuevas columnas si no existen)
    columnas_peso = [
        ("usuario", "TEXT DEFAULT 'Mariano'"),
        ("gym", "BOOLEAN DEFAULT FALSE"),
        ("tenis", "BOOLEAN DEFAULT FALSE"),
        ("casa", "BOOLEAN DEFAULT FALSE")
    ]
    for col, tipo in columnas_peso:
        try:
            cursor.execute(f"ALTER TABLE registros_peso ADD COLUMN {col} {tipo}")
            conn.commit()
        except Exception:
            conn.rollback() # Si falla, es porque la columna ya existe

    # 3. Actualizar tabla configuracion
    try:
        cursor.execute("ALTER TABLE configuracion ADD COLUMN cintura_inicial REAL DEFAULT 0.0")
        conn.commit()
    except Exception:
        conn.rollback()

    # Insertar perfiles por defecto si no existen
    cursor.execute("INSERT INTO configuracion (usuario, peso_inicial, cintura_inicial, grasa_actual, grasa_objetivo) VALUES ('Mariano', 80.0, 85.0, 20.0, 12.0) ON CONFLICT DO NOTHING")
    cursor.execute("INSERT INTO configuracion (usuario, peso_inicial, cintura_inicial, grasa_actual, grasa_objetivo) VALUES ('Novia', 60.0, 70.0, 25.0, 18.0) ON CONFLICT DO NOTHING")
    
    conn.commit()
    conn.close()

init_db()

# --- MODELOS DE DATOS ---
class RegistroPeso(BaseModel):
    usuario: str
    peso: float
    cintura: Optional[float] = None
    gym: bool = False
    tenis: bool = False
    casa: bool = False

class ConfigModel(BaseModel):
    usuario: str
    peso_inicial: float
    cintura_inicial: float
    grasa_actual: float
    grasa_objetivo: float

# --- RUTAS DE LA API ---
@app.get("/api/config/{usuario}")
def obtener_config(usuario: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT peso_inicial, cintura_inicial, grasa_actual, grasa_objetivo FROM configuracion WHERE usuario = %s", (usuario,))
    fila = cursor.fetchone()
    conn.close()
    if fila:
        return {"peso_inicial": fila[0], "cintura_inicial": fila[1], "grasa_actual": fila[2], "grasa_objetivo": fila[3]}
    return {}

@app.post("/api/config")
def guardar_config(config: ConfigModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO configuracion (usuario, peso_inicial, cintura_inicial, grasa_actual, grasa_objetivo) 
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (usuario) DO UPDATE 
        SET peso_inicial = EXCLUDED.peso_inicial, 
            cintura_inicial = EXCLUDED.cintura_inicial,
            grasa_actual = EXCLUDED.grasa_actual, 
            grasa_objetivo = EXCLUDED.grasa_objetivo
    ''', (config.usuario, config.peso_inicial, config.cintura_inicial, config.grasa_actual, config.grasa_objetivo))
    conn.commit()
    conn.close()
    return {"mensaje": "Configuración actualizada"}

@app.post("/api/registrar_peso")
def registrar_peso(registro: RegistroPeso):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # LÓGICA MAGISTRAL: Si no manda cintura, buscamos la última.
    cintura_final = registro.cintura
    if not cintura_final:
        cursor.execute("SELECT cintura FROM registros_peso WHERE usuario = %s AND cintura IS NOT NULL ORDER BY id DESC LIMIT 1", (registro.usuario,))
        row = cursor.fetchone()
        if row:
            cintura_final = row[0]
        else:
            # Si no hay historial, busca la cintura inicial del perfil
            cursor.execute("SELECT cintura_inicial FROM configuracion WHERE usuario = %s", (registro.usuario,))
            row_conf = cursor.fetchone()
            cintura_final = row_conf[0] if row_conf else None

    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute("""
        INSERT INTO registros_peso (fecha, peso, cintura, usuario, gym, tenis, casa) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (fecha_actual, registro.peso, cintura_final, registro.usuario, registro.gym, registro.tenis, registro.casa))
    conn.commit()
    conn.close()
    return {"mensaje": "Registro guardado con éxito"}

@app.get("/api/historial/{usuario}")
def obtener_historial(usuario: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, fecha, peso, cintura, gym, tenis, casa FROM registros_peso WHERE usuario = %s ORDER BY id ASC", (usuario,))
    filas = cursor.fetchall()
    conn.close()
    return [{"id": f[0], "fecha": f[1], "peso": f[2], "cintura": f[3], "gym": f[4], "tenis": f[5], "casa": f[6]} for f in filas]

@app.delete("/api/borrar_peso/{registro_id}")
def borrar_peso(registro_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registros_peso WHERE id = %s", (registro_id,))
    conn.commit()
    conn.close()
    return {"mensaje": "Registro eliminado"}