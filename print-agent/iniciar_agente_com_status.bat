@echo off
title Cyber ERP - Agente de Impressao MPT-II
color 0A

echo ============================================================
echo      CYBER ERP - AGENTE DE IMPRESSAO MPT-II (PORTA 9100)
echo ============================================================
echo.

netstat -ano | findstr 9100 >nul 2>&1
if errorlevel 1 (
    echo [STATUS] Agente esta fechado. Iniciando agora...
    start "" wscript.exe "%~dp0iniciar-oculto.vbs"
    ping 127.0.0.1 -n 3 >nul
)

netstat -ano | findstr 9100 >nul 2>&1
if errorlevel 1 (
    echo.
    echo [STATUS] Tentando iniciar via Node direto...
    start "Cyber Print Agent" /min "C:\Program Files\nodejs\node.exe" "%~dp0index.js"
    ping 127.0.0.1 -n 3 >nul
)

netstat -ano | findstr 9100 >nul 2>&1
if errorlevel 0 (
    echo.
    echo ============================================================
    echo   [OK] O Agente MPT-II esta ONLINE e pronto para imprimir!
    echo   - Porta: 9100
    echo   - Impressora: MPT-II (Bluetooth/USB)
    echo ============================================================
    echo.
    echo Esta janela fechara automaticamente em 4 segundos...
    ping 127.0.0.1 -n 4 >nul
    exit /b 0
) else (
    echo.
    echo [ERRO] Nao foi possivel iniciar o agente na porta 9100.
    echo Verifique se a impressora esta ligada ou se o Node.js esta instalado.
    echo.
    pause
    exit /b 1
)
