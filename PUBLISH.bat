@echo off
title KNSDC — GitHub Publisher
color 0E
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║          KNSDC — GitHub Publishing Tool              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── STEP 1: Check Git ──
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please install Git from: https://git-scm.com/
    pause
    exit /b 1
)

:: ── STEP 2: Initialize Repo ──
if not exist ".git" (
    echo [1/4] Initializing Git repository...
    git init
) else (
    echo [1/4] Git repository already initialized.
)

:: ── STEP 3: Add and Commit ──
echo [2/4] Adding files and creating initial commit...
git add .
git commit -m "Initial commit: KNSDC Full Pipeline Setup"
echo.

:: ── STEP 4: Push to GitHub ──
echo [3/4] Preparation for GitHub push...
echo.
echo  To push to GitHub, you need to create a repository first:
echo  1. Go to https://github.com/new
echo  2. Name it (e.g., 'knsdc-portal')
echo  3. Click "Create repository"
echo  4. Copy the URL (it looks like https://github.com/username/repo.git)
echo.

set /p GITHUB_URL="Paste your GitHub Repository URL here: "

if "%GITHUB_URL%"=="" (
    echo.
    echo [WARNING] No URL provided. Pushing skipped.
    echo You can manually run: git remote add origin ^<URL^>
    echo Then run: git push -u origin main
    pause
    exit /b 0
)

echo.
echo [4/4] Connecting to GitHub and pushing...
git remote add origin %GITHUB_URL%
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. 
    echo Check your internet connection and verify if the URL is correct.
    echo You might need to log in if prompted in a separate window.
) else (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║      SUCCESS! Your project is now on GitHub.       ║
    echo  ╚══════════════════════════════════════════════════════╝
)

echo.
pause
