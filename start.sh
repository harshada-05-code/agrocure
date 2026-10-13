#!/usr/bin/env bash
# AgroCure Concurrent Startup Script
# Concurrently launches FastAPI ML Engine (8000) and NestJS Gateway Orchestrator (3000)

set -e

# Resolve script root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=========================================================="
echo " Starting AgroCure Backend Ecosystem"
echo " 1. NestJS Gateway Orchestrator: http://localhost:3000"
echo " 2. FastAPI ML Engine:          http://localhost:8000"
echo " 3. Frontend Target:            https://agrocure.vercel.app/"
echo "=========================================================="

# Cleanup handler on exit (Ctrl+C / SIGINT / SIGTERM)
cleanup() {
    echo ""
    echo "Stopping AgroCure backend services..."
    if [ -n "$ML_PID" ]; then
        kill "$ML_PID" 2>/dev/null || true
    fi
    if [ -n "$ORCH_PID" ]; then
        kill "$ORCH_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "AgroCure services gracefully terminated."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI ML Service on port 8000
echo "[1/2] Launching FastAPI ML Engine on Port 8000..."
cd "$ROOT_DIR/ml_service"

if [ -f ".venv/Scripts/python.exe" ]; then
    PYTHON_EXEC=".venv/Scripts/python.exe"
elif [ -f ".venv/bin/python" ]; then
    PYTHON_EXEC=".venv/bin/python"
else
    PYTHON_EXEC="python"
fi

"$PYTHON_EXEC" -m uvicorn main:app --host 0.0.0.0 --port 8000 &
ML_PID=$!
echo "✓ FastAPI ML Engine started with PID $ML_PID"

# 2. Start NestJS Gateway Orchestrator on port 3000
echo "[2/2] Launching NestJS Gateway Orchestrator on Port 3000..."
cd "$ROOT_DIR/orchestrator"
npm run start &
ORCH_PID=$!
echo "✓ NestJS Orchestrator started with PID $ORCH_PID"

echo "=========================================================="
echo " Both AgroCure services are running concurrently."
echo " Press Ctrl+C to terminate both servers."
echo "=========================================================="

# Wait for both processes
wait
