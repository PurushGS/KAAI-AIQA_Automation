# Phase 1: Natural Language → Test Steps Converter

## Goal
Convert user's natural language test description into structured, machine-readable test steps that can be edited.

## What This Phase Does
1. Takes natural language input from user
2. Uses AI to parse and structure it into test steps
3. Returns editable JSON with clear action types
4. Allows user to edit/modify steps before execution
5. Validates the structured output

## Features
- ✅ Natural language input
- ✅ AI parsing (OpenAI/Claude)
- ✅ Structured JSON output
- ✅ Step editing capability
- ✅ Action type validation
- ✅ Simple web UI for testing

## Supported Action Types
- `navigate` - Go to URL
- `click` - Click element
- `type` - Enter text
- `verify` - Check element/text
- `wait` - Wait for element

## Testing
Run the test UI:
```bash
cd phase1
node server.js
```
Open: http://localhost:3001

## Next Phase
After Phase 1 is stable → Phase 2: Screenshot & Logs

