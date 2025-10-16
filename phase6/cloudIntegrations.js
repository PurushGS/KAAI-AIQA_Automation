/**
 * Cloud Integrations Manager
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Manage connections to Azure DevOps, GitHub, GitLab, AWS, and other cloud services.
 * Enable seamless integration for automated testing and regression runs.
 * 
 * FEATURES:
 * - Azure DevOps integration (repos, pipelines, test plans)
 * - GitHub integration (repos, actions, webhooks)
 * - GitLab integration (repos, CI/CD)
 * - AWS integration (CodeCommit, CodePipeline, Lambda)
 * - Webhook management for automated triggers
 * - Secure credential storage
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class CloudIntegrationsManager {
  constructor() {
    this.configurationsPath = './config/integrations';
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    
    this.supportedIntegrations = {
      github: {
        name: 'GitHub',
        requiredFields: ['token', 'repository', 'owner'],
        webhookSupport: true
      },
      gitlab: {
        name: 'GitLab',
        requiredFields: ['token', 'projectId', 'url'],
        webhookSupport: true
      },
      azure: {
        name: 'Azure DevOps',
        requiredFields: ['token', 'organization', 'project'],
        webhookSupport: true
      },
      aws: {
        name: 'AWS',
        requiredFields: ['accessKeyId', 'secretAccessKey', 'region', 'repository'],
        webhookSupport: true
      },
      bitbucket: {
        name: 'Bitbucket',
        requiredFields: ['username', 'appPassword', 'workspace', 'repository'],
        webhookSupport: true
      }
    };
  }

  /**
   * Initialize integrations manager
   */
  async initialize() {
    await fs.mkdir(this.configurationsPath, { recursive: true });
    console.log('☁️ Cloud Integrations Manager initialized');
  }

  /**
   * Add or update a cloud integration
   */
  async addIntegration(provider, configuration) {
    console.log(`🔗 Adding ${provider} integration...`);

    // Validate provider
    if (!this.supportedIntegrations[provider]) {
      throw new Error(`Unsupported provider: ${provider}. Supported: ${Object.keys(this.supportedIntegrations).join(', ')}`);
    }

    const providerConfig = this.supportedIntegrations[provider];

    // Validate required fields
    const missingFields = providerConfig.requiredFields.filter(
      field => !configuration[field]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for ${provider}: ${missingFields.join(', ')}`);
    }

    // Encrypt sensitive data
    const encryptedConfig = {
      provider,
      name: configuration.name || `${providerConfig.name} Integration`,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      webhookUrl: configuration.webhookUrl || '',
      autoTriggerRegression: configuration.autoTriggerRegression || false,
      branchFilters: configuration.branchFilters || ['main', 'master', 'develop'],
      testSuiteIds: configuration.testSuiteIds || [],
      credentials: this.encrypt(JSON.stringify(configuration))
    };

    // Save configuration
    const filePath = path.join(this.configurationsPath, `${provider}.json`);
    await fs.writeFile(filePath, JSON.stringify(encryptedConfig, null, 2));

    console.log(`   ✅ ${provider} integration configured`);

    return {
      success: true,
      provider,
      name: encryptedConfig.name,
      webhookUrl: this.generateWebhookUrl(provider)
    };
  }

  /**
   * Get integration configuration
   */
  async getIntegration(provider) {
    try {
      const filePath = path.join(this.configurationsPath, `${provider}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(content);

      // Decrypt credentials
      const credentials = JSON.parse(this.decrypt(config.credentials));

      return {
        ...config,
        credentials: credentials,
        isConfigured: true
      };
    } catch (error) {
      return {
        provider,
        isConfigured: false,
        error: error.message
      };
    }
  }

  /**
   * List all configured integrations
   */
  async listIntegrations() {
    const integrations = [];

    for (const provider of Object.keys(this.supportedIntegrations)) {
      const config = await this.getIntegration(provider);
      integrations.push({
        provider,
        name: this.supportedIntegrations[provider].name,
        isConfigured: config.isConfigured,
        enabled: config.enabled || false,
        autoTriggerRegression: config.autoTriggerRegression || false,
        webhookUrl: config.isConfigured ? this.generateWebhookUrl(provider) : null
      });
    }

    return integrations;
  }

  /**
   * Delete integration
   */
  async deleteIntegration(provider) {
    const filePath = path.join(this.configurationsPath, `${provider}.json`);
    await fs.unlink(filePath);
    console.log(`   ✅ ${provider} integration removed`);
    return { success: true };
  }

  /**
   * Handle webhook from cloud provider
   */
  async handleWebhook(provider, payload, headers) {
    console.log(`📥 Webhook received from ${provider}`);

    // Get integration configuration
    const config = await this.getIntegration(provider);
    
    if (!config.isConfigured || !config.enabled) {
      throw new Error(`${provider} integration is not configured or disabled`);
    }

    // Parse webhook based on provider
    let event;
    
    switch (provider) {
      case 'github':
        event = this.parseGitHubWebhook(payload, headers);
        break;
      case 'gitlab':
        event = this.parseGitLabWebhook(payload, headers);
        break;
      case 'azure':
        event = this.parseAzureWebhook(payload, headers);
        break;
      case 'aws':
        event = this.parseAWSWebhook(payload, headers);
        break;
      case 'bitbucket':
        event = this.parseBitbucketWebhook(payload, headers);
        break;
      default:
        throw new Error(`Webhook handler not implemented for ${provider}`);
    }

    console.log(`   Event Type: ${event.type}`);
    console.log(`   Branch: ${event.branch}`);
    console.log(`   Repository: ${event.repository}`);

    // Check if we should trigger regression
    if (event.type === 'push' && config.autoTriggerRegression) {
      if (this.shouldTriggerRegression(event.branch, config.branchFilters)) {
        console.log(`   🚀 Triggering automated regression...`);
        return {
          triggerRegression: true,
          event: event,
          testSuiteIds: config.testSuiteIds
        };
      }
    }

    return {
      triggerRegression: false,
      event: event
    };
  }

  /**
   * Generate webhook URL for provider
   */
  generateWebhookUrl(provider) {
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:6969';
    return `${baseUrl}/api/webhooks/${provider}`;
  }

  /**
   * Check if regression should be triggered for branch
   */
  shouldTriggerRegression(branch, branchFilters) {
    if (!branchFilters || branchFilters.length === 0) {
      return true; // No filters = trigger for all branches
    }

    return branchFilters.some(filter => {
      if (filter.includes('*')) {
        // Wildcard matching
        const regex = new RegExp('^' + filter.replace(/\*/g, '.*') + '$');
        return regex.test(branch);
      }
      return branch === filter;
    });
  }

  // ========== Webhook Parsers ==========

  parseGitHubWebhook(payload, headers) {
    const event = headers['x-github-event'] || 'unknown';
    
    return {
      type: event,
      provider: 'github',
      repository: payload.repository?.full_name || '',
      branch: payload.ref?.replace('refs/heads/', '') || '',
      commit: payload.head_commit?.id || '',
      author: payload.head_commit?.author?.name || '',
      message: payload.head_commit?.message || '',
      timestamp: payload.head_commit?.timestamp || new Date().toISOString()
    };
  }

  parseGitLabWebhook(payload, headers) {
    const event = headers['x-gitlab-event'] || 'unknown';
    
    return {
      type: event.toLowerCase().replace(' hook', ''),
      provider: 'gitlab',
      repository: payload.project?.path_with_namespace || '',
      branch: payload.ref?.replace('refs/heads/', '') || '',
      commit: payload.checkout_sha || '',
      author: payload.user_name || '',
      message: payload.commits?.[0]?.message || '',
      timestamp: payload.commits?.[0]?.timestamp || new Date().toISOString()
    };
  }

  parseAzureWebhook(payload, headers) {
    return {
      type: payload.eventType || 'unknown',
      provider: 'azure',
      repository: payload.resource?.repository?.name || '',
      branch: payload.resource?.refUpdates?.[0]?.name?.replace('refs/heads/', '') || '',
      commit: payload.resource?.refUpdates?.[0]?.newObjectId || '',
      author: payload.resource?.pushedBy?.displayName || '',
      message: 'Azure DevOps push',
      timestamp: payload.createdDate || new Date().toISOString()
    };
  }

  parseAWSWebhook(payload, headers) {
    // AWS CodeCommit via SNS
    const message = typeof payload.Message === 'string' 
      ? JSON.parse(payload.Message) 
      : payload.Message;
    
    return {
      type: 'push',
      provider: 'aws',
      repository: message.detail?.repositoryName || '',
      branch: message.detail?.referenceName || '',
      commit: message.detail?.commitId || '',
      author: message.detail?.callerUserArn || '',
      message: 'AWS CodeCommit push',
      timestamp: message.time || new Date().toISOString()
    };
  }

  parseBitbucketWebhook(payload, headers) {
    const event = headers['x-event-key'] || 'unknown';
    
    return {
      type: event.includes('push') ? 'push' : event,
      provider: 'bitbucket',
      repository: payload.repository?.full_name || '',
      branch: payload.push?.changes?.[0]?.new?.name || '',
      commit: payload.push?.changes?.[0]?.new?.target?.hash || '',
      author: payload.actor?.display_name || '',
      message: payload.push?.changes?.[0]?.new?.target?.message || '',
      timestamp: payload.push?.changes?.[0]?.new?.target?.date || new Date().toISOString()
    };
  }

  // ========== Encryption ==========

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0').substring(0, 32)),
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0').substring(0, 32)),
      iv
    );
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Test connection to cloud provider
   */
  async testConnection(provider, credentials) {
    console.log(`🧪 Testing connection to ${provider}...`);

    try {
      switch (provider) {
        case 'github':
          return await this.testGitHubConnection(credentials);
        case 'gitlab':
          return await this.testGitLabConnection(credentials);
        case 'azure':
          return await this.testAzureConnection(credentials);
        case 'aws':
          return await this.testAWSConnection(credentials);
        default:
          return { success: true, message: 'Connection test not implemented' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testGitHubConnection(credentials) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${credentials.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Connected as ${data.login}` };
    } else {
      throw new Error(`GitHub API returned ${response.status}`);
    }
  }

  async testGitLabConnection(credentials) {
    const url = credentials.url || 'https://gitlab.com';
    const response = await fetch(`${url}/api/v4/user`, {
      headers: {
        'PRIVATE-TOKEN': credentials.token
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Connected as ${data.username}` };
    } else {
      throw new Error(`GitLab API returned ${response.status}`);
    }
  }

  async testAzureConnection(credentials) {
    const url = `https://dev.azure.com/${credentials.organization}/_apis/projects/${credentials.project}?api-version=6.0`;
    const authToken = Buffer.from(`:${credentials.token}`).toString('base64');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Connected to project ${data.name}` };
    } else {
      throw new Error(`Azure DevOps API returned ${response.status}`);
    }
  }

  async testAWSConnection(credentials) {
    // AWS SDK would be used here in production
    // For now, just validate credentials format
    if (credentials.accessKeyId && credentials.secretAccessKey) {
      return { success: true, message: 'AWS credentials format valid' };
    } else {
      throw new Error('Invalid AWS credentials');
    }
  }
}

export default CloudIntegrationsManager;

