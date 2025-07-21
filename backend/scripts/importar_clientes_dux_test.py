import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def procesar_excel(ruta_archivo):
    print(f"📖 Leyendo Excel sin encabezado, desde fila 0: {ruta_archivo}")
    df = pd.read_excel(ruta_archivo, header=None)

    print("🧪 Primeras filas:")
    print(df.head())

    # Armado de columnas, ajustar según estructura real
    df.columns = [
        "id", "fechaCreacion", "cliente", "categoriaFiscal", "tipoDocumento", "numeroDocumento",
        "cuitCuil", "cobrador", "tipoCliente", "personaContacto", "noEditable",
        "lugarEntregaPorDefecto", "tipoComprobantePorDefecto", "listaPrecioPorDefecto",
        "habilitado", "nombreFantasia", "codigo", "correoElectronico", "vendedor",
        "provincia", "localidad", "barrio", "domicilio", "telefono", "celular", "zona", "condicionPago"
    ]

    # Limitar a columnas necesarias (en caso de más columnas extra)
    df = df.iloc[:, :27]

    # 🔧 Convertir fecha
    df['fechaCreacion'] = pd.to_datetime(df['fechaCreacion'], format="%d/%m/%Y", errors="coerce")
    # 🔧 Convertir habilitado
    df["habilitado"] = df["habilitado"].map(lambda x: 1 if str(x).strip().upper() == "S" else 0)

    print("🛠 Conectando a la base de datos...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        df.to_sql("ClientesDux", con=conn, if_exists="append", index=False)
    print("✅ Clientes importados correctamente.")

if __name__ == "__main__":
    excel_path = os.path.join(os.path.dirname(__file__), "descargas", "temp_clientes_dux.xlsx")
    procesar_excel(excel_path)
