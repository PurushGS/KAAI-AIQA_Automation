/**
 * Phase 3 Test Server
 * 
 * PURPOSE:
 * Test AI Web Reader independently and demonstrate element finding
 * 
 * CONNECTIONS:
 * - Uses: webReader.js (AI element finding)
 * - Integrates: Will be used by Phase 2 executor
 * - Serves: Test UI for demonstration
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { chromium } from 'playwright';
import AIWebReader from './webReader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/**
 * API: Test AI element finding
 * 
 * ENDPOINT: POST /api/find-element
 * INPUT: { "url": "...", "description": "the login button", "action": "click" }
 * OUTPUT: { "success": true, "selector": "...", "strategy": "..." }
 */
app.post('/api/find-element', async (req, res) => {
  try {
    const { url, description, action = 'click' } = req.body;
    
    if (!url || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, description'
      });
    }
    
    console.log('\n📥 Element find request');
    console.log(`   URL: ${url}`);
    console.log(`   Looking for: "${description}"`);
    console.log(`   Action: ${action}`);
    
    // Launch browser
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
      // Navigate to page
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000); // Let page settle
      
      // Use AI Web Reader
      const webReader = new AIWebReader();
      const result = await webReader.findElement(page, description, action);
      
      // Highlight the found element (visual feedback)
      try {
        await page.locator(result.selector).highlight();
        await page.waitForTimeout(2000); // Show highlight
      } catch {}
      
      await browser.close();
      
      res.json({
        success: true,
        ...result,
        url: url
      });
      
    } catch (error) {
      await browser.close();
      throw error;
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    phase: 3,
    description: 'AI Web Reader',
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve test UI
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  AIQA PHASE 3 - TEST SERVER                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║                                                                ║
║  🔍 Phase 3: AI Web Reader (Nanobrowser-Style)                 ║
║                                                                ║
║  Features:                                                     ║
║   ✅ Natural language element finding                          ║
║   ✅ AI-powered page understanding                             ║
║   ✅ Multiple fallback strategies                              ║
║   ✅ Context-aware selection                                   ║
║                                                                ║
║  Capabilities:                                                 ║
║   "the login button" → finds it automatically                 ║
║   "email input field" → locates it intelligently              ║
║   "submit button in form" → understands context               ║
║                                                                ║
║  API Endpoints:                                                ║
║   POST /api/find-element - Find element by description        ║
║                                                                ║
║  Integration:                                                  ║
║   → Phase 2 will use this for smart element finding           ║
║   → No more brittle CSS selectors!                            ║
║                                                                ║
║  Next: Test this phase before moving to Phase 4               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

