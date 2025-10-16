/**
 * AIQA Phase 5: Code Generator
 * 
 * PURPOSE:
 * Generates code patches using AI (GPT-4) based on error analysis.
 * Creates production-ready fixes with proper context and best practices.
 * 
 * GENERATION STRATEGIES:
 * 1. Timeout fixes → adjust timeout values intelligently
 * 2. Selector improvements → use Phase 3 AI Web Reader insights
 * 3. Error handling → add try-catch and retry logic
 * 4. Navigation improvements → add proper wait conditions
 * 5. Assertion updates → adjust based on actual behavior
 * 
 * CONNECTIONS:
 * - Input: Error analysis from Error Analyzer
 * - Uses: RAG (Phase 4.5) for similar fixes
 * - Uses: OpenAI GPT-4 for code generation
 * - Output: Code patches for Patch Applier
 */

import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { createTwoFilesPatch } from 'diff';

export class CodeGenerator {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.ragServiceUrl = 'http://localhost:3005';
  }

  /**
   * Generate code patch for a given error
   * 
   * @param {Object} analysis - Error analysis from ErrorAnalyzer
   * @param {string} file - File path to fix
   * @returns {Object} Generated patch
   */
  async generatePatch(analysis, file) {
    console.log(`🔧 Generating patch for: ${file}`);
    console.log(`   Error type: ${analysis.errorType}`);

    try {
      // Read current file content
      const filePath = path.join(process.cwd(), '..', file);
      const currentContent = await fs.readFile(filePath, 'utf-8');

      // Query RAG for similar fixes
      const similarFixes = await this.querySimilarFixes(analysis);

      // Generate patch with AI
      const patch = await this.generateWithAI(
        analysis,
        currentContent,
        file,
        similarFixes
      );

      // Create unified diff
      const diff = createTwoFilesPatch(
        file,
        file,
        currentContent,
        patch.newContent,
        'original',
        'fixed'
      );

      console.log(`   ✓ Patch generated with confidence: ${patch.confidence.toFixed(2)}`);

      return {
        success: true,
        patch: {
          id: `patch_${Date.now()}`,
          file: file,
          analysis: analysis,
          originalContent: currentContent,
          newContent: patch.newContent,
          changes: patch.changes,
          diff: diff,
          confidence: patch.confidence,
          explanation: patch.explanation,
          similarFixesUsed: similarFixes.length
        }
      };

    } catch (error) {
      console.error(`   ❌ Patch generation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Query RAG for similar fixes
   */
  async querySimilarFixes(analysis) {
    console.log('   🧠 Querying RAG for similar fixes...');

    try {
      const response = await fetch(`${this.ragServiceUrl}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Find tests with ${analysis.errorType} errors on ${analysis.context.url || 'any site'} that were successfully fixed`,
          filters: { success: true },
          limit: 3
        })
      });

      if (!response.ok) {
        console.log('   ⚠️  RAG service unavailable, continuing without context');
        return [];
      }

      const data = await response.json();
      console.log(`   ✓ Found ${data.resultsCount || 0} similar fixes in RAG`);
      
      return data.results || [];

    } catch (error) {
      console.log('   ⚠️  RAG query failed, continuing without context');
      return [];
    }
  }

  /**
   * Generate patch using AI
   */
  async generateWithAI(analysis, currentContent, file, similarFixes) {
    console.log('   🤖 Generating fix with AI...');

    // Build context for AI
    const contextMessage = this.buildAIContext(analysis, similarFixes);

    // Call GPT-4 to generate patch
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert software engineer specializing in test automation. 
          Your task is to fix test code based on error analysis.
          
          Rules:
          1. Make minimal, focused changes
          2. Maintain code style and formatting
          3. Add helpful comments explaining fixes
          4. Follow JavaScript/Node.js best practices
          5. Ensure backwards compatibility
          6. Return ONLY valid JSON with the fixed code
          
          Output format:
          {
            "newContent": "full fixed file content",
            "changes": [
              {
                "line": 123,
                "description": "Increased timeout from 10s to 15s",
                "reason": "Element needs more time on slow networks"
              }
            ],
            "explanation": "Brief explanation of all changes",
            "confidence": 0.95
          }`
        },
        {
          role: 'user',
          content: `
File: ${file}

Error Analysis:
${JSON.stringify(analysis, null, 2)}

Current Code:
\`\`\`javascript
${currentContent}
\`\`\`

${contextMessage}

Please generate a fix for this error. Return only valid JSON.
          `
        }
      ],
      temperature: 0.2, // Low temperature for consistent, focused fixes
      response_format: { type: "json_object" }
    });

    const fix = JSON.parse(response.choices[0].message.content);

    console.log(`   ✓ AI generated ${fix.changes?.length || 0} changes`);

    return fix;
  }

  /**
   * Build context message for AI from RAG results
   */
  buildAIContext(analysis, similarFixes) {
    if (similarFixes.length === 0) {
      return '';
    }

    const contextParts = [`Similar fixes from history:\n`];

    similarFixes.forEach((fix, i) => {
      contextParts.push(`${i + 1}. ${fix.testName}`);
      contextParts.push(`   Result: ${fix.passed} passed, ${fix.failed} failed`);
      contextParts.push(`   Summary: ${fix.summary.slice(0, 200)}`);
      contextParts.push('');
    });

    contextParts.push('Use these examples as guidance for your fix.');

    return contextParts.join('\n');
  }

  /**
   * Generate quick fix for common patterns
   * (Faster than AI for simple cases)
   */
  async generateQuickFix(analysis, currentContent, file) {
    console.log('   ⚡ Generating quick fix...');

    const quickFixes = {
      timeout: () => this.fixTimeout(analysis, currentContent),
      elementNotFound: () => this.fixSelector(analysis, currentContent),
      networkError: () => this.addRetryLogic(analysis, currentContent)
    };

    const fixFunction = quickFixes[analysis.errorType];
    if (!fixFunction) {
      return null; // Fall back to AI
    }

    try {
      const fix = fixFunction();
      
      if (fix) {
        console.log('   ✓ Quick fix generated');
        return fix;
      }
    } catch (error) {
      console.log('   ⚠️  Quick fix failed, falling back to AI');
    }

    return null;
  }

  /**
   * Quick fix: Increase timeout
   */
  fixTimeout(analysis, content) {
    const currentTimeout = analysis.context.timeout;
    if (!currentTimeout) return null;

    // Increase timeout by 50%
    const newTimeout = Math.ceil(currentTimeout * 1.5);

    // Replace timeout value
    const newContent = content.replace(
      new RegExp(`timeout:\\s*${currentTimeout}`, 'g'),
      `timeout: ${newTimeout}`
    );

    if (newContent === content) {
      // Try alternative format
      const altContent = content.replace(
        new RegExp(`{\\s*timeout:\\s*${currentTimeout}\\s*}`, 'g'),
        `{ timeout: ${newTimeout} }`
      );
      
      if (altContent === content) return null;
      
      return {
        newContent: altContent,
        changes: [{
          description: `Increased timeout from ${currentTimeout}ms to ${newTimeout}ms`,
          reason: 'Element needs more time to become ready'
        }],
        explanation: 'Increased timeout to handle slow page loads',
        confidence: 0.90
      };
    }

    return {
      newContent,
      changes: [{
        description: `Increased timeout from ${currentTimeout}ms to ${newTimeout}ms`,
        reason: 'Element needs more time to become ready'
      }],
      explanation: 'Increased timeout to handle slow page loads',
      confidence: 0.90
    };
  }

  /**
   * Quick fix: Improve selector
   */
  fixSelector(analysis, content) {
    // This would ideally query Phase 3 for better selectors
    // For now, suggest adding proper waits
    const selector = analysis.context.selector;
    if (!selector) return null;

    // Add waitForSelector before action
    const selectorRegex = new RegExp(`(await\\s+page\\.locator\\('${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\))`, 'g');
    
    const newContent = content.replace(
      selectorRegex,
      `await page.waitForSelector('${selector}', { state: 'visible', timeout: 15000 });\n  $1`
    );

    if (newContent === content) return null;

    return {
      newContent,
      changes: [{
        description: `Added explicit wait for selector "${selector}"`,
        reason: 'Ensure element is visible before interaction'
      }],
      explanation: 'Added proper wait to ensure element is ready',
      confidence: 0.85
    };
  }

  /**
   * Quick fix: Add retry logic
   */
  addRetryLogic(analysis, content) {
    // Wrap navigation in retry logic
    const url = analysis.context.url;
    if (!url) return null;

    // Find the goto statement
    const gotoRegex = /await\s+page\.goto\([^)]+\);/g;
    const matches = content.match(gotoRegex);
    
    if (!matches || matches.length === 0) return null;

    let newContent = content;
    matches.forEach(gotoStatement => {
      const retryWrapped = `
  // Retry logic for network resilience
  let retries = 3;
  while (retries > 0) {
    try {
      ${gotoStatement}
      break; // Success
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.log(\`Retrying navigation, \${retries} attempts left...\`);
      await page.waitForTimeout(2000);
    }
  }`;

      newContent = newContent.replace(gotoStatement, retryWrapped);
    });

    if (newContent === content) return null;

    return {
      newContent,
      changes: [{
        description: 'Added retry logic for network operations',
        reason: 'Handle transient network errors'
      }],
      explanation: 'Added automatic retry for network failures',
      confidence: 0.88
    };
  }

  /**
   * Validate generated patch
   * Ensures patch is safe to apply
   */
  validatePatch(patch) {
    console.log('   🔍 Validating patch...');

    // Check if content changed
    if (patch.originalContent === patch.newContent) {
      console.log('   ⚠️  No changes detected');
      return { valid: false, reason: 'No changes made' };
    }

    // Check if it's valid JavaScript (basic check)
    try {
      // This is a simple syntax check
      // In production, you'd want more thorough validation
      new Function(patch.newContent);
    } catch (error) {
      console.log('   ❌ Invalid JavaScript syntax');
      return { valid: false, reason: 'Syntax error in generated code' };
    }

    // Check confidence threshold
    if (patch.confidence < 0.70) {
      console.log('   ⚠️  Low confidence patch');
      return { valid: false, reason: 'Confidence too low' };
    }

    console.log('   ✓ Patch validation passed');
    return { valid: true };
  }
}

