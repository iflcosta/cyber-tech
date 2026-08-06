@echo off
title Cyber ERP - Desinstalar inicializacao automatica
echo Isso remove só a inicializacao automatica do agente ^(nao apaga nada
echo desta pasta^). Se quiser voltar a rodar manualmente, use "npm start".
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
if exist "%STARTUP%\CyberERP-PrintAgent.vbs" (
  del "%STARTUP%\CyberERP-PrintAgent.vbs"
  echo Removido. O agente nao vai mais iniciar sozinho com o Windows.
) else (
  echo Nao encontrei nada pra remover — talvez ja nao esteja instalado.
)

echo.
pause
