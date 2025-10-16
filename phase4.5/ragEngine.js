/**
 * AIQA Phase 4.5: RAG Engine
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Provides Retrieval-Augmented Generation capabilities using ChromaDB vector database.
 * This is the intelligent memory system for AIQA - stores test executions and retrieves
 * relevant context for all phases.
 * 
 * ARCHITECTURE:
 * 1. ChromaDB - Vector database for semantic search
 * 2. OpenAI Embeddings - Convert text to vectors
 * 3. Semantic Search - Find similar tests by meaning
 * 4. LLM Synthesis - Generate answers with retrieved context
 * 
 * CONNECTIONS:
 * - All phases (1-4) query this for historical context
 * - Git watcher queries for affected tests
 * - Phase 6 UI displays RAG insights
 */

import { OpenAI } from 'openai';
import { ChromaClient } from 'chromadb';

export class RAGEngine {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Use ChromaDB with default local server (http://localhost:8000)
    // If server isn't running, ChromaDB will auto-start in embedded mode
    this.chroma = new ChromaClient({
      path: 'http://localhost:8000'
    });
    this.collection = null;
    this.collectionName = 'aiqa_test_executions';
  }

  /**
   * Initialize ChromaDB collection
   * Creates or retrieves existing collection for test storage
   */
  async initialize() {
    console.log('🧠 Initializing RAG Engine...');
    
    try {
      // Try to get existing collection
      this.collection = await this.chroma.getOrCreateCollection({
        name: this.collectionName,
        metadata: { 
          description: 'AIQA test execution knowledge base',
          hnsw_space: 'cosine' // Use cosine similarity for semantic search
        }
      });
      
      console.log(`   ✓ Connected to collection: ${this.collectionName}`);
      
      // Get collection stats
      const count = await this.collection.count();
      console.log(`   ✓ Existing test executions: ${count}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize RAG:', error.message);
      throw error;
    }
  }

  /**
   * Store a test execution in the knowledge base
   * 
   * @param {Object} testExecution - Complete test execution data
   * @returns {Object} Storage result with embedding ID
   */
  async storeExecution(testExecution) {
    console.log(`📥 Storing test execution: ${testExecution.testId}`);

    try {
      // Create a comprehensive text representation of the test
      const textRepresentation = this.createTextRepresentation(testExecution);
      
      // Generate embedding
      console.log('   🔄 Generating embedding...');
      const embedding = await this.createEmbedding(textRepresentation);
      
      // Prepare metadata (ChromaDB requires flat objects)
      // CRITICAL FIX: Merge incoming metadata to preserve all fields (selectors, etc.)
      const metadata = {
        testId: testExecution.testId,
        testName: testExecution.testName || 'Unnamed test',
        url: testExecution.url || '',
        timestamp: testExecution.metadata?.timestamp || new Date().toISOString(),
        passed: testExecution.results?.passed || 0,
        failed: testExecution.results?.failed || 0,
        duration: testExecution.results?.duration || 0,
        success: (testExecution.results?.failed || 0) === 0,
        browser: testExecution.metadata?.browser || 'unknown',
        testType: testExecution.metadata?.testType || 'general',
        // REAL LEARNING: Preserve ALL incoming metadata fields
        ...(testExecution.metadata || {})
      };
      
      // Store in ChromaDB
      await this.collection.add({
        ids: [testExecution.testId],
        embeddings: [embedding],
        documents: [textRepresentation],
        metadatas: [metadata]
      });
      
      console.log(`   ✅ Stored with embedding (${embedding.length} dims)`);
      
      return {
        success: true,
        testId: testExecution.testId,
        embeddingId: testExecution.testId,
        dimensions: embedding.length
      };
      
    } catch (error) {
      console.error(`   ❌ Storage failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query the knowledge base with natural language
   * 
   * @param {string} query - Natural language question
   * @param {Object} filters - Optional metadata filters
   * @param {number} limit - Number of results to return
   * @returns {Object} Query results with LLM-generated answer
   */
  async query(query, filters = {}, limit = 5) {
    console.log(`🔍 RAG Query: "${query}"`);
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.createEmbedding(query);
      
      // Build where clause for ChromaDB
      const whereClause = this.buildWhereClause(filters);
      
      // Search in vector database
      console.log('   🔄 Searching vector database...');
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: whereClause.where,
        whereDocument: whereClause.whereDocument
      });
      
      console.log(`   ✓ Found ${results.ids[0].length} results`);
      
      // Format results
      const formattedResults = this.formatResults(results);
      
      // Use LLM to synthesize answer
      console.log('   🤖 Generating AI answer...');
      const answer = await this.synthesizeAnswer(query, formattedResults);
      
      return {
        success: true,
        query: query,
        resultsCount: formattedResults.length,
        results: formattedResults,
        answer: answer
      };
      
    } catch (error) {
      console.error(`   ❌ Query failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find tests similar to a given test
   * 
   * @param {string} testId - ID of the reference test
   * @param {number} limit - Number of similar tests to find
   * @returns {Object} Similar tests with similarity scores
   */
  async findSimilarTests(testId, limit = 5) {
    console.log(`🔍 Finding tests similar to: ${testId}`);
    
    try {
      // Get the original test
      const original = await this.collection.get({
        ids: [testId],
        include: ['embeddings', 'documents', 'metadatas']
      });
      
      if (!original.ids.length) {
        throw new Error(`Test ${testId} not found in knowledge base`);
      }
      
      // Search using the original test's embedding
      const results = await this.collection.query({
        queryEmbeddings: [original.embeddings[0]],
        nResults: limit + 1, // +1 because it will include itself
        include: ['documents', 'metadatas', 'distances']
      });
      
      // Format and exclude the original test
      const similarTests = this.formatResults(results)
        .filter(test => test.testId !== testId);
      
      return {
        success: true,
        originalTest: {
          testId: testId,
          testName: original.metadatas[0].testName
        },
        similarTests: similarTests
      };
      
    } catch (error) {
      console.error(`   ❌ Failed to find similar tests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze git changes and recommend tests
   * 
   * @param {Object} gitChange - Git commit information
   * @returns {Object} Recommended tests and risk analysis
   */
  async analyzeGitChange(gitChange) {
    console.log(`🔍 Analyzing git change: ${gitChange.commitHash || 'unknown'}`);
    
    try {
      // Create query from git changes
      const query = `
        Code changes detected:
        Files: ${gitChange.changedFiles?.join(', ') || 'unknown'}
        
        What features are affected by these changes?
        What tests should be run?
        What is the risk level?
      `;
      
      // Query knowledge base for related tests
      const relatedTests = await this.query(query, {}, 10);
      
      // Use LLM for deep analysis
      console.log('   🤖 AI analyzing impact...');
      const analysis = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI test analyst. Analyze git changes and recommend which tests to run.
            
            Output format:
            {
              "affectedFeatures": ["feature1", "feature2"],
              "recommendedTests": [{"testId": "...", "priority": "critical|high|medium", "reason": "..."}],
              "riskLevel": "critical|high|medium|low",
              "recommendation": "Run full suite | Run affected tests | Smoke test only"
            }`
          },
          {
            role: 'user',
            content: `
              Git Changes:
              ${JSON.stringify(gitChange, null, 2)}
              
              Related Tests from Knowledge Base:
              ${JSON.stringify(relatedTests.results.slice(0, 5), null, 2)}
              
              Analyze the impact and recommend tests.
            `
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      const aiAnalysis = JSON.parse(analysis.choices[0].message.content);
      
      console.log(`   ✓ Risk level: ${aiAnalysis.riskLevel}`);
      console.log(`   ✓ Recommended: ${aiAnalysis.recommendedTests.length} tests`);
      
      return {
        success: true,
        ...aiAnalysis,
        relatedTestsFound: relatedTests.resultsCount
      };
      
    } catch (error) {
      console.error(`   ❌ Git analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get database statistics
   * 
   * @returns {Object} RAG database stats
   */
  async getStats() {
    console.log('📊 Getting RAG statistics...');
    
    try {
      const count = await this.collection.count();
      
      // Get all metadata to calculate stats
      const allData = await this.collection.get({
        include: ['metadatas']
      });
      
      const metadatas = allData.metadatas || [];
      
      // Calculate statistics
      const stats = {
        totalTests: count,
        uniqueUrls: new Set(metadatas.map(m => m.url)).size,
        averageSuccessRate: metadatas.filter(m => m.success).length / count,
        totalPassed: metadatas.reduce((sum, m) => sum + (m.passed || 0), 0),
        totalFailed: metadatas.reduce((sum, m) => sum + (m.failed || 0), 0),
        averageDuration: metadatas.reduce((sum, m) => sum + (m.duration || 0), 0) / count,
        testTypes: this.countByField(metadatas, 'testType'),
        browsers: this.countByField(metadatas, 'browser')
      };
      
      // Get date range
      const timestamps = metadatas.map(m => m.timestamp).filter(Boolean).sort();
      if (timestamps.length > 0) {
        stats.oldestTest = timestamps[0];
        stats.newestTest = timestamps[timestamps.length - 1];
      }
      
      console.log(`   ✓ Analyzed ${count} test executions`);
      
      return {
        success: true,
        stats: stats
      };
      
    } catch (error) {
      console.error(`   ❌ Failed to get stats: ${error.message}`);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Create text representation of test execution for embedding
   */
  createTextRepresentation(testExecution) {
    const parts = [];
    
    // Basic info
    parts.push(`Test: ${testExecution.testName || 'Unnamed'}`);
    parts.push(`URL: ${testExecution.url || 'N/A'}`);
    
    // Steps
    if (testExecution.steps && testExecution.steps.length > 0) {
      parts.push('Steps:');
      testExecution.steps.forEach((step, i) => {
        parts.push(`  ${i + 1}. ${step.description || step.action} - ${step.target || ''}`);
      });
    }
    
    // Results
    if (testExecution.results) {
      parts.push(`Results: ${testExecution.results.passed} passed, ${testExecution.results.failed} failed`);
      parts.push(`Duration: ${testExecution.results.duration}ms`);
    }
    
    // Errors
    if (testExecution.errors && testExecution.errors.length > 0) {
      parts.push('Errors:');
      testExecution.errors.forEach(err => {
        parts.push(`  - ${err.message || err}`);
      });
    }
    
    // Metadata
    if (testExecution.metadata) {
      parts.push(`Browser: ${testExecution.metadata.browser || 'unknown'}`);
      parts.push(`Type: ${testExecution.metadata.testType || 'general'}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Create embedding using OpenAI
   */
  async createEmbedding(text) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }

  /**
   * Build ChromaDB where clause from filters
   */
  buildWhereClause(filters) {
    const where = {};
    const whereDocument = {};
    
    // Convert filters to ChromaDB format
    if (filters.success !== undefined) {
      where.success = filters.success;
    }
    if (filters.testType) {
      where.testType = filters.testType;
    }
    if (filters.url) {
      whereDocument.$contains = filters.url;
    }
    
    return {
      where: Object.keys(where).length > 0 ? where : undefined,
      whereDocument: Object.keys(whereDocument).length > 0 ? whereDocument : undefined
    };
  }

  /**
   * Format ChromaDB results into user-friendly structure
   */
  formatResults(chromaResults) {
    const ids = chromaResults.ids[0] || [];
    const documents = chromaResults.documents[0] || [];
    const metadatas = chromaResults.metadatas[0] || [];
    const distances = chromaResults.distances?.[0] || [];
    
    return ids.map((id, i) => ({
      testId: id,
      testName: metadatas[i]?.testName || 'Unnamed',
      url: metadatas[i]?.url || '',
      timestamp: metadatas[i]?.timestamp || '',
      passed: metadatas[i]?.passed || 0,
      failed: metadatas[i]?.failed || 0,
      duration: metadatas[i]?.duration || 0,
      success: metadatas[i]?.success || false,
      relevanceScore: distances[i] ? (1 - distances[i]).toFixed(3) : 1, // Convert distance to similarity
      summary: documents[i]?.split('\n').slice(0, 3).join(' '), // First 3 lines as summary
      document: documents[i], // Full document text
      // CRITICAL FIX: Include ALL metadata for REAL learning!
      metadata: metadatas[i] || {} // ✅ Preserve all metadata fields!
    }));
  }

  /**
   * Use LLM to synthesize answer from retrieved context
   */
  async synthesizeAnswer(query, results) {
    if (results.length === 0) {
      return 'No relevant tests found in the knowledge base.';
    }
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are AIQA assistant. Answer questions about test executions using the provided context. Be concise and actionable.'
        },
        {
          role: 'user',
          content: `
            Question: ${query}
            
            Context from knowledge base:
            ${JSON.stringify(results, null, 2)}
            
            Provide a helpful answer summarizing the findings.
          `
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });
    
    return response.choices[0].message.content;
  }

  /**
   * Count occurrences by field
   */
  countByField(metadatas, field) {
    const counts = {};
    metadatas.forEach(m => {
      const value = m[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }
}

