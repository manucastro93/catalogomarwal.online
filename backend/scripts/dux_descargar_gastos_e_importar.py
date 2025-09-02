#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import subprocess
from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError as PwTimeout

# 📦 .env
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=BASE_DIR / ".env")

DUX_USER = os.getenv("DUX_USER", "")
DUX_PASS = os.getenv("DUX_PASS", "")
DUX_SUCURSAL = os.getenv("DUX_API_SUCURSAL_CASA_CENTRAL", "").strip() or None  # p.ej. "ECOMMERCE"

# Rutas
SCRIPTS_DIR = Path(__file__).resolve().parent
DESCARGAS_DIR = SCRIPTS_DIR / "descargas"
DESCARGAS_DIR.mkdir(exist_ok=True)

IMPORTADOR = SCRIPTS_DIR / "importar_comprobantes_servicios.py"
if not IMPORTADOR.exists():
    print(f"❌ No encuentro el importador en: {IMPORTADOR}")
    sys.exit(2)

# 🔎 Selectors
SEL = {
    "login_user": 'input[name="formLogin:inputUsuario"]',
    "login_pass": 'input[name="formLogin:inputPassword"]',
    "login_btn":  '#formLogin\\:btnLoginBlock',

    # Selección sucursal
    "empresa_label":  '#formInicio\\:j_idt910_label',
    "sucursal_label": '#formInicio\\:j_idt915_label',
    "btn_aceptar":    '#formInicio\\:j_idt920',

    # Ventana / Historial de descargas
    "ventana_descargas": '#ventana_descargas',
    "lista_archivos":    '#id-lista-archivos, .lista-archivos',
    "btn_descarga":      '.btn-descarga, .fa-cloud-download, [onclick*="descargarArchivo("]'
}

# -------------------- Helpers base --------------------

async def goto_and_wait(page, url: str, *, wait="domcontentloaded", timeout=45000):
    """Navega y espera 'domcontentloaded' por defecto (más confiable que 'networkidle')."""
    await page.goto(url, wait_until=wait, timeout=timeout)
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=3000)
    except Exception:
        pass

async def dump_debug(page, tag: str):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    png = DESCARGAS_DIR / f"debug_{tag}_{ts}.png"
    html = DESCARGAS_DIR / f"debug_{tag}_{ts}.html"
    try:
        await page.screenshot(path=str(png), full_page=True)
        content = await page.content()
        html.write_text(content, encoding="utf-8")
        print(f"🧩 DEBUG guardado: {png} / {html}")
    except Exception as e:
        print(f"⚠️ No pude guardar debug {tag}: {e}")

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
    """Espera y devuelve (frame, locator) del primer match en cualquier frame."""
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

async def click_any_frame(page, selector: str, *, timeout: int = 2000):
    fr, loc = await wait_locator_any_frame(page, selector, state="visible", timeout=timeout)
    await loc.first.scroll_into_view_if_needed()
    await loc.first.click()
    return True

# -------------------- Funciones DOM específicas --------------------

async def select_one_menu(page, label_selector: str, *, by_text: str | None = None, index: int = 0, timeout=4000):
    fr, _lab = await wait_locator_any_frame(page, label_selector, state="visible", timeout=timeout)
    await _lab.first.click()
    listbox = fr.locator('ul[role="listbox"]').first
    await listbox.wait_for(state="visible", timeout=timeout)
    if by_text:
        opt = listbox.locator('li[role="option"]', has_text=by_text).first
        await opt.click()
    else:
        opt = listbox.locator('li[role="option"]').nth(index)
        await opt.click()
    await fr.wait_for_timeout(120)

async def accept_sucursal(page, *, prefer_text: str | None, timeout: int = 6000):
    """
    Selecciona sucursal (si aparece) y hace click en Aceptar de forma robusta
    en la pantalla 'Seleccione Sucursal'.
    """

    # Click Aceptar por varias variantes
    candidatos = [
        '#formInicio\\:j_idt920',
        'form#formInicio button.ui-button:has-text("Aceptar")',
        'button:has(span.ui-button-text:has-text("Aceptar"))'
    ]

    clicked = False
    for sel in candidatos:
        try:
            fr, btn = await wait_locator_any_frame(page, sel, state="visible", timeout=400)
            await btn.first.scroll_into_view_if_needed()
            await btn.first.click()
            clicked = True
            break
        except Exception:
            continue

    if not clicked:
        # Último recurso: ejecutar el onclick desde JS
        for fr in all_frames(page):
            try:
                ok = await fr.evaluate("""
                    () => {
                        const b = document.querySelector('#formInicio\\\\:j_idt920')
                              || document.querySelector('form#formInicio button.ui-button');
                        if (!b) return false;
                        if (typeof b.onclick === 'function') { b.onclick(); return true; }
                        b.click(); return true;
                    }
                """)
                if ok:
                    clicked = True
                    break
            except Exception:
                continue

    if not clicked:
        raise PwTimeout("No pude clickear Aceptar en el selector de empresa/sucursal.")

    # Espera a que la pantalla de selección desaparezca o avance
    try:
        fr_form, form = await wait_locator_any_frame(page, 'form#formInicio', timeout=400)
        try:
            await form.first.wait_for(state='detached', timeout=400)
        except Exception:
            # o que aparezca alguna UI de la siguiente vista
            try:
                await wait_locator_any_frame(page, '#formCabecera', timeout=400)
            except Exception:
                pass
    except Exception:
        # si no encontramos el form, ya desapareció
        pass

async def set_date_range_last_30(page):
    # dd/mm/yy (2 dígitos)
    desde_val = (datetime.now() - timedelta(days=30)).strftime("%d/%m/%y")
    hasta_val = datetime.now().strftime("%d/%m/%y")

    # 1) localizar inputs de forma robusta
    candidatos_desde = [
        '#formCabecera\\:j_idt922_input',
        'label.ui-outputlabel:has-text("Fecha Desde") >> xpath=following::input[contains(@id,"_input")][1]'
    ]
    candidatos_hasta = [
        '#formCabecera\\:j_idt924_input',
        '#formCabecera\\:j_idt923_input',
        'label.ui-outputlabel:has-text("Fecha Hasta") >> xpath=following::input[contains(@id,"_input")][1]',
        'input.ui-inputfield.ui-widget.ui-state-default.ui-corner-all.hasDatepicker >> nth=1'
    ]

    async def set_value_and_fire(fr, el, value):
        # limpiar y escribir
        try:
            await el.click()
            for mod in ("Control", "Meta"):
                try: await fr.keyboard.press(f"{mod}+A")
                except: pass
            await fr.keyboard.press("Backspace")
            await el.type(value, delay=8)
        except Exception:
            pass

        # asegurar por JS + eventos
        await el.evaluate(
            "(e, val) => { e.value = val; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); }",
            value
        )
        # blur suave
        try:
            await fr.keyboard.press("Tab")
        except Exception:
            pass
        await fr.wait_for_timeout(120)

        # forzar el mismo PF AJAX que usa el input (id del componente sin '_input')
        comp_id = await el.evaluate("e => e.id?.replace(/_input$/, '') || null")
        if comp_id:
            await fr.evaluate(
                """(cid) => {
                    try {
                      if (window.PrimeFaces && PrimeFaces.ab) {
                        PrimeFaces.ab({s: cid, e: "change", f: "formCabecera", p: cid, u: "formPrincipal formIndicadores"});
                      }
                    } catch(_) {}
                }""",
                comp_id
            )
            await fr.wait_for_timeout(150)

    # setear DESDE
    desde_fr = desde_el = None
    for sel in candidatos_desde:
        try:
            desde_fr, loc = await wait_locator_any_frame(page, sel, timeout=2500)
            desde_el = loc.first
            break
        except Exception:
            continue

    # setear HASTA
    hasta_fr = hasta_el = None
    for sel in candidatos_hasta:
        try:
            hasta_fr, loc = await wait_locator_any_frame(page, sel, timeout=2500)
            hasta_el = loc.first
            break
        except Exception:
            continue

    if desde_el:
        await set_value_and_fire(desde_fr, desde_el, desde_val)
    if hasta_el:
        await set_value_and_fire(hasta_fr, hasta_el, hasta_val)

    # verificación rápida (opcional)
    try:
        if desde_el:
            v = await desde_el.evaluate("e => e.value")
            # si aún no quedó, un segundo intento rápido
            if (v or "").strip() != desde_val:
                await set_value_and_fire(desde_fr, desde_el, desde_val)
        if hasta_el:
            v = await hasta_el.evaluate("e => e.value")
            if (v or "").strip() != hasta_val:
                await set_value_and_fire(hasta_fr, hasta_el, hasta_val)
    except Exception:
        pass

async def commit_fechas(page):
    """Postea formCabecera para que el server tome DESDE/HASTA antes de exportar."""
    candidatos = [
        '#formCabecera\\:j_idt922_input',  # Desde
        '#formCabecera\\:j_idt924_input',  # Hasta (variante 1)
        '#formCabecera\\:j_idt923_input',  # Hasta (variante 2)
    ]
    for sel in candidatos:
        try:
            fr, loc = await wait_locator_any_frame(page, sel, timeout=1200)
            el = loc.first
            comp_id = await el.evaluate("e => (e.id||'').replace(/_input$/, '')")
            if not comp_id:
                continue
            # Igual que el onchange del HTML, pero esperando oncomplete
            await fr.evaluate(
                """(cid) => new Promise(res => {
                    try {
                      if (window.PrimeFaces && PrimeFaces.ab) {
                        PrimeFaces.ab({
                          s: cid, e: "change", f: "formCabecera",
                          p: cid + " formCabecera",
                          u: "formCabecera formPrincipal formIndicadores",
                          onco: function(){ res(true); }
                        });
                      } else { res(true); }
                    } catch(e){ res(true); }
                })""",
                comp_id
            )
            # pequeña espera para que termine el re-render
            await fr.wait_for_timeout(150)
        except Exception:
            pass

    # plan B: si existe un botón "Buscar/Aplicar", clickealo
    for btn_sel in [
        'form#formCabecera button:has-text("Buscar")',
        'form#formCabecera button:has-text("Aplicar")',
        'form#formCabecera button.ui-button'
    ]:
        try:
            await click_any_frame(page, btn_sel, timeout=600)
            await page.wait_for_timeout(200)
            break
        except Exception:
            continue

async def try_open_actions_and_export(page, *, timeout=7000):
    """Best-effort: intenta Acciones→Exportar. Si falla, seguimos por historial."""
    # (lo dejamos por si algún día querés volver a usarlo; no se invoca en este flujo)
    try:
        # abrir rápido por varias variantes
        for s in [
            '#formNorth\\:idBtnGear',
            '#formCabecera\\:idAcciones',
            'button:has-text("Acciones")',
            '.ui-button:has(span.ui-button-text:has-text("Acciones"))',
            'span.ui-button-text:has-text("Acciones") >> xpath=ancestor::button[1]'
        ]:
            try:
                await click_any_frame(page, s, timeout=1200)
                break
            except Exception:
                continue
        # menú
        for fr in all_frames(page):
            menu = fr.locator(
                '#formNorth\\:j_idt911, div[role="menubar"].ui-menu-overlay, .ui-tieredmenu.ui-menu-overlay, .ui-menu.ui-menu-overlay'
            ).first
            if await menu.count():
                await menu.wait_for(state="visible", timeout=1200)
                link = menu.locator('a.ui-menuitem-link:has(span.ui-menuitem-text:has-text("Exportar"))').first
                if await link.count():
                    await link.click()
                    return True
        return False
    except Exception:
        return False

async def ensure_download_source(page, *, timeout=20000):
    """
    Va directo al historial y fuerza refresco. Retorna "historial" si hay
    al menos algún contenedor o botón de descarga visible.
    """
    await goto_and_wait(page, "https://erp.duxsoftware.com.ar/pages/estadisticas/historialExportaciones.faces")

    # intentá botones de "Actualizar/Refrescar" si existen (en cualquier frame)
    for fr in all_frames(page):
        for s in [
            'button:has-text("Actualizar")',
            'button:has-text("Refrescar")',
            '#formPrincipal\\:btnActualizar',
            '#formPrincipal\\:btnRefrescar'
        ]:
            try:
                btn = fr.locator(s).first
                if await btn.count():
                    await btn.click()
                    await fr.wait_for_timeout(400)
            except Exception:
                continue

    # pequeña espera a que aparezcan filas o botones
    try:
        await wait_locator_any_frame(page, '#id-lista-archivos, .lista-archivos', timeout=6000)
    except Exception:
        pass  # puede que los botones estén sueltos

    # si no hay contenedor, exigimos que haya al menos un botón-compatible
    try:
        await wait_locator_any_frame(page, '.btn-descarga, .fa-cloud-download, [onclick*="descargarArchivo("]', timeout=timeout)
    except Exception:
        await dump_debug(page, "historial_timeout")
        raise PwTimeout("Historial sin descargas visibles (ni contenedor ni botones).")

    return "historial"

async def download_latest_from_listing(page, prefer_texts=("Gestion de Gastos", "Gestión de Gastos", "GASTOS", "Gestión de Servicios")):
    """
    Busca y descarga SOLO 'Gestión de Gastos'. Reintenta si hay navegación durante el conteo.
    """
    def match_text(t: str) -> bool:
        t = (t or "").upper()
        return any(p.upper() in t for p in prefer_texts)

    async def try_once():
        # 1) Botones sueltos con validación por texto en ancestros
        for fr in all_frames(page):
            btns = fr.locator('.btn-descarga, .fa-cloud-download, [onclick*="descargarArchivo("]')
            try:
                n = await btns.count()
            except Exception:
                continue  # navegación en medio del conteo, probá otro frame
            for i in range(n):
                try:
                    txt = await btns.nth(i).evaluate("""(el) => {
                        let p = el, out = '';
                        for (let k=0;k<6 && p;k++){ out += (p.innerText||''); p = p.parentElement; }
                        return out;
                    }""")
                except Exception:
                    continue
                if not match_text(txt):
                    continue
                async with page.expect_download() as dl_info:
                    try:
                        await btns.nth(i).click()
                    except Exception:
                        await btns.nth(i).evaluate("(e) => (typeof e.onclick === 'function') ? e.onclick() : e.click()")
                return await dl_info.value

        # 2) Filas de listados
        cont_sel = [
            '#id-lista-archivos > div',
            '.lista-archivos > div',
            '#id-lista-archivos div[style*="display: flex"]',
            '.lista-archivos div[style*="display: flex"]'
        ]
        for fr in all_frames(page):
            for sel in cont_sel:
                cont = fr.locator(sel)
                try:
                    m = await cont.count()
                except Exception:
                    continue
                for i in range(m):
                    try:
                        txt = await cont.nth(i).inner_text()
                    except Exception:
                        continue
                    if not match_text(txt):
                        continue
                    icono = cont.nth(i).locator('.btn-descarga, .fa-cloud-download, [onclick*="descargarArchivo("]').first
                    if await icono.count():
                        async with page.expect_download() as dl_info:
                            try:
                                await icono.click()
                            except Exception:
                                await icono.evaluate("(e) => (typeof e.onclick === 'function') ? e.onclick() : e.click()")
                        return await dl_info.value
        return None

    # Hasta 3 intentos si la UI se está re-renderizando
    for intento in range(3):
        try:
            dl = await try_once()
            if dl:
                return dl
            # si no encontró nada, probá refrescar el historial
            try:
                await ensure_download_source(page, timeout=6000)
            except Exception:
                pass
            await page.wait_for_timeout(600)
        except Exception:
            # navegación en medio del conteo / render — backoff suave
            await page.wait_for_timeout(800 + intento * 400)

    await dump_debug(page, "fila_sin_boton_gastos")
    raise PwTimeout("No encontré botón de descarga para **Gestión de Gastos**.")
# -------------------- Main --------------------

async def run():
    async with async_playwright() as p:
        # 👀 visible para debug rápido; poné True si querés headless
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True, viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        print("🔐 Login Dux…")
        await goto_and_wait(page, "https://erp.duxsoftware.com.ar", wait="domcontentloaded")

        # login multi-frame rápido
        try:
            try: await page.keyboard.press("Escape")
            except: pass

            fr_user, user_inp = await wait_locator_any_frame(page, SEL["login_user"], state="visible", timeout=500)
            pass_inp = fr_user.locator(SEL["login_pass"]).first
            await pass_inp.wait_for(state="visible", timeout=500)

            await user_inp.click(); await user_inp.fill(""); await user_inp.type(DUX_USER, delay=10)
            await pass_inp.click(); await pass_inp.fill(""); await pass_inp.type(DUX_PASS, delay=10)

            try:
                await pass_inp.press("Enter")
                await page.wait_for_timeout(400)
            except: pass

            login_btn = fr_user.locator(SEL["login_btn"]).first
            if await login_btn.count():
                await login_btn.click()

            # no esperes mucho: seguimos al selector rápido
            await page.wait_for_timeout(150)
        except PwTimeout:
            pass

        print("🏬 Seleccionando sucursal/empresa (fast)…")
        try:
            await accept_sucursal(page, prefer_text=DUX_SUCURSAL, timeout=400)
        except Exception:
            # si no está la pantalla, seguimos
            pass

        # ⚡️ directo a Gastos (sin menú)
        print("➡️ Yendo directo a Gastos…")
        await goto_and_wait(page, "https://erp.duxsoftware.com.ar/pages/compras/gestionServicio/gestionCompServicio.faces")

        # listo, pequeña pausa de estabilización
        await page.wait_for_timeout(250)

        print("📦 Acciones → Exportar… (best effort; puede omitirse)")
        await set_date_range_last_30(page)
        await commit_fechas(page)
        # si querés NO intentar Acciones, comentá la siguiente línea:
        await try_open_actions_and_export(page, timeout=6000)

        print("⬇️ Buscando fuente de descargas…")
        try:
            origen = await ensure_download_source(page, timeout=12000)
        except Exception:
            await dump_debug(page, "ensure_window_fail")
            raise

        print(f"💾 Descargando XLS… (origen: {origen})")
        try:
            dl = await download_latest_from_listing(page)
        except Exception:
            await dump_debug(page, f"download_fail_{origen}")
            raise

        xls_destino = DESCARGAS_DIR / "temp_gastos_dux.xls"
        try:
            if xls_destino.exists():
                xls_destino.unlink()
        except Exception:
            pass

        await dl.save_as(xls_destino)
        # 🔍 Smoke test rápido: la primera fila debería contener textos de Gastos
        try:
            import pandas as pd
            df_test = pd.read_excel(xls_destino, header=None, nrows=3)
            primera_fila = " ".join([str(x) for x in df_test.iloc[0].tolist() if str(x) != "nan"]).upper()
            pistas = ("COMPROBANTE", "COMPRA", "FACTURA", "PROVEEDOR")  # típicos campos de Gastos/Compras
            if not any(p in primera_fila for p in pistas):
                raise PwTimeout(f"El XLS descargado no parece ser de Gastos. Pista fila 0: {primera_fila[:180]}")
        except Exception as _e:
            raise
        print(f"✅ XLS guardado en: {xls_destino}")

        print("🚚 Ejecutando importador…")
        cmd = [sys.executable, str(IMPORTADOR), str(xls_destino)]
        r = subprocess.run(cmd, cwd=BASE_DIR, capture_output=True, text=True)

        if r.returncode == 0:
            print("✅ Importación OK")
            print(r.stdout[-2000:])
        else:
            print("❌ Importación falló")
            print(r.stdout)
            print(r.stderr)
            sys.exit(r.returncode)

if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
