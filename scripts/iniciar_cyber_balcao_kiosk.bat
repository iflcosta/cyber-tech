@echo off
title Cyber Informatica - Balcao Kiosk Auto-Print
color 0A

echo ============================================================
echo   CYBER INFORMATICA - BALCAO SILENT KIOSK PRINTING
echo ============================================================
echo.
echo Verificando Agente de Impressao MPT-II...

netstat -ano | findstr 9100 >nul 2>&1
if errorlevel 1 (
    echo Iniciando Agente de Impressao local...
    start "" wscript.exe "%~dp0..\print-agent\iniciar-oculto.vbs"
    timeout /t 2 /nobreak >nul
) else (
    echo Agente de impressao ja esta ativo!
)

echo.
echo Iniciando o sistema no modo Kiosk de Impressao Silenciosa...
echo.

set FLAGS=--user-data-dir="%LOCALAPPDATA%\Google\Chrome\CyberBalcao" --kiosk-printing --test-type --app=https://www.cyberinformatica.tech/admin/os

:: 1. Tenta abrir via Google Chrome com profile isolado
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" %FLAGS%
    exit /b 0
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" %FLAGS%
    exit /b 0
)

:: 2. Fallback: Microsoft Edge com profile isolado
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" %FLAGS%
    exit /b 0
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" %FLAGS%
    exit /b 0
)

echo [ERRO] Nem Chrome nem Edge foram encontrados nos caminhos padrao.
pause
