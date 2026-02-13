@echo off
title Waste Management - Quick Start
color 0A

echo ================================================================================
echo                    WASTE MANAGEMENT - QUICK START
echo ================================================================================
echo.

cd /d "%~dp0"

:: Check dependencies
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    npm install
    echo.
)

echo [INFO] Starting server...
echo [INFO] Server URL: http://localhost:3000
echo [INFO] Press Ctrl+C to stop
echo.
echo ================================================================================
echo.

node server.js

pause
