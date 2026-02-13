@echo off
echo ============================================================
echo   Testing Findy IoT API Configuration
echo ============================================================
echo.
echo [INFO] This will test your Findy API credentials before
echo [INFO] starting the full server.
echo.
echo [INFO] Testing...
echo ============================================================
echo.

node test-findy-api.js

echo.
echo ============================================================
echo [INFO] Test complete. Check results above.
echo ============================================================
pause
