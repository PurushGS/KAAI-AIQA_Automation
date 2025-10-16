# ✨ Natural Language Input & 🎯 Assertions Feature

## 🎉 New Features Added

### 1. Natural Language Test Creation
Write test cases in plain English instead of JSON! The system automatically converts your natural language descriptions into structured test steps.

### 2. Assertions System
Add validation checkpoints to verify expected behavior with 8 different assertion types.

---

## 🚀 Access

**URL:** http://localhost:3007  
**Navigate to:** 📁 Test Suites → Click ➕ on a suite → Add Test

---

## ✨ Feature 1: Natural Language Test Creation

### How It Works

1. **Write in Natural Language** - Describe your test in plain English
2. **Click Convert** - AI converts it to structured test steps
3. **Review & Edit** - Verify the steps (edit JSON if needed)
4. **Save** - Test is ready to run!

### Input Modes

The test creation modal now has **two input modes**:

#### Mode 1: ✨ Natural Language (Default)
- Write test steps in plain English
- Click "🔄 Convert to Test Steps"
- Review and edit converted steps
- Perfect for non-technical users

#### Mode 2: 📝 JSON Format
- Direct JSON input (traditional method)
- For advanced users who prefer manual control
- Allows precise step definition

---

## 📝 Writing Natural Language Tests

### Examples

#### Example 1: Simple Login Test

**Natural Language Input:**
```
Go to https://app.example.com
Click on the login button
Enter email user@example.com
Enter password mypassword123
Click submit button
Verify that the welcome message is visible
```

**Converts To:**
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://app.example.com",
    "description": "Go to https://app.example.com"
  },
  {
    "stepNumber": 2,
    "action": "click",
    "target": "button:has-text('login')",
    "description": "Click on the login button"
  },
  {
    "stepNumber": 3,
    "action": "type",
    "target": "input[type='email']",
    "data": "user@example.com",
    "description": "Enter email user@example.com"
  },
  {
    "stepNumber": 4,
    "action": "type",
    "target": "input[type='password']",
    "data": "mypassword123",
    "description": "Enter password mypassword123"
  },
  {
    "stepNumber": 5,
    "action": "click",
    "target": "button[type='submit']",
    "description": "Click submit button"
  },
  {
    "stepNumber": 6,
    "action": "verify",
    "target": ".welcome-message",
    "expected": "element visible",
    "description": "Verify that the welcome message is visible"
  }
]
```

#### Example 2: E-commerce Checkout

**Natural Language Input:**
```
Navigate to https://shop.example.com
Search for "laptop" in the search box
Click on the first product result
Click add to cart button
Go to cart
Click proceed to checkout
Fill in shipping address
Select credit card payment method
Enter card number 4111111111111111
Click place order button
Verify order confirmation appears
```

**Converts To:** Complete JSON with all steps structured and ready to execute

#### Example 3: Form Validation

**Natural Language Input:**
```
Open https://forms.example.com/contact
Enter name "John Doe"
Enter invalid email "notanemail"
Click submit
Verify error message shows "Please enter a valid email"
Enter valid email "john@example.com"
Click submit
Verify success message is displayed
```

---

## 🎯 Feature 2: Assertions System

### What Are Assertions?

Assertions are **validation checkpoints** that verify expected behavior during test execution. They ensure your tests validate the correct state of the application.

### 8 Assertion Types

#### 1. **Element is Visible** ✅
Verifies that an element is visible on the page.

**Example:**
- **Type:** Element is Visible
- **Target:** `.welcome-message`
- **Expected:** (not needed)
- **Description:** "Verify login success message is shown"

#### 2. **Element is Hidden** 🔒
Verifies that an element is not visible or doesn't exist.

**Example:**
- **Type:** Element is Hidden
- **Target:** `.loading-spinner`
- **Expected:** (not needed)
- **Description:** "Verify loading indicator is gone"

#### 3. **Text Equals** 📝
Verifies that an element's text content exactly matches expected value.

**Example:**
- **Type:** Text Equals
- **Target:** `h1.page-title`
- **Expected:** "Dashboard"
- **Description:** "Verify page title is Dashboard"

#### 4. **Text Contains** 📄
Verifies that an element's text contains a specific substring.

**Example:**
- **Type:** Text Contains
- **Target:** `.notification`
- **Expected:** "successfully"
- **Description:** "Verify success notification appears"

#### 5. **URL Equals** 🌐
Verifies that the current URL exactly matches expected value.

**Example:**
- **Type:** URL Equals
- **Target:** `https://app.example.com/dashboard`
- **Expected:** (not needed)
- **Description:** "Verify redirected to dashboard"

#### 6. **URL Contains** 🔗
Verifies that the current URL contains a specific substring.

**Example:**
- **Type:** URL Contains
- **Target:** `/success`
- **Expected:** (not needed)
- **Description:** "Verify success page URL"

#### 7. **Element Count** 🔢
Verifies the number of elements matching a selector.

**Example:**
- **Type:** Element Count
- **Target:** `.product-item`
- **Expected:** `10`
- **Description:** "Verify 10 products are displayed"

#### 8. **Attribute Equals** 🏷️
Verifies that an element's attribute has a specific value.

**Example:**
- **Type:** Attribute Equals
- **Target:** `input#email::value` (format: selector::attribute)
- **Expected:** "user@example.com"
- **Description:** "Verify email field has correct value"

---

## 🎨 How to Use in UI

### Step-by-Step Guide

#### 1. Create a Test Suite
```
1. Open http://localhost:3007
2. Click "📁 Test Suites" tab
3. Click "➕ New Suite"
4. Enter suite name and save
```

#### 2. Add a Test with Natural Language
```
1. Click "➕" on the suite card
2. Enter test name (e.g., "Valid Login Test")
3. Enter description (optional)
4. Ensure "✨ Natural Language" mode is selected
5. Write your test in plain English
6. Click "🔄 Convert to Test Steps"
7. Review converted steps
8. Edit JSON if needed
```

#### 3. Add Assertions
```
1. Scroll to "🎯 Assertions" section
2. Click "➕ Add Assertion"
3. Select assertion type (e.g., "Element is Visible")
4. Enter target selector (e.g., ".welcome-message")
5. Enter expected value if needed
6. Add description (optional)
7. Repeat for multiple assertions
8. Click "Save Test"
```

#### 4. Run the Test
```
1. Click "▶️" next to the test name
2. Test executes with all steps and assertions
3. View detailed results with assertion status
```

---

## 📊 Assertion Results

### During Execution

When assertions run, you'll see:
- ✅ **Passed Assertions** - Green checkmark, validation successful
- ❌ **Failed Assertions** - Red X, shows expected vs actual
- **Detailed Error Messages** - Clear explanation of what went wrong

### In Reports

Test reports now include:
- **Assertion Summary**: Passed/Failed/Total
- **Pass Rate**: Percentage of assertions that passed
- **Detailed Results**: For each assertion:
  - Type
  - Target
  - Expected value
  - Actual value (if failed)
  - Error message (if failed)

---

## 🌟 Real-World Examples

### Example 1: Login Flow with Assertions

**Natural Language:**
```
Go to https://app.example.com/login
Enter email test@example.com
Enter password TestPass123
Click login button
Wait 2 seconds
```

**Assertions:**
1. **URL Contains** → `/dashboard` → "Verify redirected to dashboard"
2. **Element is Visible** → `.user-menu` → "Verify user menu appears"
3. **Text Contains** → `.username` → "test@example.com" → "Verify correct user logged in"
4. **Element is Hidden** → `.login-form` → "Verify login form is gone"

### Example 2: E-commerce Cart

**Natural Language:**
```
Navigate to https://shop.example.com
Click on first product
Click add to cart
Go to cart page
```

**Assertions:**
1. **Element Count** → `.cart-item` → `1` → "Verify 1 item in cart"
2. **Text Contains** → `.cart-total` → "99.99" → "Verify correct price"
3. **Element is Visible** → `.checkout-button` → "Verify checkout button visible"
4. **Attribute Equals** → `input.quantity::value` → `1` → "Verify quantity is 1"

### Example 3: Form Validation

**Natural Language:**
```
Open https://forms.example.com/signup
Enter name John Doe
Enter email invalid-email
Click submit
```

**Assertions:**
1. **Element is Visible** → `.error-email` → "Verify email error appears"
2. **Text Equals** → `.error-email` → "Please enter a valid email" → "Verify error message"
3. **Attribute Equals** → `input#email::class` → "error" → "Verify error class applied"
4. **Element is Hidden** → `.success-message` → "Verify no success message"

---

## 🎯 Best Practices

### Natural Language Writing

1. **Be Specific**
   - ✅ "Click the red submit button"
   - ❌ "Click button"

2. **One Action Per Line**
   - ✅ Each line = one step
   - ❌ Multiple actions in one line

3. **Use Clear Descriptions**
   - ✅ "Enter email john@example.com in the email field"
   - ❌ "Type email"

4. **Include Verification Steps**
   - ✅ "Verify welcome message appears"
   - ❌ Just actions without verification

### Assertion Writing

1. **Use Multiple Assertions**
   - Don't rely on just one validation
   - Check multiple aspects of expected behavior

2. **Be Specific with Selectors**
   - ✅ `.welcome-message.user-greeting`
   - ❌ `div`

3. **Provide Clear Descriptions**
   - Helps identify what failed
   - Useful for test reports

4. **Choose the Right Type**
   - Use "Text Equals" for exact matches
   - Use "Text Contains" for partial matches
   - Use "Element Count" for lists

---

## 🚀 Advanced Features

### Editing Converted Steps

After conversion, you can:
- Edit the JSON directly
- Add or remove steps
- Modify selectors
- Adjust timing/waits
- Fine-tune data values

### Switching Between Modes

- Start in Natural Language mode
- Convert to steps
- Switch to JSON mode to fine-tune
- Switch back to Natural Language for new tests

### Combining Steps and Assertions

- Test steps = **Actions to perform**
- Assertions = **Validations to check**
- Both execute in sequence
- Steps run first, then assertions

---

## 📈 Benefits

### Natural Language Input

✅ **Accessible** - No coding knowledge required  
✅ **Fast** - Write tests in seconds  
✅ **Intuitive** - Plain English descriptions  
✅ **AI-Powered** - Smart conversion with GPT-4  
✅ **Editable** - Review and modify generated steps  
✅ **Time-Saving** - No JSON syntax to learn  

### Assertions System

✅ **Reliable** - Explicit validation of expected behavior  
✅ **Comprehensive** - 8 different assertion types  
✅ **Flexible** - Multiple assertions per test  
✅ **Detailed** - Clear expected vs actual reporting  
✅ **Fail-Fast** - Catch issues immediately  
✅ **Test Quality** - Ensures tests verify correct behavior  

---

## 🔧 Technical Details

### Architecture

```
User Input (Natural Language)
        ↓
    Phase 1 API
  (LLM Conversion)
        ↓
   Test Steps (JSON)
        ↓
User Review & Edit
        ↓
     Save Test
        ↓
   Execute Test
        ↓
  Run Test Steps
        ↓
Execute Assertions
        ↓
  Generate Report
(Steps + Assertions)
```

### API Endpoints

**Convert Natural Language:**
```
POST /api/phase1/convert
Body: { "naturalLanguage": "Go to..." }
Response: { "success": true, "steps": [...] }
```

**Execute with Assertions:**
```
POST /api/phase2/execute
Body: { 
  "steps": [...],
  "assertions": [...]
}
Response: { 
  "success": true,
  "report": {
    "steps": [...],
    "assertions": {
      "passed": [...],
      "failed": [...],
      "total": 5,
      "passRate": 100
    }
  }
}
```

### Data Structures

**Assertion Object:**
```javascript
{
  "id": "assertion_1234567890",
  "type": "element_visible",
  "target": ".welcome-message",
  "expected": "",
  "description": "Verify welcome message appears"
}
```

**Assertion Result:**
```javascript
{
  "assertion": {...},
  "passed": true,
  "actualValue": true,
  "expectedValue": true,
  "error": null
}
```

---

## 🎓 Tutorial

### Complete Example: User Registration

#### 1. Natural Language Input
```
Navigate to https://app.example.com/register
Enter name John Doe in the name field
Enter email john@example.com in the email field
Enter password SecurePass123 in the password field
Enter password SecurePass123 in the confirm password field
Check the terms and conditions checkbox
Click the register button
Wait for 3 seconds
```

#### 2. Add Assertions
```
Assertion 1:
  Type: URL Contains
  Target: /welcome
  Description: Verify redirected to welcome page

Assertion 2:
  Type: Element is Visible
  Target: .success-message
  Description: Verify success message shown

Assertion 3:
  Type: Text Contains
  Target: .welcome-text
  Expected: John Doe
  Description: Verify user name in welcome message

Assertion 4:
  Type: Element is Hidden
  Target: .register-form
  Description: Verify registration form is gone

Assertion 5:
  Type: Element is Visible
  Target: button.continue
  Description: Verify continue button appears
```

#### 3. Review Converted Steps
```json
[
  {
    "stepNumber": 1,
    "action": "navigate",
    "target": "https://app.example.com/register",
    "description": "Navigate to registration page"
  },
  {
    "stepNumber": 2,
    "action": "type",
    "target": "input[name='name']",
    "data": "John Doe",
    "description": "Enter name"
  },
  // ... more steps
]
```

#### 4. Execute
```
1. Click "▶️ Run" on the test
2. Watch execution progress
3. View detailed results
```

#### 5. Review Results
```
Test: User Registration
Status: ✅ PASSED

Steps: 8/8 passed
Assertions: 5/5 passed (100%)

Step Results:
  ✅ Navigate to registration page
  ✅ Enter name
  ✅ Enter email
  ✅ Enter password
  ✅ Enter confirm password
  ✅ Check terms checkbox
  ✅ Click register button
  ✅ Wait for 3 seconds

Assertion Results:
  ✅ URL Contains /welcome
  ✅ Success message is visible
  ✅ Welcome text contains "John Doe"
  ✅ Registration form is hidden
  ✅ Continue button is visible

Duration: 12.5s
```

---

## 🎊 Summary

### What You Can Do Now

1. ✨ **Write Tests in Plain English** - No JSON needed!
2. 🔄 **Auto-Convert to Steps** - AI does the heavy lifting
3. ✏️ **Review & Edit** - Fine-tune if needed
4. 🎯 **Add Assertions** - Validate expected behavior
5. ▶️ **Run Tests** - Execute with full validation
6. 📊 **View Results** - See steps + assertions together

### Key Advantages

- **Faster Test Creation** - 10x faster than manual JSON
- **Lower Barrier to Entry** - Anyone can write tests
- **Better Test Quality** - Assertions ensure validation
- **Comprehensive Reporting** - See what passed and failed
- **AI-Powered** - Smart conversion with GPT-4
- **Flexible** - Switch between NL and JSON anytime

---

## 🚀 Get Started Now!

**Access:** http://localhost:3007  
**Navigate:** 📁 Test Suites → ➕ New Suite → ➕ Add Test  
**Start Writing:** Describe your test in plain English!  

---

**Built with ❤️ for AIQA Platform**

*Natural Language + Assertions = Perfect Test Automation!*

