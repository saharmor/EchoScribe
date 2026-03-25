#!/bin/bash

# Echo Scribe - Start Backend and Frontend
# This script starts both the FastAPI backend and Vite frontend

set -e  # Exit on any error

echo "🎤 Starting Echo Scribe..."
echo "================================"

# Default ports (can be overridden via env: BACKEND_PORT / FRONTEND_PORT)
BACKEND_PORT="${BACKEND_PORT:-9090}"
FRONTEND_PORT="${FRONTEND_PORT:-8282}"

# Helper: check if a TCP port is already in use (LISTEN)
port_in_use() {
    lsof -i ":$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Echo Scribe..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "✅ Frontend stopped"
    fi
    echo "👋 Echo Scribe stopped"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the Echo Scribe root directory"
    echo "   Expected files: backend/main.py and frontend/package.json"
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Backend virtual environment not found. Creating one..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend virtual environment found"
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies found"
fi

# Preflight: ensure requested ports are available
if port_in_use "$BACKEND_PORT"; then
    echo "❌ Backend port $BACKEND_PORT is already in use."
    echo "   Please free it or run with a different port, e.g.:"
    echo "   BACKEND_PORT=9091 ./start_echo_scribe.sh"
    exit 1
fi

if port_in_use "$FRONTEND_PORT"; then
    echo "❌ Frontend port $FRONTEND_PORT is already in use."
    echo "   Please free it or run with a different port, e.g.:"
    echo "   FRONTEND_PORT=8283 ./start_echo_scribe.sh"
    exit 1
fi

# Start backend
echo ""
echo "🚀 Starting backend server..."
cd backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Failed to start backend server"
    exit 1
fi

echo "✅ Backend server started on http://localhost:${BACKEND_PORT}"

# Start frontend
echo ""
echo "🎨 Starting frontend server..."
cd frontend
# Pass ports to Vite via env; Vite config reads these and binds strictly
ECHO_SCRIBE_FRONTEND_PORT="$FRONTEND_PORT" ECHO_SCRIBE_BACKEND_PORT="$BACKEND_PORT" npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Failed to start frontend server"
    cleanup
    exit 1
fi

echo "✅ Frontend server started on http://localhost:${FRONTEND_PORT}"
echo ""
echo "🎉 Echo Scribe is running!"
echo "================================"
echo "📱 Frontend: http://localhost:${FRONTEND_PORT}"
echo "🔧 Backend API: http://localhost:${BACKEND_PORT}"
echo "📚 API Docs: http://localhost:${BACKEND_PORT}/docs"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for user to stop the services
wait 