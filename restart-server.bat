@echo off
echo ============================================================
echo   Restarting Autonautics Waste Management System
echo   With Findy IoT API Credentials
echo ============================================================
echo.

echo [INFO] Stopping any running Node.js processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Killing process %%a...
    taskkill /F /PID %%a 2>nul
)

echo.
echo [INFO] Waiting 2 seconds for cleanup...
timeout /t 2 /nobreak >nul

echo.
echo [INFO] Starting server with Findy IoT credentials...
echo [INFO] Server will start at: http://localhost:3000
echo [INFO] Look for these messages:
echo    - "🔑 Findy API credentials loaded from environment"
echo    - "✅ Findy IoT API connected and authenticated"
echo    - "✅ Sensor polling service started successfully"
echo.
echo [INFO] Press Ctrl+C to stop the server
echo ============================================================
echo.

npm start
