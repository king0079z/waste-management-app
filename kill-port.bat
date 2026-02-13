@echo off
REM ============================================================
REM Kill Process on Port 3000 or 8080
REM ============================================================

echo.
echo ============================================================
echo   Killing Process on Port
echo ============================================================
echo.

REM Check for port 3000
echo [INFO] Checking for process on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Found process on port 3000: %%a
    echo [INFO] Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Process killed successfully
    ) else (
        echo [WARNING] Could not kill process (may require admin rights)
    )
)

REM Check for port 8080
echo [INFO] Checking for process on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo [INFO] Found process on port 8080: %%a
    echo [INFO] Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Process killed successfully
    ) else (
        echo [WARNING] Could not kill process (may require admin rights)
    )
)

echo.
echo [INFO] Port cleanup complete
echo.
pause
