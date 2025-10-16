# Phase 2: Screenshot & Logs System

## 🎯 Goal
Capture screenshots at each step and log expected vs actual results with detailed comparison.

## What This Phase Does
1. **Screenshots**: Before/after each action + on failures
2. **Expected Logging**: What we expected to happen
3. **Actual Logging**: What actually happened
4. **Diff Engine**: Highlight differences between expected and actual
5. **Visual Comparison**: Side-by-side screenshot comparison
6. **Error Analysis**: Detailed failure information

## Features
- ✅ Screenshot capture at each step
- ✅ Expected vs Actual logging
- ✅ Visual diff highlighting
- ✅ Annotated screenshots with step info
- ✅ Failure analysis with context
- ✅ **Advanced Logging: Network & Console Errors**
- ✅ Network request tracking (4xx, 5xx errors)
- ✅ Console error/warning capture
- ✅ Page crash detection
- ✅ Test UI with live preview

## Integration with Phase 1
Takes Phase 1's structured test steps (JSON) as input and executes them with full logging and screenshot capture.

## Architecture

```
Phase 1 Output (Test Steps)
         ↓
Phase 2 Executor
         ↓
    For Each Step:
    1. Log expected behavior
    2. Take "before" screenshot
    3. Execute action (Playwright)
    4. Take "after" screenshot
    5. Log actual behavior
    6. Compare expected vs actual
    7. Generate diff report
         ↓
Complete Log + Screenshots
```

## Testing
```bash
cd phase2
node server.js
```
Open: http://localhost:3002

## Dependencies
- Playwright (browser automation)
- Pixelmatch (screenshot comparison)
- HTML-differ (content comparison)
- Phase 1 (test step structure)

## Next Phase
After Phase 2 is stable → Phase 3: AI Web Reader

