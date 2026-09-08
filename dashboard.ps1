# Shagun's AI desktop screen: keeps the dashboard locked full screen on the second monitor.
# Started by start-dashboard.cmd (also from the Startup folder). Ended by stop-dashboard.cmd.
param([string]$RootArg)
$Root = $PSScriptRoot  # always the folder this script lives in

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) { $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" }
$dir = Join-Path $env:LOCALAPPDATA "ShagunAI"
$profile = Join-Path $dir "chrome"
$flag = Join-Path $dir "stop"
New-Item -ItemType Directory -Force $dir | Out-Null
Remove-Item $flag -ErrorAction SilentlyContinue

function Up { try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:5210).StatusCode -eq 200 } catch { $false } }
function Running { @(Get-CimInstance Win32_Process -Filter "name='chrome.exe'" | Where-Object { $_.CommandLine -like "*ShagunAI*" }).Count -gt 0 }
function OnDashboard {
  $titles = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } |
    Where-Object { (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine -like "*ShagunAI*" } | ForEach-Object { $_.MainWindowTitle }
  @($titles | Where-Object { $_ -like "*Shagun*" }).Count -gt 0
}
function CloseAll { Get-CimInstance Win32_Process -Filter "name='chrome.exe'" | Where-Object { $_.CommandLine -like "*ShagunAI*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } }
function Launch {
  Add-Type -AssemblyName System.Windows.Forms
  $scr = [System.Windows.Forms.Screen]::AllScreens | Where-Object { -not $_.Primary } | Select-Object -First 1
  if (-not $scr) { $scr = [System.Windows.Forms.Screen]::PrimaryScreen }
  $b = $scr.Bounds
  $args = @("--kiosk", "http://localhost:5210/?kiosk=1", "--autoplay-policy=no-user-gesture-required", "--user-data-dir=$profile",
            "--no-first-run", "--no-default-browser-check", "--disable-session-crashed-bubble", "--block-new-web-contents",
            "--window-position=$($b.X),$($b.Y)", "--window-size=$($b.Width),$($b.Height)")
  Start-Process -FilePath $chrome -ArgumentList $args
}

# 1. Servers.
if (-not (Up)) { Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WorkingDirectory $Root -WindowStyle Minimized; Start-Sleep -Seconds 3 }
for ($i = 0; $i -lt 60 -and -not (Up); $i++) { Start-Sleep -Seconds 1 }

# 2. Window, kept alive until the stop flag appears.
if (-not (Running)) { Launch }
$strikes = 0
while ($true) {
  Start-Sleep -Seconds 5
  if (Test-Path $flag) { Remove-Item $flag -ErrorAction SilentlyContinue; break }
  if (-not (Running)) { Launch; $strikes = 0; continue }
  # Navigated away from the dashboard (title no longer ours) for two checks in a row: bring it back.
  if (OnDashboard) { $strikes = 0 } else { $strikes++ }
  if ($strikes -ge 2) { CloseAll; Start-Sleep -Seconds 2; Launch; $strikes = 0 }
}
