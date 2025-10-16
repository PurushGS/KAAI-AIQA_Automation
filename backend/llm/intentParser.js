/**
 * Intent Parser - Converts natural language test cases into structured test steps
 * 
 * This module uses LLM (OpenAI GPT or Anthropic Claude) to parse user-provided
 * test intentions and convert them into actionable, structured test steps.
 * 
 * All interactions with the LLM are logged for transparency and debugging.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { maskSensitiveData, ensureDirectoryExists } from '../utils/helpers.js';

class IntentParser {
  constructor(config) {
    this.config = config;
    this.provider = config.llm.provider;
    
    // Initialize LLM client based on provider
    if (this.provider === 'openai') {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else if (this.provider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    
    this.logsDir = path.join(process.cwd(), 'logs', 'ai_interactions');
  }

  /**
   * Main method to parse natural language intent into structured test steps
   * @param {string} intentText - Natural language test case description
   * @returns {Promise<Object>} Structured test plan with steps
   */
  async parseIntent(intentText) {
    console.log('🤖 Parsing test intent with AI...');
    
    try {
      // Create prompt for LLM
      const prompt = this.buildPrompt(intentText);
      
      // Call LLM
      const response = await this.callLLM(prompt);
      
      // Log interaction
      await this.logInteraction(intentText, response);
      
      // Parse and validate response
      const parsedSteps = this.parseResponse(response);
      
      // Check if clarification is needed
      if (parsedSteps.needsClarification) {
        console.warn('⚠️  AI needs clarification. Please provide more details.');
        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: parsedSteps.clarificationQuestion,
          partialSteps: parsedSteps.steps || []
        };
      }
      
      console.log(`✅ Successfully parsed ${parsedSteps.steps.length} test steps`);
      
      return {
        success: true,
        intent: intentText,
        steps: parsedSteps.steps,
        metadata: {
          parsedAt: new Date().toISOString(),
          model: this.config.llm.model,
          provider: this.provider
        }
      };
      
    } catch (error) {
      console.error('❌ Error parsing intent:', error.message);
      
      // If fallback is enabled, ask human for help
      if (this.config.llm.fallback.askHuman) {
        return {
          success: false,
          needsHumanInput: true,
          error: error.message,
          suggestion: 'Please review and manually structure the test steps.'
        };
      }
      
      throw error;
    }
  }

  /**
   * Build structured prompt for LLM
   * @param {string} intentText - User's natural language test case
   * @returns {string} Formatted prompt
   */
  buildPrompt(intentText) {
    return `You are an expert test automation engineer. Your task is to convert natural language test cases into structured, actionable test steps.

USER INTENT:
${intentText}

TASK:
1. Break down the intent into clear, executable test steps
2. For each step, identify:
   - action type (navigate, click, type, verify, wait, etc.)
   - target element (CSS selector, text, or description)
   - expected outcome (for assertions)
   - any data or parameters needed

3. If any critical information is missing (like URL, credentials, or specific element identifiers), set "needsClarification": true and ask a specific question.

OUTPUT FORMAT (JSON only, no other text):
{
  "needsClarification": false,
  "clarificationQuestion": "",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Navigate to login page",
      "action": "navigate",
      "target": "https://example.com/login",
      "data": null,
      "assertion": null
    },
    {
      "stepNumber": 2,
      "description": "Enter username",
      "action": "type",
      "target": "#username",
      "data": "testuser",
      "assertion": null
    },
    {
      "stepNumber": 3,
      "description": "Verify dashboard is visible",
      "action": "verify",
      "target": ".dashboard",
      "data": null,
      "assertion": "element is visible"
    }
  ]
}

IMPORTANT:
- Output ONLY valid JSON, no markdown or explanations
- Use standard CSS selectors when possible
- For verification steps, always include an assertion
- If you need clarification, set needsClarification to true`;
  }

  /**
   * Call LLM API based on provider
   * @param {string} prompt - Formatted prompt
   * @returns {Promise<string>} LLM response
   */
  async callLLM(prompt) {
    const startTime = Date.now();
    
    try {
      if (this.provider === 'openai') {
        const completion = await this.client.chat.completions.create({
          model: this.config.llm.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a test automation expert. Always respond with valid JSON only.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: this.config.llm.temperature,
          max_tokens: this.config.llm.maxTokens
        });
        
        const response = completion.choices[0].message.content;
        const duration = Date.now() - startTime;
        
        console.log(`⏱️  LLM response received in ${duration}ms`);
        return response;
        
      } else if (this.provider === 'anthropic') {
        const message = await this.client.messages.create({
          model: this.config.llm.model,
          max_tokens: this.config.llm.maxTokens,
          temperature: this.config.llm.temperature,
          messages: [
            { role: 'user', content: prompt }
          ]
        });
        
        const response = message.content[0].text;
        const duration = Date.now() - startTime;
        
        console.log(`⏱️  LLM response received in ${duration}ms`);
        return response;
      }
      
      throw new Error(`Unsupported LLM provider: ${this.provider}`);
      
    } catch (error) {
      console.error('❌ LLM API error:', error.message);
      throw new Error(`Failed to get response from ${this.provider}: ${error.message}`);
    }
  }

  /**
   * Parse and validate LLM response
   * @param {string} response - Raw LLM response
   * @returns {Object} Parsed test steps
   */
  parseResponse(response) {
    try {
      // Extract JSON from response (in case LLM added markdown)
      let jsonText = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Validate structure
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('Invalid response structure: missing steps array');
      }
      
      // Validate each step
      parsed.steps.forEach((step, index) => {
        if (!step.action || !step.description) {
          throw new Error(`Step ${index + 1} is missing required fields`);
        }
      });
      
      return parsed;
      
    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error.message);
      console.error('Raw response:', response);
      throw new Error(`Invalid JSON response from LLM: ${error.message}`);
    }
  }

  /**
   * Log AI interaction for transparency and debugging
   * @param {string} input - User input
   * @param {string} output - LLM output
   */
  async logInteraction(input, output) {
    if (!this.config.logging.aiInteractions) {
      return;
    }
    
    try {
      await ensureDirectoryExists(this.logsDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(this.logsDir, `interaction_${timestamp}.json`);
      
      const logData = {
        timestamp: new Date().toISOString(),
        provider: this.provider,
        model: this.config.llm.model,
        input: maskSensitiveData(input, this.config.security.sensitiveFields),
        output: maskSensitiveData(output, this.config.security.sensitiveFields),
        masked: this.config.security.maskSensitiveData
      };
      
      await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
      console.log(`📝 AI interaction logged: ${logFile}`);
      
    } catch (error) {
      console.error('⚠️  Failed to log AI interaction:', error.message);
      // Don't throw - logging failure shouldn't break the flow
    }
  }

  /**
   * Explain how the parser works (for learning purposes)
   */
  explain() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    INTENT PARSER EXPLANATION                   ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Purpose: Convert natural language → structured test steps    ║
║                                                                ║
║  Process:                                                      ║
║  1. Receive user's test case description                      ║
║  2. Build a structured prompt with examples                   ║
║  3. Send to LLM (OpenAI GPT or Anthropic Claude)             ║
║  4. Parse JSON response into test steps                       ║
║  5. Validate and return structured data                       ║
║                                                                ║
║  Features:                                                     ║
║  - Automatic clarification when details are missing           ║
║  - Sensitive data masking in logs                            ║
║  - Full transparency with logged interactions                 ║
║  - Fallback to human input on errors                         ║
║                                                                ║
║  Each step includes:                                          ║
║  - Action type (navigate, click, type, verify)               ║
║  - Target element (CSS selector or description)              ║
║  - Data to use (for input actions)                           ║
║  - Expected assertion (for verify actions)                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }
}

export default IntentParser;

