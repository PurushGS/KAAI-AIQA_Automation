# KAAI Platform - User Guide

## How It Works

The KAAI platform uses a **unified server architecture** that automatically runs all phases for you. You don't need to install or start phases separately - everything is handled automatically!

## Quick Start

### Option 1: Unified Server (Recommended)

**Single command starts everything:**

```bash
node unified-server.js
```

This automatically:
- ✅ Starts Phase 1 (NL to Steps Converter)
- ✅ Starts Phase 2 (Test Execution Engine)
- ✅ Starts Phase 3 (AI Web Reader)
- ✅ Starts Phase 4 (Learning System)
- ✅ Starts Phase 4.5 (RAG Knowledge Base)
- ✅ Starts Phase 5 (Self-Improving Code)
- ✅ Starts Phase 6 (Unified Dashboard)

**Access the platform:**
- Dashboard: http://localhost:6969
- All phases run internally and communicate automatically

### Option 2: Individual Phases (Legacy)

If you prefer to run phases separately (for development/debugging):

```bash
./START_AIQA.sh
```

This starts each phase in a separate terminal/process.

## Prerequisites

### What You Need to Install

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Dependencies** (one-time setup)
   ```bash
   # Install root dependencies
   npm install
   
   # Install phase-specific dependencies
   cd phase1 && npm install && cd ..
   cd phase2 && npm install && cd ..
   cd phase3 && npm install && cd ..
   cd phase4 && npm install && cd ..
   cd phase4.5 && npm install && cd ..
   cd phase5 && npm install && cd ..
   cd phase6 && npm install && cd ..
   
   # Install Playwright browsers (for Phase 2)
   cd phase2 && npx playwright install chromium --with-deps && cd ..
   ```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=your_openai_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: Model selection
PHASE1_MODEL=claude-3-5-haiku-20241022

# Optional: ChromaDB (for RAG)
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## How Unified Server Works

### Architecture

```
┌─────────────────────────────────────────┐
│   Unified Server (Port 6969)            │
│   - Phase 6 Dashboard (integrated)       │
│   - Proxies to internal phases          │
└─────────────────────────────────────────┘
           │
           ├─── Phase 1 (internal:3001) ← Auto-started
           ├─── Phase 2 (internal:3002) ← Auto-started
           ├─── Phase 3 (internal:3003) ← Auto-started
           ├─── Phase 4 (internal:3004) ← Auto-started
           ├─── Phase 4.5 (internal:3005) ← Auto-started
           └─── Phase 5 (internal:3006) ← Auto-started
```

### What Happens When You Run `node unified-server.js`

1. **Unified server starts** on port 6969 (or `process.env.PORT`)
2. **Phase 6 loads** directly (no separate process)
3. **Child processes spawn** for Phases 1-5:
   - Each phase runs in its own Node.js process
   - Each phase listens on an internal port (3001-3006)
   - All phases communicate via `localhost`
4. **Proxy routes** forward requests:
   - `/api/phase1/*` → `http://localhost:3001/api/*`
   - `/api/phase2/*` → `http://localhost:3002/api/*`
   - etc.
5. **Dashboard** at `http://localhost:6969` orchestrates everything

### Benefits

✅ **One Command:** Start everything with `node unified-server.js`  
✅ **No Manual Setup:** All phases start automatically  
✅ **Single Port:** Only one port exposed (6969)  
✅ **Automatic Communication:** Phases talk to each other internally  
✅ **Easy Deployment:** One service on Render/cloud platforms  

## Local Development

### Running Locally

```bash
# 1. Clone repository
git clone https://github.com/PurushGS/KAAI-AIQA_Automation.git
cd KAAI-AIQA_Automation

# 2. Install dependencies (see Prerequisites above)

# 3. Set up .env file
cp .env.example .env
# Edit .env and add your API keys

# 4. Start unified server
node unified-server.js

# 5. Open browser
open http://localhost:6969
```

### Development Mode

If you want to develop individual phases:

```bash
# Start phases separately
cd phase1 && node server.js &  # Port 3001
cd phase2 && node server.js &  # Port 3002
# ... etc

# Or use the start script
./START_AIQA.sh
```

## Cloud Deployment (Render)

### How It Works on Render

1. **Render detects** `render.yaml` in your repository
2. **Creates 1 service** (not 7!)
3. **Runs** `node unified-server.js` as start command
4. **All phases** start automatically as child processes
5. **Single URL** exposes everything: `https://your-app.onrender.com`

### Environment Variables on Render

Set these in Render Dashboard:
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `PHASE1_MODEL` (optional)
- `CHROMA_HOST` and `CHROMA_PORT` (optional)

## Troubleshooting

### Phase Not Starting

**Check logs:**
```bash
# Look for [phaseName] prefix in unified server output
node unified-server.js
# Should see: [phase1] Server running...
```

**Verify phase exists:**
```bash
ls phase1/server.js  # Should exist
```

**Check port availability:**
```bash
lsof -i :3001  # Should be empty before starting
```

### "Cannot find module" Error

**Install dependencies:**
```bash
# Install all phase dependencies
npm install
cd phase1 && npm install && cd ..
cd phase2 && npm install && cd ..
# ... repeat for all phases
```

### API Key Errors

**Check .env file:**
```bash
cat .env | grep API_KEY
# Should show your keys
```

**Verify key is valid:**
```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Port Already in Use

**Kill existing processes:**
```bash
# Kill all Node.js processes
pkill -f "node.*server.js"

# Or kill specific port
lsof -ti:6969 | xargs kill
```

## FAQ

### Q: Do I need to install each phase separately?

**A:** No! The unified server automatically starts all phases. Just run `node unified-server.js`.

### Q: Can I run phases individually?

**A:** Yes, but it's not necessary. Use `./START_AIQA.sh` or start each phase manually if you need to debug.

### Q: What if a phase fails to start?

**A:** The unified server will log the error and continue. Other phases will still work. Check logs for `[phaseName]` prefix.

### Q: How do I update a specific phase?

**A:** Just update the code and restart the unified server. All phases restart together.

### Q: Can I deploy phases separately?

**A:** Yes, but it costs more ($49/month vs $7/month). Use the old `render.yaml` if you need separate services.

### Q: What ports are used?

**A:** 
- **External:** 6969 (or `process.env.PORT`)
- **Internal:** 3001-3006 (not exposed, only for inter-process communication)

### Q: Do I need ChromaDB installed?

**A:** No! Phase 4.5 uses ChromaDB embedded mode. It runs automatically when Phase 4.5 starts.

## Summary

✅ **One command** (`node unified-server.js`) starts everything  
✅ **No manual setup** - all phases start automatically  
✅ **Single port** - only 6969 exposed  
✅ **Automatic communication** - phases talk internally  
✅ **Easy deployment** - one service on cloud platforms  

You don't need to install or configure phases separately - the unified server handles everything!

