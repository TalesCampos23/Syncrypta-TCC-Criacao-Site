@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo Syncrypta - instalando dependencias (sem recriar seus dados)...
call npm.cmd install --no-audit --no-fund
if errorlevel 1 goto erro
echo.
echo Iniciando a API. Mantenha esta janela aberta.
call npm.cmd start
pause
exit /b 0
:erro
echo A instalacao falhou. Confira sua conexao e o erro acima.
pause
exit /b 1
