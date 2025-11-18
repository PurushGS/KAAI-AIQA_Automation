/**
 * KAAI Unified Server - Single Service Deployment
 * 
 * Runs all phases internally in one service to reduce costs
 * All phases run on internal ports, Phase 6 is the main entry point
 * 
 * Cost: $7/month (single service) instead of $49/month (7 services)
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const PORT = process.env.PORT || 6969;

// Set unified mode so Phase 6 doesn't start its own server
process.env.UNIFIED_MODE = 'true';

// Internal ports for each phase (not exposed externally)
const INTERNAL_PORTS = {
  phase1: 3001,
  phase2: 3002,
  phase3: 3003,
  phase4: 3004,
  phase4_5: 3005,
  phase5: 3006
};

// Track child processes
const processes = {};

// Start a phase server as child process
function startPhase(phaseName, phaseDir, port) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting ${phaseName} on internal port ${port}...`);
    
    const phasePath = join(__dirname, phaseDir, 'server.js');
    
    // Check if server file exists
    if (!fs.existsSync(phasePath)) {
      console.warn(`⚠️  ${phaseName} server not found at ${phasePath}, skipping...`);
      resolve(null);
      return;
    }
    
    // Set environment variables for this phase
    const env = {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: process.env.NODE_ENV || 'production'
    };
    
    // Start the phase server
    const child = spawn('node', [phasePath], {
      cwd: join(__dirname, phaseDir),
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Store process
    processes[phaseName] = child;
    
    // Log output
    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`[${phaseName}] ${line}`);
        }
      });
    });
    
    child.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim() && !line.includes('ExperimentalWarning')) {
          console.error(`[${phaseName}] ${line}`);
        }
      });
    });
    
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ ${phaseName} exited with code ${code}`);
      } else {
        console.log(`✅ ${phaseName} stopped`);
      }
      delete processes[phaseName];
    });
    
    // Wait for server to start
    const checkInterval = setInterval(() => {
      if (child.exitCode === null) {
        clearInterval(checkInterval);
        console.log(`✅ ${phaseName} started on port ${port}`);
        resolve(child);
      } else if (child.exitCode !== null) {
        clearInterval(checkInterval);
        reject(new Error(`${phaseName} failed to start (exit code: ${child.exitCode})`));
      }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (child.exitCode === null) {
        clearInterval(checkInterval);
        console.log(`✅ ${phaseName} started on port ${port} (timeout check)`);
        resolve(child);
      }
    }, 10000);
  });
}

// Start all phases
async function startAllPhases() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         Starting Internal Phase Services...                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const phaseStartPromises = [];
  
  // Start phases in parallel (they're independent)
  phaseStartPromises.push(
    startPhase('phase1', 'phase1', INTERNAL_PORTS.phase1).catch(e => console.warn(`⚠️  Phase 1: ${e.message}`))
  );
  phaseStartPromises.push(
    startPhase('phase4.5', 'phase4.5', INTERNAL_PORTS.phase4_5).catch(e => console.warn(`⚠️  Phase 4.5: ${e.message}`))
  );
  phaseStartPromises.push(
    startPhase('phase2', 'phase2', INTERNAL_PORTS.phase2).catch(e => console.warn(`⚠️  Phase 2: ${e.message}`))
  );
  phaseStartPromises.push(
    startPhase('phase3', 'phase3', INTERNAL_PORTS.phase3).catch(e => console.warn(`⚠️  Phase 3: ${e.message}`))
  );
  phaseStartPromises.push(
    startPhase('phase4', 'phase4', INTERNAL_PORTS.phase4).catch(e => console.warn(`⚠️  Phase 4: ${e.message}`))
  );
  phaseStartPromises.push(
    startPhase('phase5', 'phase5', INTERNAL_PORTS.phase5).catch(e => console.warn(`⚠️  Phase 5: ${e.message}`))
  );
  
  await Promise.all(phaseStartPromises);
  
  console.log('\n✅ All phases started internally\n');
  
  // Wait a bit for services to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Create Express app for Phase 6
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Service URLs (pointing to internal ports)
const SERVICES = {
  phase1: `http://localhost:${INTERNAL_PORTS.phase1}`,
  phase2: `http://localhost:${INTERNAL_PORTS.phase2}`,
  phase3: `http://localhost:${INTERNAL_PORTS.phase3}`,
  phase4: `http://localhost:${INTERNAL_PORTS.phase4}`,
  phase4_5: `http://localhost:${INTERNAL_PORTS.phase4_5}`,
  phase5: `http://localhost:${INTERNAL_PORTS.phase5}`
};

// Health check
app.get('/health', (req, res) => {
  const phaseStatus = {};
  Object.keys(processes).forEach(phase => {
    phaseStatus[phase] = processes[phase]?.exitCode === null ? 'running' : 'stopped';
  });
  
  res.json({
    status: 'healthy',
    service: 'KAAI Unified Platform',
    version: '1.0.0',
    phases: phaseStatus,
    internalPorts: INTERNAL_PORTS
  });
});

// WebSocket config endpoint
app.get('/api/config', (req, res) => {
  try {
    const phase2Base = SERVICES.phase2;
    // In production, we need to determine if we're using HTTPS
    const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    const wsProtocol = isHttps ? 'wss' : 'ws';
    
    // Get host from request
    const host = req.get('host') || 'localhost:3002';
    const wsHost = host.replace(/:\d+$/, `:${INTERNAL_PORTS.phase2}`);
    
    res.json({
      phase2WebSocketUrl: `${wsProtocol}://${wsHost}/ws/logs`,
      phase2Url: SERVICES.phase2,
      phase1Url: SERVICES.phase1,
      phase4_5Url: SERVICES.phase4_5
    });
  } catch (error) {
    res.json({
      phase2WebSocketUrl: `ws://localhost:${INTERNAL_PORTS.phase2}/ws/logs`,
      phase2Url: SERVICES.phase2,
      phase1Url: SERVICES.phase1,
      phase4_5Url: SERVICES.phase4_5
    });
  }
});

// Proxy function for forwarding requests to internal phases
async function proxyRequest(req, res, baseUrl) {
  try {
    // Remove the /api/phaseX prefix and forward to the actual phase
    const path = req.originalUrl.replace(/^\/api\/phase[0-9._]+/, '/api');
    const url = `${baseUrl}${path}`;
    
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };
    
    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      try {
        res.status(response.status).json(JSON.parse(text));
      } catch {
        res.status(response.status).send(text);
      }
    } else {
      // For binary data (like images), stream it
      const buffer = await response.arrayBuffer();
      res.status(response.status)
         .set(response.headers)
         .send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error(`Proxy error for ${baseUrl}:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: `Failed to proxy request: ${error.message}` 
    });
  }
}

// Proxy routes to internal phases (before Phase 6 routes)
app.use('/api/phase1', (req, res) => proxyRequest(req, res, SERVICES.phase1));
app.use('/api/phase2', (req, res) => proxyRequest(req, res, SERVICES.phase2));
app.use('/api/phase3', (req, res) => proxyRequest(req, res, SERVICES.phase3));
app.use('/api/phase4', (req, res) => proxyRequest(req, res, SERVICES.phase4));
app.use('/api/phase4.5', (req, res) => proxyRequest(req, res, SERVICES.phase4_5));
app.use('/api/phase5', (req, res) => proxyRequest(req, res, SERVICES.phase5));

// Proxy artifacts from Phase 2
app.use('/artifacts', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase2);
});

// Load Phase 6's routes and middleware
// Phase 6 will check UNIFIED_MODE and won't start its own server
import('./phase6/server.js').then(async (phase6Module) => {
  // Phase 6 exports the app
  const phase6App = phase6Module.default || phase6Module;
  
  // Mount Phase 6's app (it has all routes and middleware)
  app.use('/', phase6App);
  
  // Start unified server
  app.listen(PORT, async () => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         KAAI Unified Server - Main Entry Point                  ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  🚀 Server running on port ${PORT}                              ║`);
    console.log('║                                                                ║');
    console.log('║  All phases running internally:                                 ║');
    console.log(`║   • Phase 1: http://localhost:${INTERNAL_PORTS.phase1}            ║`);
    console.log(`║   • Phase 2: http://localhost:${INTERNAL_PORTS.phase2}            ║`);
    console.log(`║   • Phase 3: http://localhost:${INTERNAL_PORTS.phase3}            ║`);
    console.log(`║   • Phase 4: http://localhost:${INTERNAL_PORTS.phase4}            ║`);
    console.log(`║   • Phase 4.5: http://localhost:${INTERNAL_PORTS.phase4_5}        ║`);
    console.log(`║   • Phase 5: http://localhost:${INTERNAL_PORTS.phase5}            ║`);
    console.log(`║   • Phase 6: Integrated (Main Dashboard)                        ║`);
    console.log('║                                                                ║');
    console.log('║  💰 Cost: $7/month (single service)                            ║');
    console.log('║  💰 Savings: $42/month (was $49/month for 7 services)          ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    // Start all internal phases
    await startAllPhases();
  });
  
}).catch(error => {
  console.error('❌ Failed to load Phase 6:', error);
  // Start server anyway with basic functionality
  app.listen(PORT, async () => {
    console.log(`\n🚀 Unified server running on port ${PORT}`);
    await startAllPhases();
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down unified server...');
  Object.keys(processes).forEach(phase => {
    if (processes[phase]) {
      processes[phase].kill();
    }
  });
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down unified server...');
  Object.keys(processes).forEach(phase => {
    if (processes[phase]) {
      processes[phase].kill();
    }
  });
  setTimeout(() => process.exit(0), 2000);
});
