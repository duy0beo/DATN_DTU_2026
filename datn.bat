@echo off
title LegAI - Startup Script
color 0b

echo --------------------------------------------------
echo      KHOI DONG HE THONG LEGAI (DATN 2026)
echo --------------------------------------------------
echo.

echo [+] Dang khoi dong AI ENGINE (Port 8000)...
start "AI-ENGINE" cmd /k "cd AI_Engine && npm run dev"

echo [+] Dang khoi dong FRONTEND (Port 5173)...
start "FRONTEND" cmd /k "cd Frontend && npm run dev"


