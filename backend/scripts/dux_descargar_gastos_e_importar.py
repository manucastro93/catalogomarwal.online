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
    # selector y sucursal (igual que en clientes)
    "sel_sucursal_btn":  '#formInicio\\:j_idt900_label',
    "sel_sucursal_opt0": 'li[id="formInicio:j_idt900_0"]',
    "sel_empresa_btn":   '#formInicio\\:j_idt905_label',
    "sel_empresa_opt0":  'li[id="formInicio:j_idt905_0"]',
    "entrar_btn":        '#formInicio\\:j_idt910',

    # menú lateral
    "menu_compras_text": 'text=COMPRAS',
    "menu_gastos_text":  'text=Gastos',

    # página Gastos
    # fallback: usar el href directo si el menú falla
    "gastos_href": 'a[href="/pages/compras/gestionServicio/gestionCompServicio.faces"]',

    # Acciones → Exportar (ids pueden cambiar, así que usamos texto)
    "acciones_btn_by_text": 'role=button[name="Acciones"]',
    "acciones_btn_any":     '#formCabecera\\:idAcciones',
    "exportar_text":        'text=Exportar',

    # Ventana de descargas e ícono de bajar
    "ventana_descargas":    '#ventana_descargas',
    "btn_descarga":         '.btn-descarga',
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
        await page.wait_for_selector(SEL["sel_sucursal_btn"], timeout=15000)
        await page.click(SEL["sel_sucursal_btn"])
        await page.click(SEL["sel_sucursal_opt0"])
        await page.wait_for_selector(SEL["sel_empresa_btn"], timeout=10000)
        await page.click(SEL["sel_empresa_btn"])
        await page.click(SEL["sel_empresa_opt0"])
        await page.click(SEL["entrar_btn"])
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(400)

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
