#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
/usr/bin/env python3 "$DIR/DeployUI.py"
read -n 1 -s -r -p "Presiona cualquier tecla para cerrar…"
