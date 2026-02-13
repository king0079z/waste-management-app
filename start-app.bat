@echo off
title Waste Management Application
color 0A

echo ================================================================================
echo                    WASTE MANAGEMENT APPLICATION STARTER
echo ================================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Display Node.js version
echo [INFO] Node.js version:
node --version
echo.

:: Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not available
    pause
    exit /b 1
)

:: Navigate to application directory
cd /d "%~dp0"
echo [INFO] Working directory: %CD%
echo.

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    echo ================================================================================
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully
    echo.
) else (
    echo [INFO] Dependencies already installed (node_modules found)
    echo.
)

:: Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating default .env file...
    (
        echo # Waste Management Application Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Findy IoT API Configuration
        echo FINDY_API_URL=https://uac.higps.org
        echo FINDY_API_KEY=BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234
        echo FINDY_SERVER=findyIoT_serverApi
        echo FINDY_API_USERNAME=datavoizme
        echo FINDY_API_PASSWORD=datavoizme543#!
    ) > .env
    echo [INFO] Default .env file created
    echo.
)

:: Display configuration
echo ================================================================================
echo                           APPLICATION CONFIGURATION
echo ================================================================================
echo.
echo Findy API URL: https://uac.higps.org
echo API Key: BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234
echo Server: findyIoT_serverApi
echo Username: datavoizme
echo.

:: Ask user if they want to test API first
echo ================================================================================
echo                              STARTUP OPTIONS
echo ================================================================================
echo.
echo [1] Start server directly
echo [2] Test API connection first, then start server
echo [3] Test API connection only
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto test_and_start
if "%choice%"=="3" goto test_only
if "%choice%"=="4" goto end

:test_and_start
echo.
echo ================================================================================
echo                         TESTING API CONNECTION
echo ================================================================================
echo.
node test-findy-api.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] API test had issues. Continue anyway? (Y/N)
    set /p continue="Your choice: "
    if /i not "%continue%"=="Y" goto end
)
echo.

:start_server
echo ================================================================================
echo                         STARTING APPLICATION
echo ================================================================================
echo.
echo [INFO] Starting Waste Management Application...
echo [INFO] Press Ctrl+C to stop the server
echo.
echo Server will be available at:
echo   - http://localhost:3000
echo   - http://127.0.0.1:3000
echo.
echo ================================================================================
echo.
node server.js
goto end

:test_only
echo.
echo ================================================================================
echo                         TESTING API CONNECTION
echo ================================================================================
echo.
node test-findy-api.js
echo.
pause
goto end

:end
echo.
echo ================================================================================
echo                         APPLICATION STOPPED
echo ================================================================================
pause
