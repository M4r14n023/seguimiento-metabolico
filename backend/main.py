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

# --- CONFIGURACIÓN DE BASE DE DATOS ---
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # En Postgres el autoincremental se llama SERIAL
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
            id INTEGER PRIMARY KEY CHECK (id = 1),
            peso_inicial REAL,
            grasa_actual REAL,
            grasa_objetivo REAL
        )
    ''')
    
    cursor.execute('SELECT count(*) FROM configuracion')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO configuracion (id, peso_inicial, grasa_actual, grasa_objetivo) VALUES (1, 80.0, 20.0, 12.0)')
        
    conn.commit()
    conn.close()

# Inicializamos las tablas en Supabase
init_db()

# --- MODELOS DE DATOS ---
class RegistroPeso(BaseModel):
    peso: float
    cintura: Optional[float] = None

class ConfigModel(BaseModel):
    peso_inicial: float
    grasa_actual: float
    grasa_objetivo: float

# --- RUTAS DE LA API ---
@app.get("/api/config")
def obtener_config():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT peso_inicial, grasa_actual, grasa_objetivo FROM configuracion WHERE id = 1")
    fila = cursor.fetchone()
    conn.close()
    return {"peso_inicial": fila[0], "grasa_actual": fila[1], "grasa_objetivo": fila[2]}

@app.post("/api/config")
def guardar_config(config: ConfigModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Postgres usa %s en lugar de ? para inyectar variables
    cursor.execute('''
        UPDATE configuracion 
        SET peso_inicial = %s, grasa_actual = %s, grasa_objetivo = %s 
        WHERE id = 1
    ''', (config.peso_inicial, config.grasa_actual, config.grasa_objetivo))
    conn.commit()
    conn.close()
    return {"mensaje": "Configuración actualizada"}

@app.post("/api/registrar_peso")
def registrar_peso(registro: RegistroPeso):
    conn = get_db_connection()
    cursor = conn.cursor()
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute("INSERT INTO registros_peso (fecha, peso, cintura) VALUES (%s, %s, %s)", 
                   (fecha_actual, registro.peso, registro.cintura))
    conn.commit()
    conn.close()
    return {"mensaje": "Registro guardado con éxito"}

@app.get("/api/historial")
def obtener_historial():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, fecha, peso, cintura FROM registros_peso ORDER BY id ASC")
    filas = cursor.fetchall()
    conn.close()
    return [{"id": f[0], "fecha": f[1], "peso": f[2], "cintura": f[3]} for f in filas]

@app.delete("/api/borrar_peso/{registro_id}")
def borrar_peso(registro_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registros_peso WHERE id = %s", (registro_id,))
    conn.commit()
    conn.close()
    return {"mensaje": "Registro eliminado"}

@app.post("/api/proyectar")
def calcular_proyeccion(datos: ConfigModel):
    grasa_kg = datos.peso_inicial * (datos.grasa_actual / 100)
    masa_magra = datos.peso_inicial - grasa_kg
    peso_objetivo = masa_magra / (1 - (datos.grasa_objetivo / 100))
    
    peso_simulado = datos.peso_inicial
    semanas = 0
    historial = []

    while peso_simulado > peso_objetivo:
        semanas += 1
        perdida = peso_simulado * 0.007
        peso_simulado -= perdida
        historial.append({
            "semana": f"Sem {semanas}",
            "peso_ideal": round(peso_simulado, 2)
        })

    return {
        "peso_objetivo": round(peso_objetivo, 2),
        "semanas_estimadas": semanas,
        "proyeccion": historial
    }