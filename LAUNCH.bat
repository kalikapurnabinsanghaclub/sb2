@echo off
TITLE KNSDC Offline Ecosystem - Launcher
SETLOCAL EnableDelayedExpansion

:: --- CONFIGURATION ---
SET "ROOT_DIR=%~dp0"
SET "PORTAL_HUB=%ROOT_DIR%portal.html"
SET "INDEX_PAGE=%ROOT_DIR%index.html"
SET "MONITOR_PAGE=%ROOT_DIR%KNSDC-Monitor.html"
SET "ADMIN_PAGE=%ROOT_DIR%KNSDC-Admin.html"
SET "HOST_PAGE=%ROOT_DIR%KNSDC-Host.html"
SET "JUDGE_PAGE=%ROOT_DIR%KNSDC-Judge.html"

COLOR 0A
cls
echo.
echo  ###############################################################
echo  #                                                             #
echo  #          KNSDC OFFLINE ECOSYSTEM - STABLE v3.0              #
echo  #          -------------------------------------              #
echo  #                                                             #
echo  ###############################################################
echo.
echo  Initializing Local Protocol...
echo.

:: --- DIAGNOSTICS ---
echo  [1/3] Verifying core files...
set "missing=0"
for %%F in ("%PORTAL_HUB%" "%INDEX_PAGE%" "%MONITOR_PAGE%" "%ADMIN_PAGE%" "%HOST_PAGE%" "%JUDGE_PAGE%" "%ROOT_DIR%lib\localSync.js") do (
    if not exist %%F (
        echo  [!] CRITICAL MISSING: %%F
        set "missing=1"
    )
)

if "!missing!"=="1" (
    echo.
    echo  [ERROR] Some files are missing. Please ensure you are running this from the correct folder.
    pause
    exit /b
)
echo  [OK] All core files present.

echo  [2/3] Cleaning up legacy cache...
:: No action needed for localSync, but we verify environment
echo  [OK] Environment verified.

echo  [3/3] Launching Portal Hub...
echo.
echo  ---------------------------------------------------------------
echo  IMPORTANT: Use the file links below. DO NOT use localhost.
echo  ---------------------------------------------------------------
echo.

:: Launch the main Portal Hub
start "" "file:///%PORTAL_HUB:\=/%"

echo  SYSTEM ONLINE.
echo  You can now access all portals from the main browser tab.
echo.
echo  Quick Links (Staff):
echo  - Monitor: file:///%MONITOR_PAGE:\=/%
echo  - Admin  : file:///%ADMIN_PAGE:\=/%
echo.
echo  Keep this window open during the event for reference.
echo  Press any key to close this launcher.
pause > nul
exit
