@echo off
title Add Sensor to MongoDB
color 0B

echo ================================================================================
echo                    ADD SENSOR 865456053885594 TO MONGODB
echo ================================================================================
echo.

cd /d "%~dp0"

node add-sensor-to-mongodb.js

echo.
echo ================================================================================
echo Now restart the server with: quick-start.bat
echo ================================================================================
pause
