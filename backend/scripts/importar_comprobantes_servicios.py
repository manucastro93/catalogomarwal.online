#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Importa una planilla de 'Comprobantes de Servicios' a la BD.
- Lee .xls o .xlsx (aunque tenga filas "título" arriba de los encabezados)
- Auto-detecta la fila de encabezados buscando columnas clave (Tipo Comprobante, Comprobante, Fecha, Total)
- Normaliza montos en formato AR (puntos de miles, coma decimal)
- Parsea fechas dd/mm/yyyy y también ISO (YYYY-MM-DD [HH:MM:SS[.fff]])
- Hace UPSERT masivo en lotes:
  * ProveedoresServicios (crea proveedor si no existe)
  * CategoriasServicios (crea categoría si no existe, con normalización de duplicados "IMPUESTOS, IMPUESTOS" -> "IMPUESTOS")
  * ComprobantesServicios (clave natural: tipoComprobante + comprobante + fecha)

Requisitos:
  pip install pandas SQLAlchemy PyMySQL python-dotenv xlrd openpyxl
"""

import os
import sys
import math
import re
from pathlib import Path
from datetime import datetime
from decimal import Decimal, InvalidOperation

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from dotenv import load_dotenv
import warnings

# Silenciar warnings de parseo de fechas ISO con dayfirst
warnings.filterwarnings("ignore", message="Parsing dates in %Y-%m-%d")

# ============ Config .env ============
load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")
DB_DIALECT = os.getenv("DB_DIALECT", "mysql")

DATABASE_URL = f"{DB_DIALECT}+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ============ Helpers ============
AR_MONEY_RE = re.compile(r"[.\s]")  # para quitar puntos de miles y espacios
ISO_DT = re.compile(r"^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?)?$")

def parse_decimal_ar(value):
    if value is None:
        return Decimal("0")
    if isinstance(value, (int, float)) and not (isinstance(value, float) and math.isnan(value)):
        return Decimal(str(value))
    s = str(value).strip()
    if s == "":
        return Decimal("0")
    s = AR_MONEY_RE.sub("", s)  # quita puntos de miles y espacios
    s = s.replace(",", ".")     # coma -> punto
    try:
        return Decimal(s)
    except InvalidOperation:
        return Decimal("0")

def parse_date_dmy(value):
    # Maneja None, NaN y NaT
    if value is None or (hasattr(pd, "isna") and pd.isna(value)):
        return None
    # Si viene como Timestamp/fecha real
    if hasattr(value, "to_pydatetime"):
        try:
            return value.to_pydatetime().date()
        except Exception:
            pass
    s = str(value).strip()
    # ISO YYYY-MM-DD [HH:MM[:SS[.fff]]]
    if ISO_DT.match(s):
        dt = pd.to_datetime(s, dayfirst=False, errors="coerce")
        return None if pd.isna(dt) else dt.date()
    # dd/mm/yyyy o dd-mm-yyyy
    for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            pass
    # Fallback robusto (ej. "01/08/2025 00:00:00")
    dt = pd.to_datetime(s, dayfirst=True, errors="coerce")
    return None if pd.isna(dt) else dt.date()

def normalize_header_text(s: str) -> str:
    import unicodedata
    s = str(s).strip().lower()
    s = "".join(ch for ch in unicodedata.normalize("NFD", s) if unicodedata.category(ch) != "Mn")
    s = re.sub(r"\s+", " ", s)
    return s

def normalize_categoria_raw(cat: str) -> str:
    """Normaliza categorías.
       - 'IMPUESTOS, IMPUESTOS' -> 'IMPUESTOS'
       - Dedup case-insensitive preservando orden si hay múltiples separadas por coma.
    """
    if not isinstance(cat, str):
        return ""
    x = cat.strip()
    parts = [p.strip() for p in x.split(",") if p.strip() != ""]
    if not parts:
        return ""
    lowered = [p.lower() for p in parts]
    if len(set(lowered)) == 1:
        return parts[0]
    seen = set()
    uniq = []
    for p in parts:
        key = p.lower()
        if key not in seen:
            seen.add(key)
            uniq.append(p)
    return ", ".join(uniq)

def noneify(x):
    """Convierte NaN/NaT a None para que PyMySQL no explote."""
    try:
        if x is None or pd.isna(x):
            return None
    except Exception:
        if x is None:
            return None
    return x

COLMAP_EXPECTED = {
    # Excel -> nombre usado internamente
    "tipo comprobante": "tipoComprobante",
    "comprobante": "comprobante",
    "fecha": "fecha",
    "fecha imputacion": "fechaImputacion",
    "proveedor": "proveedorNombre",
    "detalles": "detalles",
    "categoria": "categoriaNombre",
    "categoria servicios": "categoriaNombre",
    "total": "total",
    "monto pagado": "montoPagado",
    "saldo": "saldo",
    "estado facturacion": "estadoFacturacion",
    "personal": "personal",
    "fecha vencimiento": "fechaVencimiento",
    "fecha registro": "fechaRegistro",
    "observaciones": "observaciones",
    "personal anula": "personalAnula",
    "fecha anula": "fechaAnula",
}
REQUIRED_NORMALIZED = {"tipo comprobante", "comprobante", "fecha", "total"}

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS CategoriasServicios (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  descripcion VARCHAR(500) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  UNIQUE KEY uq_categoriasservicios_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ProveedoresServicios (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  razonSocial VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  UNIQUE KEY uq_proveedoresservicios_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ComprobantesServicios (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tipoComprobante VARCHAR(100) NOT NULL,
  comprobante VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  fechaImputacion DATE NULL,
  proveedorId BIGINT UNSIGNED NULL,
  categoriaId BIGINT UNSIGNED NULL,
  detalles VARCHAR(500) NULL,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  montoPagado DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
  estadoFacturacion VARCHAR(100) NOT NULL DEFAULT 'EMITIDA',
  personal VARCHAR(255) NULL,
  fechaVencimiento DATE NULL,
  fechaRegistro DATE NULL,
  observaciones TEXT NULL,
  personalAnula VARCHAR(255) NULL,
  fechaAnula DATE NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  CONSTRAINT fk_comprobantes_proveedor FOREIGN KEY (proveedorId) REFERENCES ProveedoresServicios(id),
  CONSTRAINT fk_comprobantes_categoria FOREIGN KEY (categoriaId) REFERENCES CategoriasServicios(id),
  UNIQUE KEY uq_comprobantes_nat (tipoComprobante, comprobante, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def ensure_schema(engine: Engine):
    def table_exists(conn, name):
        row = conn.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema=:db AND table_name=:t LIMIT 1"),
            {"db": DB_NAME, "t": name}
        ).fetchone()
        return bool(row)

    with engine.begin() as conn:
        # Crear solo si NO existen (evitamos DDL innecesario)
        if not table_exists(conn, "CategoriasServicios"):
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS CategoriasServicios (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              nombre VARCHAR(255) NOT NULL,
              descripcion VARCHAR(500) NULL,
              createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deletedAt DATETIME NULL,
              UNIQUE KEY uq_categoriasservicios_nombre (nombre)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))
        if not table_exists(conn, "ProveedoresServicios"):
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ProveedoresServicios (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              nombre VARCHAR(255) NOT NULL,
              razonSocial VARCHAR(255) NULL,
              createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deletedAt DATETIME NULL,
              UNIQUE KEY uq_proveedoresservicios_nombre (nombre)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))
        if not table_exists(conn, "ComprobantesServicios"):
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ComprobantesServicios (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              tipoComprobante VARCHAR(100) NOT NULL,
              comprobante VARCHAR(100) NOT NULL,
              fecha DATE NOT NULL,
              fechaImputacion DATE NULL,
              proveedorId BIGINT UNSIGNED NULL,
              categoriaId BIGINT UNSIGNED NULL,
              detalles VARCHAR(500) NULL,
              total DECIMAL(15,2) NOT NULL DEFAULT 0,
              montoPagado DECIMAL(15,2) NOT NULL DEFAULT 0,
              saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
              estadoFacturacion VARCHAR(100) NOT NULL DEFAULT 'EMITIDA',
              personal VARCHAR(255) NULL,
              fechaVencimiento DATE NULL,
              fechaRegistro DATE NULL,
              observaciones TEXT NULL,
              personalAnula VARCHAR(255) NULL,
              fechaAnula DATE NULL,
              createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deletedAt DATETIME NULL,
              CONSTRAINT fk_comprobantes_proveedor FOREIGN KEY (proveedorId) REFERENCES ProveedoresServicios(id),
              CONSTRAINT fk_comprobantes_categoria FOREIGN KEY (categoriaId) REFERENCES CategoriasServicios(id),
              UNIQUE KEY uq_comprobantes_nat (tipoComprobante, comprobante, fecha)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))

def read_excel_raw(path: Path) -> pd.DataFrame:
    ext = path.suffix.lower()
    engine_name = "xlrd" if ext == ".xls" else "openpyxl"
    return pd.read_excel(path, header=None, engine=engine_name)

def find_header_row(df_raw: pd.DataFrame, scan_rows: int = 25) -> int:
    """
    Busca en las primeras 'scan_rows' filas aquella que contenga al menos 3 headers requeridos:
    (tipo comprobante, comprobante, fecha, total) normalizados.
    """
    def norm_cell(x):
        return normalize_header_text(x) if pd.notna(x) else ""
    for i in range(min(scan_rows, len(df_raw))):
        row_vals = [norm_cell(v) for v in df_raw.iloc[i].tolist()]
        hits = set(v for v in row_vals if v in REQUIRED_NORMALIZED)
        if len(hits) >= 3:
            return i
    return -1

def load_excel(path: Path) -> pd.DataFrame:
    df_raw = read_excel_raw(path)
    header_idx = find_header_row(df_raw)
    if header_idx == -1:
        # fallback: intentar con encabezado en la primera fila
        try:
            ext = path.suffix.lower()
            engine_name = "xlrd" if ext == ".xls" else "openpyxl"
            return pd.read_excel(path, engine=engine_name)
        except Exception:
            df = df_raw.copy()
            df.columns = df.iloc[0].tolist()
            df = df.iloc[1:].reset_index(drop=True)
            return df
    headers = df_raw.iloc[header_idx].tolist()
    df = df_raw.iloc[header_idx + 1:].reset_index(drop=True).copy()
    df.columns = headers
    return df

def map_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [normalize_header_text(c) for c in df.columns]

    # Renombrar según mapa
    rename_map = {k_excel: k_bd for k_excel, k_bd in COLMAP_EXPECTED.items() if k_excel in df.columns}
    df = df.rename(columns=rename_map)

    # Requeridas mínimas
    required = ["tipoComprobante", "comprobante", "fecha", "total"]
    faltantes = [c for c in required if c not in df.columns]
    if faltantes:
        raise RuntimeError(f"Faltan columnas requeridas en el Excel: {faltantes}\nColumnas disponibles: {list(df.columns)}")

    # Fechas
    for col in ["fecha", "fechaImputacion", "fechaVencimiento", "fechaRegistro", "fechaAnula"]:
        if col in df.columns:
            df[col] = df[col].apply(parse_date_dmy)

    # Montos
    for col in ["total", "montoPagado", "saldo"]:
        if col in df.columns:
            df[col] = df[col].apply(parse_decimal_ar)
        else:
            df[col] = Decimal("0")

    # Calcular saldo si falta
    if "saldo" in df.columns:
        df["saldo"] = df.apply(lambda r: (r.get("total") or Decimal("0")) - (r.get("montoPagado") or Decimal("0")), axis=1)

    # Fallback de categoriaNombre si no viene: intentar desde "detalles"
    if "categoriaNombre" not in df.columns:
        df["categoriaNombre"] = None
    if "detalles" in df.columns:
        mask_empty_cat = df["categoriaNombre"].isna() & df["detalles"].notna()
        df.loc[mask_empty_cat, "categoriaNombre"] = df.loc[mask_empty_cat, "detalles"].astype(str).apply(normalize_categoria_raw)

    # Completar columnas faltantes
    defaults = {
        "detalles": None,
        "estadoFacturacion": "EMITIDA",
        "personal": None,
        "observaciones": None,
        "personalAnula": None,
        "proveedorNombre": None,
    }
    for k, v in defaults.items():
        if k not in df.columns:
            df[k] = v

    final_cols = ["tipoComprobante","comprobante","fecha","fechaImputacion","proveedorNombre",
                  "categoriaNombre","detalles","total","montoPagado","saldo","estadoFacturacion",
                  "personal","fechaVencimiento","fechaRegistro","observaciones","personalAnula","fechaAnula"]
    for c in final_cols:
        if c not in df.columns:
            df[c] = None

    return df[final_cols]

# ========= Cache + helpers de creación/búsqueda =========
def precargar_caches(engine: Engine):
    prov_by_name = {}  # nombre -> id
    cat_by_name  = {}  # nombre_normalizado -> id
    with engine.begin() as conn:
        for row in conn.execute(text("SELECT id, nombre FROM ProveedoresServicios WHERE deletedAt IS NULL")):
            prov_by_name[row[1]] = int(row[0])
        for row in conn.execute(text("SELECT id, nombre FROM CategoriasServicios WHERE deletedAt IS NULL")):
            cat_by_name[row[1]] = int(row[0])
    return prov_by_name, cat_by_name

def get_or_create_proveedor_cached(conn, prov_by_name: dict, nombre: str):
    if not nombre:
        return None
    nombre = nombre.strip()
    if nombre in prov_by_name:
        return prov_by_name[nombre]
    res = conn.execute(text("INSERT INTO ProveedoresServicios (nombre) VALUES (:n)"), {"n": nombre})
    new_id = int(res.lastrowid)
    prov_by_name[nombre] = new_id
    return new_id

def get_or_create_categoria_cached(conn, cat_by_name: dict, nombre: str):
    if not nombre:
        return None
    nombre_norm = normalize_categoria_raw(nombre)
    if not nombre_norm:
        return None
    if nombre_norm in cat_by_name:
        return cat_by_name[nombre_norm]
    res = conn.execute(text("INSERT INTO CategoriasServicios (nombre) VALUES (:n)"), {"n": nombre_norm})
    new_id = int(res.lastrowid)
    cat_by_name[nombre_norm] = new_id
    return new_id

# ========= UPSERT masivo en lotes =========
def upsert_rows(df: pd.DataFrame, engine: Engine, batch_size: int = 250, max_retries: int = 5):
    """
    UPSERT masivo con batches: dentro de CADA transacción del batch
    se resuelven proveedor/categoría y se hace el INSERT ... ON DUPLICATE.
    Evita transacciones abiertas antes del begin() del batch.
    """
    from sqlalchemy.exc import OperationalError
    import time

    df = df.sort_values(by=["tipoComprobante", "fecha", "comprobante"], kind="stable").reset_index(drop=True)

    insert_sql = text("""
        INSERT INTO ComprobantesServicios
        (tipoComprobante, comprobante, fecha, fechaImputacion, proveedorId, categoriaId, detalles,
         total, montoPagado, saldo, estadoFacturacion, personal, fechaVencimiento, fechaRegistro,
         observaciones, personalAnula, fechaAnula)
        VALUES
        (:tipoComprobante, :comprobante, :fecha, :fechaImputacion, :proveedorId, :categoriaId, :detalles,
         :total, :montoPagado, :saldo, :estadoFacturacion, :personal, :fechaVencimiento, :fechaRegistro,
         :observaciones, :personalAnula, :fechaAnula)
        ON DUPLICATE KEY UPDATE
          fechaImputacion=VALUES(fechaImputacion),
          proveedorId=VALUES(proveedorId),
          categoriaId=VALUES(categoriaId),
          detalles=VALUES(detalles),
          total=VALUES(total),
          montoPagado=VALUES(montoPagado),
          saldo=VALUES(saldo),
          estadoFacturacion=VALUES(estadoFacturacion),
          personal=VALUES(personal),
          fechaVencimiento=VALUES(fechaVencimiento),
          fechaRegistro=VALUES(fechaRegistro),
          observaciones=VALUES(observaciones),
          personalAnula=VALUES(personalAnula),
          fechaAnula=VALUES(fechaAnula)
    """)

    total_rows = len(df)
    inserted_or_updated = 0

    with engine.connect() as conn:
        # set de sesión y COMMIT para no dejar transacción abierta
        try:
            conn.exec_driver_sql("SET SESSION innodb_lock_wait_timeout = 120")
            conn.exec_driver_sql("SET SESSION transaction_isolation = 'READ-COMMITTED'")
            conn.commit()
        except Exception:
            pass

        # caches en memoria (nombre -> id). Se llenan una vez y se actualizan cuando insertamos nuevos.
        prov_by_name = {}
        cat_by_name  = {}

        def ensure_proveedor_id(tx_conn, nombre: str):
            if not nombre: return None
            nombre = nombre.strip()
            if nombre in prov_by_name:
                return prov_by_name[nombre]
            row = tx_conn.execute(text("SELECT id FROM ProveedoresServicios WHERE nombre=:n AND deletedAt IS NULL"), {"n": nombre}).fetchone()
            if row:
                prov_by_name[nombre] = int(row[0])
                return prov_by_name[nombre]
            res = tx_conn.execute(text("INSERT INTO ProveedoresServicios (nombre) VALUES (:n)"), {"n": nombre})
            new_id = int(res.lastrowid)
            prov_by_name[nombre] = new_id
            return new_id

        def ensure_categoria_id(tx_conn, nombre: str):
            if not nombre: return None
            nombre_norm = normalize_categoria_raw(nombre)
            if not nombre_norm: return None
            if nombre_norm in cat_by_name:
                return cat_by_name[nombre_norm]
            row = tx_conn.execute(text("SELECT id FROM CategoriasServicios WHERE nombre=:n AND deletedAt IS NULL"), {"n": nombre_norm}).fetchone()
            if row:
                cat_by_name[nombre_norm] = int(row[0])
                return cat_by_name[nombre_norm]
            res = tx_conn.execute(text("INSERT INTO CategoriasServicios (nombre) VALUES (:n)"), {"n": nombre_norm})
            new_id = int(res.lastrowid)
            cat_by_name[nombre_norm] = new_id
            return new_id

        # acumulamos filas crudas (sin IDs) y resolvemos dentro del batch
        pending = []

        def flush_batch(rows_raw):
            nonlocal inserted_or_updated
            for attempt in range(max_retries):
                try:
                    with conn.begin():  # una transacción por batch
                        batch_params = []
                        for rr in rows_raw:
                            prov_id = ensure_proveedor_id(conn, rr.get("proveedorNombre"))
                            cat_id  = ensure_categoria_id(conn, rr.get("categoriaNombre"))
                            params = {
                                "tipoComprobante": rr["tipoComprobante"],
                                "comprobante": rr["comprobante"],
                                "fecha": rr["fecha"],
                                "fechaImputacion": rr["fechaImputacion"],
                                "proveedorId": prov_id,
                                "categoriaId": cat_id,
                                "detalles": rr["detalles"],
                                "total": float(rr["total"] or 0),
                                "montoPagado": float(rr["montoPagado"] or 0),
                                "saldo": float(rr["saldo"] or 0),
                                "estadoFacturacion": rr["estadoFacturacion"],
                                "personal": rr["personal"],
                                "fechaVencimiento": rr["fechaVencimiento"],
                                "fechaRegistro": rr["fechaRegistro"],
                                "observaciones": rr["observaciones"],
                                "personalAnula": rr["personalAnula"],
                                "fechaAnula": rr["fechaAnula"],
                            }
                            batch_params.append({k: noneify(v) for k, v in params.items()})
                        conn.execute(insert_sql, batch_params)  # executemany
                    inserted_or_updated += len(rows_raw)
                    return True
                except OperationalError as e:
                    if any(code in str(e.orig) for code in ("1205", "1213")):
                        sleep_s = min(2 ** attempt, 8)
                        print(f"⚠️ lock (intento {attempt+1}/{max_retries}). Reintentando en {sleep_s}s...")
                        time.sleep(sleep_s)
                        continue
                    raise
            return False

        for _, r in df.iterrows():
            # guardamos la fila cruda (con nombres), sin tocar la conexión (evitamos autobegin aquí)
            pending.append({
                "tipoComprobante": r["tipoComprobante"],
                "comprobante": r["comprobante"],
                "fecha": r["fecha"],
                "fechaImputacion": r["fechaImputacion"],
                "proveedorNombre": (r.get("proveedorNombre") or None),
                "categoriaNombre": (r.get("categoriaNombre") or None),
                "detalles": r["detalles"],
                "total": r["total"],
                "montoPagado": r["montoPagado"],
                "saldo": r["saldo"],
                "estadoFacturacion": r["estadoFacturacion"],
                "personal": r["personal"],
                "fechaVencimiento": r["fechaVencimiento"],
                "fechaRegistro": r["fechaRegistro"],
                "observaciones": r["observaciones"],
                "personalAnula": r["personalAnula"],
                "fechaAnula": r["fechaAnula"],
            })

            if len(pending) >= batch_size:
                ok = flush_batch(pending)
                if not ok:
                    raise RuntimeError("No se pudo completar el batch por contención de locks.")
                print(f"  • {inserted_or_updated}/{total_rows} filas upsertadas...")
                pending = []

        if pending:
            ok = flush_batch(pending)
            if not ok:
                raise RuntimeError("No se pudo completar el batch final por contención de locks.")
            print(f"  • {inserted_or_updated}/{total_rows} filas upsertadas...")
            time.sleep(0.2)

    return inserted_or_updated, 0

def main():
    if len(sys.argv) < 2:
        print("Uso: python importar_comprobantes_servicios.py <ruta_excel.xls|xlsx>")
        sys.exit(1)
    excel_path = Path(sys.argv[1])
    if not excel_path.exists():
        print(f"❌ No existe el archivo: {excel_path}")
        sys.exit(2)

    print(f"🔗 Conectando a {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)

    print("🧱 Asegurando schema/tablas...")
    ensure_schema(engine)

    print(f"📖 Leyendo Excel: {excel_path.name}")
    df = load_excel(excel_path)

    print("🧰 Mapeando columnas...")
    dfm = map_dataframe(df)

    print("⬆️ Insertando / Actualizando registros...")
    ins, upd = upsert_rows(dfm, engine, batch_size=50, max_retries=8)

    print(f"✅ Listo. Upserts: {ins}")

if __name__ == "__main__":
    main()
