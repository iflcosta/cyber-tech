@echo off
title Cyber Informatica - Balcao Kiosk Auto-Print
color 0A

echo ============================================================
echo   CYBER INFORMATICA - BALCAO SILENT KIOSK PRINTING
echo ============================================================
echo.
echo Iniciando o sistema no modo Kiosk de Impressao Silenciosa...
echo (A Knup KP-IM608 imprimira as etiquetas sem abrir dialogo!)
echo.

:: 1. Tenta abrir via Google Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://www.cyberinformatica.tech/admin/os/new
    exit /b 0
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://www.cyberinformatica.tech/admin/os/new
    exit /b 0
)

:: 2. Fallback: Microsoft Edge
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk-printing --app=https://www.cyberinformatica.tech/admin/os/new
    exit /b 0
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --kiosk-printing --app=https://www.cyberinformatica.tech/admin/os/new
    exit /b 0
)

echo [ERRO] Nem Chrome nem Edge foram encontrados nos caminhos padrao.
pause
