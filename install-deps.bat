@echo off
title Waste Management - Install Dependencies
color 0B

echo ================================================================================
echo                    INSTALLING DEPENDENCIES
echo ================================================================================
echo.

cd /d "%~dp0"

echo [INFO] Cleaning old node_modules...
if exist "node_modules\" rmdir /s /q node_modules

echo [INFO] Installing fresh dependencies...
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Dependencies installed successfully!
) else (
    echo.
    echo [ERROR] Failed to install dependencies
)

echo.
echo ================================================================================
pause
