@echo off
title Launching Data Privacy Risk Checker (Local Host)
echo ==========================================================
echo Starting Data Privacy Risk Checker (100%% Localhost Mode)
echo ==========================================================
start "Data Privacy Backend API (Port 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Data Privacy Frontend UI (Port 5173)" cmd /k "cd frontend && npm run dev"
echo Both services launched!
echo Frontend UI: http://localhost:5173
echo Backend API & Docs: http://localhost:8000/docs
timeout /t 5
