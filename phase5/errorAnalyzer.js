/**
 * AIQA Phase 5: Error Analyzer
 * 
 * PURPOSE:
 * Analyzes test failures to identify root causes and patterns.
 * Determines what type of fix is needed for each error.
 * 
 * ANALYSIS TYPES:
 * 1. Timeout errors → increase wait time or improve selector
 * 2. Element not found → update selector or add wait
 * 3. Navigation errors → add retry logic or handle redirects
 * 4. Assertion failures → fix test logic or adjust expectations
 * 5. Network errors → add error handling and retries
 * 
 * CONNECTIONS:
 * - Input: Test results from Phase 2
 * - Output: Error analysis for Code Generator
 * - Uses: RAG (Phase 4.5) for historical context
 */

export class ErrorAnalyzer {
  constructor() {
    this.errorPatterns = this.initializePatterns();
  }

  /**
   * Initialize error patterns for classification
   */
  initializePatterns() {
    return {
      timeout: {
        patterns: [
          /Timeout.*exceeded/i,
          /waiting for.*timed out/i,
          /TimeoutError/i
        ],
        severity: 'medium',
        fixType: 'increase_timeout'
      },
      elementNotFound: {
        patterns: [
          /locator\..*: Timeout.*exceeded/i,
          /element.*not found/i,
          /Unable to find element/i,
          /No element found/i
        ],
        severity: 'high',
        fixType: 'improve_selector'
      },
      networkError: {
        patterns: [
          /net::ERR_/i,
          /NetworkError/i,
          /Failed to fetch/i,
          /Connection refused/i
        ],
        severity: 'high',
        fixType: 'add_retry_logic'
      },
      navigationError: {
        patterns: [
          /Navigation failed/i,
          /page\.goto/i,
          /ERR_FAILED/i
        ],
        severity: 'medium',
        fixType: 'improve_navigation'
      },
      assertionFailure: {
        patterns: [
          /Expected.*but got/i,
          /AssertionError/i,
          /does not match/i
        ],
        severity: 'low',
        fixType: 'adjust_assertion'
      }
    };
  }

  /**
   * Analyze a test failure
   * 
   * @param {Object} testFailure - Test failure details
   * @returns {Object} Analysis with root cause and suggested fix
   */
  async analyze(testFailure) {
    console.log(`🔍 Analyzing error: ${testFailure.testId}`);

    try {
      // Classify error type
      const errorType = this.classifyError(testFailure.errorMessage);
      
      // Extract relevant context
      const context = this.extractContext(testFailure);
      
      // Determine severity
      const severity = this.determineSeverity(errorType, testFailure);
      
      // Suggest fix type
      const suggestedFix = this.suggestFix(errorType, context);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(errorType, context);

      console.log(`   ✓ Error type: ${errorType}`);
      console.log(`   ✓ Severity: ${severity}`);
      console.log(`   ✓ Confidence: ${confidence.toFixed(2)}`);

      return {
        success: true,
        analysis: {
          testId: testFailure.testId,
          errorType: errorType,
          rootCause: this.identifyRootCause(errorType, context),
          severity: severity,
          suggestedFix: suggestedFix,
          confidence: confidence,
          context: context,
          fixable: confidence > 0.7
        }
      };

    } catch (error) {
      console.error(`   ❌ Analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Classify error type from error message
   */
  classifyError(errorMessage) {
    for (const [type, config] of Object.entries(this.errorPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(errorMessage)) {
          return type;
        }
      }
    }
    return 'unknown';
  }

  /**
   * Extract relevant context from test failure
   */
  extractContext(testFailure) {
    const context = {
      selector: null,
      url: testFailure.url || null,
      action: null,
      timeout: null,
      retryCount: 0
    };

    // Extract selector from error message
    const selectorMatch = testFailure.errorMessage.match(/locator\('([^']+)'\)/);
    if (selectorMatch) {
      context.selector = selectorMatch[1];
    }

    // Extract action from error message
    const actionMatch = testFailure.errorMessage.match(/locator\.(\w+):/);
    if (actionMatch) {
      context.action = actionMatch[1];
    }

    // Extract timeout value
    const timeoutMatch = testFailure.errorMessage.match(/Timeout (\d+)ms/);
    if (timeoutMatch) {
      context.timeout = parseInt(timeoutMatch[1]);
    }

    // Check if this error has occurred before
    context.recurring = testFailure.previousOccurrences || 0;

    return context;
  }

  /**
   * Determine severity of the error
   */
  determineSeverity(errorType, testFailure) {
    const baseSeverity = this.errorPatterns[errorType]?.severity || 'medium';
    
    // Increase severity if recurring
    if (testFailure.previousOccurrences > 2) {
      return 'critical';
    }
    
    // Increase severity if blocking multiple tests
    if (testFailure.affectsMultipleTests) {
      return 'high';
    }
    
    return baseSeverity;
  }

  /**
   * Suggest fix type based on error and context
   */
  suggestFix(errorType, context) {
    const suggestions = {
      timeout: {
        description: 'Increase timeout duration',
        action: 'modify_timeout',
        details: `Increase from ${context.timeout}ms to ${context.timeout * 1.5}ms`,
        confidence: 0.9
      },
      elementNotFound: {
        description: 'Improve element selector',
        action: 'improve_selector',
        details: `Current selector: "${context.selector}" may be too specific or brittle`,
        confidence: 0.85
      },
      networkError: {
        description: 'Add retry logic for network errors',
        action: 'add_error_handling',
        details: 'Wrap navigation/requests in try-catch with retry',
        confidence: 0.88
      },
      navigationError: {
        description: 'Improve navigation handling',
        action: 'improve_navigation',
        details: 'Add waitUntil and timeout options',
        confidence: 0.82
      },
      assertionFailure: {
        description: 'Adjust assertion expectations',
        action: 'update_assertion',
        details: 'Expected value may need updating',
        confidence: 0.70
      }
    };

    return suggestions[errorType] || {
      description: 'Manual investigation required',
      action: 'manual_fix',
      details: 'Error pattern not recognized',
      confidence: 0.50
    };
  }

  /**
   * Identify root cause explanation
   */
  identifyRootCause(errorType, context) {
    const rootCauses = {
      timeout: `Element "${context.selector}" is taking longer than ${context.timeout}ms to become ready. This could be due to slow page load, network latency, or the element appearing after dynamic content loads.`,
      
      elementNotFound: `Selector "${context.selector}" cannot find the element. This might be because the selector is incorrect, the element doesn't exist yet, or the page structure has changed.`,
      
      networkError: `Network request failed while accessing ${context.url}. This could be due to server issues, network connectivity problems, or incorrect URL.`,
      
      navigationError: `Failed to navigate to ${context.url}. The page may be returning an error, redirecting, or taking too long to load.`,
      
      assertionFailure: `The actual value doesn't match the expected value. This could indicate a change in application behavior or incorrect test expectations.`
    };

    return rootCauses[errorType] || 'Unable to determine root cause. Manual investigation needed.';
  }

  /**
   * Calculate confidence score for fix suggestion
   */
  calculateConfidence(errorType, context) {
    let confidence = this.errorPatterns[errorType]?.fixType ? 0.8 : 0.5;

    // Increase confidence if we have good context
    if (context.selector) confidence += 0.05;
    if (context.action) confidence += 0.05;
    if (context.timeout) confidence += 0.05;

    // Decrease confidence if error is recurring (might be complex)
    if (context.recurring > 3) confidence -= 0.15;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Batch analyze multiple failures
   * Useful for finding patterns across multiple tests
   * 
   * @param {Array} testFailures - Array of test failures
   * @returns {Object} Aggregated analysis
   */
  async batchAnalyze(testFailures) {
    console.log(`🔍 Batch analyzing ${testFailures.length} failures...`);

    const analyses = await Promise.all(
      testFailures.map(failure => this.analyze(failure))
    );

    // Group by error type
    const byType = {};
    analyses.forEach(analysis => {
      const type = analysis.analysis?.errorType;
      if (type) {
        byType[type] = (byType[type] || 0) + 1;
      }
    });

    console.log(`   ✓ Error distribution:`, byType);

    return {
      success: true,
      totalAnalyzed: testFailures.length,
      byType: byType,
      analyses: analyses,
      patterns: this.findCommonPatterns(analyses)
    };
  }

  /**
   * Find common patterns across multiple failures
   */
  findCommonPatterns(analyses) {
    const patterns = {
      commonSelectors: {},
      commonUrls: {},
      commonActions: {}
    };

    analyses.forEach(analysis => {
      const ctx = analysis.analysis?.context;
      if (!ctx) return;

      if (ctx.selector) {
        patterns.commonSelectors[ctx.selector] = 
          (patterns.commonSelectors[ctx.selector] || 0) + 1;
      }
      if (ctx.url) {
        patterns.commonUrls[ctx.url] = 
          (patterns.commonUrls[ctx.url] || 0) + 1;
      }
      if (ctx.action) {
        patterns.commonActions[ctx.action] = 
          (patterns.commonActions[ctx.action] || 0) + 1;
      }
    });

    return patterns;
  }
}

