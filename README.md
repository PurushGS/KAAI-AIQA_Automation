# AIQA - Intent-Based AI Testing Platform

An AI-driven test automation platform that converts natural language test cases into automated tests for web and mobile applications.

---

**Author:** Purushothama Raju  
**Date:** 12/10/2025  
**Copyright:** © 2025 Purushothama Raju. All rights reserved.

---

## Features

- 🤖 **Natural Language Test Cases**: Write tests in plain English
- 🎯 **Intent-Based Automation**: AI understands and executes your test intentions
- 📸 **Smart Reporting**: Automatic screenshots, videos, and logs on failures
- 🔄 **Retry Logic**: Configurable retry mechanisms for flaky tests
- 📊 **Dashboard**: Simple UI to manage and monitor tests
- 🔒 **Secure**: Automatic sensitive data masking

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Chrome/Chromium browser

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Running AIQA

```bash
# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

### Usage

1. **Create a test case** in `testcases/` folder (see examples)
2. **Upload via dashboard** at http://localhost:3000
3. **View results** in real-time

## Project Structure

```
aiqa/
├── backend/
│   ├── executor/        # Test execution engine
│   ├── llm/            # AI intent parsing
│   └── server.js       # API server
├── frontend/           # Web dashboard
├── testcases/          # Test case files
├── logs/               # Execution logs
├── reports/            # Test reports
└── config.json         # System configuration
```

## Example Test Case

Create `testcases/login_test.txt`:

```
Test login and logout flow

1. Navigate to https://example.com
2. Click on login button
3. Enter username: testuser
4. Enter password: testpass123
5. Click submit
6. Verify dashboard is visible
7. Click logout
8. Verify returned to login page
```

## Development Phases

- ✅ Phase 0: Setup
- 🚧 Phase 1: Core MVP (In Progress)
- ⏳ Phase 2: Web Dashboard
- ⏳ Phase 3: Mobile Support
- ⏳ Phase 4: Reporting & Integrations

## Architecture

AIQA follows a layered architecture:

1. **Input Layer**: Parses natural language test cases
2. **Planner Layer**: Converts intent to structured test plans
3. **Executor Layer**: Runs tests using Playwright
4. **Validation Layer**: Verifies expected outcomes
5. **Reporting Layer**: Generates reports and summaries
6. **Integration Layer**: CI/CD and tool integrations (future)

## Configuration

Edit `config.json` to customize:
- LLM provider and model
- Browser settings
- Timeout and retry values
- Logging preferences
- Security rules

## Contributing

This is a solo developer project. For questions or suggestions, please open an issue.

## License

MIT

