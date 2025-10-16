#!/usr/bin/env node

/**
 * CLI Test Runner
 * 
 * Command-line interface for running tests without the web server.
 * Useful for CI/CD integration and quick local testing.
 * 
 * Usage:
 *   node backend/executor/runner.js <test-file-path>
 *   node backend/executor/runner.js --intent "Your test description"
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import AIQA modules
import IntentParser from '../llm/intentParser.js';
import TestPlanner from '../llm/testPlanner.js';
import PlaywrightRunner from './playwrightRunner.js';
import ReportGenerator from '../reporting/reportGenerator.js';
import { readTestCaseFile, parseTestCase } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment and config
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const configPath = path.join(__dirname, '..', '..', 'config.json');
const configContent = await fs.readFile(configPath, 'utf8');
const config = JSON.parse(configContent);

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   AIQA CLI Test Runner                         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Usage:                                                        ║
║    node backend/executor/runner.js <test-file-path>           ║
║    node backend/executor/runner.js --intent "Test description"║
║                                                                ║
║  Examples:                                                     ║
║    node backend/executor/runner.js testcases/login_test.txt   ║
║    node backend/executor/runner.js --intent "Test login flow" ║
║                                                                ║
║  Options:                                                      ║
║    --intent    Run test from direct intent string             ║
║    --help      Show this help message                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
    process.exit(0);
  }
  
  if (args[0] === '--help') {
    console.log('AIQA CLI Test Runner - See usage above');
    process.exit(0);
  }
  
  try {
    let testIntent;
    
    // Parse arguments
    if (args[0] === '--intent') {
      testIntent = args.slice(1).join(' ');
      console.log('📝 Running test from intent string\n');
    } else {
      const filepath = args[0];
      const content = await readTestCaseFile(filepath);
      const parsed = parseTestCase(filepath, content);
      testIntent = parsed.intent || parsed;
      console.log(`📝 Running test from file: ${filepath}\n`);
    }
    
    // Initialize components
    const intentParser = new IntentParser(config);
    const testPlanner = new TestPlanner(config);
    const playwrightRunner = new PlaywrightRunner(config);
    const reportGenerator = new ReportGenerator(config);
    
    console.log('='.repeat(70));
    console.log('🚀 AIQA TEST EXECUTION');
    console.log('='.repeat(70) + '\n');
    
    // Execute test flow
    console.log('Step 1: Parsing intent with AI...');
    const parsedIntent = await intentParser.parseIntent(testIntent);
    
    if (!parsedIntent.success) {
      if (parsedIntent.needsClarification) {
        console.error('\n⚠️  Need clarification:');
        console.error(parsedIntent.clarificationQuestion);
        console.error('\nPartial steps parsed:', parsedIntent.partialSteps);
      } else {
        console.error('\n❌ Failed to parse intent:', parsedIntent.error);
      }
      process.exit(1);
    }
    
    console.log('\nStep 2: Generating test plan...');
    const testPlan = await testPlanner.generateTestPlan(parsedIntent);
    
    console.log('\nStep 3: Executing test...');
    const results = await playwrightRunner.executeTestPlan(testPlan);
    
    console.log('\nStep 4: Generating reports...');
    const reports = await reportGenerator.generateReports(results);
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(reportGenerator.generateTextSummary(results));
    console.log('='.repeat(70));
    console.log(`\n📄 HTML Report: ${reports.html}`);
    console.log(`📄 JSON Report: ${reports.json}\n`);
    
    // Exit with appropriate code
    process.exit(results.status === 'passed' ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();

