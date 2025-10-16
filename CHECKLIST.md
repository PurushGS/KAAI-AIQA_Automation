# ✅ AIQA Setup & Usage Checklist

## 📋 Initial Setup (Do Once)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Chrome/Chromium browser installed
- [ ] OpenAI API key OR Anthropic API key obtained

### Installation Steps

```bash
# Step 1: Run setup wizard
node setup.js
```
- [ ] Choose LLM provider (OpenAI or Anthropic)
- [ ] Enter API key
- [ ] Set server port (default: 3000)
- [ ] Confirm setup complete

```bash
# Step 2: Install dependencies
npm install
```
- [ ] Wait for installation to complete
- [ ] No errors in console

```bash
# Step 3: Install Playwright browsers
npx playwright install chromium
```
- [ ] Browser downloaded successfully
- [ ] Installation complete

### Verify Installation

- [ ] `.env` file exists with your API key
- [ ] `node_modules/` directory created
- [ ] No error messages during installation

---

## 🚀 Running Your First Test

### Option 1: Web Dashboard (Recommended)

```bash
# Start the server
npm start
```

- [ ] Server starts without errors
- [ ] See "Server running on http://localhost:3000" message
- [ ] Open http://localhost:3000 in browser
- [ ] Dashboard loads successfully

**In the Dashboard:**
- [ ] Write a simple test in the "Write Intent" section:
  ```
  Navigate to https://example.com
  Verify page title contains "Example"
  ```
- [ ] Click "Run Test"
- [ ] Watch live logs appear
- [ ] See test results display
- [ ] Test passes successfully

### Option 2: CLI Runner

```bash
# Run example test
node backend/executor/runner.js testcases/example_login.txt
```

- [ ] Test starts automatically
- [ ] Browser opens (if headless: false)
- [ ] Steps execute one by one
- [ ] Test completes
- [ ] Report generated
- [ ] HTML report path displayed

---

## 📝 Understanding the Output

### After Test Execution, Check:

**Console Output:**
- [ ] See parsed steps
- [ ] See test plan generation
- [ ] See browser launching
- [ ] See each step execution
- [ ] See final results summary

**Generated Files:**
- [ ] `logs/latest_results.json` exists
- [ ] `logs/results_[testId].json` exists
- [ ] `reports/report_[testId].html` exists
- [ ] `plans/testplan_[testId].json` exists

**Open HTML Report:**
- [ ] Beautiful styled report opens
- [ ] Shows test name and status
- [ ] Shows all steps with pass/fail
- [ ] Shows execution time
- [ ] Includes any failure screenshots

---

## 🎯 Creating Your Own Tests

### Test Case Format

Create `testcases/my_test.txt`:

```
[Test Description]

Steps:
1. Navigate to [URL]
2. Click [element]
3. Type "[text]" in [field]
4. Verify [expected result]

Expected Outcome:
- [What should happen]
```

**Checklist for Good Tests:**
- [ ] Has clear description
- [ ] Includes full URL (https://)
- [ ] Specifies element identifiers (ID, class, text)
- [ ] Includes verification steps
- [ ] Has expected outcomes documented

### Running Your Test

**Via Dashboard:**
- [ ] Upload file or paste intent
- [ ] Click "Run Test"
- [ ] Monitor live logs
- [ ] Review results

**Via CLI:**
```bash
node backend/executor/runner.js testcases/my_test.txt
```
- [ ] Test executes
- [ ] Results displayed
- [ ] Report generated

---

## 🔧 Customization Checklist

### Configuration (`config.json`)

**LLM Settings:**
- [ ] Provider set (openai or anthropic)
- [ ] Model specified
- [ ] Temperature adjusted (0.0-1.0)

**Browser Settings:**
- [ ] Browser type chosen (chromium, firefox, webkit)
- [ ] Headless mode set (true/false)
- [ ] Timeout configured (milliseconds)
- [ ] Retries configured (number)

**Features:**
- [ ] Screenshot on failure enabled/disabled
- [ ] Video on failure enabled/disabled
- [ ] AI interaction logging enabled/disabled

**Security:**
- [ ] Sensitive fields list updated if needed
- [ ] Data masking enabled

---

## 🐛 Troubleshooting Checklist

### If Tests Fail:

**Check API Key:**
- [ ] `.env` file exists
- [ ] API key is valid (not placeholder)
- [ ] Correct key for your chosen provider

**Check Dependencies:**
- [ ] Ran `npm install`
- [ ] No error messages during install
- [ ] `node_modules/` exists

**Check Browser:**
- [ ] Ran `npx playwright install chromium`
- [ ] No errors during browser install

**Check Network:**
- [ ] Internet connection working
- [ ] Test URL is accessible
- [ ] No firewall blocking

**Check Test Case:**
- [ ] URL includes https://
- [ ] Element selectors are correct
- [ ] Steps are clear and specific

### If Server Won't Start:

- [ ] Port 3000 not already in use
- [ ] No syntax errors in code
- [ ] `.env` file properly formatted
- [ ] All required dependencies installed

### If LLM Returns Errors:

- [ ] API key is valid
- [ ] API quota not exceeded
- [ ] Internet connection stable
- [ ] Test description is clear

---

## 📊 Monitoring Test Execution

### Real-time Monitoring

**Dashboard (Web):**
- [ ] Live logs streaming
- [ ] Step-by-step updates
- [ ] Status changes visible
- [ ] Results appear automatically

**CLI:**
- [ ] Console logs showing progress
- [ ] Emoji indicators for status
- [ ] Timing information displayed
- [ ] Final summary printed

### After Execution

**Check Logs:**
```bash
cat logs/latest_results.json | grep "status"
```
- [ ] Status is "passed" or "failed"
- [ ] All steps recorded
- [ ] Timing information present

**View Report:**
```bash
open reports/report_[testId].html
```
- [ ] Report opens in browser
- [ ] All information displayed
- [ ] Screenshots embedded (if any)

---

## 🎓 Learning Path Checklist

### Understanding the System

**Read Documentation:**
- [ ] `QUICK_START.md` - Basic usage
- [ ] `GETTING_STARTED.md` - Comprehensive guide
- [ ] `ARCHITECTURE.md` - Technical details
- [ ] `WORKFLOW.md` - Visual flow diagrams

**Explore Code:**
- [ ] `backend/llm/intentParser.js` - How AI parsing works
- [ ] `backend/executor/playwrightRunner.js` - How tests run
- [ ] `backend/reporting/reportGenerator.js` - How reports are made
- [ ] `backend/server.js` - API endpoints

**Try Examples:**
- [ ] Run `example_login.txt`
- [ ] Run `example_search.txt`
- [ ] Modify an example
- [ ] Create your own test

### Advanced Usage

**CLI Features:**
- [ ] Run test from file
- [ ] Run test from direct intent
- [ ] Check exit codes for CI/CD
- [ ] Review generated artifacts

**API Endpoints:**
- [ ] Test `/api/health`
- [ ] Upload file via `/api/upload`
- [ ] Run test via `/api/run-test`
- [ ] Get results via `/api/results/latest`

**Customization:**
- [ ] Modify browser settings
- [ ] Adjust timeouts
- [ ] Configure retries
- [ ] Change report format

---

## 🚀 Production Readiness Checklist

### Before Using in Production:

**Security:**
- [ ] API keys stored securely
- [ ] `.env` not committed to git
- [ ] Sensitive data masking enabled
- [ ] File upload validation active

**Performance:**
- [ ] Timeouts appropriate for your site
- [ ] Retry counts reasonable
- [ ] Browser headless for CI/CD
- [ ] Screenshot only on failure

**Monitoring:**
- [ ] Log rotation configured
- [ ] Disk space monitored
- [ ] Error alerts set up
- [ ] Report archival planned

**Testing:**
- [ ] Test cases validated
- [ ] Known URLs accessible
- [ ] Selectors confirmed working
- [ ] Expected outcomes defined

---

## 📈 Next Steps

### Immediate (This Week):
- [ ] Run setup and first test
- [ ] Create 3-5 test cases for your app
- [ ] Review all generated reports
- [ ] Customize configuration

### Short-term (This Month):
- [ ] Build test suite for critical flows
- [ ] Set up scheduled test runs
- [ ] Share reports with team
- [ ] Document custom tests

### Long-term (This Quarter):
- [ ] Integrate with CI/CD
- [ ] Add Jira integration (if needed)
- [ ] Set up Slack notifications (if needed)
- [ ] Explore mobile testing (Phase 3)

---

## ✅ Success Criteria

You'll know everything is working when:

- [ ] Tests run without errors
- [ ] Browser opens and performs actions
- [ ] Test results are accurate
- [ ] Reports are generated successfully
- [ ] You can explain how each component works
- [ ] You can create new tests easily
- [ ] Team can use the system independently

---

## 🎉 You're Ready!

Once all checkboxes above are complete, you have:
- ✅ Fully functional AIQA platform
- ✅ Understanding of how it works
- ✅ Ability to create and run tests
- ✅ Production-ready test automation

**Start testing with confidence! 🚀**

---

## 📞 Quick Reference

**Start Server:**
```bash
npm start
```

**Run Test (CLI):**
```bash
node backend/executor/runner.js testcases/[filename]
```

**View Logs:**
```bash
cat logs/latest_results.json
```

**View Reports:**
```bash
open reports/report_*.html
```

**Get Help:**
- README.md - Overview
- QUICK_START.md - Fast setup
- GETTING_STARTED.md - Full guide
- ARCHITECTURE.md - Technical deep dive

