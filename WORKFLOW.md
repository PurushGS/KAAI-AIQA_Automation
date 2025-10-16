# AIQA Workflow Visualization

## 🔄 Complete Test Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INPUT                                   │
│  "Test login flow: Navigate to site, enter credentials, verify" │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 1: INTENT PARSING                             │
│                (backend/llm/intentParser.js)                     │
├─────────────────────────────────────────────────────────────────┤
│  • Send to LLM (OpenAI GPT / Anthropic Claude)                  │
│  • Convert natural language → JSON structure                     │
│  • Extract: actions, targets, data, assertions                  │
│  • Log interaction to logs/ai_interactions/                     │
│  • Mask sensitive data                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                   {
                     "steps": [
                       {
                         "action": "navigate",
                         "target": "https://example.com",
                         "description": "Go to login page"
                       },
                       {
                         "action": "type",
                         "target": "#username",
                         "data": "testuser"
                       },
                       ...
                     ]
                   }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 2: TEST PLANNING                              │
│                (backend/llm/testPlanner.js)                      │
├─────────────────────────────────────────────────────────────────┤
│  • Generate unique test ID                                      │
│  • Add metadata to each step (ID, timeout, retries)            │
│  • Set screenshot/video capture config                         │
│  • Estimate duration                                           │
│  • Save to plans/testplan_[id].json                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              Test Plan (Enriched)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 3: EXECUTION                                  │
│           (backend/executor/playwrightRunner.js)                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Launch Browser (Chromium/Firefox/WebKit)                    │
│     ↓                                                           │
│  2. For each step:                                              │
│     ├─ Perform action (navigate, click, type, verify, etc.)    │
│     ├─ Retry if fails (configurable)                           │
│     ├─ Capture screenshot on failure                           │
│     ├─ Log console messages                                    │
│     └─ Track timing                                            │
│     ↓                                                           │
│  3. Collect Results                                             │
│     ├─ Passed steps                                            │
│     ├─ Failed steps                                            │
│     ├─ Screenshots                                             │
│     └─ Execution times                                         │
│     ↓                                                           │
│  4. Close Browser                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              Test Results Object
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 4: REPORTING                                  │
│            (backend/reporting/reportGenerator.js)                │
├─────────────────────────────────────────────────────────────────┤
│  • Generate HTML report (styled, beautiful)                     │
│  • Generate JSON report (machine-readable)                      │
│  • Generate text summary (console output)                       │
│  • Embed screenshots                                            │
│  • Save to reports/report_[id].html                             │
│  • Save to logs/results_[id].json                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT                                        │
├─────────────────────────────────────────────────────────────────┤
│  ✅ HTML Report - Beautiful, shareable                           │
│  📊 JSON Report - Machine-readable                              │
│  📸 Screenshots - Failure evidence                              │
│  📝 Logs - Detailed execution logs                              │
│  📺 Video - Full test recording (optional)                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Action Type Flow

```
┌──────────────┐
│  Action Type │
└──────┬───────┘
       │
       ├─────────► navigate  ──► page.goto(url)
       │
       ├─────────► click     ──► page.click(selector)
       │
       ├─────────► type      ──► page.fill(selector, text)
       │
       ├─────────► wait      ──► page.waitForSelector(selector)
       │
       ├─────────► verify    ──► page.waitForSelector(selector, {state: 'visible'})
       │                         Check assertions
       │
       ├─────────► hover     ──► page.hover(selector)
       │
       ├─────────► select    ──► page.selectOption(selector, value)
       │
       └─────────► press     ──► page.keyboard.press(key)
```

## 🔁 Retry Logic Flow

```
Execute Step
     │
     ▼
   Try Action
     │
     ├──── Success ────► Mark Passed ──► Next Step
     │
     └──── Failure ────► Retry Count < Max?
                              │
                              ├─── Yes ──► Wait 1s ──► Try Again
                              │
                              └─── No ───► Capture Screenshot
                                           │
                                           ▼
                                      Mark Failed
                                           │
                                           ▼
                                   Stop Test (unless optional)
```

## 🌐 API Server Flow

```
                    HTTP Request
                         │
                         ▼
              ┌──────────────────┐
              │  Express Server  │
              └────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   POST /upload   POST /run-test   GET /results
        │              │              │
        ▼              ▼              ▼
  Save File      Execute Flow    Return JSON
        │              │              │
        │              ├─► IntentParser
        │              ├─► TestPlanner
        │              ├─► PlaywrightRunner
        │              └─► ReportGenerator
        │              │
        └──────────────┴──────────────┘
                       │
                       ▼
              WebSocket Streaming
              (Real-time logs to dashboard)
```

## 📱 Dashboard Interaction Flow

```
┌─────────────────────────────────────────┐
│         User Opens Dashboard            │
│         http://localhost:3000           │
└────────────────┬────────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   WebSocket Connect  │
      │   (for live logs)    │
      └──────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌────────┐              ┌──────────┐
│ Upload │              │  Write   │
│  File  │              │ Intent   │
└───┬────┘              └────┬─────┘
    │                        │
    └────────────┬───────────┘
                 │
                 ▼
         Click "Run Test"
                 │
                 ▼
         POST /api/run-test
                 │
                 ▼
    ┌────────────────────────┐
    │  Server Executes Test  │
    │  (Full 4-step flow)    │
    └────────────┬───────────┘
                 │
                 ▼
      Live Logs Stream via WS
         ↓  ↓  ↓  ↓
    Dashboard updates in real-time
                 │
                 ▼
         Test Completes
                 │
                 ▼
    ┌────────────────────────┐
    │  Results Display       │
    │  • Status badge        │
    │  • Metrics             │
    │  • Duration            │
    │  • Report link         │
    └────────────────────────┘
```

## 🗂️ Data Storage Flow

```
Input
  │
  ├─► testcases/
  │     └─ example_login.txt  (Original test cases)
  │
Parsing
  │
  ├─► logs/ai_interactions/
  │     └─ interaction_[timestamp].json  (AI logs)
  │
Planning
  │
  ├─► plans/
  │     └─ testplan_[id].json  (Executable plans)
  │
Execution
  │
  ├─► artifacts/[testId]/
  │     ├─ screenshots/
  │     │    └─ step_01_failure_[timestamp].png
  │     └─ videos/
  │          └─ test_video.webm
  │
  ├─► logs/
  │     ├─ results_[testId].json  (Individual results)
  │     └─ latest_results.json    (Latest test)
  │
Reporting
  │
  └─► reports/
        ├─ report_[testId].html  (Beautiful HTML)
        └─ report_[testId].json  (Machine-readable)
```

## 🔒 Security Data Flow

```
User Input (may contain passwords)
         │
         ▼
┌─────────────────────┐
│  Mask Sensitive     │
│  Data (helpers.js)  │
└─────────┬───────────┘
          │
          ├─► Config: sensitiveFields = ["password", "token", "apiKey"]
          │
          ▼
    Replace patterns:
    "password": "secret123"  →  "password": "********"
    token=abc123             →  token=******
          │
          ▼
    Safe to log
          │
          ├─► logs/ai_interactions/  (masked)
          ├─► logs/results_*.json    (masked)
          └─► reports/report_*.html  (masked)
```

## 🚀 CLI Execution Flow

```
$ node backend/executor/runner.js testcases/example.txt
                    │
                    ▼
            Load config.json
                    │
                    ▼
            Load .env (API keys)
                    │
                    ▼
         Read test case file
                    │
                    ▼
    ┌───────────────────────────┐
    │  Same 4-Step Flow:        │
    │  1. Parse Intent          │
    │  2. Generate Plan         │
    │  3. Execute Test          │
    │  4. Generate Reports      │
    └───────────────┬───────────┘
                    │
                    ▼
         Print Summary to Console
                    │
                    ▼
         Exit with code 0 (pass) or 1 (fail)
                    │
                    ▼
              Perfect for CI/CD!
```

## 🎨 Configuration Hierarchy

```
┌─────────────────────────────────┐
│      Environment Variables      │
│         (.env file)             │
│  • OPENAI_API_KEY               │
│  • ANTHROPIC_API_KEY            │
│  • PORT                         │
└──────────────┬──────────────────┘
               │ Loads into
               ▼
┌─────────────────────────────────┐
│      System Configuration       │
│        (config.json)            │
│  • LLM settings                 │
│  • Browser settings             │
│  • Timeout/retry values         │
│  • Security rules               │
│  • Path mappings                │
└──────────────┬──────────────────┘
               │ Used by
               ▼
┌─────────────────────────────────┐
│      Runtime Components         │
│  • IntentParser                 │
│  • TestPlanner                  │
│  • PlaywrightRunner             │
│  • ReportGenerator              │
└─────────────────────────────────┘
```

## 🔄 Error Handling Flow

```
Error Occurs
     │
     ▼
┌─────────────────┐
│  Error Type?    │
└────────┬────────┘
         │
    ┌────┼────┬─────────────┐
    │    │    │             │
    ▼    ▼    ▼             ▼
  LLM  Step  API      System
  Error Fail  Error    Error
    │    │    │             │
    │    │    │             │
    ▼    ▼    ▼             ▼
  Retry  Retry  Return    Cleanup
  with   with   Error     & Exit
  Fallback Retry Response
    │    │    │             │
    │    │    │             │
    └────┼────┴─────────────┘
         │
         ▼
   Log to console
         │
         ▼
   Save to logs/
         │
         ▼
   Show in dashboard
         │
         ▼
   Include in report
```

## 🎯 Use Case Examples

### 1. Quick Manual Test
```
User → Dashboard → Write Intent → Run → View Results
(2 minutes)
```

### 2. Automated CI/CD Test
```
Git Push → GitHub Action → CLI Runner → Exit Code → Pass/Fail
```

### 3. Scheduled Test
```
Cron Job → CLI Runner → Generate Report → Email Report
```

### 4. Team Collaboration
```
Create Test File → Commit to Repo → Team Runs → Share HTML Report
```

---

**This visual guide helps understand how all components work together!**

