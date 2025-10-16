# Getting Started with AIQA

This guide will help you set up and run AIQA in minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Chrome or Chromium** browser installed
- **OpenAI API key** (or Anthropic API key for Claude)
  - Get OpenAI key: https://platform.openai.com/api-keys
  - Get Anthropic key: https://console.anthropic.com/settings/keys

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run Setup Wizard

```bash
node setup.js
```

The wizard will:
- Prompt you to choose your LLM provider (OpenAI or Anthropic)
- Ask for your API key
- Configure server settings
- Create necessary directories

### Step 3: Install Playwright Browsers

```bash
npx playwright install chromium
```

This downloads the Chromium browser that Playwright will use for testing.

### Step 4: Verify Installation

Check that everything is set up correctly:

```bash
# Check Node.js version
node --version  # Should be 18 or higher

# Check if .env file exists
cat .env  # Should show your configuration

# Check Playwright installation
npx playwright --version
```

## Running Your First Test

### Option 1: Using the Web Dashboard

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Write a test:**
   In the "Write Test Intent" section, enter:
   ```
   Navigate to https://example.com
   Verify page title contains "Example"
   ```

4. **Click "Run Test"**

5. **Watch the magic happen!**
   - AI parses your intent
   - Browser opens and executes the test
   - Results appear in the dashboard
   - Full HTML report is generated

### Option 2: Using Example Test Cases

AIQA comes with example test cases you can run immediately:

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open the dashboard at** `http://localhost:3000`

3. **Upload a test file:**
   - Click "Choose File"
   - Select `testcases/example_login.txt`
   - Click "Upload File"
   - Click "Yes" to run it immediately

### Option 3: Using the CLI

Run tests directly from the command line:

```bash
# Run from a file
node backend/executor/runner.js testcases/example_login.txt

# Run from direct intent
node backend/executor/runner.js --intent "Navigate to google.com and verify title"
```

## Understanding the Workflow

AIQA follows a clear 4-step process:

```
┌─────────────────┐
│ 1. Parse Intent │  AI reads your natural language test
└────────┬────────┘
         │
┌────────▼────────┐
│ 2. Plan Test    │  Converts to structured steps with metadata
└────────┬────────┘
         │
┌────────▼────────┐
│ 3. Execute Test │  Playwright runs the browser automation
└────────┬────────┘
         │
┌────────▼────────┐
│ 4. Report       │  Generates HTML/JSON reports with screenshots
└─────────────────┘
```

## Writing Test Cases

AIQA accepts natural language test cases. Here's a template:

```
[Test Description]

Steps:
1. Navigate to [URL]
2. Click on [element description]
3. Type "[text]" in [field description]
4. Verify [expected outcome]

Expected Outcome:
- [What should happen]
```

### Example: Login Test

```
Test user login functionality

Steps:
1. Navigate to https://yourapp.com/login
2. Enter "testuser@example.com" in the email field
3. Enter "password123" in the password field
4. Click the login button
5. Verify dashboard is visible
6. Verify "Welcome" message appears

Expected Outcome:
- User successfully logs in
- Dashboard loads within 3 seconds
```

## Tips for Better Tests

### 1. Be Specific About Elements

❌ Bad:
```
Click the button
```

✅ Good:
```
Click the "Submit" button
Click the button with id "submit-btn"
Click the blue button at the top right
```

### 2. Include Verification Steps

Always verify that actions worked:

```
1. Click login button
2. Verify URL changed to /dashboard  ← Verification
3. Verify user name appears in header  ← Verification
```

### 3. Add Waits When Needed

For slow-loading elements:

```
1. Click "Load Data" button
2. Wait for loading spinner to disappear
3. Verify data table is visible
```

### 4. Test One Flow at a Time

Keep tests focused on a single user flow:

- ✅ "Test login flow"
- ✅ "Test search functionality"
- ✅ "Test checkout process"
- ❌ "Test entire application" (too broad)

## Viewing Results

### In the Dashboard

After test execution, the dashboard shows:
- ✅ Overall pass/fail status
- 📊 Step-by-step results
- ⏱️ Execution duration
- 📸 Failure screenshots (if any)
- 🔗 Link to full HTML report

### HTML Reports

Find detailed reports in `./reports/`:
- Beautiful, styled HTML pages
- Step-by-step breakdown
- Screenshots embedded
- Shareable with team

### JSON Reports

For programmatic access, check `./logs/`:
- `results_[testId].json` - Full test results
- `latest_results.json` - Most recent test
- Machine-readable format for CI/CD integration

## Troubleshooting

### "API key not found" error

**Solution:** Make sure you ran `node setup.js` and entered a valid API key.

### "Browser not installed" error

**Solution:** Run `npx playwright install chromium`

### Test fails immediately

**Solution:** 
1. Check your internet connection
2. Verify the URL is accessible
3. Look at the error message in logs
4. Try with headless: false in config.json to see what's happening

### "Cannot find module" errors

**Solution:** Run `npm install` again to ensure all dependencies are installed.

### LLM returns unclear steps

**Solution:**
1. Be more specific in your test description
2. Include URLs and specific element identifiers
3. Break complex tests into smaller ones

## Next Steps

Now that you're set up:

1. ✍️ **Write your own test cases** - Create files in `testcases/`
2. 🎨 **Customize configuration** - Edit `config.json` to adjust timeouts, retries, etc.
3. 📖 **Read the full documentation** - Check `README.md` for advanced features
4. 🔧 **Explore the code** - All code is commented and human-readable

## Need Help?

- 📚 Check the main README.md
- 🐛 Look at error logs in `./logs/`
- 💡 Review example test cases in `./testcases/`
- 🤔 Use the `.explain()` methods in code to understand how things work

## Common Use Cases

### Testing a Live Website

```
Navigate to https://example.com
Verify page loads successfully
Click "Products" link
Verify products page appears
```

### Form Submission

```
Navigate to https://example.com/contact
Enter "John Doe" in name field
Enter "john@example.com" in email field
Enter "Hello!" in message field
Click submit button
Verify success message appears
```

### Navigation Testing

```
Navigate to https://example.com
Click "About" in navigation
Verify URL contains "/about"
Click "Contact" in navigation
Verify URL contains "/contact"
```

---

**You're all set! Start testing with AI! 🚀**

