@echo off
echo =============================================
echo CookMate - Auto Start with Port Cleanup
echo =============================================
echo.

echo Cleaning up conflicting ports...
echo.

:: Kill processes on port 5001 (Firebase Functions)
echo Checking port 5001 (Firebase Functions)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do (
    echo Killing process %%a using port 5001
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill processes on port 5173 (Vite default)
echo Checking port 5173 (Vite)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo Killing process %%a using port 5173
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill processes on port 5174 (Vite fallback)
echo Checking port 5174 (Vite fallback)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do (
    echo Killing process %%a using port 5174
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill processes on port 5175 (Vite fallback)
echo Checking port 5175 (Vite fallback)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175') do (
    echo Killing process %%a using port 5175
    taskkill /F /PID %%a >nul 2>&1
)

:: Also kill any remaining node processes to be safe
echo.
echo Killing any remaining Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Ports cleaned successfully!
echo.
echo Starting development servers...
echo.

:: Wait a moment for ports to be freed
timeout /t 2 /nobreak >nul

:: Start the development servers
npm run dev

pause