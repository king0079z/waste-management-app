@echo off
title MongoDB Connection Test - Waste Management App
cd /d "%~dp0"

echo.
echo ============================================
echo   MongoDB / Application Connection Test
echo ============================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Install Node.js and add it to PATH.
    echo.
    pause
    exit /b 1
)

echo Server URL: http://localhost:3000
echo If your server runs on another port, set BASE_URL before running.
echo.
echo NOTE: Start the server first in another window:  node server.js
echo.
echo Running tests...
echo --------------------------------------------

node scripts\test-mongodb-connection.js
set EXIT_CODE=%ERRORLEVEL%

echo --------------------------------------------
if %EXIT_CODE% equ 0 (
    echo.
    echo [SUCCESS] All connection checks passed.
) else (
    echo.
    echo [FAILED] One or more connection checks failed or server unreachable.
    echo.
    echo Common causes:
    echo   - Server not running. Start it with:  node server.js
    echo   - Wrong port. Set BASE_URL:  set BASE_URL=http://localhost:4000
    echo   - MongoDB not running. Set DATABASE_TYPE=mongodb and start MongoDB.
)

echo.
pause
exit /b %EXIT_CODE%
