@echo off
title KNSDC — Server Setup & Start
color 0B
echo.
echo  ======================================================
echo   KNSDC — System Diagnostic & Launcher
echo  ======================================================
echo.
echo  [1/3] Checking Node.js / NPM...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js/NPM is not installed or not in PATH!
    echo  Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)
echo  [1/3] Node.js/NPM found.
echo.
echo  [2/3] Installing dependencies (this may take a minute)...
echo  Running: npm install
call npm install
echo.
echo  [2/3] Dependencies installed.
echo.
echo  [3/3] Starting Vite development server...
echo.
echo  Once the server is running, the Portal Hub will open.
echo  -------------------------------------------------------
echo.

:: Start server and open browser
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173/portal.html"

npm run dev
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Server failed to start. 
    echo  Try running 'npm install' manually in this folder.
    echo.
)
pause
