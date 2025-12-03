#!/bin/bash

echo "============================================="
echo "CookMate - Auto Start (Simple Mode)"
echo "============================================="
echo
echo "This uses the Express dev server instead of Firebase emulators"
echo

echo "Starting Express development server..."
echo

# Kill any conflicting processes
echo "Cleaning up any existing processes..."
pkill -f "node" 2>/dev/null || echo "No Node.js processes found"

# Wait a moment for processes to be killed
sleep 2

echo
echo "Starting backend server (Express)..."
# Start backend in background
cd backend/functions && node dev-server.js &
BACKEND_PID=$!
cd ../..

echo "Backend started with PID: $BACKEND_PID"
echo
echo "Starting frontend server (Vite)..."
echo "This will open on http://localhost:5173 or next available port"
echo

# Start frontend
cd frontend && npm run dev

# When frontend stops, kill the backend
echo "Frontend stopped, cleaning up backend..."
kill $BACKEND_PID 2>/dev/null