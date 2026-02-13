@echo off
REM ============================================================
REM Simple Application Startup Script
REM ============================================================
REM Quick start - assumes migration already done
REM ============================================================

echo.
echo ============================================================
echo   Starting Application...
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

REM Start the application
echo [INFO] Starting server on http://localhost:8080
echo [INFO] Press Ctrl+C to stop
echo.
call npm start

pause
