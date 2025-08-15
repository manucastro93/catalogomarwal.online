import pandas as pd
from sqlalchemy import create_engine, text
import os, unicodedata
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = f"{os.getenv('DB_DIALECT','mysql')}+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT','3306')}/{os.getenv('DB_NAME')}"

def normalizar(s):
    if not isinstance(s, str):
        return ""
    s = s.strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = " ".join(s.split())
    return s

def armar_claves_nombre(apellido, nombre):
    ape = normalizar(apellido or "")
    nom = normalizar(nombre or "")
    claves = set()
    if ape or nom:
        if ape and nom:
            claves.add(f"{ape}, {nom}")
            claves.add(f"{ape} {nom}")
        else:
            claves.add(ape or nom)
    return claves

engine = create_engine(DATABASE_URL)

# Mapa PersonalDux
pers = pd.read_sql("SELECT id_personal, nombre, apellido_razon_social FROM PersonalDux WHERE deletedAt IS NULL", engine)
mapa = {}
for _, r in pers.iterrows():
    for k in armar_claves_nombre(r["apellido_razon_social"], r["nombre"]):
        mapa.setdefault(k, int(r["id_personal"]))

# Clientes sin vendedorId
cli = pd.read_sql("""
    SELECT id, vendedor
    FROM ClientesDux
    WHERE (vendedorId IS NULL OR vendedorId = 0) AND vendedor IS NOT NULL AND vendedor <> ''
""", engine)

updates = []
for _, r in cli.iterrows():
    clave = normalizar(r["vendedor"])
    vid = mapa.get(clave)
    if not vid:
        partes = clave.split(" ")
        if len(partes) >= 2:
            nombre = " ".join(partes[:-1])
            apellido = partes[-1]
            for k in armar_claves_nombre(apellido, nombre):
                if k in mapa:
                    vid = mapa[k]
                    break
    if vid:
        updates.append((vid, int(r["id"])))

with engine.begin() as conn:
    for vid, cid in updates:
        conn.execute(text("UPDATE ClientesDux SET vendedorId = :vid WHERE id = :cid"), {"vid": vid, "cid": cid})

print(f"Backfill listo. Actualizados: {len(updates)} filas.")
