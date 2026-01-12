/**
 * BaseRepository
 * Base class for all Cosmos DB repositories
 * Provides shared utilities and common patterns
 */

class BaseRepository {
  /**
   * @param {Database} database - Cosmos DB database instance
   * @param {object} containerConfig - Container configuration object
   */
  constructor(database, containerConfig) {
    if (!database) {
      throw new Error('Database instance is required');
    }
    this.database = database;
    this.containerConfig = containerConfig || {};
    this.containers = {};
  }

  /**
   * Get a container reference by logical name
   * @param {string} name - Container name from configuration
   * @returns {Container} Cosmos DB container instance
   */
  getContainer(name) {
    // Cache container references
    if (!this.containers[name]) {
      const config = this.containerConfig[name];
      if (!config) {
        throw new Error(`Container '${name}' not found in configuration`);
      }
      this.containers[name] = this.database.container(config.name);
    }
    return this.containers[name];
  }

  /**
   * Clean Cosmos DB metadata from documents
   * Removes internal Cosmos fields: _rid, _self, _etag, _attachments, _ts
   * @param {object} doc - Document with Cosmos metadata
   * @returns {object} Document without Cosmos metadata
   */
  cleanMetadata(doc) {
    if (!doc) return doc;
    const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
    return clean;
  }

  /**
   * Log write operations for debugging and monitoring
   * @param {string} containerName - Container name
   * @param {string} partitionKey - Partition key value
   * @param {string} id - Document ID
   * @param {string} operation - Operation type (upsert, delete, etc.)
   * @param {object} metadata - Additional metadata to log
   */
  logWrite(containerName, partitionKey, id, operation, metadata = {}) {
    console.log('💾 WRITE:', {
      container: containerName,
      partitionKey,
      id,
      operation,
      ...metadata
    });
  }

  /**
   * Handle common read errors (404 = not found)
   * @param {Error} error - Error from Cosmos DB
   * @param {*} defaultValue - Value to return if not found (default: null)
   * @returns {*} Default value if 404, otherwise throws
   */
  handleReadError(error, defaultValue = null) {
    if (error.code === 404 || error.code === 'NotFound') {
      return defaultValue;
    }
    throw error;
  }

  /**
   * Add timestamp fields to a document
   * @param {object} doc - Document to add timestamps to
   * @param {boolean} isNew - Whether this is a new document (adds createdAt)
   * @returns {object} Document with timestamps
   */
  addTimestamps(doc, isNew = false) {
    const now = new Date().toISOString();
    if (isNew) {
      doc.createdAt = now;
    }
    doc.updatedAt = now;
    return doc;
  }
}

module.exports = BaseRepository;
