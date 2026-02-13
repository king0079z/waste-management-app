@echo off
REM ============================================================
REM World-Class MongoDB Migration & Application Startup Script
REM ============================================================
REM This script will:
REM   1. Check MongoDB connection
REM   2. Run migration (if needed)
REM   3. Verify migration
REM   4. Start the application
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   MongoDB Migration and Application Startup
echo ============================================================
echo.

REM Set colors for better visibility
color 0A

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

REM Check if npm is installed
echo [2/6] Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)
echo [OK] npm found
echo.

REM Check if .env file exists
echo [3/6] Checking configuration...
if not exist ".env" (
    echo [WARNING] .env file not found
    echo Creating .env from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] .env file created
        echo [INFO] Please edit .env file with your MongoDB settings
        echo.
    ) else (
        echo [ERROR] .env.example not found
        echo Please create .env file manually
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file exists
)
echo.

REM Check MongoDB connection
echo [4/6] Checking MongoDB connection...
node -e "const {MongoClient} = require('mongodb'); (async() => { try { const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017'); await client.connect(); await client.db('admin').command({ ping: 1 }); console.log('OK'); await client.close(); process.exit(0); } catch(e) { console.log('ERROR: ' + e.message); process.exit(1); } })()" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB connection failed
    echo [INFO] Make sure MongoDB is running
    echo [INFO] You can start MongoDB with: net start MongoDB
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "!continue!"=="y" (
        echo Migration cancelled
        pause
        exit /b 1
    )
) else (
    echo [OK] MongoDB connection successful
)
echo.

REM Check if node_modules exists
echo [5/6] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies found
)
echo.

REM Check if port is already in use
echo [BONUS] Checking if port is available...
node -e "const net = require('net'); const server = net.createServer(); server.once('error', (err) => { if (err.code === 'EADDRINUSE') { console.log('PORT_IN_USE'); process.exit(1); } }); server.once('listening', () => { server.close(); console.log('PORT_AVAILABLE'); process.exit(0); }); server.listen(process.env.PORT || 8080);" 2>nul
if %errorlevel% equ 1 (
    echo [WARNING] Port is already in use!
    echo [INFO] Attempting to free the port...
    call kill-port.bat
    echo.
    echo [INFO] Waiting 2 seconds for port to be released...
    timeout /t 2 /nobreak >nul
) else (
    echo [OK] Port is available
)
echo.

REM Run migration
echo [6/6] Running MongoDB migration...
echo ============================================================
echo [INFO] This will migrate all data from data.json to MongoDB
echo [INFO] Automatic backup will be created before migration
echo ============================================================
echo.
call npm run migrate:mongo
set MIGRATION_STATUS=%errorlevel%
echo ============================================================

if %MIGRATION_STATUS% neq 0 (
    echo.
    echo [WARNING] Migration completed with errors
    echo [INFO] Check the migration log in backups/ folder for details
    echo.
    set /p continue="Continue to start application anyway? (y/n): "
    if /i not "!continue!"=="y" (
        echo Application startup cancelled
        echo [INFO] You can fix migration issues and run again
        pause
        exit /b 1
    )
) else (
    echo.
    echo [SUCCESS] Migration completed successfully!
    echo [INFO] All data has been migrated to MongoDB
    echo.
)

REM Verify migration (optional but recommended)
echo [BONUS] Verifying migration...
call npm run verify:migration
if %errorlevel% equ 0 (
    echo [OK] Migration verification passed
) else (
    echo [WARNING] Migration verification found issues
    echo [INFO] Check verification report for details
)
echo.

REM Start the application
echo ============================================================
echo   Starting Application...
echo ============================================================
echo.

REM Get port from .env or use default
for /f "tokens=2 delims==" %%a in ('findstr /C:"PORT=" .env 2^>nul') do set APP_PORT=%%a
if not defined APP_PORT set APP_PORT=8080

echo [INFO] Application will start on http://localhost:%APP_PORT%
echo [INFO] Press Ctrl+C to stop the application
echo.
echo ============================================================
echo.

call npm start

REM If npm start fails, show error message
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application failed to start
    echo [INFO] Common causes:
    echo    - Port already in use (run kill-port.bat)
    echo    - MongoDB not running
    echo    - Missing dependencies (run npm install)
    echo.
    pause
    exit /b 1
)

REM If we get here, the application has stopped
echo.
echo ============================================================
echo   Application Stopped
echo ============================================================
pause
