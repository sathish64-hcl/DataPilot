@echo off
title Data Pilot Studio Orchestrator
echo ==========================================
echo Starting Data Pilot Studio Services
echo ==========================================

set "ROOT_DIR=%~dp0"
set "PYTHON_EXE=C:\Users\mvmen\anaconda3\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

echo [1/2] Launching Backend FastAPI Server...
start "Data Pilot Studio - Backend Server" cmd /k "cd /d ""%ROOT_DIR%backend"" && ""%PYTHON_EXE%"" -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend Vite Server...
cd /d "%ROOT_DIR%frontend"
npm.cmd run dev
