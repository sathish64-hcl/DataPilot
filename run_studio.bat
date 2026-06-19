@echo off
title Data Pilot Studio Orchestrator
echo ==========================================
echo Starting Data Pilot Studio Services
echo ==========================================

echo [1/2] Launching Backend FastAPI Server...
start "Data Pilot Studio - Backend Server" cmd /k "cd backend && C:\Users\mvmen\anaconda3\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend Vite Server...
cd frontend
npm.cmd run dev
