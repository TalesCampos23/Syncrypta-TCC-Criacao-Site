@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo ===========================================
echo SYNCRYPTA - CONTA DE EXEMPLO DA THAIS
echo Cria ou conserta a conta thais.demo@syncrypta.local
echo sem apagar nenhum dado. Deixe o backend DESLIGADO.
echo ===========================================
call node conta-exemplo.js %*
echo.
pause
