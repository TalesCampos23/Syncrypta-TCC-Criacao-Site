@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
echo ===========================================
echo  SYNCRYPTA 4.0 - BACKEND
echo ===========================================
echo.
call npm start
pause
