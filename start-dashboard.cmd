@echo off
rem Shagun's AI desktop screen: starts the servers if needed, then locks the dashboard
rem full screen (kiosk) on the second monitor and reopens it if it is ever closed.
rem Use stop-dashboard.cmd to end it.
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0dashboard.ps1" -Root "%~dp0"
