# AIQA Architecture Documentation

This document explains the internal architecture of AIQA, designed for understanding, maintenance, and extension.

## System Overview

AIQA follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                       │
│                    (Web Dashboard UI)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                      API Server Layer                       │
│                   (Express.js REST API)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼────────┐
│ Input Layer  │ │  Planner │ │   Executor   │
│ (LLM Parser) │ │  Layer   │ │   Layer      │
└──────┬───────┘ └────┬─────┘ └─────┬────────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────┐           ┌────────▼────────┐
│  Validation  │           │   Reporting     │
│   Layer      │           │     Layer       │
└──────────────┘           └─────────────────┘
```

## Core Components

### 1. Intent Parser (`backend/llm/intentParser.js`)

**Purpose:** Converts natural language into structured test steps.

**Responsibilities:**
- Communicate with LLM (OpenAI/Anthropic)
- Parse natural language intent
- Structure output as JSON
- Handle ambiguity and request clarification
- Log all AI interactions
- Mask sensitive data

**Key Methods:**
- `parseIntent(intentText)` - Main entry point
- `buildPrompt(intentText)` - Creates LLM prompt
- `callLLM(prompt)` - API communication
- `parseResponse(response)` - JSON extraction and validation
- `logInteraction(input, output)` - Transparent logging

**Data Flow:**
```
Natural Language → Build Prompt → Call LLM → Parse JSON → Structured Steps
                                      ↓
                                  Log Interaction
```

**Output Format:**
```json
{
  "success": true,
  "intent": "Original user intent",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Navigate to login page",
      "action": "navigate",
      "target": "https://example.com/login",
      "data": null,
      "assertion": null
    }
  ],
  "metadata": {
    "parsedAt": "ISO timestamp",
    "model": "gpt-4",
    "provider": "openai"
  }
}
```

### 2. Test Planner (`backend/llm/testPlanner.js`)

**Purpose:** Enriches parsed steps with execution metadata.

**Responsibilities:**
- Add unique IDs to test and steps
- Configure timeouts per action type
- Set retry policies
- Estimate test duration
- Save test plans to disk
- Enable test plan reuse

**Key Methods:**
- `generateTestPlan(parsedIntent)` - Main entry point
- `enrichSteps(steps)` - Add metadata to each step
- `saveTestPlan(testPlan)` - Persist to disk
- `loadTestPlan(planId)` - Reload for re-execution
- `listTestPlans()` - Get all saved plans

**Enrichment Process:**
```
Parsed Steps
    ↓
Add: ID, timeout, retries, status tracking
    ↓
Calculate: duration estimate
    ↓
Save: testplan_[id].json
    ↓
Complete Test Plan (ready for execution)
```

**Test Plan Structure:**
```json
{
  "id": "uuid",
  "name": "Test name",
  "intent": "Original intent",
  "createdAt": "ISO timestamp",
  "status": "pending",
  "config": {
    "browser": "chromium",
    "timeout": 30000,
    "retries": 2,
    "screenshotOnFailure": true
  },
  "steps": [/* enriched steps */],
  "metadata": {
    "totalSteps": 5,
    "estimatedDuration": 15
  }
}
```

### 3. Playwright Runner (`backend/executor/playwrightRunner.js`)

**Purpose:** Execute test plans using browser automation.

**Responsibilities:**
- Launch and manage browser instances
- Execute test steps sequentially
- Handle retries automatically
- Capture screenshots on failure
- Record videos (optional)
- Log browser console messages
- Generate execution results

**Key Methods:**
- `executeTestPlan(testPlan)` - Main entry point
- `executeStep(step)` - Run single step with retries
- `performAction(step)` - Action dispatcher
- `performVerification(target, assertion)` - Handle assertions
- `setup(config)` - Initialize browser
- `teardown()` - Cleanup browser
- `captureScreenshot(stepId, type)` - Save screenshot

**Supported Actions:**
- `navigate` - Go to URL
- `click` - Click element
- `type` - Fill input field
- `wait` - Wait for element or timeout
- `verify` - Assert element state
- `hover` - Hover over element
- `select` - Select dropdown option
- `press` - Press keyboard key

**Execution Flow:**
```
Setup Browser
    ↓
For each step:
    ↓
    Try execute (with retries)
        ↓
        Success → Mark passed
        ↓
        Failure → Capture screenshot → Mark failed
    ↓
All steps complete
    ↓
Teardown Browser
    ↓
Return Results
```

**Results Structure:**
```json
{
  "testId": "uuid",
  "testName": "Test name",
  "status": "passed|failed|error",
  "startedAt": "ISO timestamp",
  "completedAt": "ISO timestamp",
  "duration": 12345,
  "totalSteps": 5,
  "passedSteps": 4,
  "failedSteps": 1,
  "steps": [/* step results */],
  "screenshots": [/* paths */],
  "error": "error message if failed"
}
```

### 4. Report Generator (`backend/reporting/reportGenerator.js`)

**Purpose:** Transform execution results into readable reports.

**Responsibilities:**
- Generate HTML reports
- Generate JSON reports
- Generate text summaries
- Embed screenshots
- Style with CSS
- Make reports shareable

**Key Methods:**
- `generateReports(results)` - Generate all formats
- `generateHTMLReport(results)` - Create styled HTML
- `generateJSONReport(results)` - Save JSON
- `generateTextSummary(results)` - Console summary
- `buildHTMLReport(results)` - Construct HTML structure
- `buildStepHTML(step)` - Format individual step

**HTML Report Features:**
- Responsive design
- Color-coded status
- Step-by-step breakdown
- Embedded screenshots
- Execution timing
- Professional styling

### 5. API Server (`backend/server.js`)

**Purpose:** Provide HTTP API and serve frontend.

**Responsibilities:**
- Handle HTTP requests
- Manage file uploads
- Coordinate AIQA components
- Stream live logs via WebSocket
- Serve static frontend
- Error handling

**API Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload test case file |
| POST | `/api/run-test` | Execute test |
| GET | `/api/results/:testId` | Get specific test results |
| GET | `/api/results/latest` | Get latest results |
| GET | `/api/plans` | List all test plans |
| GET | `/api/testcases` | List test case files |
| GET | `/api/info` | Get system configuration |

**WebSocket Protocol:**
```json
{
  "type": "info|error|warn|success",
  "message": "Log message",
  "timestamp": "ISO timestamp"
}
```

**Request Flow:**
```
Client Request
    ↓
POST /api/run-test
    ↓
Parse Intent (IntentParser)
    ↓
Generate Plan (TestPlanner)
    ↓
Execute Test (PlaywrightRunner)
    ↓
Generate Reports (ReportGenerator)
    ↓
Return Results to Client
```

### 6. Frontend Dashboard (`frontend/index.html`)

**Purpose:** Provide user interface for AIQA.

**Features:**
- File upload interface
- Direct intent input
- Live log streaming
- Results visualization
- Report links

**Sections:**
1. **Upload Test Case** - Drag-drop or browse for files
2. **Write Intent** - Text area for natural language
3. **Live Logs** - WebSocket-powered real-time logs
4. **Results** - Visual summary with metrics

## Data Flow

### Complete Test Execution Flow

```
1. User Input
   ↓
   Natural Language Test Case (file or text)
   
2. Intent Parsing
   ↓
   IntentParser.parseIntent()
   ↓
   LLM API Call (OpenAI/Anthropic)
   ↓
   Structured Steps (JSON)
   
3. Test Planning
   ↓
   TestPlanner.generateTestPlan()
   ↓
   Enriched Test Plan (saved to disk)
   
4. Test Execution
   ↓
   PlaywrightRunner.executeTestPlan()
   ↓
   Browser Automation (Playwright)
   ↓
   Step Results + Screenshots
   
5. Report Generation
   ↓
   ReportGenerator.generateReports()
   ↓
   HTML + JSON Reports
   
6. Results Display
   ↓
   API Response to Client
   ↓
   Dashboard Updates
```

## File System Structure

```
aiqa/
├── backend/
│   ├── executor/
│   │   ├── playwrightRunner.js    # Browser automation
│   │   └── runner.js               # CLI runner
│   ├── llm/
│   │   ├── intentParser.js         # AI parsing
│   │   └── testPlanner.js          # Test plan generation
│   ├── reporting/
│   │   └── reportGenerator.js      # Report creation
│   ├── utils/
│   │   └── helpers.js              # Utility functions
│   └── server.js                   # Express server
│
├── frontend/
│   └── index.html                  # Web dashboard
│
├── testcases/                      # Test case files
│   ├── example_login.txt
│   ├── example_search.txt
│   └── uploaded/                   # User uploads
│
├── logs/                           # Execution logs
│   ├── results_[id].json
│   ├── latest_results.json
│   └── ai_interactions/            # LLM logs
│       └── interaction_[timestamp].json
│
├── reports/                        # Generated reports
│   ├── report_[id].html
│   └── report_[id].json
│
├── plans/                          # Saved test plans
│   └── testplan_[id].json
│
├── artifacts/                      # Test artifacts
│   └── [testId]/
│       ├── screenshots/
│       └── videos/
│
├── config.json                     # System configuration
├── .env                           # Environment variables
├── package.json                    # Dependencies
└── setup.js                       # Setup wizard
```

## Configuration

### config.json Structure

```json
{
  "system": {
    "name": "AIQA",
    "version": "1.0.0",
    "environment": "development"
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4-turbo-preview",
    "temperature": 0.3,
    "maxTokens": 2000,
    "fallback": {
      "enabled": true,
      "askHuman": true
    }
  },
  "executor": {
    "browser": "chromium",
    "headless": false,
    "timeout": 30000,
    "retries": 2,
    "screenshotOnFailure": true,
    "videoOnFailure": true
  },
  "logging": {
    "level": "info",
    "aiInteractions": true,
    "maxLogSize": "50MB"
  },
  "security": {
    "maskSensitiveData": true,
    "sensitiveFields": ["password", "token", "apiKey"]
  },
  "paths": {
    "testcases": "./testcases",
    "logs": "./logs",
    "reports": "./reports",
    "plans": "./plans",
    "artifacts": "./artifacts"
  }
}
```

## Extension Points

### Adding New Action Types

1. Add action to `playwrightRunner.js`:
```javascript
case 'my_new_action':
  await this.performMyNewAction(step);
  break;
```

2. Update LLM prompt in `intentParser.js` to recognize it

3. Update documentation

### Adding New LLM Providers

1. Add provider initialization in `intentParser.js`
2. Implement `callLLM()` for new provider
3. Update configuration options
4. Test with provider-specific models

### Adding New Report Formats

1. Add method in `reportGenerator.js`:
```javascript
async generatePDFReport(results) {
  // PDF generation logic
}
```

2. Call from `generateReports()`
3. Add route in `server.js` if needed

## Security Considerations

### Sensitive Data Masking

All logs automatically mask fields listed in `config.security.sensitiveFields`:
- Passwords
- API keys
- Tokens
- Secrets

Implemented in `helpers.maskSensitiveData()`.

### API Key Protection

- Never commit `.env` file
- Store keys in environment variables
- Validate keys before use
- Don't log API responses with keys

### File Upload Safety

- Whitelist file extensions
- Validate file content
- Store in isolated directory
- Sanitize filenames

## Error Handling

### Levels of Error Handling

1. **LLM Level** - Retry with fallback, ask human
2. **Execution Level** - Retry with configurable count
3. **API Level** - Return appropriate HTTP status
4. **Frontend Level** - Display user-friendly messages

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {/* additional context */}
}
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing** - Future: run independent steps in parallel
2. **Caching** - Cache LLM responses for identical intents
3. **Browser Reuse** - Reuse browser context for multiple tests
4. **Selective Screenshots** - Only on failure by default
5. **Log Rotation** - Prevent log directory from growing infinitely

### Resource Management

- Browser instances are cleaned up in `finally` blocks
- WebSocket connections are tracked and closed properly
- File handles are released after reads/writes
- Graceful shutdown on SIGINT

## Testing Philosophy

AIQA itself should be testable:

1. **Unit Tests** - Individual functions (future)
2. **Integration Tests** - Component interaction (future)
3. **E2E Tests** - Full flow with real browser
4. **Example Tests** - Serve as smoke tests

## Future Architecture Enhancements

### Phase 3: Mobile Support

- Add `appiumRunner.js` alongside `playwrightRunner.js`
- Unified interface for both runners
- Mobile-specific actions (swipe, tap, etc.)

### Phase 4: CI/CD Integration

- GitHub Actions workflow files
- Jenkins pipeline support
- Test result uploading
- Parallel test execution

### Phase 5: Advanced Features

- Test recording (record actions → generate test)
- Visual regression testing
- API testing alongside UI testing
- Test data management
- Test suite organization

## Debugging Tips

### Enable Verbose Logging

Set `config.logging.level: "debug"` and restart server.

### View Browser Actions

Set `config.executor.headless: false` to watch tests run.

### Inspect LLM Interactions

Check `logs/ai_interactions/` for full prompt/response logs.

### Use CLI for Quick Testing

```bash
node backend/executor/runner.js testcases/example.txt
```

### Check Latest Results

```bash
cat logs/latest_results.json | jq
```

## Maintenance Guidelines

### Code Style

- Use JSDoc comments for all functions
- Export classes as default
- Use ES6 modules (import/export)
- Async/await over promises
- Descriptive variable names

### Adding Features

1. Update this ARCHITECTURE.md
2. Add code with comments
3. Update README.md if user-facing
4. Add example if applicable
5. Test thoroughly

### Version Management

Follow semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

---

**This architecture is designed for clarity, maintainability, and extensibility by a solo developer.**

