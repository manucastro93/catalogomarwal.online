import asyncio
import os
from pathlib import Path
from datetime import datetime
import pandas as pd
import unicodedata
from sqlalchemy import create_engine, MetaData, Table, text
from sqlalchemy.dialects.mysql import insert as mysql_insert
from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError as PwTimeout

# 📦 Cargar variables de entorno
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
USUARIO = os.getenv("DUX_USER", "")
CONTRASENA = os.getenv("DUX_PASS", "")
DUX_SUCURSAL = os.getenv("DUX_API_SUCURSAL_CASA_CENTRAL", "").strip() or None  # opcional
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")
DB_DIALECT = os.getenv("DB_DIALECT", "mysql")

DATABASE_URL = f"{DB_DIALECT}+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ---------- Normalización vendedores ----------
def normalizar(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = " ".join(s.split())
    return s

def armar_claves_nombre(apellido: str, nombre: str):
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

def ensure_schema(engine):
    """Asegura columna vendedorId e índice, compatible con MySQL/MariaDB viejos."""
    with engine.begin() as conn:
        # Verificar si la columna ya existe
        existe_col = conn.execute(text("""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = :db
              AND TABLE_NAME = 'ClientesDux'
              AND COLUMN_NAME = 'vendedorId'
        """), {"db": DB_NAME}).scalar()

        if not existe_col:
            conn.execute(text("ALTER TABLE ClientesDux ADD vendedorId INT NULL"))

        # Verificar si el índice ya existe
        existe_idx = conn.execute(text("""
            SELECT COUNT(1)
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = :db
              AND TABLE_NAME = 'ClientesDux'
              AND INDEX_NAME = 'idx_clientesdux_vendedorId'
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

# ---------- Utilidades Playwright (robustas, mismas del script que funciona) ----------
SEL = {
    "login_user": 'input[name="formLogin:inputUsuario"]',
    "login_pass": 'input[name="formLogin:inputPassword"]',
    "login_btn":  '#formLogin\\:btnLoginBlock',
}

def all_frames(page):
    frames = []
    try:
        mf = page.main_frame
        if mf:
            frames.append(mf)
    except Exception:
        pass
    for fr in page.frames:
        if fr not in frames:
            frames.append(fr)
    return frames

async def wait_locator_any_frame(page, selector: str, *, state: str | None = None, timeout: int = 8000):
    elapsed = 0
    step = 200
    while elapsed < timeout:
        for fr in all_frames(page):
            try:
                loc = fr.locator(selector)
                if await loc.count():
                    if state:
                        try:
                            await loc.first.wait_for(state=state, timeout=step)
                        except Exception:
                            continue
                    return fr, loc
            except Exception:
                continue
        await page.wait_for_timeout(step)
        elapsed += step
    raise PwTimeout(f"No encontré selector en ningún frame: {selector}")

async def select_one_menu(page, label_selector: str, *, by_text: str | None = None, index: int = 0, timeout=4000):
    fr, lab = await wait_locator_any_frame(page, label_selector, state="visible", timeout=timeout)
    await lab.first.click()
    listbox = fr.locator('ul[role="listbox"]').first
    await listbox.wait_for(state="visible", timeout=timeout)
    if by_text:
        opt = listbox.locator('li[role="option"]', has_text=by_text).first
        await opt.click()
    else:
        opt = listbox.locator('li[role="option"]').nth(index)
        await opt.click()
    await fr.wait_for_timeout(120)

async def accept_sucursal(page, *, prefer_text: str | None, timeout: int = 12000):
    """
    Pantalla 'Seleccione Sucursal' / 'Seleccione Empresa'.
    Tolera cambios de IDs (PrimeFaces) y múltiples frames.
    """
    # 1) Intentar abrir y elegir empresa/sucursal si hay combos visibles
    candidatos_empresa = [
        '#formInicio\\:j_idt910_label',
        '#formInicio\\:j_idt900_label',
        '#formInicio\\:j_idt905_label',
        'label:has-text("Empresa") >> xpath=following::*[contains(@id, "_label")][1]'
    ]
    for sel in candidatos_empresa:
        try:
            await select_one_menu(page, sel, index=0, timeout=800)
            break
        except Exception:
            continue

    candidatos_sucursal = [
        '#formInicio\\:j_idt915_label',
        '#formInicio\\:j_idt905_label',
        '#formInicio\\:j_idt900_label',
        'label:has-text("Sucursal") >> xpath=following::*[contains(@id, "_label")][1]'
    ]
    suc_ok = False
    for sel in candidatos_sucursal:
        try:
            if prefer_text:
                await select_one_menu(page, sel, by_text=prefer_text, timeout=800)
            else:
                await select_one_menu(page, sel, index=0, timeout=800)
            suc_ok = True
            break
        except Exception:
            continue

    # 2) Click en "Aceptar" por múltiples variantes
    candidatos_aceptar = [
        '#formInicio\\:j_idt920',
        '#formInicio\\:j_idt910',
        'form#formInicio button.ui-button:has-text("Aceptar")',
        'button:has(span.ui-button-text:has-text("Aceptar"))'
    ]
    clicked = False
    for sel in candidatos_aceptar:
        try:
            fr, btn = await wait_locator_any_frame(page, sel, state="visible", timeout=600)
            await btn.first.scroll_into_view_if_needed()
            await btn.first.click()
            clicked = True
            break
        except Exception:
            continue
    if not clicked:
        # Último recurso: disparar click/onclick por JS
        for fr in all_frames(page):
            try:
                ok = await fr.evaluate("""
                    () => {
                        const cands = [
                          '#formInicio\\\\:j_idt920',
                          '#formInicio\\\\:j_idt910',
                          'form#formInicio button.ui-button'
                        ];
                        for (const s of cands) {
                          const b = document.querySelector(s);
                          if (!b) continue;
                          if (typeof b.onclick === 'function') { b.onclick(); return true; }
                          b.click(); return true;
                        }
                        return false;
                    }
                """)
                if ok:
                    clicked = True
                    break
            except Exception:
                continue

    # 3) Espera que desaparezca el form o cambie la vista
    try:
        fr_form, form = await wait_locator_any_frame(page, 'form#formInicio', timeout=600)
        try:
            await form.first.wait_for(state='detached', timeout=1000)
        except Exception:
            pass
    except Exception:
        pass

    return suc_ok or clicked

# ---------- Flujo principal ----------
async def run():
    download_dir = Path(__file__).parent / "descargas"
    download_dir.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True, viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        print("🔐 Iniciando sesión...")
        await page.goto("https://erp.duxsoftware.com.ar", wait_until="domcontentloaded")
        # a veces aparece access-duplied; continuar igualmente
        try:
            fr_user, user_inp = await wait_locator_any_frame(page, SEL["login_user"], state="visible", timeout=4000)
            pass_inp = fr_user.locator(SEL["login_pass"]).first
            await pass_inp.wait_for(state="visible", timeout=2000)

            await user_inp.click(); await user_inp.fill(""); await user_inp.type(USUARIO, delay=10)
            await pass_inp.click(); await pass_inp.fill(""); await pass_inp.type(CONTRASENA, delay=10)

            # Enter + botón por si PrimeFaces ignora la tecla
            try:
                await pass_inp.press("Enter")
                await page.wait_for_timeout(300)
            except Exception:
                pass

            login_btn = fr_user.locator(SEL["login_btn"]).first
            if await login_btn.count():
                await login_btn.click()
        except Exception:
            # Si ya está logueado o cambió la ruta, seguimos
            pass

        print("⏳ Seleccionando sucursal/empresa (robusto)…")
        try:
            await accept_sucursal(page, prefer_text=DUX_SUCURSAL, timeout=12000)
        except Exception:
            # Si no aparece la pantalla, seguimos (puede haber recordado la selección)
            pass

        # ⬇️ A partir de acá, tu flujo original con pequeñas esperas más tolerantes
        print("🟢 Ingresando al sistema…")
        # No forzamos click específico; ya deberías estar “adentro” tras aceptar
        await page.wait_for_load_state('domcontentloaded')
        await page.wait_for_timeout(400)

        print("📊 Menú DATA Y ANALÍTICAS → BASE DATOS → Clientes...")
        # Clicks tolerantes por texto (en cualquier frame)
        async def click_text(txt, timeout=5000):
            for fr in all_frames(page):
                try:
                    loc = fr.get_by_text(txt, exact=True)
                except AttributeError:
                    loc = fr.locator(f'text="{txt}"')
                try:
                    if await loc.count():
                        await loc.first.click()
                        return True
                except Exception:
                    continue
            return False

        await click_text("DATA Y ANALITICAS")
        await page.wait_for_timeout(300)
        await click_text("BASE DATOS")
        await page.wait_for_timeout(300)
        await click_text("Clientes")
        try:
            await page.wait_for_url('**/listaClienteBeta.faces', timeout=15000)
        except Exception:
            pass
        await page.wait_for_load_state('domcontentloaded')
        await page.wait_for_timeout(500)

        print("🧩 Menú Acciones → Exportar...")
        # abrir Acciones por variantes
        opened = False
        for sel in ['#formCabecera\\:idAcciones', '#formNorth\\:idBtnGear', 'button:has-text("Acciones")', '.ui-button:has(span.ui-button-text:has-text("Acciones"))']:
            try:
                fr, btn = await wait_locator_any_frame(page, sel, state="visible", timeout=5000)
                await btn.first.click()
                opened = True
                break
            except Exception:
                continue
        if opened:
            await page.wait_for_timeout(300)
            await click_text("Exportar")
            await page.wait_for_timeout(600)

        print("⬇️ Esperando ícono de descarga en ventana de exportaciones / historial...")
        # Intentar que aparezca la ventana
        try:
            for fr in all_frames(page):
                try:
                    await fr.evaluate("""
                        () => {
                            try { if (typeof window.visibleVentanaDescargas === 'function') window.visibleVentanaDescargas(true); } catch(_) {}
                            try { if (typeof window.rcProcesarRespuestaWsInformes === 'function') window.rcProcesarRespuestaWsInformes({}); } catch(_) {}
                        }
                    """)
                except Exception:
                    continue
            # esperar ventana
            try:
                await wait_locator_any_frame(page, '#ventana_descargas', timeout=5000)
            except Exception:
                # ir al historial
                await page.goto("https://erp.duxsoftware.com.ar/pages/estadisticas/historialExportaciones.faces", wait_until="domcontentloaded")
        except Exception:
            pass

        # Buscar botón de descarga en cualquier frame
        async def descargar_primero(prefer_texts=("Clientes", "CLIENTES")):
            candidatos_contenedor = [
                '#id-lista-archivos > div',
                '.lista-archivos > div',
                '#id-lista-archivos div[style*="display: flex"]',
                '.lista-archivos div[style*="display: flex"]'
            ]
            for fr in all_frames(page):
                # si hay botones sueltos
                btns = fr.locator('.btn-descarga, .fa-cloud-download, [onclick*="descargarArchivo("]')
                if await btns.count():
                    # pick por preferencia textual
                    pick = 0
                    for i in range(await btns.count()):
                        txt = await btns.nth(i).evaluate("""(el) => {
                            let p = el, out = '';
                            for (let k=0;k<6 && p;k++){ out += (p.innerText||''); p = p.parentElement; }
                            return out;
                        }""")
                        if any(t in txt for t in prefer_texts):
                            pick = i
                            break
                    async with page.expect_download() as dl_info:
                        await btns.nth(pick).click()
                    return await dl_info.value

                # o listados
                for sel in candidatos_contenedor:
                    cont = fr.locator(sel)
                    if await cont.count():
                        n = await cont.count()
                        target = 0
                        for i in range(n):
                            txt = await cont.nth(i).inner_text()
                            if any(t in txt for t in prefer_texts):
                                target = i
                                break
                        fila = cont.nth(target)
                        icono = fila.locator('.btn-descarga, .fa-cloud-download, [onclick*="descargarArchivo("]').first
                        if await icono.count():
                            try:
                                async with page.expect_download() as dl_info:
                                    await icono.click()
                                return await dl_info.value
                            except Exception:
                                async with page.expect_download() as dl_info:
                                    await icono.evaluate("(el) => (typeof el.onclick === 'function') ? el.onclick() : el.click()")
                                return await dl_info.value
            raise PwTimeout("No encontré botón/ícono de descarga.")

        try:
            download = await descargar_primero(prefer_texts=("Clientes", "CLIENTES"))
        except Exception as e:
            raise

        hoy = datetime.now().strftime("%Y-%m-%d")
        xls_original = Path(__file__).parent / "descargas" / f"clientes_dux_{hoy}.xls"
        await download.save_as(xls_original)

        xls_sanitizado = Path(__file__).parent / "descargas" / "temp_clientes_dux.xls"
        try:
            if xls_sanitizado.exists():
                xls_sanitizado.unlink()
        except Exception:
            pass
        xls_original.rename(xls_sanitizado)

        print(f"✅ Archivo descargado correctamente: {xls_sanitizado}")
        xlsx_path = convertir_a_xlsx(xls_sanitizado)

        # 🔗 DB engine + schema + mapa de vendedores
        engine = create_engine(DATABASE_URL)
        ensure_schema(engine)
        mapa_vendedores = construir_mapa_personal(engine)

        procesar_excel(xlsx_path, mapa_vendedores, engine)
        guardar_log("✅ Importación exitosa")

# ---------- Conversión y carga ----------
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

    def resolver_vendedor_id(vtxt: str):
        clave = normalizar(vtxt or "")
        if not clave:
            return None
        if clave in mapa_vendedores:
            return mapa_vendedores[clave]
        partes = clave.split(" ")
        if len(partes) >= 2:
            nombre = " ".join(partes[:-1])
            apellido = partes[-1]
            for k in armar_claves_nombre(apellido, nombre):
                if k in mapa_vendedores:
                    return mapa_vendedores[k]
        return None

    df["vendedorId"] = df["vendedor"].apply(resolver_vendedor_id)

    no_match = df[(df["vendedor"].notna()) & (df["vendedor"] != "") & (df["vendedorId"].isna())]["vendedor"].unique()
    if len(no_match):
        vista = [str(x) for x in no_match[:20]]
        print(f"⚠️ Vendedores sin match ({len(no_match)}): {vista}{' ...' if len(no_match) > 20 else ''}")

    print("🛠 Insertando con ON DUPLICATE KEY UPDATE...")
    metadata = MetaData()
    clientes_table = Table("ClientesDux", metadata, autoload_with=engine)

    with engine.begin() as conn:
        for _, row in df.iterrows():
            row_data = row.where(pd.notnull(row), None).to_dict()
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
