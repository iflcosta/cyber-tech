@echo off
setlocal enabledelayedexpansion
title Cyber ERP - Instalador do Agente de Impressao
echo ============================================
echo   Cyber ERP - Instalador do Agente de Impressao
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado nesse PC.
  echo Instale a versao LTS em https://nodejs.org/ e rode este instalador de novo.
  echo.
  pause
  exit /b 1
)

set "AGENT_DIR=%~dp0"
cd /d "%AGENT_DIR%"

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Criei o arquivo .env a partir do exemplo.
  echo IMPORTANTE: confira se PRINTER_COM_PORT esta certo pra essa impressora
  echo ^(Gerenciador de Dispositivos ^> Portas COM^) antes de continuar.
  echo Vou abrir o Bloco de Notas com o arquivo — salve e feche pra seguir.
  echo.
  pause
  notepad ".env"
)

echo.
echo Instalando dependencias ^(pode demorar um minuto^)...
call npm install
if errorlevel 1 (
  echo.
  echo [ERRO] npm install falhou. Veja a mensagem acima e tente de novo.
  pause
  exit /b 1
)

echo.
echo Criando inicializacao automatica e sem janela...
(
  echo Set WshShell = CreateObject^("WScript.Shell"^)
  echo WshShell.CurrentDirectory = "%AGENT_DIR%"
  echo WshShell.Run "cmd /c run.bat", 0, False
) > "%AGENT_DIR%iniciar-oculto.vbs"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
copy /Y "%AGENT_DIR%iniciar-oculto.vbs" "%STARTUP%\CyberERP-PrintAgent.vbs" >nul

if errorlevel 1 (
  echo [AVISO] Nao consegui copiar pra pasta de Inicializacao do Windows.
  echo Você pode copiar manualmente depois: abra "shell:startup" no Explorer
  echo e cole o arquivo iniciar-oculto.vbs desta pasta la dentro.
) else (
  echo Pronto — o agente vai iniciar sozinho ^(sem janela^) toda vez que o Windows ligar.
)

echo.
echo Iniciando o agente agora, pela primeira vez...
start "" wscript "%AGENT_DIR%iniciar-oculto.vbs"

timeout /t 2 /nobreak >nul
echo.
echo ============================================
echo Confira em http://localhost:9100/status — deve aparecer {"ok":true,...}
echo Se nao aparecer, confira a impressora e a porta COM no .env.
echo ============================================
echo.
pause
