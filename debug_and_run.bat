@echo off
setlocal
echo ===================================================
echo KNSDC - LOCAL HOSTING DIAGNOSTICS
echo ===================================================

echo.
echo 1. Checking Environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/ to continue.
    pause
    exit /b
)
echo [OK] Node.js is installed.

echo.
echo 2. Checking Dependencies (node_modules)...
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing now...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 'npm install' failed. Check your internet connection.
        pause
        exit /b
    )
    echo [OK] Dependencies installed successfully.
) else (
    echo [OK] node_modules exists.
)

echo.
echo 3. Starting Development Server...
echo [INFO] Once started, keep this window OPEN.
echo [INFO] Press Ctrl+C to stop the server later.
echo.
echo ===================================================
npm run dev
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start server. Try running 'npm install' manually.
)

pause
