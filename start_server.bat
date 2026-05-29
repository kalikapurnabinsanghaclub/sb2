@echo off
title KNSDC — Portal Server
color 0A
echo.
echo  ======================================================
echo   KNSDC — Kalikapur Nabin Sangha Portal Launcher
echo  ======================================================
echo.
echo  [1/2] Installing / verifying dependencies...
call npm install --silent
echo  [1/2] Done.
echo.
echo  [2/2] Starting Vite development server...
echo.
echo  Once ready, opening browser at http://localhost:5173/portal.html
echo  -------------------------------------------------------
echo.

:: Start server in background and open browser after short delay
start /b cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173/portal.html"

npm run dev
pause
