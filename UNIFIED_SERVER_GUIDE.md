# KAAI Unified Server - Cost Optimization Guide

## Overview

The unified server consolidates all 7 phases into a **single service** to dramatically reduce deployment costs.

### Cost Comparison

- **Before (7 separate services):** $7/month × 7 = **$49/month**
- **After (1 unified service):** $7/month × 1 = **$7/month**
- **Savings:** **$42/month** (85% cost reduction)

## Architecture

```
┌─────────────────────────────────────────┐
│   Unified Server (Port 6969)            │
│   - Phase 6 Dashboard (integrated)      │
│   - Proxies to internal phases          │
└─────────────────────────────────────────┘
           │
           ├─── Phase 1 (internal:3001)
           ├─── Phase 2 (internal:3002)
           ├─── Phase 3 (internal:3003)
           ├─── Phase 4 (internal:3004)
           ├─── Phase 4.5 (internal:3005)
           └─── Phase 5 (internal:3006)
```

### How It Works

1. **Unified Server** (`unified-server.js`) starts on the main port (6969 or Render's PORT)
2. **Phase 6** is integrated directly (no separate process)
3. **All other phases** run as child processes on internal ports (3001-3006)
4. **Unified server** proxies requests to internal phases via `/api/phaseX/*` routes
5. **Phase 6** routes handle dashboard, suites, and orchestration

## Files Changed

### 1. `unified-server.js` (NEW)
- Main entry point for unified deployment
- Starts all phases as child processes
- Proxies requests to internal phases
- Integrates Phase 6's Express app

### 2. `phase6/server.js` (MODIFIED)
- Added `UNIFIED_MODE` check to prevent starting its own server when imported
- Modified `SERVICES` to support environment variables

### 3. `render.yaml` (MODIFIED)
- Changed from 7 services to 1 service
- Updated `rootDir` to `.` (project root)
- Updated `startCommand` to `node unified-server.js`
- Added `UNIFIED_MODE=true` environment variable

## Deployment

### Render Deployment

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Select: `PurushGS/KAAI-AIQA_Automation`

3. **Render will:**
   - Auto-detect `render.yaml`
   - Create 1 service instead of 7
   - Deploy unified server

4. **Set Environment Variables:**
   ```
   OPENAI_API_KEY=your_key
   ANTHROPIC_API_KEY=your_key
   PHASE1_MODEL=claude-3-5-haiku-20241022
   ```

### Local Testing

```bash
# Start unified server
node unified-server.js

# Or use the existing start script (it will still work)
./START_AIQA.sh
```

## How Phases Communicate

### Internal Communication
- All phases run on `localhost` with different ports
- Phase 6 uses `SERVICES` object to reference internal phases
- Unified server proxies `/api/phaseX/*` requests

### External Access
- Only **one port** is exposed (6969 or Render's PORT)
- All requests go through unified server
- Phase 6 dashboard handles UI and orchestration

## Benefits

1. **Cost Savings:** 85% reduction ($42/month saved)
2. **Simpler Deployment:** One service instead of seven
3. **Easier Management:** Single health check, single log stream
4. **Same Functionality:** All features work exactly the same

## Limitations

1. **Single Point of Failure:** If unified server crashes, all phases go down
2. **Resource Sharing:** All phases share the same container resources
3. **Scaling:** Can't scale individual phases independently

## Troubleshooting

### Phase Not Starting
- Check logs: `[phaseName]` prefix in unified server output
- Verify phase's `server.js` exists
- Check if port is already in use

### Proxy Errors
- Verify internal phase is running: `curl http://localhost:3001/health`
- Check `SERVICES` object in unified server
- Ensure phase has `/health` endpoint

### Phase 6 Not Loading
- Check `UNIFIED_MODE` environment variable is set
- Verify Phase 6's `server.js` exports the app correctly
- Check for import errors in unified server logs

## Reverting to Multi-Service

If you need to revert to separate services:

1. **Restore old `render.yaml`:**
   ```bash
   git checkout HEAD~1 render.yaml
   ```

2. **Remove unified mode:**
   - Delete `unified-server.js`
   - Remove `UNIFIED_MODE` checks from `phase6/server.js`

3. **Redeploy on Render:**
   - Render will create 7 services again

## Future Improvements

- [ ] Add process monitoring/restart for child processes
- [ ] Implement health checks for all internal phases
- [ ] Add graceful shutdown for all child processes
- [ ] Consider using PM2 for better process management
- [ ] Add metrics/observability for unified server

