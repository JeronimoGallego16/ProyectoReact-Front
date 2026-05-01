@echo off
REM Activar venv de academic_service y ejecutar run.py
cd /d "%~dp0"

REM Activar venv
call academic_service\.venv\Scripts\activate.bat

REM Ejecutar el servidor
python academic_service\run.py

pause
