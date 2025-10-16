# 🚀 New Features Guide - CSV Import, Cloud Integrations & Automated Triggers

**Author:** Purushothama Raju  
**Date:** 12/10/2025  
**Version:** 2.0.0

---

## ✨ Three Major Features Added

### 1. **CSV Test Suite Import**
### 2. **Cloud Integrations (Azure, GitHub, GitLab, AWS, Bitbucket)**
### 3. **Automated Test Triggers (Flexible Automation)**

---

## 📊 Feature 1: CSV Test Suite Import

### **What It Does**
Upload CSV files containing multiple test cases and automatically convert them to executable test suites.

### **CSV Format**

Your CSV should have these columns (any order):

```csv
test_name, test_description, test_steps, url, expected_result
Login Test, Test user login, "1. Navigate to login page\n2. Enter username\n3. Enter password\n4. Click login button", https://example.com/login, User should be logged in
Search Test, Test search functionality, "Navigate to homepage\nType 'product' in search\nClick search button\nVerify results appear", https://example.com, Search results displayed
```

**Supported Formats:**
- Numbered lists: `1. Step one\n2. Step two`
- Line breaks: `Step one\nStep two`  
- Sentences: `Step one. Step two. Step three.`

### **API Endpoint**

```http
POST /api/csv/upload
Content-Type: multipart/form-data

csvFile: <your_file.csv>
```

### **Response**

```json
{
  "success": true,
  "testSuiteId": "suite_1234567890_abc123",
  "testSuiteName": "login_tests",
  "totalTestCases": 5,
  "testCases": [
    {
      "id": "test_1234567890_1_abc12345",
      "name": "Login Test",
      "steps": 4
    }
  ]
}
```

### **How It Works**

1. **Upload CSV** → System parses the file
2. **Extract Test Cases** → Each row becomes a separate test case
3. **Parse Natural Language** → Converts test steps to JSON format
4. **Save Test Suite** → Stores in `test-suites/` folder
5. **Ready to Execute** → Test cases can be run immediately

### **Example: Using cURL**

```bash
curl -X POST http://localhost:3007/api/csv/upload \
  -F "csvFile=@my_tests.csv"
```

---

## ☁️ Feature 2: Cloud Integrations

### **Supported Providers**

| Provider | Features | Webhook Support |
|----------|----------|-----------------|
| **GitHub** | Repos, Actions, Webhooks | ✅ Yes |
| **GitLab** | Repos, CI/CD, Webhooks | ✅ Yes |
| **Azure DevOps** | Repos, Pipelines, Test Plans | ✅ Yes |
| **AWS** | CodeCommit, CodePipeline | ✅ Yes |
| **Bitbucket** | Repos, Pipelines | ✅ Yes |

### **Setup Integration**

#### **GitHub Example**

```http
POST /api/integrations/github
Content-Type: application/json

{
  "name": "My GitHub Integration",
  "token": "ghp_your_personal_access_token",
  "repository": "username/repository",
  "owner": "username",
  "autoTriggerRegression": true,
  "branchFilters": ["main", "develop"],
  "testSuiteIds": ["suite_123", "suite_456"]
}
```

**Response:**
```json
{
  "success": true,
  "provider": "github",
  "name": "My GitHub Integration",
  "webhookUrl": "http://localhost:3007/api/webhooks/github"
}
```

#### **Azure DevOps Example**

```http
POST /api/integrations/azure
Content-Type: application/json

{
  "name": "My Azure Integration",
  "token": "your_personal_access_token",
  "organization": "your-org",
  "project": "your-project",
  "autoTriggerRegression": true,
  "branchFilters": ["main", "master"],
  "testSuiteIds": ["suite_789"]
}
```

#### **AWS Example**

```http
POST /api/integrations/aws
Content-Type: application/json

{
  "name": "My AWS Integration",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1",
  "repository": "my-repo"
}
```

### **Test Connection**

```http
POST /api/integrations/github/test
Content-Type: application/json

{
  "token": "ghp_your_token",
  "repository": "username/repo",
  "owner": "username"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected as username"
}
```

### **List All Integrations**

```http
GET /api/integrations
```

**Response:**
```json
{
  "success": true,
  "integrations": [
    {
      "provider": "github",
      "name": "GitHub",
      "isConfigured": true,
      "enabled": true,
      "autoTriggerRegression": true,
      "webhookUrl": "http://localhost:3007/api/webhooks/github"
    },
    {
      "provider": "azure",
      "name": "Azure DevOps",
      "isConfigured": false
    }
  ]
}
```

### **Configure Webhooks**

#### **GitHub Webhook Setup:**

1. Go to your repo → Settings → Webhooks → Add webhook
2. **Payload URL:** `https://your-domain.com/api/webhooks/github`
3. **Content type:** application/json
4. **Events:** Just the push event
5. **Active:** ✅ Checked

#### **Azure DevOps Service Hook:**

1. Project Settings → Service hooks → Create subscription
2. Select: Web Hooks
3. **Trigger:** Code pushed
4. **URL:** `https://your-domain.com/api/webhooks/azure`
5. **Resource:** Git push

#### **GitLab Webhook:**

1. Settings → Webhooks
2. **URL:** `https://your-domain.com/api/webhooks/gitlab`
3. **Trigger:** Push events
4. **Secret token:** (optional)

---

## 🎯 Feature 3: Automated Test Triggers

### **What It Does**

Configure **ANY test suite** to run automatically based on various triggers:
- Code push to specific branches
- Scheduled (cron-like)
- Manual webhooks
- On-demand API calls

### **Trigger Types**

| Type | Description | Use Case |
|------|-------------|----------|
| **push** | Runs on code push | CI/CD automation |
| **schedule** | Runs on schedule | Nightly regression |
| **webhook** | Custom webhook | Integration with other tools |
| **manual** | API or UI trigger | On-demand testing |

### **Create a Trigger**

```http
POST /api/triggers
Content-Type: application/json

{
  "name": "Main Branch Regression",
  "description": "Run full regression suite on main branch push",
  "enabled": true,
  "testSuiteIds": ["suite_123", "suite_456", "suite_789"],
  "triggerType": "push",
  "conditions": {
    "cloudProvider": "github",
    "repository": "username/my-app",
    "branches": ["main", "master"],
    "filePatterns": ["src/**/*.js", "tests/**"],
    "skipPatterns": ["docs/**", "*.md"],
    "commitMessagePattern": "^(?!WIP).*"
  },
  "execution": {
    "parallel": true,
    "maxConcurrent": 3,
    "timeout": 3600000,
    "retryOnFailure": true,
    "maxRetries": 2
  },
  "notifications": {
    "onSuccess": false,
    "onFailure": true,
    "email": ["team@example.com"],
    "slack": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  }
}
```

**Response:**
```json
{
  "success": true,
  "trigger": {
    "id": "trigger_1234567890_abc12345",
    "name": "Main Branch Regression",
    "enabled": true,
    "testSuiteIds": ["suite_123", "suite_456", "suite_789"],
    "triggerType": "push",
    "createdAt": "2025-10-16T10:30:00.000Z"
  }
}
```

### **Trigger Examples**

#### **Example 1: Feature Branch Testing**

```json
{
  "name": "Feature Branch Tests",
  "enabled": true,
  "testSuiteIds": ["suite_smoke_tests"],
  "triggerType": "push",
  "conditions": {
    "cloudProvider": "github",
    "branches": ["feature/*"],
    "filePatterns": ["src/**"]
  }
}
```

#### **Example 2: Nightly Regression**

```json
{
  "name": "Nightly Full Regression",
  "enabled": true,
  "testSuiteIds": ["suite_regression_full"],
  "triggerType": "schedule",
  "conditions": {
    "schedule": "0 2 * * *",
    "timezone": "UTC"
  }
}
```

#### **Example 3: Manual Trigger for Production**

```json
{
  "name": "Production Smoke Tests",
  "enabled": true,
  "testSuiteIds": ["suite_prod_smoke"],
  "triggerType": "manual",
  "conditions": {}
}
```

### **List All Triggers**

```http
GET /api/triggers
```

**Response:**
```json
{
  "success": true,
  "triggers": [
    {
      "id": "trigger_123",
      "name": "Main Branch Regression",
      "enabled": true,
      "triggerType": "push",
      "testSuiteIds": ["suite_123"],
      "stats": {
        "totalRuns": 45,
        "successfulRuns": 42,
        "failedRuns": 3,
        "lastRun": "2025-10-16T09:15:00.000Z",
        "lastRunStatus": "passed"
      }
    }
  ]
}
```

### **Manual Trigger Execution**

```http
POST /api/triggers/trigger_123/execute
Content-Type: application/json

{
  "userId": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "execution": {
    "id": "exec_1234567890_xyz",
    "triggerId": "trigger_123",
    "status": "running",
    "testSuiteIds": ["suite_123"],
    "startTime": "2025-10-16T10:45:00.000Z"
  }
}
```

### **Get Execution History**

```http
GET /api/triggers/executions/history?triggerId=trigger_123&limit=10
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "exec_123",
      "triggerId": "trigger_123",
      "triggerName": "Main Branch Regression",
      "status": "passed",
      "startTime": "2025-10-16T09:15:00.000Z",
      "endTime": "2025-10-16T09:25:00.000Z",
      "results": [
        {
          "suiteId": "suite_123",
          "status": "passed",
          "totalTests": 25,
          "passedTests": 25,
          "failedTests": 0
        }
      ]
    }
  ]
}
```

---

## 🔄 Complete Workflow Example

### **Scenario: Automated CI/CD Testing**

1. **Setup GitHub Integration**
```bash
curl -X POST http://localhost:3007/api/integrations/github \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_your_token",
    "repository": "myorg/myapp",
    "owner": "myorg"
  }'
```

2. **Upload Test Suite via CSV**
```bash
curl -X POST http://localhost:3007/api/csv/upload \
  -F "csvFile=@regression_tests.csv"
```

3. **Create Automated Trigger**
```bash
curl -X POST http://localhost:3007/api/triggers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Automated Regression",
    "testSuiteIds": ["suite_from_csv"],
    "triggerType": "push",
    "conditions": {
      "cloudProvider": "github",
      "branches": ["main"]
    }
  }'
```

4. **Configure GitHub Webhook**
   - Add webhook URL: `https://your-domain.com/api/webhooks/github`

5. **Push Code** → Tests run automatically! 🎉

---

## 📱 API Reference Summary

### **CSV Import**
- `POST /api/csv/upload` - Upload CSV file

### **Cloud Integrations**
- `POST /api/integrations/:provider` - Add integration
- `GET /api/integrations` - List all integrations
- `GET /api/integrations/:provider` - Get specific integration
- `POST /api/integrations/:provider/test` - Test connection
- `DELETE /api/integrations/:provider` - Remove integration

### **Webhooks**
- `POST /api/webhooks/:provider` - Receive webhook events

### **Automated Triggers**
- `POST /api/triggers` - Create trigger
- `GET /api/triggers` - List triggers
- `GET /api/triggers/:id` - Get trigger details
- `PUT /api/triggers/:id` - Update trigger
- `DELETE /api/triggers/:id` - Delete trigger
- `POST /api/triggers/:id/execute` - Manual execution
- `GET /api/triggers/executions/history` - Execution history

---

## 🎓 Best Practices

### **1. CSV Test Suites**
- Use clear, descriptive test names
- Keep steps concise and actionable
- Include URLs for each test
- Group related tests in one CSV file

### **2. Cloud Integrations**
- Use tokens with minimum required permissions
- Store tokens securely (environment variables)
- Test connection before enabling auto-trigger
- Monitor webhook deliveries

### **3. Automated Triggers**
- Start with manual triggers, then automate
- Use branch filters to avoid unnecessary runs
- Enable parallel execution for faster results
- Set appropriate timeouts
- Configure notifications for failures only

---

## 🔒 Security Considerations

1. **API Tokens**: All credentials are encrypted at rest
2. **Webhook Secrets**: Validate webhook signatures
3. **Access Control**: Implement authentication for production
4. **HTTPS**: Use HTTPS for webhook URLs in production
5. **Environment Variables**: Store sensitive data in `.env` file

---

## 📊 Monitoring & Debugging

### **Check Trigger Status**
```bash
curl http://localhost:3007/api/triggers/trigger_123
```

### **View Execution History**
```bash
curl "http://localhost:3007/api/triggers/executions/history?limit=50"
```

### **Test Integration Connection**
```bash
curl -X POST http://localhost:3007/api/integrations/github/test \
  -H "Content-Type: application/json" \
  -d '{"token": "your_token"}'
```

---

## 🚀 Quick Start Examples

### **Example 1: CSV Import**
```bash
# Create a CSV file
cat > tests.csv << 'EOF'
test_name,test_steps,url
Login Test,"Navigate to login\nEnter credentials\nClick login",https://app.example.com
Logout Test,"Click logout button\nVerify redirect",https://app.example.com
EOF

# Upload it
curl -X POST http://localhost:3007/api/csv/upload \
  -F "csvFile=@tests.csv"
```

### **Example 2: Setup GitHub Auto-Trigger**
```bash
# 1. Add GitHub integration
curl -X POST http://localhost:3007/api/integrations/github \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_your_token",
    "repository": "user/repo",
    "owner": "user"
  }'

# 2. Create trigger
curl -X POST http://localhost:3007/api/triggers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Branch Tests",
    "testSuiteIds": ["suite_123"],
    "triggerType": "push",
    "conditions": {
      "cloudProvider": "github",
      "branches": ["main"]
    }
  }'
```

---

## 📞 Support & Documentation

- **Main Documentation**: See `README.md`
- **ML Scalability**: See `ML_SCALABILITY_GUIDE.md`
- **System Architecture**: See `ARCHITECTURE.md`

---

**🎉 You now have a complete enterprise-grade test automation platform with CSV import, cloud integrations, and flexible automated triggers!**

