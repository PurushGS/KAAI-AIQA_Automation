#!/bin/bash

# AIQA Platform Startup Script
# Author: Purushothama Raju
# Date: 12/10/2025

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              AIQA PLATFORM - STARTING ALL SERVICES             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Kill any existing instances
echo "🛑 Stopping any existing AIQA services..."
pkill -f "node server.js" 2>/dev/null
sleep 2

# Start all phases
echo ""
echo "🚀 Starting AIQA services..."
echo ""

# Phase 1 - Natural Language to Steps
echo "📝 Starting Phase 1 (Port 3001) - Natural Language to Steps..."
cd "$SCRIPT_DIR/phase1"
nohup node server.js > /tmp/aiqa-phase1.log 2>&1 &
sleep 1

# Phase 2 - Test Execution
echo "⚡ Starting Phase 2 (Port 3002) - Test Execution Engine..."
cd "$SCRIPT_DIR/phase2"
nohup node server.js > /tmp/aiqa-phase2.log 2>&1 &
sleep 1

# Phase 3 - AI Web Reader
echo "🌐 Starting Phase 3 (Port 3003) - AI Web Reader..."
cd "$SCRIPT_DIR/phase3"
nohup node server.js > /tmp/aiqa-phase3.log 2>&1 &
sleep 1

# Phase 4 - Learning System
echo "🧠 Starting Phase 4 (Port 3004) - Learning System..."
cd "$SCRIPT_DIR/phase4"
nohup node server.js > /tmp/aiqa-phase4.log 2>&1 &
sleep 1

# Phase 4.5 - RAG Service
echo "🔍 Starting Phase 4.5 (Port 3005) - RAG Knowledge Base..."
cd "$SCRIPT_DIR/phase4.5"
nohup node server.js > /tmp/aiqa-phase4.5.log 2>&1 &
sleep 1

# Phase 5 - Self-Improving Code
echo "🔧 Starting Phase 5 (Port 3006) - Self-Improving Code..."
cd "$SCRIPT_DIR/phase5"
nohup node server.js > /tmp/aiqa-phase5.log 2>&1 &
sleep 1

# Phase 6 - Unified Platform
echo "🎯 Starting Phase 6 (Port 6969) - Unified Platform..."
cd "$SCRIPT_DIR/phase6"
nohup node server.js > /tmp/aiqa-phase6.log 2>&1 &
sleep 3

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ AIQA PLATFORM STARTED                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  🌐 Dashboard: http://localhost:6969                          ║"
echo "║                                                                ║"
echo "║  📊 CSV Import          - Upload bulk test cases              ║"
echo "║  ☁️  Cloud Integrations  - GitHub, Azure, AWS, GitLab         ║"
echo "║  🎯 Auto Triggers       - CI/CD automation                    ║"
echo "║                                                                ║"
echo "║  All 7 services running!                                      ║"
echo "║                                                                ║"
echo "║  To stop: ./STOP_AIQA.sh                                      ║"
echo "║  Logs: /tmp/aiqa-phase*.log                                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to keep terminal open, or close this window."
echo ""

# Keep script running to show it's active
tail -f /tmp/aiqa-phase6.log

