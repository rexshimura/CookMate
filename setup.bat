@echo off
echo =============================================
echo CookMate - Automated Setup for Windows
echo =============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/6] Node.js and npm detected ✓
echo.

:: Install root dependencies
echo [2/6] Installing root dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo Root dependencies installed ✓
echo.

:: Install backend dependencies
echo [3/6] Installing backend dependencies...
cd backend\functions
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed ✓
cd ..\..
echo.

:: Install frontend dependencies
echo [4/6] Installing frontend dependencies...
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed ✓
cd ..
echo.

:: Setup .env file
echo [5/6] Setting up environment file...
if not exist "backend\functions\.env" (
    copy "backend\functions\.env.template" "backend\functions\.env"
    echo Environment file created from template ✓
    echo.
    echo IMPORTANT: Edit backend\functions\.env and add your GROQ_API_KEY
    echo Get your free API key from: https://console.groq.com/
    echo.
) else (
    echo Environment file already exists ✓
)
echo.

:: Final instructions
echo [6/6] Setup completed successfully! ✓
echo.
echo =============================================
echo NEXT STEPS:
echo =============================================
echo 1. Edit backend\functions\.env and add your GROQ_API_KEY
echo    (Get free key: https://console.groq.com/)
echo.
echo 2. Start the development servers:
echo    Run: npm run dev:backend
echo    Run: npm run dev:frontend
echo.
echo 3. Open http://localhost:5173 in your browser
echo.
echo For more details, see README.md
echo =============================================
echo.
pause