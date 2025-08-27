#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import shutil
import subprocess
import threading
import hashlib
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox

from dotenv import load_dotenv

# Cargar .env (en la raíz donde está este archivo)
load_dotenv()

# ========= Variables desde .env =========
SSH_HOST = os.getenv("DEPLOY_SSH_HOST", "").strip()
SSH_KEY = os.path.expanduser(os.getenv("DEPLOY_SSH_KEY", "").strip()) or None  # ruta a archivo de clave o vacío
UPLOAD_TOOL = os.getenv("DEPLOY_UPLOAD_TOOL", "rsync").strip().lower()

# Builds
FRONT_BUILD_CMD = os.getenv("DEPLOY_FRONT_BUILD_CMD", "npm run build")  # <- por defecto build
BACK_BUILD_CMD  = os.getenv("DEPLOY_BACK_BUILD_CMD",  "npm run build")

# Rutas remotas /dist
FRONTEND_PUBLIC_REMOTE = os.getenv("FRONTEND_PUBLIC_REMOTE_PATH", "").strip()
FRONTEND_ADMIN_REMOTE  = os.getenv("FRONTEND_ADMIN_REMOTE_PATH", "").strip()
BACKEND_REMOTE         = os.getenv("BACKEND_REMOTE_PATH", "").strip()

# Backend comandos remotos (opcionales)
BACKEND_PRE_REMOTE  = os.getenv("BACKEND_PRE_REMOTE", "").strip() or None
BACKEND_PM2_CMD     = os.getenv("BACKEND_PM2_CMD", "").strip() or None
BACKEND_POST_REMOTE = os.getenv("BACKEND_POST_REMOTE", "").strip() or None

# NPM y BASE_DIRs (opcionales para check inteligente de deps)
NPM_BIN = os.getenv("NPM_BIN", "npm").strip()
FRONTEND_PUBLIC_BASE_DIR = os.getenv("FRONTEND_PUBLIC_BASE_DIR", "").strip() or None
FRONTEND_ADMIN_BASE_DIR  = os.getenv("FRONTEND_ADMIN_BASE_DIR", "").strip() or None
BACKEND_BASE_DIR_OVERRIDE = os.getenv("BACKEND_BASE_DIR", "").strip() or None
# =======================================

# Layout de carpetas locales
CONFIG = {
    "frontend_public": {
        "local_path": "frontend_public",
        "dist_path":  "dist",
        "remote_path": FRONTEND_PUBLIC_REMOTE,
        "build_cmd":  FRONT_BUILD_CMD,
        "base_dir_override": FRONTEND_PUBLIC_BASE_DIR,
    },
    "frontend_admin": {
        "local_path": "frontend_admin",
        "dist_path":  "dist",
        "remote_path": FRONTEND_ADMIN_REMOTE,
        "build_cmd":  FRONT_BUILD_CMD,
        "base_dir_override": FRONTEND_ADMIN_BASE_DIR,
    },
    "backend": {
        "local_path": "backend",
        "dist_path":  "dist",  # backend build a dist
        "remote_path": BACKEND_REMOTE,
        "build_cmd":  BACK_BUILD_CMD,
        "base_dir_override": BACKEND_BASE_DIR_OVERRIDE,
    },
}

def require_env(value: str, name: str):
    if not value:
        raise RuntimeError(f"Falta variable en .env: {name}")

def which_or_raise(bin_name: str):
    if shutil.which(bin_name) is None:
        raise FileNotFoundError(f"No se encontró '{bin_name}' en PATH")

def run(cmd, cwd=None, check=True, log=None):
    """
    Ejecuta comandos de sistema. Acepta str (usa bash -lc) o list[str].
    """
    if isinstance(cmd, str):
        shell_cmd = ["/bin/bash", "-lc", cmd]
        printable = cmd
    else:
        shell_cmd = cmd
        printable = " ".join(cmd)
    if log:
        log(f"➜ $ {printable}" + (f"   (cwd={cwd})" if cwd else ""))
    proc = subprocess.run(shell_cmd, cwd=cwd, text=True)
    if check and proc.returncode != 0:
        raise RuntimeError(f"Comando falló ({proc.returncode}): {printable}")
    return proc.returncode

def as_project_user(cmd: str) -> str:
    ssh_user = SSH_HOST.split("@", 1)[0] if "@" in SSH_HOST else ""
    return cmd if ssh_user == "marwalonline" else f'su - marwalonline -c "{cmd}"'

def ssh_cmd(command: str, log):
    """
    Ejecuta un comando remoto por SSH usando SOLO llave (sin password).
    Si la llave no funciona, falla en vez de pedir password.
    """
    base = ["ssh"]
    if SSH_KEY:
        base += ["-i", SSH_KEY]
    base += [
        "-o", "BatchMode=yes",                     # no prompt interactivo
        "-o", "KbdInteractiveAuthentication=no",
        "-o", "PasswordAuthentication=no",
        "-o", "PreferredAuthentications=publickey",
        "-o", "PubkeyAuthentication=yes",
        "-o", "StrictHostKeyChecking=accept-new",
    ]
    base += [SSH_HOST, command]
    log(f"🖧 SSH {SSH_HOST} :: {command}")
    run(base, log=log)

def upload_rsync(src_dir: Path, remote_path: str, log):
    which_or_raise("rsync")
    if SSH_KEY:
        ssh_part = (
            f"-e 'ssh -i {SSH_KEY} "
            f"-o BatchMode=yes "
            f"-o KbdInteractiveAuthentication=no "
            f"-o PasswordAuthentication=no "
            f"-o PreferredAuthentications=publickey "
            f"-o PubkeyAuthentication=yes "
            f"-o StrictHostKeyChecking=accept-new'"
        )
    else:
        ssh_part = (
            "-e 'ssh -o BatchMode=yes "
            "-o KbdInteractiveAuthentication=no "
            "-o PasswordAuthentication=no "
            "-o PreferredAuthentications=publickey "
            "-o PubkeyAuthentication=yes "
            "-o StrictHostKeyChecking=accept-new'"
        )

    cmd = (
        f"rsync -avz --delete "
        f"--exclude 'node_modules' --exclude '.git' --exclude '.env' "
        f"{ssh_part} '{src_dir}/' '{SSH_HOST}:{remote_path}/'"
    )
    log(f"📤 Subiendo con rsync → {SSH_HOST}:{remote_path}")
    run(cmd, log=log)

def upload_scp(src_dir: Path, remote_path: str, log):
    which_or_raise("scp")
    log(f"📤 Subiendo con scp → {SSH_HOST}:{remote_path}")

    # 1) Asegura carpeta remota
    ssh_cmd_parts = ["ssh"]
    if SSH_KEY:
        ssh_cmd_parts += ["-i", SSH_KEY]
    ssh_cmd_parts += [SSH_HOST, f"mkdir -p '{remote_path}'"]
    run(ssh_cmd_parts, log=log)

    # 2) Copia recursiva del CONTENIDO de dist (incluye ocultos con "/.")
    scp_parts = ["scp"]
    if SSH_KEY:
        scp_parts += ["-i", SSH_KEY]
    scp_parts += ["-r", str(src_dir) + "/.", f"{SSH_HOST}:{remote_path}/"]
    run(scp_parts, log=log)

def sha256_of(path: Path) -> str:
    if not path.exists():
        return ""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def infer_base_dir_from_remote_dist(remote_path: str) -> str:
    # ej: /.../frontend_admin/dist -> /.../frontend_admin
    rp = remote_path.rstrip("/").split("/")
    if rp and rp[-1] == "dist":
        return "/".join(rp[:-1]) or "/"
    # fallback: el mismo dir remoto (si no termina en dist)
    return remote_path.rstrip("/")

def smart_install_if_needed(target_key: str, local_project: Path, remote_dist: str, base_dir_override: str, log):
    """
    Instala deps en el server SOLO si cambió package.json o package-lock.json.
    Se salta si no hay package.json local o remoto.
    """
    # Hash locales
    local_pkg = local_project / "package.json"
    local_lock = local_project / "package-lock.json"
    if not local_pkg.exists():
        log("ℹ️  No hay package.json local → saltando check de dependencias.")
        return

    pkg_hash  = sha256_of(local_pkg)
    lock_hash = sha256_of(local_lock)  # puede ser ""

    # Dónde correr en el server
    remote_base = base_dir_override or infer_base_dir_from_remote_dist(remote_dist)

    # Script remoto
    deps_check_script = (
        f"cd {remote_base} || exit 0; "
        f"if [ ! -f package.json ]; then echo 'ℹ️  (server) package.json NO existe en {remote_base} → saltando npm install'; exit 0; fi; "
        f"NEW_PKG='{pkg_hash}'; NEW_LOCK='{lock_hash}'; "
        f"OLD_PKG=$(cat .pkg.sha256 2>/dev/null || true); "
        f"OLD_LOCK=$(cat .lock.sha256 2>/dev/null || true); "
        f"if [ \"$NEW_PKG\" != \"$OLD_PKG\" ] || [ \"$NEW_LOCK\" != \"$OLD_LOCK\" ]; then "
        f"echo '📦 Cambios en dependencias → {NPM_BIN} install --omit=dev'; "
        f"{NPM_BIN} install --omit=dev && "
        f"echo \"$NEW_PKG\" > .pkg.sha256 && echo \"$NEW_LOCK\" > .lock.sha256; "
        f"else echo '✅ Dependencias sin cambios'; "
        f"fi"
    )

    ssh_cmd(as_project_user(deps_check_script), log)

def build_and_deploy(target_key: str, log, on_done):
    try:
        # Validaciones mínimas
        require_env(SSH_HOST, "DEPLOY_SSH_HOST")
        require_env(CONFIG[target_key]["remote_path"], f"{target_key.upper()}_REMOTE_PATH")

        which_or_raise("npm")
        which_or_raise("ssh")
        if UPLOAD_TOOL not in ("rsync", "scp"):
            raise ValueError("DEPLOY_UPLOAD_TOOL debe ser 'rsync' o 'scp'")
        which_or_raise(UPLOAD_TOOL)

        cfg = CONFIG[target_key]
        project_root = Path(__file__).resolve().parent
        local_project = project_root / cfg["local_path"]
        dist_path = local_project / cfg["dist_path"]
        build_cmd = cfg["build_cmd"]

        if not local_project.exists():
            raise FileNotFoundError(f"No existe carpeta del proyecto: {local_project}")

        # Build
        log(f"🏗️  [{target_key}] Ejecutando build: {build_cmd}")
        run(build_cmd, cwd=str(local_project), log=log)

        if not dist_path.exists() or not dist_path.is_dir():
            raise FileNotFoundError(f"No existe carpeta de build/dist: {dist_path}")

        # Upload dist
        remote_path = cfg["remote_path"]
        if UPLOAD_TOOL == "rsync":
            upload_rsync(dist_path, remote_path, log)
        else:
            upload_scp(dist_path, remote_path, log)

        # BACKEND: subir package.json/lock a la BASE antes de npm install inteligente
        if target_key == "backend":
            remote_base = BACKEND_BASE_DIR_OVERRIDE or infer_base_dir_from_remote_dist(remote_path)
            # crear base en remoto
            ssh_cmd(as_project_user(f"mkdir -p '{remote_base}'"), log)

            pkg_src = (local_project / "package.json").resolve()
            lock_src = (local_project / "package-lock.json").resolve()

            if pkg_src.exists():
                if UPLOAD_TOOL == "rsync":
                    ssh_part = f"-e 'ssh -i {SSH_KEY}'" if SSH_KEY else ""
                    run(f"rsync -avz {ssh_part} '{pkg_src}' '{SSH_HOST}:{remote_base}/'", log=log)
                    if lock_src.exists():
                        run(f"rsync -avz {ssh_part} '{lock_src}' '{SSH_HOST}:{remote_base}/'", log=log)
                else:
                    scp_base = ["scp"]
                    if SSH_KEY:
                        scp_base += ["-i", SSH_KEY]
                    files = [str(pkg_src)] + ([str(lock_src)] if lock_src.exists() else [])
                    run(scp_base + files + [f"{SSH_HOST}:{remote_base}/"], log=log)

        # Check inteligente de dependencias (front/back)
        smart_install_if_needed(
            target_key=target_key,
            local_project=local_project,
            remote_dist=remote_path,
            base_dir_override=cfg.get("base_dir_override"),
            log=log,
        )

        # Backend: pre/pm2/post si están definidos
        if target_key == "backend":
            if BACKEND_PRE_REMOTE:
                ssh_cmd(BACKEND_PRE_REMOTE, log)

            if BACKEND_PM2_CMD:
                ssh_cmd(BACKEND_PM2_CMD, log)
            else:
                log("ℹ️  BACKEND_PM2_CMD vacío: no se recargó PM2.")

            if BACKEND_POST_REMOTE:
                ssh_cmd(BACKEND_POST_REMOTE, log)

        log("✅ Deploy finalizado.")
    except Exception as e:
        log(f"❌ Error: {e}")
        messagebox.showerror("Error de Deploy", str(e))
    finally:
        on_done()

# ============== GUI ==============
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Deploy Marwal (.env)")
        self.geometry("780x520")
        self.minsize(700, 480)

        # Botones
        btn_frame = ttk.Frame(self)
        btn_frame.pack(padx=12, pady=12, anchor="w")

        self.btn_pub = ttk.Button(btn_frame, text="Subir frontend_public",
                                  command=lambda: self.launch("frontend_public"))
        self.btn_pub.grid(row=0, column=0, padx=6, pady=6)

        self.btn_admin = ttk.Button(btn_frame, text="Subir frontend_admin",
                                    command=lambda: self.launch("frontend_admin"))
        self.btn_admin.grid(row=0, column=1, padx=6, pady=6)

        self.btn_back = ttk.Button(btn_frame, text="Subir backend",
                                   command=lambda: self.launch("backend"))
        self.btn_back.grid(row=0, column=2, padx=6, pady=6)

        # Selector de herramienta (muestra lo que vino de .env; podés cambiarlo runtime)
        tool_frame = ttk.Frame(self)
        tool_frame.pack(padx=12, pady=(0,12), anchor="w")
        ttk.Label(tool_frame, text="Upload tool:").grid(row=0, column=0, padx=(0,6))
        self.tool_var = tk.StringVar(value=UPLOAD_TOOL)
        tool = ttk.Combobox(tool_frame, textvariable=self.tool_var,
                            values=["rsync", "scp"], width=8, state="readonly")
        tool.grid(row=0, column=1)

        # Logs
        log_frame = ttk.LabelFrame(self, text="Logs")
        log_frame.pack(fill="both", expand=True, padx=12, pady=12)
        self.text = tk.Text(log_frame, wrap="word")
        self.text.pack(fill="both", expand=True, padx=6, pady=6)

        self.running = False

        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure("TButton", padding=8)

    def append_log(self, s: str):
        self.text.insert("end", s + "\n")
        self.text.see("end")
        self.update_idletasks()

    def set_buttons_state(self, state: str):
        for b in (self.btn_pub, self.btn_admin, self.btn_back):
            b.config(state=state)

    def launch(self, target_key: str):
        if self.running:
            return

        # Actualiza herramienta elegida en la UI (no persiste al .env)
        global UPLOAD_TOOL
        UPLOAD_TOOL = self.tool_var.get().lower()

        # Validación mínima visible
        try:
            require_env(SSH_HOST, "DEPLOY_SSH_HOST")
        except Exception as e:
            messagebox.showerror("Config faltante", str(e))
            return

        self.running = True
        self.set_buttons_state("disabled")
        self.append_log(f"=== DEPLOY: {target_key} ===")

        def on_done():
            self.running = False
            self.set_buttons_state("normal")

        t = threading.Thread(target=build_and_deploy,
                             args=(target_key, self.append_log, on_done),
                             daemon=True)
        t.start()

def main():
    app = App()
    app.mainloop()

if __name__ == "__main__":
    main()
