@echo off
echo =============================================
echo CookMate - Development Server
echo =============================================
echo.
echo This script starts both frontend and backend servers
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5001
echo.

echo Cleaning up any existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting backend server...
start "Backend Server" cmd /k "cd backend\functions && node dev-server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend server...
echo.
cd frontend && npm run dev