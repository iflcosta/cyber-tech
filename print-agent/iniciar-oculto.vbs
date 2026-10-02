Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\User\Documents\crm-cyber\cyber-tech-clone\print-agent"
WshShell.Run "cmd /c run.bat", 0, False
