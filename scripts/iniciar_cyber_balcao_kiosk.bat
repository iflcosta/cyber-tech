@echo off
title Cyber Informatica - Balcao Kiosk Auto-Print
color 0A

echo ============================================================
echo   CYBER INFORMATICA - BALCAO SILENT KIOSK PRINTING
echo ============================================================
echo.
echo Iniciando o sistema no modo Kiosk de Impressao Silenciosa...
echo (A Knup KP-IM608 e MPT-II imprimem diretamente sem abrir dialogo!)
echo.

set FLAGS=--user-data-dir="%LOCALAPPDATA%\Google\Chrome\CyberBalcao" --kiosk-printing --allow-running-insecure-content --unsafely-treat-insecure-origin-as-secure=http://localhost:9100,http://127.0.0.1:9100 --app=https://www.cyberinformatica.tech/admin/os

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
