#!/bin/bash

echo "============================================="
echo "CookMate - Auto Start with Port Cleanup"
echo "============================================="
echo

echo "Cleaning up conflicting ports..."
echo

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "Checking port $port..."
    
    # Get PIDs of processes using this port
    pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "Found processes on port $port: $pids"
        for pid in $pids; do
            echo "Killing process $pid using port $port"
            kill -9 $pid 2>/dev/null
        done
    else
        echo "No processes found on port $port"
    fi
}

# Kill processes on specific ports
kill_port 5001  # Firebase Functions
kill_port 5173  # Vite default
kill_port 5174  # Vite fallback
kill_port 5175  # Vite fallback

# Also kill any remaining node processes to be safe
echo
echo "Killing any remaining Node.js processes..."
pkill -f "node" 2>/dev/null || echo "No Node.js processes found"

echo "Ports cleaned successfully!"
echo
echo "Starting development servers..."
echo

# Wait a moment for ports to be freed
sleep 2

# Start the development servers
npm run dev