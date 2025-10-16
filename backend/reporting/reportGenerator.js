/**
 * Report Generator - Creates test execution reports
 * 
 * Generates HTML, JSON, and PDF reports from test results.
 * Includes failure analysis, screenshots, and AI-generated summaries.
 */

import fs from 'fs/promises';
import path from 'path';
import { ensureDirectoryExists, formatDuration } from '../utils/helpers.js';

class ReportGenerator {
  constructor(config) {
    this.config = config;
    this.reportsDir = path.join(process.cwd(), config.paths.reports);
  }

  /**
   * Generate all report formats
   * @param {Object} results - Test execution results
   * @returns {Promise<Object>} Report paths
   */
  async generateReports(results) {
    console.log('\n📊 Generating reports...');
    
    await ensureDirectoryExists(this.reportsDir);
    
    const reports = {
      json: await this.generateJSONReport(results),
      html: await this.generateHTMLReport(results),
      summary: this.generateTextSummary(results)
    };
    
    console.log('✅ Reports generated:');
    console.log(`   JSON: ${reports.json}`);
    console.log(`   HTML: ${reports.html}`);
    
    return reports;
  }

  /**
   * Generate JSON report
   * @param {Object} results - Test results
   * @returns {Promise<string>} Report file path
   */
  async generateJSONReport(results) {
    const filename = `report_${results.testId}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    
    return filepath;
  }

  /**
   * Generate HTML report
   * @param {Object} results - Test results
   * @returns {Promise<string>} Report file path
   */
  async generateHTMLReport(results) {
    const filename = `report_${results.testId}.html`;
    const filepath = path.join(this.reportsDir, filename);
    
    const html = this.buildHTMLReport(results);
    await fs.writeFile(filepath, html);
    
    return filepath;
  }

  /**
   * Build HTML report content
   * @param {Object} results - Test results
   * @returns {string} HTML content
   */
  buildHTMLReport(results) {
    const statusColor = results.status === 'passed' ? '#10b981' : '#ef4444';
    const statusIcon = results.status === 'passed' ? '✅' : '❌';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIQA Test Report - ${results.testName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .summary-card h3 {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      color: white;
      background: ${statusColor};
    }
    
    .content {
      padding: 30px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    
    .steps {
      list-style: none;
    }
    
    .step {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #d1d5db;
    }
    
    .step.passed {
      border-left-color: #10b981;
    }
    
    .step.failed {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .step-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .step-status {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 12px;
      background: #e5e7eb;
      color: #374151;
    }
    
    .step.passed .step-status {
      background: #d1fae5;
      color: #065f46;
    }
    
    .step.failed .step-status {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .step-details {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      font-size: 14px;
      color: #6b7280;
    }
    
    .step-details dt {
      font-weight: 600;
    }
    
    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 15px;
      margin-top: 10px;
      color: #991b1b;
      font-size: 14px;
    }
    
    .screenshot {
      margin-top: 15px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    
    .screenshot img {
      max-width: 100%;
      display: block;
    }
    
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    
    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      font-size: 14px;
    }
    
    .metadata dt {
      font-weight: 600;
      color: #6b7280;
    }
    
    .metadata dd {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusIcon} ${results.testName}</h1>
      <p>Test ID: ${results.testId}</p>
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Status</h3>
        <div class="value"><span class="status-badge">${results.status.toUpperCase()}</span></div>
      </div>
      
      <div class="summary-card">
        <h3>Total Steps</h3>
        <div class="value">${results.totalSteps}</div>
      </div>
      
      <div class="summary-card">
        <h3>Passed</h3>
        <div class="value" style="color: #10b981;">${results.passedSteps}</div>
      </div>
      
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value" style="color: #ef4444;">${results.failedSteps}</div>
      </div>
      
      <div class="summary-card">
        <h3>Duration</h3>
        <div class="value" style="font-size: 24px;">${formatDuration(results.duration)}</div>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Test Intent</h2>
        <p style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
          ${results.intent}
        </p>
      </div>
      
      <div class="section">
        <h2>Test Steps</h2>
        <ul class="steps">
          ${results.steps.map(step => this.buildStepHTML(step)).join('')}
        </ul>
      </div>
      
      ${results.error ? `
      <div class="section">
        <h2>Error Summary</h2>
        <div class="error-box">
          <strong>❌ Test Failed:</strong><br>
          ${results.error}
        </div>
      </div>
      ` : ''}
      
      <div class="section">
        <h2>Test Metadata</h2>
        <dl class="metadata">
          <dt>Started At:</dt>
          <dd>${new Date(results.startedAt).toLocaleString()}</dd>
          
          <dt>Completed At:</dt>
          <dd>${new Date(results.completedAt).toLocaleString()}</dd>
          
          <dt>Total Duration:</dt>
          <dd>${formatDuration(results.duration)}</dd>
          
          <dt>Test ID:</dt>
          <dd><code>${results.testId}</code></dd>
        </dl>
      </div>
    </div>
    
    <div class="footer">
      <p>Generated by AIQA - Intent-Based AI Testing Platform</p>
      <p>Report generated at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Build HTML for individual step
   * @param {Object} step - Test step result
   * @returns {string} HTML content
   */
  buildStepHTML(step) {
    return `
      <li class="step ${step.status}">
        <div class="step-header">
          <span class="step-title">
            ${step.status === 'passed' ? '✅' : step.status === 'failed' ? '❌' : '⏭️'}
            Step ${step.stepNumber}: ${step.description}
          </span>
          <span class="step-status">${step.status.toUpperCase()}</span>
        </div>
        
        <dl class="step-details">
          <dt>Action:</dt>
          <dd>${step.action}</dd>
          
          <dt>Duration:</dt>
          <dd>${formatDuration(step.duration)}</dd>
          
          ${step.retryCount > 0 ? `
            <dt>Retries:</dt>
            <dd>${step.retryCount}</dd>
          ` : ''}
        </dl>
        
        ${step.error ? `
          <div class="error-box">
            <strong>Error:</strong> ${step.error}
          </div>
        ` : ''}
        
        ${step.screenshot ? `
          <div class="screenshot">
            <img src="${step.screenshot}" alt="Failure screenshot">
          </div>
        ` : ''}
      </li>
    `;
  }

  /**
   * Generate text summary
   * @param {Object} results - Test results
   * @returns {string} Text summary
   */
  generateTextSummary(results) {
    const icon = results.status === 'passed' ? '✅' : '❌';
    
    return `
${icon} Test ${results.status.toUpperCase()}: ${results.testName}

Intent: ${results.intent}

Results:
- Total Steps: ${results.totalSteps}
- Passed: ${results.passedSteps}
- Failed: ${results.failedSteps}
- Duration: ${formatDuration(results.duration)}

${results.error ? `Error: ${results.error}` : ''}

Test ID: ${results.testId}
Completed: ${new Date(results.completedAt).toLocaleString()}
    `.trim();
  }

  /**
   * Explain how the report generator works
   */
  explain() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                REPORT GENERATOR EXPLANATION                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Purpose: Transform test results into readable reports        ║
║                                                                ║
║  Report Formats:                                              ║
║  1. JSON - Machine-readable, full details                     ║
║  2. HTML - Beautiful web report with styling                  ║
║  3. Text - Quick summary for console/logs                     ║
║                                                                ║
║  HTML Report Includes:                                        ║
║  - Test status and summary cards                              ║
║  - Original intent description                                ║
║  - Detailed step-by-step execution                            ║
║  - Failure screenshots (if captured)                          ║
║  - Error messages and retry counts                            ║
║  - Execution metadata and timing                              ║
║                                                                ║
║  Visual Features:                                             ║
║  - Color-coded status (green = pass, red = fail)              ║
║  - Responsive design                                          ║
║  - Clean, modern UI                                           ║
║  - Easy to share and archive                                  ║
║                                                                ║
║  Storage:                                                     ║
║  - Saved to ./reports/ directory                              ║
║  - Each test gets unique report file                          ║
║  - Can be opened directly in browser                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }
}

export default ReportGenerator;

