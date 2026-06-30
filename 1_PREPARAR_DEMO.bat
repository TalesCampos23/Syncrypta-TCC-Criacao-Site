@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
echo ===========================================
echo  SYNCRYPTA 4.0 - PREPARAR DEMONSTRACAO
echo ===========================================
echo.
echo Instalando dependencias...
call npm install --no-audit --no-fund
if errorlevel 1 goto erro
echo.
echo Criando dados ficticios...
call npm run seed
if errorlevel 1 goto erro
echo.
echo Preparacao concluida.
echo Agora execute 2_INICIAR_BACKEND.bat
pause
exit /b 0
:erro
echo.
echo Ocorreu um erro. Confira Node.js, internet e o terminal.
pause
exit /b 1
