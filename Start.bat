@echo off
title VoteX - Vyxen Studio
color 0F

echo.
echo  ============================================
echo        VoteX by Vyxen Studio
echo  ============================================
echo.
echo  Starting VoteX servers...
echo.

:: Start Backend
echo  [1/2] Starting Backend (Port 5000)...
start "VoteX Backend" cmd /k "cd /d %~dp0backend && node server.js"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend
echo  [2/2] Starting Frontend (Port 5173)...
start "VoteX Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait for frontend to start
timeout /t 4 /nobreak >nul

:: Open browser
echo.
echo  Opening VoteX in your browser...
start http://localhost:5173

echo.
echo  ============================================
echo   VoteX is running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo  ============================================
echo.
echo   Admin Panel: Click "Vyxen Studio" in the
echo   footer 5 times to open Admin Login.
echo.
echo   Admin User : admin
echo   Admin Pass : VyxenAdmin@2025
echo.
echo  Press any key to close this window...
pause >nul
