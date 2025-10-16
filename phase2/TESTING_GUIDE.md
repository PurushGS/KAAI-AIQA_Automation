# Phase 2 Testing Guide

## ✅ What We're Testing

**Screenshot & Logs System**
- Screenshots captured at each step (before/after)
- Expected vs Actual behavior logging
- Visual comparison
- Failure analysis
- Complete execution reports

## 🔗 Integration with Phase 1

Phase 2 takes the **structured test steps** from Phase 1 as input!

**Workflow:**
1. Use Phase 1 to convert natural language → test steps
2. Copy the JSON output from Phase 1
3. Paste into Phase 2 to execute
4. See screenshots and logs for each step

## 🚀 How to Test

### Step 1: Install Dependencies

```bash
cd /Users/purush/AIQA/phase2
npm install
npx playwright install chromium
```

### Step 2: Start Phase 2 Server

```bash
npm start
```

### Step 3: Open Test UI

Open browser to: **http://localhost:3002**

### Step 4: Prepare Test Steps

**Option A: From Phase 1**
1. Go to http://localhost:3001 (Phase 1)
2. Convert a test description
3. Copy the JSON output
4. Paste into Phase 2

**Option B: Use Example**
Use the example provided in the Phase 2 UI (Google search test)

**Option C: Create Custom**
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://example.com",
    "description": "Navigate to example.com"
  },
  {
    "stepNumber": 2,
    "action": "verify",
    "target": "h1",
    "expected": "element visible",
    "description": "Verify page title exists"
  }
]
```

### Step 5: Execute Test

1. Paste test steps JSON in the textarea
2. Choose headless mode or not:
   - **Unchecked**: See browser window (good for debugging)
   - **Checked**: Run in background (faster)
3. Click "🚀 Execute Test"

## 🧪 Test Scenarios

### Test 1: Simple Navigation
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://www.google.com",
    "description": "Navigate to Google"
  },
  {
    "stepNumber": 2,
    "action": "verify",
    "target": "textarea[name=q]",
    "expected": "element visible",
    "description": "Verify search box visible"
  }
]
```

**What to verify:**
- ✅ 2 screenshots per step (before/after)
- ✅ Expected behavior logged
- ✅ Actual behavior logged
- ✅ Behavior match indicator
- ✅ Test passes

### Test 2: Interaction Flow
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://www.google.com",
    "description": "Navigate to Google"
  },
  {
    "stepNumber": 2,
    "action": "type",
    "target": "textarea[name=q]",
    "data": "Playwright testing",
    "description": "Type search query"
  },
  {
    "stepNumber": 3,
    "action": "click",
    "target": "input[name='btnK']",
    "description": "Click search button"
  }
]
```

**What to verify:**
- ✅ Screenshots show text being entered
- ✅ Before/after comparison clear
- ✅ Expected vs actual match
- ✅ All steps pass

### Test 3: Intentional Failure
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://example.com",
    "description": "Navigate to example"
  },
  {
    "stepNumber": 2,
    "action": "verify",
    "target": "#nonexistent-element",
    "expected": "element visible",
    "description": "Verify element that doesn't exist"
  }
]
```

**What to verify:**
- ✅ Step 1 passes
- ✅ Step 2 fails
- ✅ Failure screenshot captured
- ✅ Error message clear
- ✅ Expected vs actual shows mismatch
- ✅ Test marked as failed overall

## 📋 What to Check

### ✅ Screenshot Capture
- [ ] Before screenshot taken for each step
- [ ] After screenshot taken for each step
- [ ] Failure screenshot on errors
- [ ] Screenshots are viewable (click to enlarge)
- [ ] Screenshots show correct page state

### ✅ Expected vs Actual Logging
- [ ] Expected behavior documented
- [ ] Actual behavior captured
- [ ] Comparison shows match/mismatch
- [ ] Clear indicator (✓ Match or ✗ Mismatch)

### ✅ Test Execution
- [ ] All steps execute in order
- [ ] Browser launches correctly
- [ ] Actions perform as expected
- [ ] Test stops on failure (if configured)

### ✅ Reports
- [ ] Summary shows totals (passed/failed)
- [ ] Duration tracked
- [ ] Each step result detailed
- [ ] Error messages clear
- [ ] Report saved to disk

### ✅ Visual Design
- [ ] Results easy to read
- [ ] Screenshots side-by-side
- [ ] Color coding (green=pass, red=fail)
- [ ] Professional appearance

## 📊 Success Criteria

Phase 2 is successful when:
1. ✅ Screenshots captured for all steps
2. ✅ Expected vs Actual logged correctly
3. ✅ Behavior comparison works
4. ✅ Failures identified with clear errors
5. ✅ UI displays results beautifully
6. ✅ Integrates seamlessly with Phase 1

## 🐛 Troubleshooting

**Issue: "Cannot find module 'playwright'"**
```bash
cd phase2
npm install
npx playwright install chromium
```

**Issue: "Browser not found"**
```bash
npx playwright install chromium
```

**Issue: "Screenshots not showing"**
- Check browser console for 404 errors
- Verify artifacts directory exists
- Check file permissions

**Issue: "Test hangs"**
- Selector might be wrong
- Page might not be loading
- Try running in non-headless mode to debug

**Issue: "Expected vs Actual always mismatch"**
- This is expected for some action types
- Verify action is a verification step
- Check comparison logic in executor.js

## 🔗 Integration Test

**Complete Phase 1 + Phase 2 Flow:**

1. **Phase 1** (http://localhost:3001):
   ```
   Test Google search
   
   1. Go to Google
   2. Type "Playwright testing" in search box
   3. Verify results appear
   ```

2. **Phase 1** converts to JSON (copy the output)

3. **Phase 2** (http://localhost:3002):
   - Paste JSON
   - Execute
   - See screenshots and logs

## 📝 Test Results Log

| Test | Steps | Expected | Actual Result | Pass/Fail | Notes |
|------|-------|----------|---------------|-----------|-------|
| Google Search | 2 | Both pass | | | |
| Type & Click | 3 | All pass | | | |
| Intentional Fail | 2 | Step 2 fails | | | |

## ➡️ Next Steps

Once Phase 2 is tested and approved:
1. ✅ Sign off on Phase 2
2. 🚀 Move to Phase 3: AI Web Reader (nanobrowser-style)
3. 🔄 Continue through remaining phases

## 💡 Known Limitations

Current Phase 2 limitations (to be enhanced later):
- Screenshot diff not yet implemented (visual comparison)
- No video recording yet
- Simple text comparison for behavior matching
- No screenshot annotations with highlights

These will be added in Phase 2.1 if needed, or can be integrated in Phase 6.

