@echo off
REM Roda o agente em loop — se cair por qualquer motivo (impressora
REM desligada, erro, etc), reinicia sozinho depois de 3s em vez de
REM morrer de vez e precisar abrir na mão de novo.
cd /d "%~dp0"

:loop
node index.js
echo.
echo [%date% %time%] Agente parou (codigo %errorlevel%^) — reiniciando em 3s...
timeout /t 3 /nobreak >nul
goto loop
