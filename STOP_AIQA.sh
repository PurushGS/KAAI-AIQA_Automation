#!/bin/bash

# AIQA Platform Stop Script
# Author: Purushothama Raju
# Date: 12/10/2025

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              AIQA PLATFORM - STOPPING ALL SERVICES             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "🛑 Stopping all AIQA services..."

# Kill all node server processes
pkill -f "node server.js"

# Wait a moment
sleep 2

# Check if any are still running
REMAINING=$(ps aux | grep "node server.js" | grep -v grep | wc -l)

if [ $REMAINING -eq 0 ]; then
    echo "✅ All AIQA services stopped successfully"
else
    echo "⚠️  Some services may still be running. Force killing..."
    pkill -9 -f "node server.js"
    sleep 1
    echo "✅ All services force stopped"
fi

echo ""
echo "🧹 Cleaning up log files..."
rm -f /tmp/aiqa-phase*.log

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ AIQA PLATFORM STOPPED                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

