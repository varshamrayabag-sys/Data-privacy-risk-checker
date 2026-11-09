@echo off
title Launching Data Privacy Risk Checker
echo ==========================================================
echo Starting Data Privacy Risk Checker (Backend + Frontend)
echo ==========================================================
start "Data Privacy Backend API (Port 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Data Privacy Frontend UI (Port 5173)" cmd /k "cd frontend && npm run dev"
echo Both services launched!
echo Frontend will be ready at: http://localhost:5173
echo Backend API will be ready at: http://localhost:8000/docs
timeout /t 5
