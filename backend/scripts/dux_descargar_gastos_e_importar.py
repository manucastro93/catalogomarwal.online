#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime
import subprocess
from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError as PwTimeout

# 📦 .env (mismo esquema que el bot de clientes)
BASE_DIR = Path(__file__).resolve().parents[1]  # ../ (raíz backend)
load_dotenv(dotenv_path=BASE_DIR / ".env")

DUX_USER = os.getenv("DUX_USER", "")
DUX_PASS = os.getenv("DUX_PASS", "")
DUX_SUCURSAL = os.getenv("DUX_API_SUCURSAL_CASA_CENTRAL", "").strip() or None

# Rutas
SCRIPTS_DIR = Path(__file__).resolve().parent
DESCARGAS_DIR = SCRIPTS_DIR / "descargas"
DESCARGAS_DIR.mkdir(exist_ok=True)

# Importador existente
IMPORTADOR = SCRIPTS_DIR / "importar_comprobantes_servicios.py"
if not IMPORTADOR.exists():
    print(f"❌ No encuentro el importador en: {IMPORTADOR}")
    sys.exit(2)

# 🔎 Selectors “robustos” (funcionan aunque cambien ids)
SEL = {
    "login_user": 'input[name="formLogin:inputUsuario"]',
    "login_pass": 'input[name="formLogin:inputPassword"]',
    "login_btn":  '#formLogin\\:btnLoginBlock',

    # pantalla "Seleccione Sucursal"
    "empresa_label":  '#formInicio\\:j_idt910_label',
    "sucursal_label": '#formInicio\\:j_idt915_label',
    "btn_aceptar":    '#formInicio\\:j_idt920',

    # menú lateral
    "menu_compras_text": 'text=COMPRAS',
    "menu_gastos_text":  'text=Gastos',
    "gastos_href": 'a[href="/pages/compras/gestionServicio/gestionCompServicio.faces"]',

    # Acciones → Exportar
    "acciones_btn_by_text": 'role=button[name="Acciones"]',
    "acciones_btn_any":     '#formCabecera\\:idAcciones',
    "exportar_text":        'text=Exportar',

    # ventana de descargas
    "ventana_descargas": '#ventana_descargas',
    "btn_descarga":      '.btn-descarga',
}

async def goto_and_wait(page, url: str, **kwargs):
    await page.goto(url, **kwargs)
    await page.wait_for_load_state('networkidle')


async def click_safe(page, selector: str, *, timeout=20000):
    try:
        await page.wait_for_selector(selector, timeout=timeout)
        await page.click(selector)
        return True
    except PwTimeout:
        return False


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True)
        page = await context.new_page()

        print("🔐 Login Dux…")
        await goto_and_wait(page, "https://erp.duxsoftware.com.ar")
        await page.fill(SEL["login_user"], DUX_USER)
        await page.fill(SEL["login_pass"], DUX_PASS)
        await page.click(SEL["login_btn"])

        print("🏬 Seleccionando sucursal/empresa…")

        # helper para PrimeFaces SelectOneMenu
        async def select_one_menu(page, label_selector: str, *, by_text: str | None = None, index: int = 0, timeout=10000):
            # abre el dropdown clickeando el label
            await page.wait_for_selector(label_selector, timeout=timeout)
            await page.click(label_selector)

            # aparece un <ul role="listbox"> con <li role="option">
            listbox = page.locator('ul[role="listbox"]').first
            await listbox.wait_for(state="visible", timeout=timeout)

            if by_text:
                opt = listbox.locator('li[role="option"]', has_text=by_text).first
                await opt.click()
            else:
                opt = listbox.locator('li[role="option"]').nth(index)
                await opt.click()

            # pequeña pausa para que PrimeFaces haga el update
            await page.wait_for_timeout(200)

        # esta pantalla puede no aparecer si ya quedó sesión previa;
        # chequeo rápido y, si no está, sigo
        try:
            await page.wait_for_selector(SEL["empresa_label"], timeout=8000)
            # Empresa: dejá la seleccionada (o elegí por texto si querés)
            # await select_one_menu(page, SEL["empresa_label"], by_text="INOXIDABLE MARWAL S.R.L.")
            # Sucursal: elegí por texto o por índice (0=CASA CENTRAL, 1=ECOMMERCE según tu HTML)
            # ⇒ Si querés ECOMMERCE:
            await select_one_menu(page, SEL["sucursal_label"], by_text=DUX_SUCURSAL or None, index=1 if not DUX_SUCURSAL else 0)

            # Aceptar
            await page.click(SEL["btn_aceptar"])
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(400)
        except PwTimeout:
            # no apareció la pantalla, continuo como si ya estuvieras dentro
            pass

        print("🧾 Menú COMPRAS → Gastos…")
        # Primero por texto (más estable)
        ok = await click_safe(page, SEL["menu_compras_text"])
        if not ok:
            print("  ⚠️ No encontré COMPRAS por texto, intento por href directo a Gastos…")
        else:
            await page.wait_for_timeout(250)
            ok = await click_safe(page, SEL["menu_gastos_text"])
            if not ok:
                print("  ⚠️ No encontré Gastos por texto, intento por href directo…")

        # Fallback: ir directo a la URL de Gastos
        if not ok:
            await goto_and_wait(page, "https://erp.duxsoftware.com.ar/pages/compras/gestionServicio/gestionCompServicio.faces")
        else:
            # confirmo carga de la página de Gastos
            try:
                await page.wait_for_url("**/gestionCompServicio.faces", timeout=10000)
            except Exception:
                pass
            await page.wait_for_load_state('networkidle')

        await page.wait_for_timeout(500)

        print("📦 Acciones → Exportar…")
        # botón Acciones: pruebo por texto, si no por id conocido
        if not await click_safe(page, SEL["acciones_btn_by_text"], timeout=6000):
            await click_safe(page, SEL["acciones_btn_any"], timeout=10000)
        await page.wait_for_timeout(300)
        await click_safe(page, SEL["exportar_text"], timeout=10000)

        print("⬇️ Esperando ventana de descargas…")
        await page.wait_for_selector(SEL["ventana_descargas"], timeout=20000)
        descargas = await page.query_selector_all(SEL["btn_descarga"])
        if not descargas:
            print("❌ No hay exportaciones disponibles en la ventana.")
            return

        print("💾 Descargando XLS…")
        async with page.expect_download() as dl_info:
            await descargas[0].click()
        dl = await dl_info.value

        hoy = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        xls_destino = DESCARGAS_DIR / f"gastos_dux_{hoy}.xls"
        await dl.save_as(xls_destino)
        print(f"✅ XLS guardado en: {xls_destino}")

        # 💿 Ejecutar importador (nuestro script ya soporta .xls y autodetecta headers)
        print("🚚 Ejecutando importador…")
        cmd = [sys.executable, str(IMPORTADOR), str(xls_destino)]
        r = subprocess.run(cmd, cwd=BASE_DIR, capture_output=True, text=True)

        if r.returncode == 0:
            print("✅ Importación OK")
            print(r.stdout[-2000:])  # último tramo por si es largo
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
