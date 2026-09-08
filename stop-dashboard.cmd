@echo off
rem Ends the locked dashboard screen: tells the keep-alive loop to stop, then closes the window.
type nul > "%LOCALAPPDATA%\ShagunAI\stop"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*ShagunAI*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo Dashboard screen stopped.
