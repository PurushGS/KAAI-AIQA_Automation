# 🧪 Phase 4.5 Testing Guide

## Prerequisites

1. **ChromaDB**: Must be running (or will auto-start)
2. **OpenAI API Key**: Set in `.env` file
3. **Node.js**: v18 or higher

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd phase4.5
npm install
```

### 2. Start the Server
```bash
npm start
```

Server will start on `http://localhost:3005`

---

## 📋 Test Scenarios

### Test 1: Store a Test Execution

**Goal**: Verify RAG can store test data with embeddings

```bash
curl -X POST http://localhost:3005/api/rag/store \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test_login_001",
    "testName": "Login flow test",
    "url": "https://app.example.com",
    "steps": [
      {"action": "navigate", "target": "https://app.example.com/login"},
      {"action": "type", "target": "#email", "data": "user@example.com"},
      {"action": "type", "target": "#password", "data": "password123"},
      {"action": "click", "target": "#login-btn"},
      {"action": "verify", "expected": "Dashboard visible"}
    ],
    "results": {
      "passed": 5,
      "failed": 0,
      "duration": 2500
    },
    "metadata": {
      "timestamp": "2024-01-15T10:30:00Z",
      "browser": "chromium",
      "testType": "authentication"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "testId": "test_login_001",
  "embeddingId": "test_login_001",
  "dimensions": 1536
}
```

**✅ Success Criteria**:
- Response has `success: true`
- Returns embedding ID
- Console shows: "✅ Stored with embedding (1536 dims)"

---

### Test 2: Query Knowledge Base

**Goal**: Semantic search for similar tests

```bash
curl -X POST http://localhost:3005/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me login tests",
    "limit": 3
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "query": "Show me login tests",
  "resultsCount": 1,
  "results": [
    {
      "testId": "test_login_001",
      "testName": "Login flow test",
      "url": "https://app.example.com",
      "relevanceScore": "0.950",
      "passed": 5,
      "failed": 0
    }
  ],
  "answer": "Found 1 login test. It passed all 5 steps..."
}
```

**✅ Success Criteria**:
- Returns relevant test results
- AI answer summarizes findings
- Relevance score > 0.8 for exact matches

---

### Test 3: Store Multiple Test Types

**Goal**: Build diverse knowledge base

**File Upload Test**:
```bash
curl -X POST http://localhost:3005/api/rag/store \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test_upload_001",
    "testName": "File upload - PDF document",
    "url": "https://app.example.com/upload",
    "steps": [
      {"action": "navigate", "target": "https://app.example.com/upload"},
      {"action": "click", "target": "#upload-btn"},
      {"action": "upload", "target": "input[type=file]", "data": "document.pdf"},
      {"action": "wait", "target": ".upload-progress", "timeout": 10000},
      {"action": "verify", "expected": "File appears in list"}
    ],
    "results": {
      "passed": 5,
      "failed": 0,
      "duration": 8500
    },
    "metadata": {
      "timestamp": "2024-01-15T11:00:00Z",
      "browser": "chromium",
      "testType": "file_upload"
    }
  }'
```

**Video Streaming Test**:
```bash
curl -X POST http://localhost:3005/api/rag/store \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test_video_001",
    "testName": "YouTube video playback",
    "url": "https://youtube.com/watch?v=test",
    "steps": [
      {"action": "navigate", "target": "https://youtube.com/watch?v=test"},
      {"action": "wait", "target": "video", "timeout": 5000},
      {"action": "click", "target": ".ytp-play-button"},
      {"action": "verify", "expected": "Video is playing"}
    ],
    "results": {
      "passed": 4,
      "failed": 0,
      "duration": 6000
    },
    "metadata": {
      "timestamp": "2024-01-15T11:15:00Z",
      "browser": "chromium",
      "testType": "video_streaming"
    }
  }'
```

---

### Test 4: Semantic Search Across Test Types

**Query 1: File Operations**
```bash
curl -X POST http://localhost:3005/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I test file upload?",
    "limit": 5
  }'
```

**Expected**: Should return `test_upload_001` with high relevance

**Query 2: Video Testing**
```bash
curl -X POST http://localhost:3005/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tests for video streaming and playback",
    "limit": 5
  }'
```

**Expected**: Should return `test_video_001`

**Query 3: Failed Tests**
```bash
curl -X POST http://localhost:3005/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show failed tests",
    "filters": { "success": false },
    "limit": 5
  }'
```

---

### Test 5: Git Change Analysis

**Goal**: Map code changes to affected tests

```bash
curl -X POST http://localhost:3005/api/rag/git-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "commitHash": "abc123",
    "message": "Fix authentication bug",
    "changedFiles": [
      "backend/api/auth.js",
      "frontend/components/Login.tsx",
      "tests/auth.test.js"
    ],
    "diff": "Modified authentication logic"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "affectedFeatures": [
    "Login flow",
    "User authentication",
    "Session management"
  ],
  "recommendedTests": [
    {
      "testId": "test_login_001",
      "priority": "critical",
      "reason": "auth.js directly modified"
    }
  ],
  "riskLevel": "high",
  "recommendation": "Run full authentication test suite"
}
```

**✅ Success Criteria**:
- Identifies affected features correctly
- Recommends relevant tests
- Risk level appropriate for changes
- AI provides actionable recommendation

---

### Test 6: Find Similar Tests

**Goal**: Discover related test cases

```bash
curl http://localhost:3005/api/rag/similar/test_login_001?limit=5
```

**Expected Response**:
```json
{
  "success": true,
  "originalTest": {
    "testId": "test_login_001",
    "testName": "Login flow test"
  },
  "similarTests": [
    {
      "testId": "test_login_002",
      "testName": "Login with 2FA",
      "relevanceScore": "0.850"
    }
  ]
}
```

---

### Test 7: Database Statistics

**Goal**: Verify data is being stored

```bash
curl http://localhost:3005/api/rag/stats
```

**Expected Response**:
```json
{
  "success": true,
  "stats": {
    "totalTests": 3,
    "uniqueUrls": 3,
    "averageSuccessRate": 1.0,
    "totalPassed": 14,
    "totalFailed": 0,
    "averageDuration": 5666,
    "testTypes": {
      "authentication": 1,
      "file_upload": 1,
      "video_streaming": 1
    }
  }
}
```

---

### Test 8: GitHub Webhook (Simulated)

**Goal**: Test git webhook integration

```bash
curl -X POST http://localhost:3005/api/rag/git-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "repository": {
      "name": "my-app"
    },
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "abc123def456",
        "message": "Update authentication flow",
        "author": {
          "name": "Developer"
        },
        "timestamp": "2024-01-15T12:00:00Z",
        "added": ["tests/new-auth.test.js"],
        "modified": ["backend/auth.js", "frontend/Login.tsx"],
        "removed": []
      }
    ]
  }'
```

**Expected**: Should process webhook and recommend tests

---

## 🎨 Web UI Testing

### Open in Browser
```
http://localhost:3005
```

### UI Test Checklist

1. **Stats Dashboard**
   - [ ] Shows total tests
   - [ ] Shows success rate
   - [ ] Shows unique URLs
   - [ ] Shows average duration
   - [ ] Updates after storing new test

2. **Query Knowledge Base**
   - [ ] Can enter natural language query
   - [ ] AI answer appears
   - [ ] Results show relevance scores
   - [ ] Can filter by success/failure

3. **Store Test Execution**
   - [ ] Can enter test details
   - [ ] JSON validation works
   - [ ] Success message appears
   - [ ] Stats update immediately

4. **Git Analysis**
   - [ ] Can enter changed files
   - [ ] Risk level displayed with color
   - [ ] Recommended tests shown
   - [ ] Priorities indicated

5. **Find Similar Tests**
   - [ ] Can search by test ID
   - [ ] Similar tests ranked by relevance
   - [ ] Shows differences

---

## 🔗 Integration Testing

### Test with Phase 2 (Test Executor)

**Goal**: Phase 2 stores results in RAG automatically

1. Start Phase 2:
   ```bash
   cd phase2
   npm start
   ```

2. Run a test in Phase 2

3. Check RAG has the execution:
   ```bash
   curl http://localhost:3005/api/rag/stats
   ```

4. Query for the test:
   ```bash
   curl -X POST http://localhost:3005/api/rag/query \
     -H "Content-Type: application/json" \
     -d '{"query": "Recent test executions"}'
   ```

---

## 📊 Expected Behavior

### Semantic Search Quality

| Query | Should Find | Should NOT Find |
|-------|-------------|-----------------|
| "login tests" | test_login_001 | test_upload_001 |
| "file upload" | test_upload_001 | test_video_001 |
| "video playback" | test_video_001 | test_login_001 |
| "failed tests" | Tests with failed > 0 | All passed tests |

### Git Analysis Accuracy

| Changed Files | Expected Risk | Expected Tests |
|--------------|---------------|----------------|
| auth.js | Critical/High | Login, Signup tests |
| README.md | Low | None or docs tests |
| payment.js | Critical | Payment flow tests |
| styles.css | Low | Visual regression |

---

## 🐛 Troubleshooting

### ChromaDB Connection Error
```
❌ Failed to initialize RAG: Connection refused
```

**Fix**: ChromaDB will auto-start with first request. Wait 5 seconds and try again.

### OpenAI API Error
```
❌ Failed to create embedding: Invalid API key
```

**Fix**: Check `.env` file has valid `OPENAI_API_KEY`

### No Results Found
```
No relevant tests found in the knowledge base
```

**Fix**: Store some test data first (Test 1-3)

---

## ✅ Phase 4.5 Complete Checklist

- [ ] Server starts without errors
- [ ] Can store test executions
- [ ] Semantic search returns relevant results
- [ ] AI answers are helpful
- [ ] Git analysis identifies affected tests
- [ ] Similar tests found correctly
- [ ] Stats update in real-time
- [ ] Web UI loads and works
- [ ] All 4 UI cards functional
- [ ] Ready to integrate with other phases

---

**Once all tests pass, Phase 4.5 is complete!** 🎉

Move to Phase 5: Self-Improving Code

