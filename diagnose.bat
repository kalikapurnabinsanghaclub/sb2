@echo off
set LOGFILE=diag_results.txt
echo KNSDC DIAGNOSTICS > %LOGFILE%
echo Timestamp: %DATE% %TIME% >> %LOGFILE%

echo. >> %LOGFILE%
echo [1] Checking Node.js Version... >> %LOGFILE%
node -v >> %LOGFILE% 2>&1
if %errorlevel% neq 0 echo Node.js is NOT installed! >> %LOGFILE%

echo. >> %LOGFILE%
echo [2] Checking NPM Version... >> %LOGFILE%
npm -v >> %LOGFILE% 2>&1
if %errorlevel% neq 0 echo NPM is NOT installed! >> %LOGFILE%

echo. >> %LOGFILE%
echo [3] Checking for Vite... >> %LOGFILE%
dir node_modules\vite >> %LOGFILE% 2>&1

echo. >> %LOGFILE%
echo [4] Checking Path... >> %LOGFILE%
echo %PATH% >> %LOGFILE%

echo.
echo DIAGNOSTICS COMPLETE. 
echo Please tell me you have run this file, and I will check the results.
pause
