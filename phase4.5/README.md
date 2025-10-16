# 🧠 AIQA Phase 4.5: RAG Service

## Overview

**Phase 4.5** is the **intelligent memory system** for AIQA. It uses **RAG (Retrieval-Augmented Generation)** with a vector database to store and retrieve test execution knowledge.

This is a **dedicated microservice** that all other phases query for historical context, making AIQA continuously smarter.

---

## 🎯 Purpose

RAG Service provides:

1. **Semantic Search** - Find similar tests by meaning, not just keywords
2. **Knowledge Persistence** - Store every test execution with embeddings
3. **Cross-Phase Memory** - All phases access the same knowledge base
4. **Git Integration** - Map code changes to affected tests
5. **Context Retrieval** - Give LLMs relevant historical data

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              RAG Service (:3005)                     │
│  ═════════════════════════════════════════════════  │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  ChromaDB (Vector Database)                │    │
│  │  • Stores embeddings                       │    │
│  │  • Semantic search                         │    │
│  │  • Persistent storage                      │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  OpenAI Embeddings                         │    │
│  │  • text-embedding-3-small                  │    │
│  │  • 1536 dimensions                         │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Git Watcher                               │    │
│  │  • Monitor code changes                    │    │
│  │  • Auto-trigger tests                      │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
         ↑                    ↑                ↑
         │                    │                │
    Phase 1-4            Git Webhooks    Phase 6 UI
```

---

## 🚀 Features

### 1. Store Test Executions
Every test run is stored with:
- Test steps
- Results (pass/fail)
- Screenshots
- Error logs
- Timing data
- URL tested
- Browser info

### 2. Semantic Search
Query by natural language:
```
"How to test file upload?"
"Login tests that failed"
"Tests for app.example.com"
```

### 3. Git-Triggered Testing
Automatically determine which tests to run based on code changes:
```javascript
// Developer pushes: backend/auth.js
// RAG analyzes: "This affects login, signup, password reset"
// Auto-triggers: login_test, signup_test, password_reset_test
```

### 4. Cross-Phase Intelligence
- **Phase 1**: "What similar tests exist?"
- **Phase 2**: "What selectors worked before on this site?"
- **Phase 3**: "Have we tested this page before?"
- **Phase 4**: "What errors happened historically?"

---

## 📡 API Endpoints

### `POST /api/rag/store`
Store a test execution in the knowledge base

**Request:**
```json
{
  "testId": "test_123",
  "testName": "Login flow test",
  "url": "https://app.example.com",
  "steps": [...],
  "results": {
    "passed": 5,
    "failed": 1,
    "duration": 3500
  },
  "errors": [...],
  "screenshots": [...],
  "metadata": {
    "browser": "chromium",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test execution stored in RAG",
  "testId": "test_123",
  "embeddingId": "emb_abc123"
}
```

---

### `POST /api/rag/query`
Query the knowledge base with natural language

**Request:**
```json
{
  "query": "Show me file upload tests that failed",
  "filters": {
    "success": false,
    "testType": "file_upload"
  },
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "testId": "test_456",
      "testName": "File upload - PDF",
      "relevanceScore": 0.92,
      "summary": "Large PDF upload timed out after 10s",
      "url": "https://app.example.com/upload",
      "timestamp": "2024-01-14T15:20:00Z"
    }
  ],
  "answer": "Found 3 file upload tests that failed. Common issue: Large files (>5MB) timeout. Recommendation: Increase wait time to 15s."
}
```

---

### `POST /api/rag/git-analyze`
Analyze git changes and recommend tests

**Request:**
```json
{
  "commitHash": "abc123def",
  "changedFiles": [
    "backend/api/auth.js",
    "frontend/components/Login.tsx"
  ],
  "diff": "...git diff output..."
}
```

**Response:**
```json
{
  "success": true,
  "affectedFeatures": [
    "Login flow",
    "Session management",
    "User authentication"
  ],
  "recommendedTests": [
    {
      "testId": "test_login_001",
      "testName": "Login with valid credentials",
      "priority": "critical",
      "reason": "auth.js directly modified"
    },
    {
      "testId": "test_session_001",
      "testName": "Session persistence",
      "priority": "high",
      "reason": "Related to auth changes"
    }
  ],
  "riskLevel": "high",
  "recommendation": "Run full authentication test suite"
}
```

---

### `GET /api/rag/similar-tests/:testId`
Find tests similar to a given test

**Response:**
```json
{
  "success": true,
  "originalTest": {
    "testId": "test_123",
    "testName": "Login flow"
  },
  "similarTests": [
    {
      "testId": "test_789",
      "testName": "Login with 2FA",
      "similarity": 0.88,
      "differences": "Includes 2FA verification step"
    }
  ]
}
```

---

### `GET /api/rag/stats`
Get RAG database statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTests": 1543,
    "totalExecutions": 8921,
    "uniqueUrls": 47,
    "averageSuccessRate": 0.87,
    "databaseSize": "245MB",
    "oldestTest": "2024-01-01T00:00:00Z",
    "newestTest": "2024-01-15T12:00:00Z"
  }
}
```

---

## 🔧 How It Works

### 1. **Storage Flow**
```
Test Execution (Phase 2)
    ↓
Convert to text representation
    ↓
Generate embedding (OpenAI)
    ↓
Store in ChromaDB with metadata
    ↓
Indexed for fast retrieval
```

### 2. **Query Flow**
```
User asks: "Show login tests"
    ↓
Generate embedding of question
    ↓
Semantic search in ChromaDB
    ↓
Retrieve top 5 similar tests
    ↓
LLM synthesizes answer with context
    ↓
Return results + AI summary
```

### 3. **Git Integration Flow**
```
Git webhook: Code pushed
    ↓
Extract changed files + diff
    ↓
Query RAG: "What tests cover these files?"
    ↓
RAG returns: Affected test list
    ↓
Auto-trigger relevant tests (Phase 2)
    ↓
Store new results in RAG
```

---

## 🧪 Testing Phase 4.5

### Setup
```bash
cd phase4.5
npm install
npm start
```

Server starts on: `http://localhost:3005`

### Test 1: Store a Test Execution
```bash
curl -X POST http://localhost:3005/api/rag/store \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test_001",
    "testName": "Login flow test",
    "url": "https://app.example.com",
    "steps": [
      {"action": "navigate", "target": "https://app.example.com/login"},
      {"action": "type", "target": "#email", "data": "user@example.com"},
      {"action": "click", "target": "#login-btn"}
    ],
    "results": {"passed": 3, "failed": 0, "duration": 2500}
  }'
```

### Test 2: Query the Knowledge Base
```bash
curl -X POST http://localhost:3005/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me login tests",
    "limit": 3
  }'
```

### Test 3: Git Analysis
```bash
curl -X POST http://localhost:3005/api/rag/git-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "changedFiles": ["backend/api/auth.js"],
    "diff": "Modified authentication logic"
  }'
```

---

## 🔗 Integration with Other Phases

### Phase 1: Enhanced Test Generation
```javascript
// Phase 1 queries RAG before generating tests
const similarTests = await fetch('http://localhost:3005/api/rag/query', {
  method: 'POST',
  body: JSON.stringify({
    query: `Similar tests for: ${userInput}`
  })
});

// Use historical context to generate better tests
```

### Phase 2: Smart Element Finding
```javascript
// Phase 2 queries RAG for working selectors
const knownSelectors = await fetch('http://localhost:3005/api/rag/query', {
  method: 'POST',
  body: JSON.stringify({
    query: `Element selectors that worked on ${url}`
  })
});
```

### Phase 4: Pattern Analysis
```javascript
// Phase 4 uses RAG to find historical patterns
const patterns = await fetch('http://localhost:3005/api/rag/query', {
  method: 'POST',
  body: JSON.stringify({
    query: 'All failed tests with network errors'
  })
});
```

---

## 📊 Benefits of Dedicated RAG Service

| Benefit | Why It Matters |
|---------|---------------|
| **Scalability** | Vector DB can scale independently |
| **Cross-Phase Access** | All phases query same knowledge |
| **Git Integration** | Smart auto-test triggering |
| **Failure Isolation** | RAG down = graceful degradation |
| **Technology Swap** | Easily change vector DB |
| **Microservice Ready** | Deploy separately in production |

---

## 🎓 Use Cases Enabled

1. **File Upload Testing**
   - RAG remembers: "5MB PDFs timeout on site X"
   - Auto-adjusts wait times

2. **Video Streaming**
   - RAG knows: "YouTube needs 3s load time"
   - Configures tests automatically

3. **Chatbot Validation**
   - RAG stores: "Good responses are coherent + <5s"
   - Validates against learned patterns

4. **Git-Triggered Testing**
   - RAG maps: "auth.js → 12 related tests"
   - Runs only affected tests

5. **Multi-Site Testing**
   - RAG learns: Each site's unique patterns
   - Adapts tests per domain

---

## 🚀 Next Steps

After testing Phase 4.5:
- ✅ All phases query RAG for context
- ✅ Git webhook integration
- ✅ Auto-test triggering based on code changes
- ✅ Move to Phase 5: Self-Improving Code

---

## 📝 Key Files

- `ragEngine.js` - Core RAG logic with ChromaDB
- `server.js` - Express API server
- `gitWatcher.js` - Git integration for auto-testing
- `index.html` - Web UI for testing RAG queries

---

**Phase 4.5 is the brain that makes AIQA continuously smarter! 🧠**

