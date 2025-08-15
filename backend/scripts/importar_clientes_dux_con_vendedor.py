import asyncio
import os
from pathlib import Path
from datetime import datetime
import pandas as pd
import unicodedata
from sqlalchemy import create_engine, MetaData, Table, text
from sqlalchemy.dialects.mysql import insert as mysql_insert
from dotenv import load_dotenv
from playwright.async_api import async_playwright

# 📦 Cargar variables de entorno
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
USUARIO = os.getenv("DUX_USER", "")
CONTRASENA = os.getenv("DUX_PASS", "")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")
DB_DIALECT = os.getenv("DB_DIALECT", "mysql")

DATABASE_URL = f"{DB_DIALECT}+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 🔧 Helpers normalización para matchear nombres de vendedores
def normalizar(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")  # quita acentos
    s = " ".join(s.split())  # colapsa espacios
    return s

def armar_claves_nombre(apellido: str, nombre: str):
    ape = normalizar(apellido or "")
    nom = normalizar(nombre or "")
    claves = set()
    if ape or nom:
        if ape and nom:
            claves.add(f"{ape}, {nom}")  # formato típico Dux "APELLIDO, NOMBRE"
            claves.add(f"{ape} {nom}")   # alternativa sin coma
        else:
            claves.add(ape or nom)
    return claves

def ensure_schema(engine):
    """Asegura columna vendedorId e índice (si no existen)."""
    with engine.begin() as conn:
        # Columna si no existe
        conn.execute(text("""
            ALTER TABLE ClientesDux
            ADD COLUMN IF NOT EXISTS vendedorId INT NULL
        """))
        # Índice si no existe
        existe_idx = conn.execute(text("""
            SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'ClientesDux' AND INDEX_NAME = 'idx_clientesdux_vendedorId'
        """), {"db": DB_NAME}).scalar()
        if not existe_idx:
            conn.execute(text("CREATE INDEX idx_clientesdux_vendedorId ON ClientesDux (vendedorId)"))

def construir_mapa_personal(engine):
    """Devuelve dict { 'APELLIDO, NOMBRE' : id_personal } con variantes normalizadas."""
    q = """
    SELECT id_personal, nombre, apellido_razon_social
    FROM PersonalDux
    WHERE deletedAt IS NULL
    """
    dfp = pd.read_sql(q, engine)
    mapa = {}
    for _, r in dfp.iterrows():
        claves = armar_claves_nombre(r.get("apellido_razon_social"), r.get("nombre"))
        for k in claves:
            mapa.setdefault(k, int(r["id_personal"]))
    return mapa

async def run():
    download_dir = Path(__file__).parent / "descargas"
    download_dir.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True)
        page = await context.new_page()

        print("🔐 Iniciando sesión...")
        await page.goto("https://erp.duxsoftware.com.ar")
        await page.fill('input[name="formLogin:inputUsuario"]', USUARIO)
        await page.fill('input[name="formLogin:inputPassword"]', CONTRASENA)
        await page.click('#formLogin\\:btnLoginBlock')

        print("⏳ Esperando selector visual de sucursal...")
        await page.wait_for_selector('#formInicio\\:j_idt900_label', timeout=15000)
        await page.click('#formInicio\\:j_idt900_label')
        await page.click('li[id="formInicio:j_idt900_0"]')
        await page.wait_for_selector('#formInicio\\:j_idt905_label', timeout=10000)
        await page.click('#formInicio\\:j_idt905_label')
        await page.click('li[id="formInicio:j_idt905_0"]')

        print("🟢 Ingresando al sistema...")
        await page.click('#formInicio\\:j_idt910')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(500)

        print("📊 Menú DATA Y ANALÍTICAS → BASE DATOS → Clientes...")
        await page.click('text=DATA Y ANALITICAS')
        await page.wait_for_timeout(300)
        await page.click('text=BASE DATOS')
        await page.wait_for_timeout(300)
        await page.click('text=Clientes')
        await page.wait_for_url('**/listaClienteBeta.faces')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(500)

        print("🧩 Menú Acciones → Exportar...")
        await page.wait_for_selector('#formCabecera\\:idAcciones', timeout=10000)
        await page.click('#formCabecera\\:idAcciones')
        await page.wait_for_timeout(300)
        await page.click('text=Exportar')
        await page.wait_for_timeout(500)

        print("⬇️ Esperando ícono de descarga en ventana de exportaciones...")
        await page.wait_for_selector('#ventana_descargas', timeout=15000)
        descargas = await page.query_selector_all('.btn-descarga')
        if not descargas:
            print("❌ No se encontró ninguna exportación disponible para descargar")
            return

        print("💾 Haciendo clic en ícono de descarga (interceptando archivo)...")
        async with page.expect_download() as download_info:
            await descargas[0].click()

        download = await download_info.value

        hoy = datetime.now().strftime("%Y-%m-%d")
        xls_original = Path(__file__).parent / "descargas" / f"clientes_dux_{hoy}.xls"
        await download.save_as(xls_original)

        xls_sanitizado = Path(__file__).parent / "descargas" / "temp_clientes_dux.xls"
        xls_original.rename(xls_sanitizado)

        print(f"✅ Archivo descargado correctamente: {xls_sanitizado}")
        xlsx_path = convertir_a_xlsx(xls_sanitizado)

        # 🔗 DB engine + schema + mapa de vendedores
        engine = create_engine(DATABASE_URL)
        ensure_schema(engine)
        mapa_vendedores = construir_mapa_personal(engine)

        procesar_excel(xlsx_path, mapa_vendedores, engine)
        guardar_log("✅ Importación exitosa")

def convertir_a_xlsx(path_xls: Path) -> Path:
    print(f"🔁 Convirtiendo {path_xls.name} a .xlsx...")
    from openpyxl import Workbook

    df = pd.read_excel(path_xls, header=3, engine="xlrd", sheet_name=0)
    columnas_limpias = []
    for c in df.columns:
        nombre = str(c).encode("ascii", "ignore").decode(errors="ignore")
        nombre = nombre.replace("\x1e", "").replace("\n", " ").replace("\r", "").strip()
        columnas_limpias.append(nombre if nombre else "columna_sin_nombre")
    df.columns = columnas_limpias

    wb = Workbook()
    ws = wb.active
    ws.title = "ClientesDux"
    ws.append(df.columns.tolist())
    for row in df.itertuples(index=False, name=None):
        row_limpia = [(v.encode("utf-8", "ignore").decode(errors="ignore").replace("\x1e", "") if isinstance(v, str) else v) for v in row]
        ws.append(row_limpia)

    path_xlsx = path_xls.with_suffix(".xlsx")
    wb.save(path_xlsx)
    print(f"✅ Archivo convertido: {path_xlsx.name}")
    path_xls.unlink(missing_ok=True)
    return path_xlsx

def procesar_excel(ruta_archivo, mapa_vendedores: dict, engine):
    print(f"📖 Leyendo Excel sin encabezado, desde fila 0: {ruta_archivo}")
    df = pd.read_excel(ruta_archivo, header=None)
    print("🧪 Primeras filas:")
    print(df.head())

    df.columns = [
        "id", "fechaCreacion", "cliente", "categoriaFiscal", "tipoDocumento", "numeroDocumento",
        "cuitCuil", "cobrador", "tipoCliente", "personaContacto", "noEditable",
        "lugarEntregaPorDefecto", "tipoComprobantePorDefecto", "listaPrecioPorDefecto",
        "habilitado", "nombreFantasia", "codigo", "correoElectronico", "vendedor",
        "provincia", "localidad", "barrio", "domicilio", "telefono", "celular", "zona", "condicionPago"
    ]
    df = df.iloc[:, :27]
    df['fechaCreacion'] = pd.to_datetime(df['fechaCreacion'], format="%d/%m/%Y", errors="coerce")
    df["habilitado"] = df["habilitado"].map(lambda x: 1 if str(x).strip().upper() == "S" else 0)

    # 🧠 Resolver vendedorId a partir del texto 'vendedor'
    def resolver_vendedor_id(vtxt: str):
        clave = normalizar(vtxt or "")
        if not clave:
            return None
        # intento directo
        if clave in mapa_vendedores:
            return mapa_vendedores[clave]
        # fallback: invertir "NOMBRE APELLIDO" → "APELLIDO, NOMBRE"
        partes = clave.split(" ")
        if len(partes) >= 2:
            nombre = " ".join(partes[:-1])
            apellido = partes[-1]
            for k in armar_claves_nombre(apellido, nombre):
                if k in mapa_vendedores:
                    return mapa_vendedores[k]
        return None

    df["vendedorId"] = df["vendedor"].apply(resolver_vendedor_id)

    # Log de no matcheados (muestra hasta 20 únicos)
    no_match = df[(df["vendedor"].notna()) & (df["vendedor"] != "") & (df["vendedorId"].isna())]["vendedor"].unique()
    if len(no_match):
        vista = [str(x) for x in no_match[:20]]
        print(f"⚠️ Vendedores sin match ({len(no_match)}): {vista}{' ...' if len(no_match) > 20 else ''}")

    print("🛠 Insertando con ON DUPLICATE KEY UPDATE...")
    metadata = MetaData()
    clientes_table = Table("ClientesDux", metadata, autoload_with=engine)

    with engine.begin() as conn:
        for _, row in df.iterrows():
            row_data = row.where(pd.notnull(row), None).to_dict()  # 👈 reemplaza NaN por None
            insert_stmt = mysql_insert(clientes_table).values(row_data)
            update_stmt = insert_stmt.on_duplicate_key_update({
                k: insert_stmt.inserted[k] for k in row_data.keys() if k != 'id'
            })
            conn.execute(update_stmt)

    print("✅ Clientes importados (actualizados si existían)")

def guardar_log(mensaje: str):
    with open(Path(__file__).parent / "import_log.txt", "a") as f:
        f.write(f"[{datetime.now().isoformat()}] {mensaje}\n")

if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as e:
        print(f"❌ Error durante la ejecución: {e}")
        guardar_log(f"❌ Error: {e}")
