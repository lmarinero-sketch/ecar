@echo off
echo.
echo  ========================================
echo   ECAR Paniol - Sistema de Almacen
echo  ========================================
echo.
echo  Iniciando el sistema...
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python no esta instalado.
    echo  Descargalo desde https://www.python.org
    pause
    exit
)

pip install flask >nul 2>&1

echo  Abriendo el navegador en 3 segundos...
timeout /t 3 /nobreak >nul
start http://localhost:5000

python app.py

pause
