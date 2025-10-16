/**
 * Phase 1: Natural Language → Test Steps Converter
 * 
 * PURPOSE:
 * This module takes a natural language test description and converts it
 * into a structured, machine-readable format that can be edited and validated.
 * 
 * CONNECTIONS:
 * - Used by: server.js (API endpoint)
 * - Uses: OpenAI API for parsing
 * - Output: Structured JSON that feeds into Phase 2 (execution)
 * 
 * ARCHITECTURE:
 * Input (NL) → AI Parser → Structured Steps → Validator → Output (JSON)
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

/**
 * Converter Class
 * Handles the conversion of natural language to structured test steps
 */
class NLToStepsConverter {
  constructor() {
    // Initialize OpenAI client
    // CONNECTION: This connects to OpenAI's API for natural language processing
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Define supported action types
    // WHY: These are the primitive actions our test system can execute
    // FUTURE: Phase 3 will expand this based on AI web reading capabilities
    this.supportedActions = [
      'navigate',  // Go to a URL
      'click',     // Click an element
      'type',      // Type text into a field
      'verify',    // Verify element/text exists
      'wait'       // Wait for element to appear
    ];
  }

  /**
   * Main conversion method
   * 
   * FLOW:
   * 1. Build AI prompt with examples
   * 2. Call OpenAI API
   * 3. Parse and validate response
   * 4. Return structured steps
   * 
   * @param {string} naturalLanguage - User's test description
   * @returns {Promise<Object>} - Structured test steps
   */
  async convert(naturalLanguage) {
    console.log('\n🔄 Converting natural language to test steps...');
    console.log('Input:', naturalLanguage.substring(0, 100) + '...');
    
    try {
      // STEP 1: Build the AI prompt
      // WHY: Clear instructions help AI generate consistent output
      const prompt = this.buildPrompt(naturalLanguage);
      
      // STEP 2: Call OpenAI API
      // CONNECTION: This is where we use external AI service
      const aiResponse = await this.callAI(prompt);
      
      // STEP 3: Parse the response into structured format
      // WHY: AI might return markdown/text, we need pure JSON
      const steps = this.parseAIResponse(aiResponse);
      
      // STEP 4: Validate the structure
      // WHY: Ensure the output is usable by next phases
      this.validateSteps(steps);
      
      console.log(`✅ Successfully converted to ${steps.length} steps`);
      
      // Return structured output
      // STRUCTURE: Array of step objects with action, target, data
      return {
        success: true,
        originalInput: naturalLanguage,
        steps: steps,
        metadata: {
          convertedAt: new Date().toISOString(),
          stepCount: steps.length
        }
      };
      
    } catch (error) {
      console.error('❌ Conversion error:', error.message);
      
      // Return error in structured format
      // WHY: UI needs consistent response format
      return {
        success: false,
        error: error.message,
        originalInput: naturalLanguage
      };
    }
  }

  /**
   * Build AI prompt with clear instructions and examples
   * 
   * WHY: Good prompts = good results
   * TECHNIQUE: Few-shot learning with examples
   * 
   * @param {string} userInput - Natural language test description
   * @returns {string} - Formatted prompt for AI
   */
  buildPrompt(userInput) {
    return `You are a test automation expert. Convert the following natural language test description into structured test steps.

USER INPUT:
${userInput}

YOUR TASK:
1. Identify each test action (navigate, click, type, verify, wait)
2. Extract target elements (selectors, text, URLs)
3. Identify data to input (for type actions)
4. Identify assertions (for verify actions)

IMPORTANT RULES:
- Output ONLY valid JSON (no markdown, no explanations)
- Use simple, specific action types: navigate, click, type, verify, wait
- For element targets, prefer CSS selectors or text descriptions
- Be specific about what to verify

OUTPUT FORMAT (JSON):
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://example.com/login",
    "data": null,
    "expected": null,
    "description": "Navigate to login page"
  },
  {
    "stepNumber": 2,
    "action": "type",
    "target": "#email",
    "data": "user@example.com",
    "expected": null,
    "description": "Enter email address"
  },
  {
    "stepNumber": 3,
    "action": "click",
    "target": "button[type=submit]",
    "data": null,
    "expected": null,
    "description": "Click submit button"
  },
  {
    "stepNumber": 4,
    "action": "verify",
    "target": ".dashboard",
    "data": null,
    "expected": "element visible",
    "description": "Verify dashboard appears"
  }
]

Now convert the user input above into this format.`;
  }

  /**
   * Call OpenAI API
   * 
   * CONNECTION: External API call
   * ERROR HANDLING: Network errors, API errors, rate limits
   * 
   * @param {string} prompt - Formatted prompt
   * @returns {Promise<string>} - AI response text
   */
  async callAI(prompt) {
    console.log('📡 Calling OpenAI API...');
    
    const startTime = Date.now();
    
    try {
      // API call with specific parameters
      // WHY THESE SETTINGS:
      // - gpt-4-turbo: Best for structured output
      // - temperature 0.3: Low randomness for consistency
      // - max_tokens 2000: Enough for complex tests
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a test automation expert. Output only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,  // Low temperature = more consistent output
        max_tokens: 2000
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️  API response in ${duration}ms`);
      
      // Extract the actual response text
      return completion.choices[0].message.content;
      
    } catch (error) {
      // Handle specific API errors
      // CONNECTION: Error handling flows to UI for user feedback
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your API key.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
  }

  /**
   * Parse AI response into structured JSON
   * 
   * WHY: AI might wrap JSON in markdown code blocks
   * TECHNIQUE: Extract JSON from various formats
   * 
   * @param {string} aiResponse - Raw AI response
   * @returns {Array} - Array of step objects
   */
  parseAIResponse(aiResponse) {
    console.log('🔍 Parsing AI response...');
    
    // Remove markdown code blocks if present
    // REASON: AI sometimes adds ```json``` wrappers
    let jsonText = aiResponse.trim();
    
    if (jsonText.startsWith('```')) {
      // Extract JSON from markdown
      jsonText = jsonText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    }
    
    try {
      // Parse JSON
      const parsed = JSON.parse(jsonText);
      
      // Ensure it's an array
      // WHY: We need array of steps for processing
      if (!Array.isArray(parsed)) {
        throw new Error('Response must be an array of steps');
      }
      
      return parsed;
      
    } catch (error) {
      console.error('Raw response:', aiResponse);
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }
  }

  /**
   * Validate step structure
   * 
   * PURPOSE: Ensure steps can be executed by next phases
   * VALIDATION RULES: Required fields, valid action types, proper structure
   * 
   * @param {Array} steps - Array of step objects
   * @throws {Error} - If validation fails
   */
  validateSteps(steps) {
    console.log('✓ Validating steps...');
    
    if (!steps || steps.length === 0) {
      throw new Error('No steps generated. Please provide more details.');
    }
    
    // Validate each step
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      
      // REQUIRED FIELDS
      // WHY: These are minimum requirements for execution
      if (!step.action) {
        throw new Error(`Step ${stepNum}: Missing 'action' field`);
      }
      
      if (!step.description) {
        throw new Error(`Step ${stepNum}: Missing 'description' field`);
      }
      
      // VALIDATE ACTION TYPE
      // CONNECTION: These action types must match Phase 2's executor capabilities
      if (!this.supportedActions.includes(step.action)) {
        throw new Error(
          `Step ${stepNum}: Unsupported action '${step.action}'. ` +
          `Supported: ${this.supportedActions.join(', ')}`
        );
      }
      
      // ACTION-SPECIFIC VALIDATION
      // WHY: Each action type has different requirements
      if (step.action === 'navigate' && !step.target) {
        throw new Error(`Step ${stepNum}: 'navigate' action requires 'target' URL`);
      }
      
      if (step.action === 'type' && !step.data) {
        throw new Error(`Step ${stepNum}: 'type' action requires 'data' field`);
      }
      
      if (step.action === 'verify' && !step.expected) {
        throw new Error(`Step ${stepNum}: 'verify' action requires 'expected' field`);
      }
    });
    
    console.log(`✅ All ${steps.length} steps validated successfully`);
  }

  /**
   * Edit a specific step
   * 
   * PURPOSE: Allow users to modify generated steps
   * WHY: AI might not get it perfect, users need control
   * CONNECTION: This enables the editing feature in the UI
   * 
   * @param {Array} steps - Original steps array
   * @param {number} stepNumber - Step to edit (1-indexed)
   * @param {Object} updates - Fields to update
   * @returns {Array} - Updated steps array
   */
  editStep(steps, stepNumber, updates) {
    console.log(`✏️  Editing step ${stepNumber}...`);
    
    // Validate step exists
    if (stepNumber < 1 || stepNumber > steps.length) {
      throw new Error(`Invalid step number: ${stepNumber}`);
    }
    
    // Get the step (convert to 0-indexed)
    const stepIndex = stepNumber - 1;
    const step = steps[stepIndex];
    
    // Apply updates
    // WHY: Merge instead of replace to keep unmodified fields
    const updatedStep = {
      ...step,
      ...updates,
      stepNumber: stepNumber  // Keep original step number
    };
    
    // Validate the updated step
    this.validateSteps([updatedStep]);
    
    // Return updated array
    const updatedSteps = [...steps];
    updatedSteps[stepIndex] = updatedStep;
    
    console.log(`✅ Step ${stepNumber} updated`);
    return updatedSteps;
  }

  /**
   * Add a new step
   * 
   * PURPOSE: Users can add steps AI might have missed
   * CONNECTION: Enables manual test building in UI
   * 
   * @param {Array} steps - Existing steps
   * @param {Object} newStep - New step to add
   * @param {number} position - Where to insert (optional)
   * @returns {Array} - Updated steps array
   */
  addStep(steps, newStep, position = null) {
    console.log('➕ Adding new step...');
    
    // Validate the new step
    this.validateSteps([newStep]);
    
    // Add at specific position or end
    const updatedSteps = [...steps];
    
    if (position !== null && position >= 0 && position <= steps.length) {
      // Insert at position
      updatedSteps.splice(position, 0, newStep);
    } else {
      // Add to end
      updatedSteps.push(newStep);
    }
    
    // Renumber all steps
    updatedSteps.forEach((step, index) => {
      step.stepNumber = index + 1;
    });
    
    console.log(`✅ Step added. Total steps: ${updatedSteps.length}`);
    return updatedSteps;
  }

  /**
   * Delete a step
   * 
   * @param {Array} steps - Existing steps
   * @param {number} stepNumber - Step to delete (1-indexed)
   * @returns {Array} - Updated steps array
   */
  deleteStep(steps, stepNumber) {
    console.log(`🗑️  Deleting step ${stepNumber}...`);
    
    if (stepNumber < 1 || stepNumber > steps.length) {
      throw new Error(`Invalid step number: ${stepNumber}`);
    }
    
    // Remove the step
    const updatedSteps = steps.filter((_, index) => index !== stepNumber - 1);
    
    // Renumber remaining steps
    updatedSteps.forEach((step, index) => {
      step.stepNumber = index + 1;
    });
    
    console.log(`✅ Step deleted. Remaining steps: ${updatedSteps.length}`);
    return updatedSteps;
  }
}

/**
 * Export the converter
 * CONNECTION: Used by server.js to handle API requests
 */
export default NLToStepsConverter;

