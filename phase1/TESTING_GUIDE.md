# Phase 1 Testing Guide

## ✅ What We're Testing

**Natural Language → Test Steps Conversion**
- AI understands test descriptions
- Generates machine-readable steps
- Allows editing/adding/deleting steps
- Validates step structure

## 🚀 How to Test

### Step 1: Configure API Key

Make sure you have `.env` in the parent directory (`/AIQA/.env`) with:
```
OPENAI_API_KEY=your_actual_key_here
```

### Step 2: Start the Server

```bash
cd /Users/purush/AIQA/phase1
npm start
```

### Step 3: Open the Test UI

Open your browser to: **http://localhost:3001**

### Step 4: Test the Conversion

**Test 1: Simple Login Flow**
```
Test login functionality

1. Navigate to https://example.com/login
2. Enter email: user@example.com
3. Enter password: password123
4. Click submit button
5. Verify dashboard appears
```

**Test 2: Search Flow**
```
Test search feature

1. Go to homepage
2. Type "laptop" in search box  
3. Click search
4. Verify results displayed
5. Verify at least 5 products shown
```

**Test 3: Complex Flow**
```
Test checkout process

1. Navigate to product page
2. Click "Add to Cart"
3. Go to cart
4. Update quantity to 2
5. Click checkout
6. Enter shipping address
7. Select payment method
8. Confirm order
9. Verify order confirmation page
10. Verify email received
```

## 🧪 What to Verify

### ✅ Conversion Quality
- [ ] All steps are captured
- [ ] Action types are correct (navigate, click, type, verify, wait)
- [ ] Targets are identified (URLs, selectors, elements)
- [ ] Data is extracted (input values)
- [ ] Assertions are clear (what to verify)

### ✅ Editing Works
- [ ] Can edit step descriptions
- [ ] Can delete steps
- [ ] Step numbers update automatically
- [ ] JSON updates in real-time

### ✅ Validation Works
- [ ] Invalid action types are rejected
- [ ] Missing required fields are caught
- [ ] Clear error messages displayed

## 📊 Success Criteria

Phase 1 is successful if:
1. ✅ AI correctly parses 90%+ of test descriptions
2. ✅ All 5 action types work (navigate, click, type, verify, wait)
3. ✅ Steps can be edited without errors
4. ✅ Output JSON is valid and structured
5. ✅ Ready to feed into Phase 2 (execution engine)

## 🐛 Common Issues

**Issue: "Invalid API key"**
- Check `.env` file exists in parent directory
- Verify API key is valid on OpenAI platform
- Make sure no quotes around the key

**Issue: "AI returns unexpected format"**
- This is a prompt engineering issue
- Check logs in terminal for raw AI response
- May need to adjust prompt in converter.js

**Issue: "Step validation fails"**
- Check that all required fields are present
- Verify action type is supported
- Look at terminal for specific validation error

## 📝 Test Results Log

Document your testing here:

| Test Case | Input | Expected Output | Actual Output | Pass/Fail | Notes |
|-----------|-------|-----------------|---------------|-----------|-------|
| Simple Login | "Test login..." | 5 steps with navigate, type, click, verify | | | |
| Search Flow | "Test search..." | Steps capture search process | | | |
| Complex Checkout | "Test checkout..." | 10+ steps properly structured | | | |

## ➡️ Next Steps

Once Phase 1 is stable and tested:
1. Mark Phase 1 as complete
2. Document any limitations/edge cases
3. Move to Phase 2: Screenshot & Logs System

