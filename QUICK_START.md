# AIQA Quick Start Guide

## 🚀 Get Running in 3 Commands

```bash
# 1. Setup AIQA (interactive wizard)
node setup.js

# 2. Install dependencies
npm install

# 3. Install browser
npx playwright install chromium
```

## ✅ What You Just Built

AIQA is now fully operational! Here's what's included:

### Core Features
- ✅ AI-powered test parsing (OpenAI GPT / Anthropic Claude)
- ✅ Browser automation with Playwright
- ✅ Web dashboard for test management
- ✅ Real-time log streaming
- ✅ Automatic screenshot capture on failures
- ✅ Beautiful HTML reports
- ✅ CLI for command-line testing
- ✅ Complete API server

### Project Structure Created

```
✅ backend/
   ✅ executor/          - Playwright test runner + CLI
   ✅ llm/              - AI intent parser + test planner
   ✅ reporting/        - HTML/JSON report generator
   ✅ utils/            - Helper functions
   ✅ server.js         - Express API server

✅ frontend/
   ✅ index.html        - Beautiful web dashboard

✅ testcases/          - Example test cases
✅ Documentation       - README, GETTING_STARTED, ARCHITECTURE
✅ Configuration       - config.json, package.json
✅ Setup wizard        - setup.js
```

## 🎯 Run Your First Test (2 ways)

### Option 1: Web Dashboard (Recommended)

```bash
# Start server
npm start

# Open browser
open http://localhost:3000

# Try the example in the UI:
# "Navigate to https://example.com
#  Verify page title contains Example"
```

### Option 2: Command Line

```bash
# Run example test
node backend/executor/runner.js testcases/example_login.txt

# Or run with direct intent
node backend/executor/runner.js --intent "Navigate to google.com and verify title"
```

## 📋 What Happens When You Run a Test

```
1️⃣  AI reads your natural language test
2️⃣  Converts it to structured steps
3️⃣  Opens browser automatically
4️⃣  Executes each step
5️⃣  Captures screenshots on failure
6️⃣  Generates beautiful HTML report
7️⃣  Shows results in dashboard
```

## 🔑 Before First Run

**IMPORTANT:** You need an API key!

1. **Get an OpenAI API key**: https://platform.openai.com/api-keys
   - OR Anthropic key: https://console.anthropic.com/settings/keys

2. **Run setup wizard**:
   ```bash
   node setup.js
   ```

3. **Enter your API key** when prompted

## 📖 Quick Reference

### Start Server
```bash
npm start
```

### Run Test from File
```bash
node backend/executor/runner.js testcases/example_login.txt
```

### Run Test from Intent
```bash
node backend/executor/runner.js --intent "Your test description here"
```

### View Reports
Reports are saved in `./reports/` as HTML files. Open them in any browser.

### View Logs
```bash
# Latest test results
cat logs/latest_results.json

# All logs
ls logs/
```

## 🎨 Write Your First Custom Test

Create `testcases/my_test.txt`:

```
Test my website homepage

Steps:
1. Navigate to https://mywebsite.com
2. Verify page title contains "Welcome"
3. Click the "Learn More" button
4. Verify URL changed to /about
5. Verify "About Us" heading is visible
```

Run it:
```bash
node backend/executor/runner.js testcases/my_test.txt
```

## 🔧 Configuration

Edit `config.json` to customize:
- Browser type (chromium, firefox, webkit)
- Timeouts and retries
- Screenshot/video settings
- LLM model and parameters

## 📊 Understanding Results

After each test:
- ✅ **Passed** - All steps executed successfully
- ❌ **Failed** - One or more steps failed
- ⚠️ **Partial** - Some optional steps skipped

Results include:
- Step-by-step breakdown
- Execution time for each step
- Screenshots of failures
- Detailed error messages
- Full HTML report with styling

## 🐛 Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### "API key not found" error
```bash
node setup.js
```

### "Browser not found" error
```bash
npx playwright install chromium
```

### Test fails immediately
- Check internet connection
- Verify the URL is accessible
- Look at error message in console
- Set `headless: false` in config.json to watch

### LLM returns unclear steps
- Be more specific in test description
- Include exact URLs
- Mention specific button/field names
- Break complex tests into smaller ones

## 📚 Next Steps

1. **Read GETTING_STARTED.md** - Comprehensive guide
2. **Read ARCHITECTURE.md** - Understand the system
3. **Write real tests** - For your actual application
4. **Customize config** - Adjust to your needs
5. **Integrate CI/CD** - (Future phase)

## 🎓 Learning the Codebase

Every module has an `.explain()` method:

```javascript
// In Node REPL or script
import IntentParser from './backend/llm/intentParser.js';
const parser = new IntentParser(config);
parser.explain(); // Prints explanation of how it works
```

All code is:
- ✅ Fully commented
- ✅ Human-readable
- ✅ Modular and simple
- ✅ No hidden logic

## 🌟 Key Principles

1. **No Hallucinations** - AI asks for clarification when uncertain
2. **Full Transparency** - All AI interactions logged
3. **Human Control** - You understand and control everything
4. **Simplicity** - Easy to maintain and extend
5. **Modularity** - Each component is independent

## 🔒 Security Notes

- API keys stored in `.env` (never committed)
- Sensitive data automatically masked in logs
- Files stored locally by default
- No data sent to external services except LLM API

## 💡 Pro Tips

### Tip 1: Watch Tests Run
Set `headless: false` in config.json to see browser actions

### Tip 2: Specific Selectors
For better reliability, use CSS selectors:
```
Click button with id "submit-btn"
Type "hello" in input[name="email"]
```

### Tip 3: Add Waits
For dynamic content:
```
Click "Load Data" button
Wait for loading spinner to disappear
Verify data is visible
```

### Tip 4: Multiple Environments
Create config.dev.json and config.prod.json for different settings

## 📞 Need Help?

- Check `logs/` for detailed error messages
- Review `logs/ai_interactions/` to see what AI understood
- Read the comprehensive docs in GETTING_STARTED.md
- Look at example tests in `testcases/`

## ✨ What Makes AIQA Special

- **Intent-Based**: Write tests in natural language
- **AI-Powered**: Understands what you mean
- **Transparent**: See exactly what AI is doing
- **Beginner-Friendly**: No complex syntax to learn
- **Solo-Maintainable**: One person can manage it all
- **Production-Ready**: Real browser automation with Playwright

---

**You're ready to start testing! 🎉**

Run `npm start` and visit http://localhost:3000

Happy Testing! 🚀

