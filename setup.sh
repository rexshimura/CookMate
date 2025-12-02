#!/bin/bash

echo "============================================="
echo "CookMate - Automated Setup for Unix/Mac/Linux"
echo "============================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo
    exit 1
fi

echo "[1/6] Node.js and npm detected ✓"
echo

# Install root dependencies
echo "[2/6] Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install root dependencies"
    exit 1
fi
echo "Root dependencies installed ✓"
echo

# Install backend dependencies
echo "[3/6] Installing backend dependencies..."
cd backend/functions
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi
echo "Backend dependencies installed ✓"
cd ../..
echo

# Install frontend dependencies
echo "[4/6] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    exit 1
fi
echo "Frontend dependencies installed ✓"
cd ..
echo

# Setup .env file
echo "[5/6] Setting up environment file..."
if [ ! -f "backend/functions/.env" ]; then
    cp "backend/functions/.env.template" "backend/functions/.env"
    echo "Environment file created from template ✓"
    echo
    echo "IMPORTANT: Edit backend/functions/.env and add your GROQ_API_KEY"
    echo "Get your free API key from: https://console.groq.com/"
    echo
else
    echo "Environment file already exists ✓"
fi
echo

# Final instructions
echo "[6/6] Setup completed successfully! ✓"
echo
echo "============================================="
echo "NEXT STEPS:"
echo "============================================="
echo "1. Edit backend/functions/.env and add your GROQ_API_KEY"
echo "   (Get free key: https://console.groq.com/)"
echo
echo "2. Start the development servers:"
echo "   Run: npm run dev:backend"
echo "   Run: npm run dev:frontend"
echo
echo "3. Open http://localhost:5173 in your browser"
echo
echo "For more details, see README.md"
echo "============================================="
echo

# Make the script executable
chmod +x setup.sh