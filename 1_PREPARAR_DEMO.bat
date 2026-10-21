@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo ===========================================
echo SYNCRYPTA - PREPARAR DEMONSTRACAO
echo Os dados existentes serao preservados.
echo ===========================================
call npm.cmd install --no-audit --no-fund
if errorlevel 1 goto erro
call node atualizar-demo.js
if errorlevel 1 goto erro
rem 4.14: cria ou conserta a conta de exemplo da Thais (thais.demo@syncrypta.local) sem apagar nada
call node conta-exemplo.js
if errorlevel 1 goto erro
echo.
echo Pronto. Execute 2_INICIAR_BACKEND.bat ou INSTALAR_E_INICIAR.bat.
pause
exit /b 0
:erro
echo A preparacao falhou. Confira a mensagem acima.
pause
exit /b 1
