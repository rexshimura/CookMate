@echo off
echo =============================================
echo CookMate - Auto Start (Simple Mode)
echo =============================================
echo.
echo This uses the Express dev server instead of Firebase emulators
echo.

echo Starting Express development server...
echo.

:: Kill any conflicting processes
echo Cleaning up any existing processes...
taskkill /F /IM node.exe >nul 2>&1

:: Wait a moment for processes to be killed
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server (Express)...
start "Backend Server" cmd /k "cd backend\functions && node dev-server.js"

echo.
echo Starting frontend server (Vite)...
echo This will open on http://localhost:5173 or next available port
echo.

cd frontend && npm run dev