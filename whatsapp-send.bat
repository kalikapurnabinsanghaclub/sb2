@echo off
title KNSDC WhatsApp Bulk Sender (No API Key - No Server)
echo ============================================
echo   KNSDC WhatsApp Bulk Sender (No API Key)
echo   Uses WhatsApp Web on this PC - No server needed!
echo ============================================
echo.

:: Check if wa-bulk-jobs.json exists
if not exist "wa-bulk-jobs.json" (
    echo ❌ wa-bulk-jobs.json not found!
    echo.
    echo Please generate it first:
    echo   1. Open KNSDC-Monitor.html in your browser
    echo   2. Go to Registration tab
    echo   3. Click "🚀 Auto Bulk Send" button
    echo   4. Click "📥 Download Send File" in the modal
    echo.
    echo This will download wa-bulk-jobs.json to your Downloads folder.
    echo Move it to this folder (same as this .bat file) and run again.
    echo.
    pause
    exit /b 1
)

:: Step 1: Install puppeteer if not already present
if not exist "node_modules\puppeteer" (
    echo [1/2] Installing puppeteer (first time only)...
    npm install puppeteer
    echo.
)

:: Step 2: Run the sender directly (no bridge server!)
echo [2/2] Starting WhatsApp Web sender...
echo.
echo A Chrome window will open with WhatsApp Web.
echo On first run: Scan the QR code with your phone.
echo Messages will send automatically (12 seconds apart).
echo.
node whatsapp-bulk-sender.js

echo.
echo ============================================
echo   Done! Check the summary above.
echo ============================================
echo.
pause