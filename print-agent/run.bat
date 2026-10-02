@echo off
REM Roda o agente em loop — se cair por qualquer motivo (impressora
REM desligada, erro, etc), reinicia sozinho depois de 3s em vez de
REM morrer de vez e precisar abrir na mão de novo.
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

:loop
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" index.js
) else (
    node index.js
)
echo.
echo [%date% %time%] Agente parou (codigo %errorlevel%^) — reiniciando em 3s...
ping 127.0.0.1 -n 4 >nul
goto loop
