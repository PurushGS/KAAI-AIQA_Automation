# Phase 4: Learning System

## 🎯 Goal
Enable AIQA to learn from mistakes, user feedback, and test execution patterns to continuously improve test accuracy and reliability.

## What This Phase Does
1. **Collect User Feedback**: After each test run, ask what went right/wrong
2. **Analyze Errors**: Parse failure logs and identify patterns
3. **Build Knowledge Base**: Store learnings in structured format
4. **Pattern Recognition**: Identify recurring issues
5. **ML-Based Improvements**: Use machine learning to improve test generation
6. **Feedback Loop**: Apply learnings to future tests

## Why This Is Important
Tests that fail teach us:
- Which selectors are unreliable
- What descriptions work best
- Common failure patterns
- Page-specific quirks
- Better test strategies

**Phase 4 learns from every failure to prevent future ones.**

## Features
- ✅ User feedback collection UI
- ✅ Error log analysis
- ✅ Pattern detection algorithms
- ✅ Knowledge base storage
- ✅ Feedback-driven improvements
- ✅ Learning metrics & insights
- ✅ Auto-suggestions for fixes

## Architecture

```
Test Execution (Phase 2)
         ↓
    Pass or Fail?
         ↓
┌────────────────────────────────────┐
│  Phase 4: Collect Feedback         │
│  - What went right?                │
│  - What went wrong?                │
│  - User ratings                    │
└──────────────┬─────────────────────┘
               ↓
┌────────────────────────────────────┐
│  Analyze & Learn                   │
│  - Parse error logs                │
│  - Identify patterns               │
│  - Correlate with feedback         │
└──────────────┬─────────────────────┘
               ↓
┌────────────────────────────────────┐
│  Store Knowledge                   │
│  - Failed selectors                │
│  - Successful patterns             │
│  - User preferences                │
└──────────────┬─────────────────────┘
               ↓
┌────────────────────────────────────┐
│  Apply Learnings                   │
│  - Suggest better selectors        │
│  - Improve descriptions            │
│  - Update test steps               │
└────────────────────────────────────┘
```

## Learning Categories

### 1. Selector Reliability
- Which selectors fail most?
- Which are most stable?
- Best selector strategies per site

### 2. Description Effectiveness
- Which descriptions find elements?
- Common description patterns
- Site-specific terminology

### 3. Error Patterns
- Common failure types
- Network issues
- Timing problems
- Element not found reasons

### 4. User Preferences
- Preferred element descriptions
- Acceptable wait times
- Test structure preferences

## Integration

### Phase 1 → Phase 4:
Learn which natural language descriptions work best

### Phase 2 → Phase 4:
Learn from execution failures and errors

### Phase 3 → Phase 4:
Learn which element finding strategies succeed

### Phase 4 → All Phases:
Provide recommendations back to improve future tests

## Testing
```bash
cd phase4
node server.js
```
Open: http://localhost:3004

## Dependencies
- Previous phases (1, 2, 3)
- ML libraries for pattern recognition
- Database for knowledge storage

## Next Phase
After Phase 4 → Phase 5: Self-Improving Code

