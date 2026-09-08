@echo off
rem Shagun's AI desktop screen: starts the API + web server if needed, then opens the
rem dashboard in its own full-screen Chrome app window (separate profile so the flags apply).
setlocal
cd /d "%~dp0"

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set "PROFILE=%LOCALAPPDATA%\ShagunAI\chrome"

rem 1. Start the servers when port 5210 is not answering yet.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$up = $false; try { $up = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://localhost:5210).StatusCode -eq 200 } catch {}; if (-not $up) { Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm start' -WorkingDirectory '%~dp0' -WindowStyle Minimized }"

rem 2. Wait (up to 40 s) for the web server.
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i = 0; $i -lt 40; $i++) { try { if ((Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:5210).StatusCode -eq 200) { break } } catch {}; Start-Sleep -Seconds 1 }"

rem 3. Open the dashboard full screen. F11 leaves full screen, Alt+F4 closes it.
start "" "%CHROME%" --app=http://localhost:5210 --start-fullscreen --autoplay-policy=no-user-gesture-required --user-data-dir="%PROFILE%" --no-first-run --no-default-browser-check
endlocal
