# 🤖 AIQA Phase 5: Self-Improving Code

## Overview

**Phase 5** is the **autonomous improvement engine** for AIQA. It detects code mistakes from test failures, queries RAG for similar fixes, and **automatically generates and applies code patches**.

This is where AIQA becomes **truly intelligent** - learning from failures and fixing itself! 🧠✨

---

## 🎯 Purpose

Phase 5 provides:

1. **Error Detection** - Analyze test failures to identify code issues
2. **RAG Query** - Find similar past fixes from knowledge base
3. **Code Generation** - AI creates patches for detected issues
4. **Safe Application** - Apply fixes with rollback capability
5. **Clear Summaries** - Show user what changed and why

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Phase 5: Self-Improving Code            │
│  ═════════════════════════════════════════════════  │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Error Analyzer                            │    │
│  │  • Parse test failures                     │    │
│  │  • Identify root causes                    │    │
│  │  • Extract error patterns                  │    │
│  └────────────────────────────────────────────┘    │
│                    ↓                                 │
│  ┌────────────────────────────────────────────┐    │
│  │  RAG Integration                           │    │
│  │  • Query similar failures                  │    │
│  │  • Retrieve past fixes                     │    │
│  │  • Learn from history                      │    │
│  └────────────────────────────────────────────┘    │
│                    ↓                                 │
│  ┌────────────────────────────────────────────┐    │
│  │  AI Code Generator                         │    │
│  │  • Generate patches with GPT-4             │    │
│  │  • Context-aware fixes                     │    │
│  │  • Best practices enforcement              │    │
│  └────────────────────────────────────────────┘    │
│                    ↓                                 │
│  ┌────────────────────────────────────────────┐    │
│  │  Safe Code Applier                         │    │
│  │  • Backup original files                   │    │
│  │  • Apply changes                           │    │
│  │  • Rollback on failure                     │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
         ↑                    ↓
    Phase 2, 4           Phase 6 UI
   (test results)      (show changes)
```

---

## 🚀 Features

### 1. Intelligent Error Detection
Analyzes test failures to identify:
- Selector issues (element not found)
- Timing problems (timeouts)
- Navigation errors (404, 500)
- Assertion failures
- Network errors

### 2. RAG-Powered Learning
```javascript
// Query RAG for similar fixes
const similarFixes = await queryRAG(`
  Test failed with: "${errorMessage}"
  Find similar failures and how they were fixed
`);

// Learn from history
// Apply proven solutions
```

### 3. AI Code Generation
```javascript
// GPT-4 generates patches
const patch = await generatePatch({
  error: testFailure,
  context: fileContent,
  similarFixes: ragResults
});

// Result: Production-ready code fix
```

### 4. Safe Application
```javascript
// Backup → Apply → Verify → Commit
// OR
// Backup → Apply → Fail → Rollback
```

### 5. Clear Summaries
```javascript
{
  "fixApplied": true,
  "file": "phase2/executor.js",
  "changes": [
    "Increased timeout from 5s → 10s",
    "Added retry logic for network errors",
    "Improved selector specificity"
  ],
  "reason": "Test was timing out on slow networks",
  "confidence": 0.95
}
```

---

## 📡 API Endpoints

### `POST /api/auto-fix/analyze`
Analyze test failure and suggest fix

**Request:**
```json
{
  "testId": "test_123",
  "errorType": "timeout",
  "errorMessage": "locator.click: Timeout 10000ms exceeded",
  "selector": "#login-btn",
  "url": "https://app.example.com",
  "stackTrace": "..."
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "rootCause": "Element selector timing issue",
    "severity": "medium",
    "suggestedFix": "Increase timeout or improve selector"
  },
  "similarIssues": 3,
  "fixAvailable": true
}
```

---

### `POST /api/auto-fix/generate`
Generate code patch for issue

**Request:**
```json
{
  "issueId": "issue_123",
  "file": "phase2/executor.js",
  "context": {
    "error": "timeout",
    "selector": "#login-btn",
    "currentTimeout": 10000
  }
}
```

**Response:**
```json
{
  "success": true,
  "patch": {
    "file": "phase2/executor.js",
    "changes": [
      {
        "line": 45,
        "old": "timeout: 10000",
        "new": "timeout: 15000",
        "reason": "Increase timeout for slow networks"
      }
    ],
    "diff": "... unified diff ...",
    "confidence": 0.92
  }
}
```

---

### `POST /api/auto-fix/apply`
Apply generated patch

**Request:**
```json
{
  "patchId": "patch_123",
  "dryRun": false,
  "autoCommit": false
}
```

**Response:**
```json
{
  "success": true,
  "applied": true,
  "backup": "backups/phase2-executor-20240115.js",
  "changes": {
    "filesModified": 1,
    "linesChanged": 3,
    "testsPassed": true
  },
  "rollback": {
    "available": true,
    "id": "rollback_123"
  }
}
```

---

### `POST /api/auto-fix/rollback`
Rollback applied patch

**Request:**
```json
{
  "rollbackId": "rollback_123",
  "reason": "Tests still failing"
}
```

---

### `GET /api/auto-fix/history`
View fix history

**Response:**
```json
{
  "success": true,
  "fixes": [
    {
      "id": "fix_001",
      "timestamp": "2024-01-15T10:00:00Z",
      "file": "phase2/executor.js",
      "issue": "Timeout on slow networks",
      "success": true,
      "improvementPercent": 85
    }
  ]
}
```

---

### `GET /api/auto-fix/stats`
Get fix statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFixes": 42,
    "successRate": 0.95,
    "averageImprovement": 0.78,
    "mostCommonIssue": "timeout",
    "testsFixed": 156
  }
}
```

---

## 🔧 How It Works

### Flow 1: Automatic Fix After Test Failure

```
1. Test fails in Phase 2
      ↓
2. Phase 2 sends failure to Phase 5
      ↓
3. Phase 5 analyzes error
      ↓
4. Query RAG: "Similar timeouts on this site?"
      ↓
5. RAG returns: "Previous fix: increase timeout to 15s"
      ↓
6. GPT-4 generates patch with context
      ↓
7. Backup original file
      ↓
8. Apply patch
      ↓
9. Re-run test
      ↓
10. Test passes → Store fix in RAG
    Test fails → Rollback + try different approach
```

---

### Flow 2: User-Triggered Analysis

```
1. User clicks "Auto-Fix" in Phase 6 UI
      ↓
2. Phase 5 analyzes recent failures
      ↓
3. Generates fix suggestions
      ↓
4. Shows diff to user
      ↓
5. User approves
      ↓
6. Apply patch + show summary
```

---

## 🎯 Types of Fixes Phase 5 Can Make

### 1. **Timeout Adjustments**
```javascript
// Before
await page.locator('#slow-element').click({ timeout: 5000 });

// After (Phase 5 detected slow network)
await page.locator('#slow-element').click({ timeout: 15000 });
```

### 2. **Selector Improvements**
```javascript
// Before (brittle)
await page.locator('#submit').click();

// After (more robust)
await page.locator('button[type="submit"]').first().click();
```

### 3. **Wait Strategies**
```javascript
// Before
await page.click('#login');

// After (Phase 5 added proper wait)
await page.waitForSelector('#login', { state: 'visible' });
await page.click('#login');
```

### 4. **Error Handling**
```javascript
// Before
await navigateToPage(url);

// After (Phase 5 added retry)
try {
  await navigateToPage(url);
} catch (error) {
  console.log('Retry after network error...');
  await page.waitForTimeout(2000);
  await navigateToPage(url);
}
```

### 5. **Network Resilience**
```javascript
// Before
await page.goto(url);

// After (Phase 5 added network handling)
await page.goto(url, { 
  waitUntil: 'domcontentloaded',
  timeout: 30000 
});
```

---

## 🧠 ML Techniques Used

### 1. **Pattern Recognition**
- Identify recurring error types
- Group similar failures
- Learn fix patterns

### 2. **Contextual Learning**
- Understand code context
- Apply site-specific knowledge
- Adapt to different environments

### 3. **Confidence Scoring**
```javascript
confidence = (
  similarityToKnownFixes * 0.4 +
  codeQualityScore * 0.3 +
  testSuccessRate * 0.3
);

// Only apply if confidence > 0.85
```

### 4. **Incremental Learning**
```javascript
// After each fix
if (testsPassed) {
  storeInRAG({
    fix: appliedPatch,
    success: true,
    improvement: metricsImprovement
  });
}
```

---

## 🔒 Safety Mechanisms

### 1. **Always Backup**
Every file modification is backed up before changes

### 2. **Dry Run Mode**
Test patches without applying:
```javascript
{
  "dryRun": true  // Shows what would change
}
```

### 3. **Rollback Capability**
One-click rollback to previous state

### 4. **Confidence Threshold**
Only apply fixes with >85% confidence

### 5. **Test Verification**
Re-run tests after applying fix

### 6. **Human Approval**
Option to require user approval for fixes

---

## 🧪 Testing Phase 5

### Test 1: Analyze a Failure
```bash
curl -X POST http://localhost:3006/api/auto-fix/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test_timeout_001",
    "errorType": "timeout",
    "errorMessage": "Timeout 10000ms exceeded",
    "selector": "#slow-button",
    "url": "https://slow-site.com"
  }'
```

### Test 2: Generate a Fix
```bash
curl -X POST http://localhost:3006/api/auto-fix/generate \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "issue_001",
    "file": "phase2/executor.js"
  }'
```

### Test 3: Apply Fix (Dry Run)
```bash
curl -X POST http://localhost:3006/api/auto-fix/apply \
  -H "Content-Type: application/json" \
  -d '{
    "patchId": "patch_001",
    "dryRun": true
  }'
```

---

## 🔗 Integration with Other Phases

### Phase 2 → Phase 5
```javascript
// After test failure in Phase 2
await fetch('http://localhost:3006/api/auto-fix/analyze', {
  method: 'POST',
  body: JSON.stringify(testFailure)
});

// Phase 5 analyzes and suggests fix
```

### Phase 4.5 → Phase 5
```javascript
// Phase 5 queries RAG for similar fixes
const similarFixes = await fetch('http://localhost:3005/api/rag/query', {
  method: 'POST',
  body: JSON.stringify({
    query: `Timeout errors on ${url}`
  })
});

// Use RAG knowledge to generate better fixes
```

### Phase 5 → Phase 6
```javascript
// Phase 6 UI shows applied fixes
GET /api/auto-fix/history

// Display:
// - What was fixed
// - Why it was fixed  
// - Improvement metrics
// - Rollback option
```

---

## 📊 Benefits

| Benefit | Impact |
|---------|--------|
| **Autonomous** | Fixes itself without human intervention |
| **Learning** | Gets better with each fix |
| **Fast** | Applies fixes in seconds |
| **Safe** | Always backs up + rollback |
| **Transparent** | Clear explanations of changes |
| **Context-Aware** | Understands code + history |

---

## 🎓 Use Cases

### 1. **Flaky Test Fixing**
```
Test fails intermittently
    ↓
Phase 5 detects timing issue
    ↓
Increases timeout automatically
    ↓
Test now stable!
```

### 2. **Selector Updates**
```
Element selector breaks
    ↓
Phase 5 finds new working selector via Phase 3
    ↓
Updates test automatically
    ↓
Test works again!
```

### 3. **Network Error Handling**
```
Test fails on slow network
    ↓
Phase 5 adds retry logic
    ↓
Test resilient to network issues
    ↓
95% reliability improvement!
```

---

## 🚀 Next Steps

After testing Phase 5:
- ✅ Autonomous code fixing
- ✅ Learning from history
- ✅ Clear change summaries
- ✅ Move to Phase 6: Unified Platform

---

## 📝 Key Files

- `errorAnalyzer.js` - Analyzes test failures
- `codeGenerator.js` - Generates patches with AI
- `patchApplier.js` - Safely applies changes
- `server.js` - Express API server
- `index.html` - Web UI for reviewing fixes

---

**Phase 5 makes AIQA truly autonomous - it learns and improves itself! 🤖🚀**

