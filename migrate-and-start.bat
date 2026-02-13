@echo off
REM ============================================================
REM Migration Only Script
REM ============================================================
REM Runs migration and verification, then exits
REM ============================================================

echo.
echo ============================================================
echo   MongoDB Migration Script
echo ============================================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)

REM Check dependencies
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

REM Run migration
echo [INFO] Running migration...
echo.
call npm run migrate:mongo

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Migration completed!
    echo.
    
    REM Run verification
    echo [INFO] Verifying migration...
    echo.
    call npm run verify:migration
    
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] Migration verified successfully!
        echo [INFO] All data has been migrated to MongoDB
    ) else (
        echo.
        echo [WARNING] Verification found issues
        echo [INFO] Check verification report for details
    )
) else (
    echo.
    echo [ERROR] Migration failed
    echo [INFO] Check migration log for details
)

echo.
echo ============================================================
pause
