/**
 * Phase 3: AI Web Reader
 * 
 * PURPOSE:
 * Enable AI to read entire web pages and intelligently locate elements
 * using natural language descriptions instead of exact CSS selectors.
 * 
 * INSPIRATION: Nanobrowser approach - AI understands page like a human
 * 
 * CONNECTIONS:
 * - Input: Natural language element description ("the login button")
 * - Uses: Playwright for DOM access, OpenAI for AI understanding
 * - Output: Precise element locator that Phase 2 can use
 * 
 * ARCHITECTURE:
 * Natural Description → Page Analysis → AI Matching → Robust Selector
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

/**
 * AI Web Reader Class
 * Reads web pages and finds elements intelligently
 */
class AIWebReader {
  constructor() {
    // Initialize OpenAI for AI-powered element finding
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Find element on page using natural language description
   * 
   * PURPOSE: Core of Phase 3 - convert "login button" to actual element
   * 
   * STRATEGIES:
   * 1. Try simple text match first (fast)
   * 2. Try aria labels (accessibility)
   * 3. Try role-based matching
   * 4. Use AI to understand context (smart)
   * 5. Generate robust selector
   * 
   * @param {Page} page - Playwright page object
   * @param {string} description - Natural language description
   * @param {string} action - Action type (click, type, etc.)
   * @returns {Promise<Object>} - Element selector and metadata
   */
  async findElement(page, description, action = 'click') {
    console.log(`\n🔍 AI Web Reader: Finding "${description}"`);
    
    try {
      // STEP 1: Extract page information
      // WHY: Need page context for AI to understand
      const pageInfo = await this.extractPageInfo(page);
      console.log(`   📄 Page analyzed: ${pageInfo.elementCount} elements found`);
      
      // STEP 2: Try simple strategies first (fast)
      // WHY: Most elements can be found without AI (performance)
      const simpleMatch = await this.trySimpleStrategies(
        page,
        description,
        action,
        pageInfo
      );
      
      if (simpleMatch) {
        console.log(`   ✅ Found using simple strategy: ${simpleMatch.strategy}`);
        return simpleMatch;
      }
      
      // STEP 3: Use AI for complex matching
      // WHY: When simple strategies fail, AI understands context
      console.log(`   🤖 Using AI for intelligent matching...`);
      const aiMatch = await this.useAIMatching(
        page,
        description,
        action,
        pageInfo
      );
      
      if (aiMatch) {
        console.log(`   ✅ Found using AI: ${aiMatch.strategy}`);
        return aiMatch;
      }
      
      // STEP 4: No match found
      throw new Error(`Could not find element: "${description}"`);
      
    } catch (error) {
      console.error(`   ❌ Error finding element: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract comprehensive page information
   * 
   * PURPOSE: Get page context for AI understanding
   * WHY: AI needs to "see" the page structure
   * 
   * @param {Page} page - Playwright page
   * @returns {Promise<Object>} - Page information
   */
  async extractPageInfo(page) {
    // Extract all relevant elements from page
    // WHY: We need complete context for AI to understand
    const pageInfo = await page.evaluate(() => {
      // Helper: Get element details
      const getElementInfo = (el, index) => {
        return {
          index: index,
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          text: el.textContent?.trim().substring(0, 100) || '',
          value: el.value || '',
          placeholder: el.placeholder || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          role: el.getAttribute('role') || '',
          id: el.id || '',
          classes: Array.from(el.classList).join(' '),
          name: el.name || '',
          href: el.href || '',
          visible: el.offsetParent !== null,
          // Position (for context)
          rect: el.getBoundingClientRect(),
          // Parent context
          parentText: el.parentElement?.textContent?.trim().substring(0, 50) || ''
        };
      };
      
      // Get all interactive elements
      // WHY: Focus on elements users can interact with
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'));
      const links = Array.from(document.querySelectorAll('a[href]'));
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
      const images = Array.from(document.querySelectorAll('img'));
      
      return {
        url: window.location.href,
        title: document.title,
        buttons: buttons.map(getElementInfo).filter(el => el.visible),
        links: links.map(getElementInfo).filter(el => el.visible),
        inputs: inputs.map(getElementInfo).filter(el => el.visible),
        images: images.map(getElementInfo).filter(el => el.visible),
        elementCount: buttons.length + links.length + inputs.length
      };
    });
    
    return pageInfo;
  }

  /**
   * Try simple strategies before using AI
   * 
   * PURPOSE: Fast element finding without AI calls
   * STRATEGIES: Text match, aria labels, placeholders, roles
   * 
   * @param {Page} page - Playwright page
   * @param {string} description - Element description
   * @param {string} action - Action type
   * @param {Object} pageInfo - Extracted page info
   * @returns {Promise<Object|null>} - Match or null
   */
  async trySimpleStrategies(page, description, action, pageInfo) {
    // Normalize description for matching
    const descLower = description.toLowerCase();
    
    // STRATEGY 1: Exact text match
    // WHY: "login button" → button with text "login"
    try {
      const textSelector = `text=${description}`;
      const count = await page.locator(textSelector).count();
      if (count > 0) {
        return {
          selector: textSelector,
          strategy: 'text-match',
          confidence: 'high',
          description: `Found by exact text: "${description}"`
        };
      }
    } catch {}
    
    // STRATEGY 2: Partial text match
    // WHY: "login button" → button containing "login"
    try {
      const partialSelector = `text=/${this.escapeRegex(descLower)}/i`;
      const count = await page.locator(partialSelector).count();
      if (count > 0) {
        return {
          selector: partialSelector,
          strategy: 'partial-text-match',
          confidence: 'medium',
          description: `Found by partial text: "${description}"`
        };
      }
    } catch {}
    
    // STRATEGY 3: Aria label match
    // WHY: Accessibility attributes often describe elements
    const elements = [...pageInfo.buttons, ...pageInfo.links, ...pageInfo.inputs];
    const ariaMatch = elements.find(el => 
      el.ariaLabel && el.ariaLabel.toLowerCase().includes(descLower)
    );
    
    if (ariaMatch) {
      return {
        selector: `[aria-label*="${ariaMatch.ariaLabel}"]`,
        strategy: 'aria-label',
        confidence: 'high',
        description: `Found by aria-label: "${ariaMatch.ariaLabel}"`
      };
    }
    
    // STRATEGY 4: Placeholder match (for inputs)
    if (action === 'type') {
      const placeholderMatch = pageInfo.inputs.find(el =>
        el.placeholder && el.placeholder.toLowerCase().includes(descLower)
      );
      
      if (placeholderMatch) {
        return {
          selector: `[placeholder*="${placeholderMatch.placeholder}"]`,
          strategy: 'placeholder',
          confidence: 'high',
          description: `Found by placeholder: "${placeholderMatch.placeholder}"`
        };
      }
    }
    
    // STRATEGY 5: Role + text combination
    // WHY: "button" role + text content
    const roleMatch = elements.find(el => {
      const matchesRole = descLower.includes(el.tag) || descLower.includes(el.role);
      const matchesText = el.text.toLowerCase().includes(descLower.replace(el.tag, '').trim());
      return matchesRole && matchesText;
    });
    
    if (roleMatch) {
      return {
        selector: this.generateSelector(roleMatch),
        strategy: 'role-text-combo',
        confidence: 'medium',
        description: `Found by role and text combination`,
        element: roleMatch
      };
    }
    
    // No simple match found
    return null;
  }

  /**
   * Use AI to intelligently find element
   * 
   * PURPOSE: When simple strategies fail, use AI understanding
   * WHY: AI can understand context, synonyms, relationships
   * 
   * @param {Page} page - Playwright page
   * @param {string} description - Element description
   * @param {string} action - Action type
   * @param {Object} pageInfo - Page information
   * @returns {Promise<Object|null>} - Match or null
   */
  async useAIMatching(page, description, action, pageInfo) {
    try {
      // Build context for AI
      // WHY: AI needs to understand page structure
      const elements = this.getRelevantElements(pageInfo, action);
      
      if (elements.length === 0) {
        return null;
      }
      
      // Build AI prompt
      const prompt = this.buildAIPrompt(description, action, elements, pageInfo);
      
      // Call AI
      const aiResponse = await this.callAI(prompt);
      
      // Parse AI response
      const match = this.parseAIResponse(aiResponse, elements);
      
      if (match) {
        return {
          selector: this.generateSelector(match.element),
          strategy: 'ai-match',
          confidence: match.confidence,
          description: match.reasoning,
          element: match.element
        };
      }
      
      return null;
      
    } catch (error) {
      console.error(`   ⚠️  AI matching error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get relevant elements based on action type
   * 
   * WHY: Filter elements by what makes sense for the action
   */
  getRelevantElements(pageInfo, action) {
    switch (action) {
      case 'click':
        return [...pageInfo.buttons, ...pageInfo.links];
      case 'type':
        return pageInfo.inputs;
      case 'verify':
      case 'wait':
        return [...pageInfo.buttons, ...pageInfo.links, ...pageInfo.inputs];
      default:
        return [...pageInfo.buttons, ...pageInfo.links, ...pageInfo.inputs];
    }
  }

  /**
   * Build AI prompt for element matching
   */
  buildAIPrompt(description, action, elements, pageInfo) {
    // Limit elements to top 20 most relevant
    const limitedElements = elements.slice(0, 20);
    
    return `You are a web automation expert. Find the best matching element on this page.

PAGE CONTEXT:
- URL: ${pageInfo.url}
- Title: ${pageInfo.title}

USER WANTS TO: ${action} "${description}"

AVAILABLE ELEMENTS (in order of appearance):
${limitedElements.map((el, i) => `
${i + 1}. ${el.tag.toUpperCase()}
   Text: "${el.text}"
   ${el.placeholder ? `Placeholder: "${el.placeholder}"` : ''}
   ${el.ariaLabel ? `Aria-Label: "${el.ariaLabel}"` : ''}
   ${el.value ? `Value: "${el.value}"` : ''}
`).join('\n')}

TASK:
Identify which element number (1-${limitedElements.length}) best matches the description "${description}".

OUTPUT FORMAT (JSON only):
{
  "elementIndex": <number 1-${limitedElements.length}>,
  "confidence": "<high|medium|low>",
  "reasoning": "<brief explanation why this element matches>"
}

Output only valid JSON, no other text.`;
  }

  /**
   * Call OpenAI API for AI matching
   */
  async callAI(prompt) {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a web automation expert. Output only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    return completion.choices[0].message.content;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(aiResponse, elements) {
    try {
      // Remove markdown if present
      let jsonText = aiResponse.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Validate response
      if (!parsed.elementIndex || parsed.elementIndex < 1 || parsed.elementIndex > elements.length) {
        return null;
      }
      
      return {
        element: elements[parsed.elementIndex - 1],
        confidence: parsed.confidence || 'medium',
        reasoning: parsed.reasoning || 'AI matched element'
      };
      
    } catch (error) {
      console.error(`   ⚠️  Failed to parse AI response: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate robust selector for element
   * 
   * PURPOSE: Create selector that's likely to work
   * WHY: Single selector might break, need fallbacks
   */
  generateSelector(element) {
    // Try multiple selector strategies in order of preference
    
    // 1. ID (most stable if available)
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 2. Aria label (accessibility)
    if (element.ariaLabel) {
      return `[aria-label="${element.ariaLabel}"]`;
    }
    
    // 3. Name attribute (for forms)
    if (element.name) {
      return `[name="${element.name}"]`;
    }
    
    // 4. Text content (if short and unique)
    if (element.text && element.text.length < 50) {
      return `text=${element.text}`;
    }
    
    // 5. Placeholder (for inputs)
    if (element.placeholder) {
      return `[placeholder="${element.placeholder}"]`;
    }
    
    // 6. Tag + role
    if (element.role) {
      return `${element.tag}[role="${element.role}"]`;
    }
    
    // 7. Tag + type (for inputs)
    if (element.type) {
      return `${element.tag}[type="${element.type}"]`;
    }
    
    // 8. Classes (least stable)
    if (element.classes) {
      return `.${element.classes.split(' ')[0]}`;
    }
    
    // 9. Fallback: tag
    return element.tag;
  }

  /**
   * Helper: Escape regex special characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Export AI Web Reader
 * CONNECTION: Used by Phase 2 executor when finding elements
 */
export default AIWebReader;

