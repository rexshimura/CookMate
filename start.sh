#!/bin/bash

echo "============================================="
echo "CookMate - Development Server"
echo "============================================="
echo
echo "This script starts both frontend and backend servers"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5001"
echo

echo "Cleaning up any existing processes..."
pkill -f "node" 2>/dev/null || echo "No Node.js processes found"
sleep 2

echo "Starting backend server..."
cd backend/functions && node dev-server.js &
BACKEND_PID=$!
cd ../..

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend server..."
echo
cd frontend && npm run dev

# When frontend stops, kill the backend
echo "Frontend stopped, cleaning up backend..."
kill $BACKEND_PID 2>/dev/null