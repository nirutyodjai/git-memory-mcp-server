/**
 * Semantic Memory Service for MCP Protocol
 * Handles vector-based semantic search and memory indexing
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const GitMemoryService = require('./GitMemoryService');

// Simple vector operations for semantic similarity
class VectorUtils {
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vectorA - First vector
   * @param {Array<number>} vectorB - Second vector
   * @returns {number} Cosine similarity score (0-1)
   */
  static cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate a simple text embedding using TF-IDF-like approach
   * @param {string} text - Text to embed
   * @param {Object} vocabulary - Vocabulary for embedding
   * @returns {Array<number>} Text embedding vector
   */
  static generateTextEmbedding(text, vocabulary) {
    const words = text.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const vector = new Array(vocabulary.size).fill(0);
    
    Object.entries(wordCounts).forEach(([word, count]) => {
      const index = vocabulary.wordToIndex[word];
      if (index !== undefined) {
        // Simple TF-IDF calculation
        const tf = count / words.length;
        const idf = Math.log(vocabulary.totalDocuments / (vocabulary.documentFreq[word] || 1));
        vector[index] = tf * idf;
      }
    });

    return vector;
  }
}

class SemanticMemoryService {
  constructor() {
    this.gitMemoryService = new GitMemoryService();
    this.indexPath = path.join(process.cwd(), 'data', 'semantic_index');
    this.vocabularyPath = path.join(this.indexPath, 'vocabulary.json');
    this.indexFilePath = path.join(this.indexPath, 'index.json');
    this.vocabulary = null;
    this.index = null;
    this.stats = {
      indexed_documents: 0,
      vocabulary_size: 0,
      last_rebuild: null,
      search_count: 0
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the Semantic Memory Service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.initializeIndex();
      this.isInitialized = true;
      logger.info('Semantic Memory Service initialized successfully');
    } catch (error) {
       logger.error('Failed to initialize Semantic Memory Service', {
         error: error.message
       });
       throw error;
     }
   }

  /**
   * Initialize the semantic index directory and files
   */
  async initializeIndex() {
    try {
      await fs.mkdir(this.indexPath, { recursive: true });
      
      // Load existing vocabulary and index
      await this.loadVocabulary();
      await this.loadIndex();
      
      logger.info('Semantic memory service initialized', {
        vocabulary_size: this.vocabulary?.size || 0,
        indexed_documents: this.stats.indexed_documents
      });
    } catch (error) {
      logger.error('Failed to initialize semantic index', { error: error.message });
    }
  }

  /**
   * Load vocabulary from disk
   */
  async loadVocabulary() {
    try {
      const vocabularyData = await fs.readFile(this.vocabularyPath, 'utf8');
      this.vocabulary = JSON.parse(vocabularyData);
      this.stats.vocabulary_size = this.vocabulary.size;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create empty vocabulary
        this.vocabulary = {
          wordToIndex: {},
          indexToWord: {},
          documentFreq: {},
          totalDocuments: 0,
          size: 0
        };
        await this.saveVocabulary();
      } else {
        logger.error('Failed to load vocabulary', { error: error.message });
        throw error;
      }
    }
  }

  /**
   * Save vocabulary to disk
   */
  async saveVocabulary() {
    try {
      await fs.writeFile(
        this.vocabularyPath,
        JSON.stringify(this.vocabulary, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Failed to save vocabulary', { error: error.message });
      throw error;
    }
  }

  /**
   * Load semantic index from disk
   */
  async loadIndex() {
    try {
      const indexData = await fs.readFile(this.indexFilePath, 'utf8');
      this.index = JSON.parse(indexData);
      this.stats.indexed_documents = Object.keys(this.index).length;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create empty index
        this.index = {};
        await this.saveIndex();
      } else {
        logger.error('Failed to load semantic index', { error: error.message });
        throw error;
      }
    }
  }

  /**
   * Save semantic index to disk
   */
  async saveIndex() {
    try {
      await fs.writeFile(
        this.indexFilePath,
        JSON.stringify(this.index, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Failed to save semantic index', { error: error.message });
      throw error;
    }
  }

  /**
   * Build vocabulary from text corpus
   * @param {Array<Object>} documents - Array of documents with text content
   */
  buildVocabulary(documents) {
    const wordFreq = {};
    const docWordSets = [];

    // Count word frequencies and document frequencies
    documents.forEach(doc => {
      const text = this.extractTextFromDocument(doc);
      const words = text.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

      const uniqueWords = new Set(words);
      docWordSets.push(uniqueWords);

      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    // Filter words by frequency (remove very rare and very common words)
    const minFreq = Math.max(1, Math.floor(documents.length * 0.01)); // At least 1% of documents
    const maxFreq = Math.floor(documents.length * 0.8); // At most 80% of documents
    
    const filteredWords = Object.entries(wordFreq)
      .filter(([word, freq]) => freq >= minFreq && freq <= maxFreq)
      .sort((a, b) => b[1] - a[1]) // Sort by frequency
      .slice(0, 10000) // Limit vocabulary size
      .map(([word]) => word);

    // Build vocabulary mappings
    const vocabulary = {
      wordToIndex: {},
      indexToWord: {},
      documentFreq: {},
      totalDocuments: documents.length,
      size: filteredWords.length
    };

    filteredWords.forEach((word, index) => {
      vocabulary.wordToIndex[word] = index;
      vocabulary.indexToWord[index] = word;
    });

    // Calculate document frequencies
    docWordSets.forEach(wordSet => {
      wordSet.forEach(word => {
        if (vocabulary.wordToIndex[word] !== undefined) {
          vocabulary.documentFreq[word] = (vocabulary.documentFreq[word] || 0) + 1;
        }
      });
    });

    this.vocabulary = vocabulary;
    this.stats.vocabulary_size = vocabulary.size;
  }

  /**
   * Extract text content from a document object
   * @param {Object} document - Document object
   * @returns {string} Extracted text
   */
  extractTextFromDocument(document) {
    let text = '';
    
    if (typeof document.data === 'string') {
      text += document.data + ' ';
    } else if (typeof document.data === 'object') {
      text += JSON.stringify(document.data) + ' ';
    }
    
    if (document.metadata) {
      if (document.metadata.title) text += document.metadata.title + ' ';
      if (document.metadata.description) text += document.metadata.description + ' ';
      if (document.metadata.tags) {
        text += document.metadata.tags.join(' ') + ' ';
      }
    }
    
    return text.trim();
  }

  /**
   * Index a single document
   * @param {string} key - Document key
   * @param {Object} document - Document to index
   */
  indexDocument(key, document) {
    if (!this.vocabulary || this.vocabulary.size === 0) {
      logger.warn('Cannot index document: vocabulary not built');
      return;
    }

    const text = this.extractTextFromDocument(document);
    const embedding = VectorUtils.generateTextEmbedding(text, this.vocabulary);
    
    this.index[key] = {
      key,
      embedding,
      text_preview: text.substring(0, 200),
      metadata: document.metadata || {},
      indexed_at: new Date().toISOString()
    };
  }

  /**
   * Perform semantic search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    try {
      this.stats.search_count++;
      
      const {
        limit = 10,
        threshold = 0.1,
        includeMetadata = true,
        tags = null
      } = options;

      if (!this.vocabulary || !this.index || Object.keys(this.index).length === 0) {
        logger.warn('Semantic search attempted with empty index');
        return [];
      }

      // Generate query embedding
      const queryEmbedding = VectorUtils.generateTextEmbedding(query, this.vocabulary);
      
      // Calculate similarities
      const results = [];
      
      for (const [key, indexEntry] of Object.entries(this.index)) {
        try {
          const similarity = VectorUtils.cosineSimilarity(queryEmbedding, indexEntry.embedding);
          
          if (similarity >= threshold) {
            // Get full document from git memory
            const document = await this.gitMemoryService.retrieve(key);
            
            if (document) {
              // Filter by tags if specified
              if (tags && tags.length > 0) {
                const docTags = document.metadata?.tags || [];
                const hasMatchingTag = tags.some(tag => Array.isArray(docTags) && docTags.includes(tag));
                if (!hasMatchingTag) continue;
              }
              
              const result = {
                key,
                similarity: parseFloat(similarity.toFixed(4)),
                data: document.data,
                text_preview: indexEntry.text_preview
              };
              
              if (includeMetadata) {
                result.metadata = document.metadata;
                result.indexed_at = indexEntry.indexed_at;
              }
              
              results.push(result);
            }
          }
        } catch (error) {
          logger.error('Error processing search result', {
            key,
            error: error.message
          });
        }
      }
      
      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      
      logger.info('Semantic search completed', {
        query,
        results_count: results.length,
        threshold,
        limit
      });
      
      return results.slice(0, limit);
    } catch (error) {
      logger.error('Semantic search failed', {
        query,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Rebuild the entire semantic index
   * @param {Object} options - Rebuild options
   * @returns {Promise<Object>} Rebuild result
   */
  async rebuildIndex(options = {}) {
    try {
      const { forceRebuild = false, batchSize = 100 } = options;
      const startTime = Date.now();
      
      logger.info('Starting semantic index rebuild', {
        force_rebuild: forceRebuild,
        batch_size: batchSize
      });
      
      // Get all documents from git memory
      const allDocuments = await this.gitMemoryService.list({ limit: 10000 });
      
      if (allDocuments.length === 0) {
        logger.warn('No documents found for indexing');
        return {
          indexed_count: 0,
          duration: Date.now() - startTime,
          vocabulary_size: 0
        };
      }
      
      // Build vocabulary from all documents
      this.buildVocabulary(allDocuments);
      await this.saveVocabulary();
      
      // Clear existing index if force rebuild
      if (forceRebuild) {
        this.index = {};
      }
      
      // Index documents in batches
      let indexedCount = 0;
      
      for (let i = 0; i < allDocuments.length; i += batchSize) {
        const batch = allDocuments.slice(i, i + batchSize);
        
        for (const document of batch) {
          this.indexDocument(document.key, document);
          indexedCount++;
        }
        
        // Save progress periodically
        if (indexedCount % (batchSize * 5) === 0) {
          await this.saveIndex();
          logger.info('Index rebuild progress', {
            indexed: indexedCount,
            total: allDocuments.length,
            progress: `${((indexedCount / allDocuments.length) * 100).toFixed(1)}%`
          });
        }
      }
      
      // Save final index
      await this.saveIndex();
      
      this.stats.indexed_documents = indexedCount;
      this.stats.last_rebuild = new Date().toISOString();
      
      const duration = Date.now() - startTime;
      
      logger.info('Semantic index rebuild completed', {
        indexed_count: indexedCount,
        vocabulary_size: this.vocabulary.size,
        duration: `${duration}ms`
      });
      
      return {
        indexed_count: indexedCount,
        vocabulary_size: this.vocabulary.size,
        duration,
        completed_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Semantic index rebuild failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Add or update a document in the semantic index
   * @param {string} key - Document key
   * @param {Object} document - Document to index
   * @returns {Promise<void>}
   */
  async addToIndex(key, document) {
    try {
      // If vocabulary is empty, we need to rebuild the entire index
      if (!this.vocabulary || this.vocabulary.size === 0) {
        logger.info('Vocabulary empty, triggering index rebuild');
        await this.rebuildIndex();
        return;
      }
      
      this.indexDocument(key, document);
      await this.saveIndex();
      
      this.stats.indexed_documents = Object.keys(this.index).length;
      
      logger.debug('Document added to semantic index', { key });
    } catch (error) {
      logger.error('Failed to add document to semantic index', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Remove a document from the semantic index
   * @param {string} key - Document key to remove
   * @returns {Promise<void>}
   */
  async removeFromIndex(key) {
    try {
      if (this.index && this.index[key]) {
        delete this.index[key];
        await this.saveIndex();
        
        this.stats.indexed_documents = Object.keys(this.index).length;
        
        logger.debug('Document removed from semantic index', { key });
      }
    } catch (error) {
      logger.error('Failed to remove document from semantic index', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if the service is healthy
   * @returns {Promise<boolean>} Health status
   */
  async isHealthy() {
    try {
      // Check if vocabulary and index are initialized
      if (!this.vocabulary || this.vocabulary.size === 0) {
        logger.debug('SemanticMemoryService: Vocabulary not initialized');
        return false;
      }
      
      if (!this.index || Object.keys(this.index).length === 0) {
        logger.debug('SemanticMemoryService: Index not initialized');
        return false;
      }
      
      // Test basic search functionality
      const testResults = await this.search('test', { limit: 1, threshold: 0.1 });
      
      return true;
    } catch (error) {
      logger.error('SemanticMemoryService health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get semantic memory service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      ...this.stats,
      index_size_mb: this.index ? 
        (JSON.stringify(this.index).length / 1024 / 1024).toFixed(2) : 0,
      vocabulary_size_mb: this.vocabulary ? 
        (JSON.stringify(this.vocabulary).length / 1024 / 1024).toFixed(2) : 0
    };
  }
}

module.exports = SemanticMemoryService;