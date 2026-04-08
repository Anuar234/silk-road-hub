@echo off
setlocal

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

echo Starting demo launcher...
call npm run demo:launch
if errorlevel 1 (
  echo Demo launcher failed. Check errors above.
  pause
  exit /b 1
)
