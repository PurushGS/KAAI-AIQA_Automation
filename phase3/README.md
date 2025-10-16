# Phase 3: AI Web Reader (Nanobrowser-Style)

## 🎯 Goal
Enable AI to read and understand entire web pages, then intelligently locate any element - just like a human would.

## What This Phase Does
1. **Full Page Analysis**: Extract complete DOM structure and content
2. **AI Element Detection**: Use AI to find elements by natural description
3. **Context-Aware Selection**: Understand page context to locate elements
4. **Robust Selectors**: Generate multiple fallback strategies
5. **Visual Understanding**: Use element attributes, text, position
6. **Smart Fallbacks**: Try multiple strategies if first approach fails

## Why This Is Important
Current approach requires exact CSS selectors (e.g., `#email`, `.btn-submit`). This breaks easily when:
- IDs change
- Classes are dynamic
- Structure changes
- Elements have no stable selectors

**Phase 3 solves this** by letting you say:
- "the login button" → AI finds it
- "email input field" → AI locates it
- "submit button in the form" → AI understands context

## Features
- ✅ Full page DOM extraction
- ✅ AI-powered element finding (GPT-4 Vision ready)
- ✅ Multiple selection strategies
- ✅ Natural language element descriptions
- ✅ Context-aware element location
- ✅ Automatic fallback mechanisms
- ✅ Element highlighting in screenshots

## Architecture

```
User Says: "click the login button"
         ↓
Phase 3: AI Web Reader
    1. Extract page structure
    2. Get all button elements
    3. Analyze button text/attributes
    4. Use AI to match "login button"
    5. Generate robust selector
    6. Return best match
         ↓
Phase 2: Execute click on found element
```

## Integration

### Before Phase 3:
```json
{
  "action": "click",
  "target": "#login-btn",  // Must know exact selector ❌
  "description": "Click login button"
}
```

### With Phase 3:
```json
{
  "action": "click",
  "target": "the login button",  // Natural description ✅
  "description": "Click login button"
}
```

Phase 3 will:
1. Read the page
2. Find all clickable elements
3. Use AI to match "the login button"
4. Return the actual element
5. Phase 2 clicks it

## Element Detection Strategies

Phase 3 tries multiple strategies (in order):

1. **Text Match**: Find by visible text
2. **Aria Labels**: Check accessibility attributes
3. **Placeholder**: For input fields
4. **Role**: Button, link, input roles
5. **Context**: Elements near other elements
6. **AI Analysis**: Use GPT-4 to understand page
7. **Visual**: Position, size, styling

## Testing
```bash
cd phase3
node server.js
```
Open: http://localhost:3003

## Dependencies
- Phase 1 (test steps structure)
- Phase 2 (execution engine)
- OpenAI API (for AI understanding)
- Playwright (DOM access)

## Next Phase
After Phase 3 → Phase 4: Learning System

