#!/bin/bash

# AIQA - Stop All Services Script

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           🛑 STOPPING ALL AIQA SERVICES 🛑                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Stop services by port
stop_service() {
    local port=$1
    local name=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "🛑 Stopping $name (port $port)..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo "   ✅ Stopped"
    else
        echo "⚪ $name (port $port) not running"
    fi
}

# Stop all AIQA services
stop_service 3001 "Phase 1: NL to Test Steps"
stop_service 3002 "Phase 2: Test Execution"
stop_service 3003 "Phase 3: AI Web Reader"
stop_service 3004 "Phase 4: Learning System"
stop_service 3005 "Phase 4.5: RAG Service"
stop_service 3006 "Phase 5: Self-Improving Code"
stop_service 3007 "Phase 6: Unified Platform"
stop_service 8000 "ChromaDB"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              ✅ ALL SERVICES STOPPED ✅                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "To restart, run: ./START_UNIFIED_PLATFORM.sh"
echo ""

