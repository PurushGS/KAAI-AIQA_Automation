/**
 * ════════════════════════════════════════════════════════════════
 *                  DO NOT MODIFY - AUTHOR INFORMATION
 * ════════════════════════════════════════════════════════════════
 *  Author: Purushothama Raju
 *  Date: 12/10/2025
 *  Copyright © 2025 Purushothama Raju. All rights reserved.
 * ════════════════════════════════════════════════════════════════
 * 
 * AIQA API Server
 * 
 * Express server providing REST API endpoints for test execution,
 * file uploads, and result retrieval. Includes WebSocket support
 * for real-time log streaming.
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import AIQA modules
import IntentParser from './llm/intentParser.js';
import TestPlanner from './llm/testPlanner.js';
import PlaywrightRunner from './executor/playwrightRunner.js';
import ReportGenerator from './reporting/reportGenerator.js';
import { 
  readTestCaseFile, 
  parseTestCase, 
  validateConfig,
  ensureDirectoryExists 
} from './utils/helpers.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Load configuration
const configPath = path.join(__dirname, '..', 'config.json');
const configContent = await fs.readFile(configPath, 'utf8');
const config = JSON.parse(configContent);

// Validate configuration
validateConfig(config);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Configure file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'testcases', 'uploaded');
    await ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.json', '.yaml', '.yml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: .txt, .json, .yaml, .yml'));
    }
  }
});

// Initialize AIQA components
const intentParser = new IntentParser(config);
const testPlanner = new TestPlanner(config);
const playwrightRunner = new PlaywrightRunner(config);
const reportGenerator = new ReportGenerator(config);

// Global WebSocket clients for live logging
let wsClients = [];

// Custom console interceptor for WebSocket streaming
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  broadcastLog('info', args.join(' '));
};

console.error = (...args) => {
  originalError(...args);
  broadcastLog('error', args.join(' '));
};

function broadcastLog(type, message) {
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({ type, message, timestamp: new Date().toISOString() }));
    }
  });
}

// ==================== API Endpoints ====================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: config.system.version,
    environment: config.system.environment,
    timestamp: new Date().toISOString()
  });
});

/**
 * Upload test case file
 */
app.post('/api/upload', upload.single('testcase'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`📤 File uploaded: ${req.file.filename}`);
    
    res.json({
      success: true,
      message: 'Test case uploaded successfully',
      filename: req.file.filename,
      path: req.file.path
    });
    
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Run test from uploaded file or direct intent
 */
app.post('/api/run-test', async (req, res) => {
  try {
    const { filepath, intent } = req.body;
    
    if (!filepath && !intent) {
      return res.status(400).json({ 
        error: 'Either filepath or intent must be provided' 
      });
    }
    
    let testIntent;
    
    // Get intent from file or direct input
    if (filepath) {
      const content = await readTestCaseFile(filepath);
      const parsed = parseTestCase(filepath, content);
      testIntent = parsed.intent || parsed;
    } else {
      testIntent = intent;
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🚀 STARTING NEW TEST EXECUTION');
    console.log('='.repeat(70));
    
    // Step 1: Parse intent
    const parsedIntent = await intentParser.parseIntent(testIntent);
    
    if (!parsedIntent.success) {
      return res.status(400).json({
        success: false,
        needsClarification: parsedIntent.needsClarification,
        clarificationQuestion: parsedIntent.clarificationQuestion,
        partialSteps: parsedIntent.partialSteps
      });
    }
    
    // Step 2: Generate test plan
    const testPlan = await testPlanner.generateTestPlan(parsedIntent);
    
    // Step 3: Execute test
    const results = await playwrightRunner.executeTestPlan(testPlan);
    
    // Step 4: Generate reports
    const reports = await reportGenerator.generateReports(results);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST EXECUTION COMPLETE');
    console.log('='.repeat(70) + '\n');
    
    res.json({
      success: true,
      testId: results.testId,
      status: results.status,
      results,
      reports
    });
    
  } catch (error) {
    console.error('Test execution error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get test results by ID
 */
app.get('/api/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const resultsPath = path.join(__dirname, '..', 'logs', `results_${testId}.json`);
    
    const content = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(content);
    
    res.json(results);
    
  } catch (error) {
    res.status(404).json({ error: 'Test results not found' });
  }
});

/**
 * Get latest test results
 */
app.get('/api/results/latest', async (req, res) => {
  try {
    const resultsPath = path.join(__dirname, '..', 'logs', 'latest_results.json');
    const content = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(content);
    
    res.json(results);
    
  } catch (error) {
    res.status(404).json({ error: 'No test results found' });
  }
});

/**
 * List all test plans
 */
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await testPlanner.listTestPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all test cases
 */
app.get('/api/testcases', async (req, res) => {
  try {
    const testcasesDir = path.join(__dirname, '..', 'testcases');
    await ensureDirectoryExists(testcasesDir);
    
    const files = await fs.readdir(testcasesDir);
    const testcases = [];
    
    for (const file of files) {
      if (['.txt', '.json', '.yaml', '.yml'].some(ext => file.endsWith(ext))) {
        const filepath = path.join(testcasesDir, file);
        const stats = await fs.stat(filepath);
        
        testcases.push({
          filename: file,
          path: filepath,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    res.json(testcases);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system info
 */
app.get('/api/info', (req, res) => {
  res.json({
    system: config.system,
    llm: {
      provider: config.llm.provider,
      model: config.llm.model
    },
    executor: {
      browser: config.executor.browser,
      headless: config.executor.headless
    }
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                        AIQA SERVER                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║                                                                ║
║  📡 API Endpoints:                                             ║
║     POST   /api/upload          - Upload test case            ║
║     POST   /api/run-test        - Execute test                ║
║     GET    /api/results/:id     - Get test results            ║
║     GET    /api/plans           - List test plans             ║
║     GET    /api/testcases       - List test cases             ║
║                                                                ║
║  🔧 Configuration:                                             ║
║     LLM: ${config.llm.provider} (${config.llm.model})
║     Browser: ${config.executor.browser}                                      ║
║                                                                ║
║  📝 Logs: ./logs/                                              ║
║  📊 Reports: ./reports/                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Setup WebSocket server for live logs
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  wsClients.push(ws);
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    wsClients = wsClients.filter(client => client !== ws);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  server.close();
  process.exit(0);
});

export default app;

