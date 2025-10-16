/**
 * Utility Helper Functions
 * 
 * Common utilities used across the AIQA system
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Mask sensitive data in text
 * @param {string} text - Text to mask
 * @param {Array<string>} sensitiveFields - List of sensitive field names
 * @returns {string} Masked text
 */
export function maskSensitiveData(text, sensitiveFields) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let masked = text;
  
  // Mask each sensitive field
  sensitiveFields.forEach(field => {
    // Pattern: "field": "value" or field: value or field=value
    const patterns = [
      new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, 'gi'),
      new RegExp(`${field}\\s*:\\s*([^,\\s}\\]]+)`, 'gi'),
      new RegExp(`${field}\\s*=\\s*([^,\\s&]+)`, 'gi')
    ];
    
    patterns.forEach(pattern => {
      masked = masked.replace(pattern, (match) => {
        return match.replace(/[^":=\s]/g, '*');
      });
    });
  });
  
  return masked;
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${seconds}s`;
}

/**
 * Read test case file and return content
 * @param {string} filepath - Path to test case file
 * @returns {Promise<string>} File content
 */
export async function readTestCaseFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    return content.trim();
  } catch (error) {
    throw new Error(`Failed to read test case file: ${error.message}`);
  }
}

/**
 * Parse test case based on file extension
 * @param {string} filepath - Path to test case file
 * @param {string} content - File content
 * @returns {Object} Parsed test case
 */
export function parseTestCase(filepath, content) {
  const ext = path.extname(filepath).toLowerCase();
  
  if (ext === '.json') {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in test case: ${error.message}`);
    }
  }
  
  // For .txt, .yaml, or plain text, return as intent string
  return {
    intent: content,
    format: 'text'
  };
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config) {
  const required = ['llm', 'executor', 'paths'];
  
  required.forEach(field => {
    if (!config[field]) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  });
  
  // Validate LLM config
  if (!config.llm.provider || !config.llm.model) {
    throw new Error('LLM configuration must include provider and model');
  }
  
  // Validate paths
  if (!config.paths.logs || !config.paths.reports) {
    throw new Error('Configuration must include logs and reports paths');
  }
}

/**
 * Generate timestamp string for filenames
 * @returns {string} Timestamp string
 */
export function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
}

/**
 * Sanitize filename
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Check if file exists
 * @param {string} filepath - Path to check
 * @returns {Promise<boolean>} True if exists
 */
export async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in human-readable format
 * @param {string} filepath - Path to file
 * @returns {Promise<string>} File size
 */
export async function getFileSize(filepath) {
  try {
    const stats = await fs.stat(filepath);
    const bytes = stats.size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return 'Unknown';
  }
}

/**
 * Create logger with prefix
 * @param {string} prefix - Log prefix
 * @returns {Object} Logger object
 */
export function createLogger(prefix) {
  return {
    info: (msg) => console.log(`[${prefix}] ℹ️  ${msg}`),
    success: (msg) => console.log(`[${prefix}] ✅ ${msg}`),
    warn: (msg) => console.warn(`[${prefix}] ⚠️  ${msg}`),
    error: (msg) => console.error(`[${prefix}] ❌ ${msg}`),
    debug: (msg) => console.log(`[${prefix}] 🐛 ${msg}`)
  };
}

export default {
  ensureDirectoryExists,
  maskSensitiveData,
  formatDuration,
  readTestCaseFile,
  parseTestCase,
  validateConfig,
  getTimestamp,
  sanitizeFilename,
  fileExists,
  getFileSize,
  createLogger
};

