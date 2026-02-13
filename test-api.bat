@echo off
title Waste Management - API Test
color 0E

echo ================================================================================
echo                    FINDY API CONNECTION TEST
echo ================================================================================
echo.

cd /d "%~dp0"

echo Testing connection to https://uac.higps.org...
echo.

node test-findy-api.js

echo.
echo ================================================================================
pause
