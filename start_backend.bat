@echo off
title Data Privacy Risk Checker - Backend API
echo Starting FastAPI Backend Server on http://localhost:8000 ...
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
