/**
 * CSV Test Suite Handler
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Parse CSV files containing test cases and convert them to executable JSON format.
 * Each row in CSV becomes a separate test case.
 * 
 * CSV FORMAT EXPECTED:
 * test_name, test_description, test_steps, url, expected_result
 * 
 * FEATURES:
 * - Parse CSV with multiple test cases
 * - Extract test steps column (natural language)
 * - Convert each row to separate test case JSON
 * - Store in test-suites folder
 * - Auto-convert to executable format
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class CSVTestSuiteHandler {
  constructor() {
    this.testSuitesPath = './test-suites';
    this.uploadedCSVPath = './test-suites/uploaded-csv';
  }

  /**
   * Parse CSV content and extract test cases
   * @param {string} csvContent - Raw CSV file content
   * @param {string} filename - Original CSV filename
   * @returns {Object} Parsed test suite with individual test cases
   */
  async parseCSV(csvContent, filename) {
    console.log(`📄 Parsing CSV file: ${filename}`);

    // Split into lines
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least header and one data row');
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]);
    console.log(`   Headers found: ${headers.join(', ')}`);

    // Validate required columns
    const requiredColumns = ['test_steps'];
    const hasRequired = requiredColumns.every(col => 
      headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
    );

    if (!hasRequired) {
      throw new Error(`CSV must contain 'test_steps' column. Found: ${headers.join(', ')}`);
    }

    // Parse data rows
    const testCases = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length === 0 || values.every(v => !v)) {
        continue; // Skip empty rows
      }

      const testCase = this.createTestCaseFromRow(headers, values, i);
      if (testCase) {
        testCases.push(testCase);
      }
    }

    console.log(`   ✅ Extracted ${testCases.length} test cases`);

    // Create test suite
    const testSuite = {
      id: `suite_${Date.now()}_${uuidv4().substring(0, 10)}`,
      name: filename.replace('.csv', ''),
      source: 'csv_upload',
      uploadedAt: new Date().toISOString(),
      originalFile: filename,
      totalTests: testCases.length,
      testCases: testCases
    };

    return testSuite;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }

  /**
   * Create a test case object from CSV row
   */
  createTestCaseFromRow(headers, values, rowNumber) {
    const testCase = {
      id: `test_${Date.now()}_${rowNumber}_${uuidv4().substring(0, 8)}`,
      rowNumber: rowNumber,
      name: '',
      description: '',
      url: '',
      testSteps: '',
      expectedResult: '',
      convertedSteps: null
    };

    // Map CSV columns to test case properties
    headers.forEach((header, index) => {
      const value = values[index] || '';
      const headerLower = header.toLowerCase();

      if (headerLower.includes('test_name') || headerLower.includes('name')) {
        testCase.name = value;
      } else if (headerLower.includes('test_description') || headerLower.includes('description')) {
        testCase.description = value;
      } else if (headerLower.includes('test_steps') || headerLower.includes('steps')) {
        testCase.testSteps = value;
      } else if (headerLower.includes('url') || headerLower.includes('website')) {
        testCase.url = value;
      } else if (headerLower.includes('expected') || headerLower.includes('result')) {
        testCase.expectedResult = value;
      }
    });

    // Validate test case has required fields
    if (!testCase.testSteps) {
      console.warn(`   ⚠️ Row ${rowNumber}: No test steps found, skipping`);
      return null;
    }

    // Set default name if not provided
    if (!testCase.name) {
      testCase.name = `Test Case ${rowNumber}`;
    }

    return testCase;
  }

  /**
   * Convert natural language test steps to JSON format
   * @param {Object} testCase - Test case with natural language steps
   * @returns {Object} Test case with converted JSON steps
   */
  async convertTestStepsToJSON(testCase) {
    console.log(`   🔄 Converting test steps for: ${testCase.name}`);

    // Split test steps by line breaks or numbered lists
    const steps = this.extractIndividualSteps(testCase.testSteps);

    // Convert to JSON format
    const jsonSteps = steps.map((step, index) => ({
      stepNumber: index + 1,
      description: step,
      action: this.inferAction(step),
      target: this.inferTarget(step),
      value: this.inferValue(step)
    }));

    testCase.convertedSteps = jsonSteps;
    testCase.totalSteps = jsonSteps.length;

    return testCase;
  }

  /**
   * Extract individual steps from natural language
   */
  extractIndividualSteps(stepsText) {
    // Try to split by common patterns
    let steps = [];

    // Pattern 1: Numbered list (1. Step 1\n2. Step 2)
    if (/^\d+\./.test(stepsText)) {
      steps = stepsText
        .split(/\n?\d+\.\s*/)
        .filter(s => s.trim())
        .map(s => s.trim());
    }
    // Pattern 2: Line breaks
    else if (stepsText.includes('\n')) {
      steps = stepsText
        .split('\n')
        .filter(s => s.trim())
        .map(s => s.trim());
    }
    // Pattern 3: Sentences with periods
    else if (stepsText.includes('.')) {
      steps = stepsText
        .split(/\.\s+/)
        .filter(s => s.trim())
        .map(s => s.trim() + (s.endsWith('.') ? '' : '.'));
    }
    // Pattern 4: Single step
    else {
      steps = [stepsText.trim()];
    }

    return steps;
  }

  /**
   * Infer action type from natural language
   */
  inferAction(stepDescription) {
    const step = stepDescription.toLowerCase();

    if (step.includes('navigate') || step.includes('go to') || step.includes('open')) {
      return 'navigate';
    } else if (step.includes('click')) {
      return 'click';
    } else if (step.includes('type') || step.includes('enter') || step.includes('fill')) {
      return 'fill';
    } else if (step.includes('select') || step.includes('choose')) {
      return 'select';
    } else if (step.includes('verify') || step.includes('check') || step.includes('assert')) {
      return 'verify';
    } else if (step.includes('wait')) {
      return 'wait';
    } else {
      return 'custom';
    }
  }

  /**
   * Infer target element from natural language
   */
  inferTarget(stepDescription) {
    // Extract quoted strings
    const quotedMatch = stepDescription.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Extract common patterns
    const patterns = [
      /button\s+["']?([^"'\n]+)["']?/i,
      /field\s+["']?([^"'\n]+)["']?/i,
      /link\s+["']?([^"'\n]+)["']?/i,
      /input\s+["']?([^"'\n]+)["']?/i,
    ];

    for (const pattern of patterns) {
      const match = stepDescription.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Infer value from natural language
   */
  inferValue(stepDescription) {
    // Extract value after "with", "as", "to"
    const valuePatterns = [
      /with\s+["']?([^"'\n]+)["']?/i,
      /as\s+["']?([^"'\n]+)["']?/i,
      /to\s+["']?([^"'\n]+)["']?$/i,
    ];

    for (const pattern of valuePatterns) {
      const match = stepDescription.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Save test suite to disk
   */
  async saveTestSuite(testSuite) {
    // Ensure directories exist
    await fs.mkdir(this.testSuitesPath, { recursive: true });
    await fs.mkdir(this.uploadedCSVPath, { recursive: true });

    // Save as JSON
    const filePath = path.join(this.testSuitesPath, `${testSuite.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(testSuite, null, 2));

    console.log(`   ✅ Saved test suite: ${filePath}`);

    return filePath;
  }

  /**
   * Process uploaded CSV file (main entry point)
   */
  async processUploadedCSV(csvContent, filename) {
    console.log(`\n📥 Processing CSV upload: ${filename}`);

    try {
      // 1. Parse CSV
      const testSuite = await this.parseCSV(csvContent, filename);

      // 2. Convert each test case
      for (const testCase of testSuite.testCases) {
        await this.convertTestStepsToJSON(testCase);
      }

      // 3. Save test suite
      await this.saveTestSuite(testSuite);

      // 4. Generate summary
      const summary = {
        success: true,
        testSuiteId: testSuite.id,
        testSuiteName: testSuite.name,
        totalTestCases: testSuite.totalTests,
        testCases: testSuite.testCases.map(tc => ({
          id: tc.id,
          name: tc.name,
          steps: tc.totalSteps
        }))
      };

      console.log(`\n✅ CSV Processing Complete!`);
      console.log(`   Test Suite ID: ${testSuite.id}`);
      console.log(`   Total Test Cases: ${testSuite.totalTests}`);

      return summary;

    } catch (error) {
      console.error(`❌ CSV Processing Failed: ${error.message}`);
      throw error;
    }
  }
}

export default CSVTestSuiteHandler;

