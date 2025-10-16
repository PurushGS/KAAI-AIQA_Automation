#!/bin/bash

# AIQA Unified Platform - Quick Start Script
# This script starts all required services for the unified platform

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        🚀 AIQA UNIFIED PLATFORM - QUICK START 🚀              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if services are already running
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Start a service if not running
start_service() {
    local port=$1
    local phase=$2
    local name=$3
    
    if check_port $port; then
        echo "✅ $name already running on port $port"
    else
        echo "🚀 Starting $name on port $port..."
        cd "$phase" && npm start > /dev/null 2>&1 &
        sleep 2
    fi
}

# Change to AIQA directory
cd "$(dirname "$0")"

echo "📋 Checking services..."
echo ""

# Phase 2 is required for test execution
start_service 3002 "phase2" "Phase 2: Test Execution"

# Phase 4.5 is required for knowledge base
start_service 3005 "phase4.5" "Phase 4.5: RAG Service"

# Phase 5 is optional but recommended
start_service 3006 "phase5" "Phase 5: Self-Improving Code"

# Phase 6 is the unified platform
start_service 3007 "phase6" "Phase 6: Unified Platform"

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              ✅ UNIFIED PLATFORM READY! ✅                    ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║  🌐 Open your browser:                                        ║"
echo "║                                                               ║"
echo "║     http://localhost:3007                                     ║"
echo "║                                                               ║"
echo "║  Features Available:                                          ║"
echo "║  ✅ Dashboard                                                  ║"
echo "║  ✅ Create Tests (Natural Language)                           ║"
echo "║  ✅ Execute Tests                                             ║"
echo "║  ✅ View Results                                              ║"
echo "║  ✅ Knowledge Base                                            ║"
echo "║  ✅ Services Health                                           ║"
echo "║                                                               ║"
echo "║  📚 Documentation: UNIFIED_PLATFORM_GUIDE.md                  ║"
echo "║                                                               ║"
echo "║  To stop all services, press Ctrl+C or run:                   ║"
echo "║  ./STOP_ALL_SERVICES.sh                                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Open browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🌐 Opening browser..."
    sleep 2
    open http://localhost:3007
fi

echo ""
echo "✨ Unified platform is running! ✨"
echo ""

