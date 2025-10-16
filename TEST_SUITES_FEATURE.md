# 📁 Test Suites Feature - Complete Guide

## 🎯 Overview

The **Test Suites** feature is a comprehensive test organization and management system that allows you to:
- Create folders with custom names
- Organize tests into logical collections
- Support nested folder structures (folders within folders)
- Run entire suites or individual tests
- Choose execution mode (sequential/parallel)
- Tag tests for easy filtering (smoke, regression, critical)
- Export/Import test suites
- Clone/Duplicate suites
- Schedule automated runs

---

## 📍 Access

Navigate to: **http://localhost:3007**  
Click on: **📁 Test Suites** in the sidebar

---

## 🏗️ Architecture

### Structure

```
📁 Test Suite (Folder)
   ├── 📄 Test 1 (File)
   │   └── 🧪 Test Steps [step1, step2, step3...]
   ├── 📄 Test 2 (File)
   │   └── 🧪 Test Steps [step1, step2, step3...]
   └── 📁 Nested Suite (Sub-folder)
       └── 📄 Test 3 (File)
           └── 🧪 Test Steps [step1, step2, step3...]
```

### Backend API

**Location:** `/Users/purush/AIQA/phase6/testSuitesAPI.js`

**Key Functions:**
- `createSuite()` - Create new test suite
- `getSuiteTree()` - Get hierarchical structure
- `addTestToSuite()` - Add tests to suites
- `executeSuite()` - Run suite with options
- `cloneSuite()` - Duplicate suites
- `exportSuite()` / `importSuite()` - Import/Export
- `scheduleSuite()` - Set up scheduled runs

**API Endpoints:**
```
GET    /api/suites                     - Get all suites (tree)
GET    /api/suites/:id                 - Get single suite
POST   /api/suites                     - Create suite
PUT    /api/suites/:id                 - Update suite
DELETE /api/suites/:id                 - Delete suite
POST   /api/suites/:id/tests           - Add test to suite
PUT    /api/suites/:id/tests/:testId   - Update test
DELETE /api/suites/:id/tests/:testId   - Remove test
POST   /api/suites/:id/run             - Execute suite
POST   /api/suites/:id/clone           - Clone suite
GET    /api/suites/:id/export          - Export suite
POST   /api/suites/import              - Import suite
POST   /api/suites/:id/schedule        - Schedule suite
GET    /api/suites/search/:query       - Search suites
GET    /api/suites/tag/:tag            - Filter by tag
```

---

## ✨ Features

### 1. Create Test Suite

**Steps:**
1. Click **➕ New Suite** button
2. Enter:
   - **Suite Name** (required) - e.g., "Login Tests"
   - **Description** - Brief description
   - **Parent Suite** - Select if creating nested suite
   - **Tags** - Comma-separated tags (smoke, regression, critical)
3. Click **Save Suite**

**Example:**
```
Suite Name: User Authentication Tests
Description: All authentication-related test scenarios
Tags: smoke, critical
Parent: None (top-level)
```

### 2. Add Tests to Suite

**Steps:**
1. Click **➕** button on a suite card
2. Enter:
   - **Test Name** (required) - e.g., "Valid Login"
   - **Description** - Brief description
   - **Test Steps** (JSON format) - Array of test steps
   - **Tags** - Test-specific tags
3. Click **Save Test**

**Test Steps Format:**
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://app.example.com",
    "data": null,
    "expected": null,
    "description": "Navigate to login page"
  },
  {
    "stepNumber": 2,
    "action": "type",
    "target": "input[name='email']",
    "data": "user@example.com",
    "expected": null,
    "description": "Enter email"
  },
  {
    "stepNumber": 3,
    "action": "type",
    "target": "input[name='password']",
    "data": "password123",
    "expected": null,
    "description": "Enter password"
  },
  {
    "stepNumber": 4,
    "action": "click",
    "target": "button[type='submit']",
    "data": null,
    "expected": null,
    "description": "Click login button"
  },
  {
    "stepNumber": 5,
    "action": "verify",
    "target": "div.welcome-message",
    "data": null,
    "expected": "element visible",
    "description": "Verify login successful"
  }
]
```

### 3. Run Entire Suite

**Steps:**
1. Click **▶️** button on suite card
2. Choose execution options:
   - **Execution Mode:**
     - ⦿ Sequential (default) - one after another
     - ○ Parallel - all at once (faster)
   - **On Failure:**
     - ☑ Continue with remaining tests (default)
     - ☐ Stop immediately
   - **Browser Options:**
     - ☑ Headless mode (default)
3. Click **▶️ Run Tests**

**What Happens:**
- Tests execute based on chosen mode
- Screenshots captured on failure
- Logs collected (network, console, errors)
- Suite statistics updated
- Results stored in RAG for learning

### 4. Run Individual Test

**Steps:**
1. Find test in suite card
2. Click **▶️** button next to test name
3. Test executes immediately with default settings

### 5. Edit Suite or Test

**Edit Suite:**
- Click **✏️** button on suite card
- Modify name, description, tags, or parent
- Click **Save Suite**

**Edit Test:**
- Click **✏️** button next to test name
- Modify test name, description, steps, or tags
- Click **Save Test**

### 6. Clone/Duplicate Suite

**Steps:**
1. Click **📋** button on suite card
2. Suite is cloned with name " (Copy)"
3. All tests are duplicated with new IDs

**Use Case:**
- Create variations of test suites
- Test different environments
- Maintain multiple versions

### 7. Export Suite

**Steps:**
1. Click **📤** button on suite card
2. JSON file downloads automatically
3. File name: `test-suite-[id].json`

**Export Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-10-15T10:30:00.000Z",
  "suite": {
    "name": "Login Tests",
    "description": "All login scenarios",
    "tests": [...],
    "tags": ["smoke", "critical"]
  },
  "children": [...]
}
```

### 8. Import Suite

**Steps:**
1. Click **📥 Import** button
2. Select exported JSON file
3. Click **📥 Import**
4. Suite is created with all tests and nested suites

**Use Case:**
- Share test suites between teams
- Backup and restore
- Template reuse

### 9. Schedule Suite Runs

**Steps:**
1. Click **⏰** button on suite card
2. Configure schedule:
   - ☑ Enable scheduling
   - **Schedule Type:**
     - Interval (minutes) - e.g., "60" = every hour
     - Cron Expression - e.g., "0 0 * * *" = daily at midnight
     - One Time - ISO date string
   - **Expression** - Based on type
3. Click **Save Schedule**

**Examples:**
```
Interval:
  Type: Interval
  Expression: 60
  Result: Runs every 60 minutes

Cron:
  Type: Cron
  Expression: 0 9 * * MON-FRI
  Result: Runs at 9 AM on weekdays

One Time:
  Type: Once
  Expression: 2025-10-20T15:00:00.000Z
  Result: Runs once at specified time
```

### 10. Tags System

**Predefined Tags:**
- 🔥 **smoke** - Essential functionality tests
- 🔄 **regression** - Existing feature validation
- ⚠️ **critical** - High-priority tests

**Usage:**
- Add tags when creating/editing suites or tests
- Use tag filter dropdown to filter by tag
- Custom tags supported (any text)

### 11. Search & Filter

**Search:**
- Type in search box
- Matches suite name, description, or tags
- Results update in real-time
- Works with nested suites

**Filter by Tag:**
- Select tag from dropdown
- Shows only suites with that tag
- Select "All Tags" to clear filter

### 12. Enable/Disable Tests

**Steps:**
1. Click **🔓** button next to test (to disable)
2. Test is disabled (shown grayed out)
3. Click **🔒** button to re-enable
4. Disabled tests are skipped during suite execution

**Use Case:**
- Temporarily skip flaky tests
- Maintain tests without running them
- Progressive test development

### 13. Nested Folders

**Creating Nested Structure:**
1. Create parent suite: "Authentication"
2. Click **➕ New Suite**
3. Enter suite details
4. Select **Parent Suite:** "Authentication"
5. Click **Save Suite**

**Result:**
```
📁 Authentication
   📁 Login Tests
      📄 Valid Login
      📄 Invalid Login
   📁 Signup Tests
      📄 Valid Signup
      📄 Email Validation
   📁 Password Reset
      📄 Request Reset
      📄 Complete Reset
```

**Benefits:**
- Logical organization
- Better maintainability
- Easier navigation
- Scalable structure

---

## 📊 Suite Statistics

Each suite tracks:
- **Total Tests** - Number of tests in suite
- **Last Run** - When suite was last executed
- **Pass Rate** - Percentage of passed tests
- **Total Runs** - Number of times suite was executed

**Display:**
```
📊 5 tests • 🕐 Last run: 2 min ago • ✓ 100% pass rate
```

---

## 🎯 Best Practices

### 1. Organize by Feature
```
📁 E-commerce Platform
   📁 User Management
   📁 Shopping Cart
   📁 Checkout Process
   📁 Payment Gateway
   📁 Order Tracking
```

### 2. Use Descriptive Names
✅ Good: "User Login - Valid Credentials"  
❌ Bad: "Test 1"

### 3. Tag Strategically
- **smoke** - Core functionality (run first)
- **regression** - Full suite (run before release)
- **critical** - Must pass (block deployment)

### 4. Keep Tests Atomic
- Each test should be independent
- No dependencies between tests
- Clear pass/fail criteria

### 5. Leverage Nesting
```
📁 Authentication (Parent)
   📁 Login (Child)
   📁 Signup (Child)
   📁 Logout (Child)
```

### 6. Export for Backup
- Regular exports of important suites
- Version control for test suites
- Easy rollback if needed

---

## 🚀 Real-World Use Cases

### Use Case 1: Daily Smoke Tests

**Setup:**
```
Suite: Daily Smoke Tests
Tags: smoke, critical
Schedule: Every day at 9 AM
Execution: Sequential, Continue on failure
Tests: 10 critical path tests
```

**Result:** Automatic daily validation of core features

### Use Case 2: Release Regression

**Setup:**
```
Suite: Full Regression Suite
Tags: regression
Execution: Parallel (faster completion)
Tests: 100+ tests across all features
```

**Result:** Complete validation before release

### Use Case 3: Feature Development

**Setup:**
```
Suite: New Feature - Payment Gateway
Tags: feature-dev
Execution: Sequential
Tests: Progressive test development
```

**Result:** Iterative testing during development

### Use Case 4: Cross-Environment Testing

**Setup:**
```
Original Suite: Production Tests
Clone → Staging Tests
Clone → Dev Tests
Different URLs, same steps
```

**Result:** Consistent testing across environments

---

## 🔧 Technical Details

### Storage

**Location:** `/Users/purush/AIQA/phase6/test-suites/`

**Format:** JSON files (one per suite)
```
test-suites/
  ├── suite_1697123456_abc123.json
  ├── suite_1697123789_def456.json
  └── suite_1697124012_ghi789.json
```

### Data Structure

```javascript
{
  "id": "suite_1697123456_abc123",
  "name": "Login Tests",
  "description": "All login scenarios",
  "parentId": null, // or parent suite ID
  "type": "folder",
  "tests": [
    {
      "id": "test_1697123789_xyz123",
      "name": "Valid Login",
      "description": "Test valid credentials",
      "steps": [...],
      "tags": ["smoke"],
      "enabled": true,
      "createdAt": "2025-10-15T10:00:00.000Z",
      "lastRun": "2025-10-15T11:30:00.000Z",
      "lastResult": {
        "success": true,
        "passedSteps": 5,
        "failedSteps": 0,
        "duration": 12000
      }
    }
  ],
  "tags": ["smoke", "critical"],
  "createdAt": "2025-10-15T10:00:00.000Z",
  "updatedAt": "2025-10-15T11:30:00.000Z",
  "lastRun": "2025-10-15T11:30:00.000Z",
  "stats": {
    "totalRuns": 5,
    "totalTests": 3,
    "successRate": 100
  },
  "schedule": {
    "enabled": true,
    "type": "interval",
    "expression": "60",
    "nextRun": "2025-10-15T12:30:00.000Z"
  }
}
```

### Integration with Existing Features

**Phase 2 (Executor):**
- Suite execution calls Phase 2's `/api/execute` endpoint
- Each test is executed as a standard test flow
- Screenshots, logs, and reports generated per test

**Phase 3 (AI Web Reader):**
- Auto-adaptation works seamlessly with suite tests
- Failed selectors are corrected automatically
- Corrections logged to RAG

**Phase 4.5 (RAG):**
- Suite execution results stored in RAG
- Historical data used for insights
- Pattern detection across suite runs

**Phase 4 (Learning):**
- Test failures analyzed for patterns
- Learning applied to future runs
- User feedback integrated

---

## 🎯 Example Workflow

### Complete Test Suite Creation

```
1. Create Suite
   Name: E-commerce Checkout Flow
   Description: Complete checkout process validation
   Tags: regression, critical

2. Add Tests:
   
   Test 1: Add Item to Cart
   Steps:
   - Navigate to product page
   - Click "Add to Cart"
   - Verify cart count increases
   
   Test 2: Proceed to Checkout
   Steps:
   - Click cart icon
   - Click "Proceed to Checkout"
   - Verify checkout page loads
   
   Test 3: Enter Shipping Info
   Steps:
   - Fill shipping form
   - Click "Continue"
   - Verify info saved
   
   Test 4: Select Payment Method
   Steps:
   - Select credit card
   - Enter card details
   - Click "Complete Order"
   
   Test 5: Verify Order Confirmation
   Steps:
   - Verify order number displayed
   - Verify email sent
   - Verify order in history

3. Run Suite
   Mode: Sequential
   Continue on failure: Yes
   Headless: Yes

4. Review Results
   Total: 5
   Passed: 5
   Failed: 0
   Duration: 45s
   Pass Rate: 100%

5. Schedule
   Type: Interval
   Expression: 120 (every 2 hours)
   Enabled: Yes

6. Export for Backup
   File: test-suite-[id].json
   Stored securely
```

---

## 📈 Benefits

### For Test Organization
✅ Logical grouping of related tests  
✅ Easy navigation and management  
✅ Scalable structure (nested folders)  
✅ Clear ownership and responsibility  

### For Execution
✅ Run multiple tests with one click  
✅ Flexible execution modes  
✅ Continue on failure option  
✅ Automatic retry and adaptation  

### For Collaboration
✅ Export/Import for sharing  
✅ Clone for variations  
✅ Tags for categorization  
✅ Clear documentation  

### For Automation
✅ Schedule automated runs  
✅ Integration with existing phases  
✅ Results stored in RAG  
✅ Historical analysis  

### For Maintenance
✅ Enable/disable tests  
✅ Edit without re-creation  
✅ Statistics tracking  
✅ Version control via export  

---

## 🔮 Future Enhancements

Potential future additions:
- 🎨 Visual test builder (drag-and-drop)
- 🔗 CI/CD integration hooks
- 📊 Advanced analytics dashboard
- 📧 Email/Slack notifications
- 🎯 Test prioritization (ML-based)
- 🔄 Auto-healing tests
- 📱 Mobile app support
- 🌍 Multi-environment management
- 👥 Team collaboration features
- 📸 Visual regression testing

---

## 🎉 Summary

The Test Suites feature provides a **complete test organization and management system** that transforms how you create, manage, and execute tests:

✅ **Organized** - Nested folder structure  
✅ **Flexible** - Sequential or parallel execution  
✅ **Tagged** - Easy filtering and categorization  
✅ **Portable** - Export/Import capabilities  
✅ **Scheduled** - Automated runs  
✅ **Smart** - Integration with AI features  
✅ **Scalable** - Handle hundreds of tests  
✅ **User-Friendly** - Intuitive UI  

**Access it now at: http://localhost:3007 → 📁 Test Suites**

---

## 📞 Quick Reference

| Action | Button | Shortcut |
|--------|--------|----------|
| Create Suite | ➕ New Suite | - |
| Add Test | ➕ (on suite) | - |
| Run Suite | ▶️ (on suite) | - |
| Run Test | ▶️ (on test) | - |
| Edit Suite | ✏️ (on suite) | - |
| Edit Test | ✏️ (on test) | - |
| Clone Suite | 📋 | - |
| Export Suite | 📤 | - |
| Import Suite | 📥 Import | - |
| Schedule | ⏰ | - |
| Delete | 🗑️ | Confirm |
| Toggle Test | 🔓/🔒 | - |

---

**Built with ❤️ for AIQA Platform**

