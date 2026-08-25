@echo off
REM ============================================================
REM  Swing Trade Sniper - local launcher
REM
REM  Double-click to start. Keep this window open while using
REM  the app; closing it stops the app.
REM ============================================================

title Swing Trade Sniper - keep this window open

cd /d "%~dp0server"

echo.
echo   Starting Swing Trade Sniper...
echo   The browser will open by itself once the app is ready.
echo.
echo   KEEP THIS WINDOW OPEN. Closing it stops the app.
echo.
echo   ------------------------------------------------------
echo.

REM Wait until the server actually answers before opening a browser.
REM A fixed delay opened the page too early and showed "can't connect".
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "for ($i=0; $i -lt 90; $i++) { try { Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 2 -UseBasicParsing ^| Out-Null; Start-Process 'http://localhost:3001'; exit } catch { Start-Sleep -Seconds 1 } }"

REM Run the server in THIS window, so errors are visible and closing
REM the window actually stops it.
call npm start

echo.
echo   ------------------------------------------------------
echo    The app has stopped.
echo    If you see an error above, send it to Claude.
echo   ------------------------------------------------------
pause
