/**
 * Validation Middleware
 * Provides request validation utilities for MCP server endpoints
 */

const logger = require('../utils/logger');

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.statusCode = 400;
  }
}

/**
 * Validation utilities
 */
class ValidationUtils {
  /**
   * Check if value is required and not empty
   * @param {any} value - Value to check
   * @param {string} fieldName - Field name for error messages
   * @throws {ValidationError} If value is missing or empty
   */
  static required(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED_FIELD');
    }
  }

  /**
   * Validate string type and constraints
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name
   * @param {Object} options - Validation options
   * @throws {ValidationError} If validation fails
   */
  static string(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`, fieldName, 'INVALID_TYPE');
      }
      
      if (options.minLength && value.length < options.minLength) {
        throw new ValidationError(
          `${fieldName} must be at least ${options.minLength} characters long`,
          fieldName,
          'MIN_LENGTH'
        );
      }
      
      if (options.maxLength && value.length > options.maxLength) {
        throw new ValidationError(
          `${fieldName} must be at most ${options.maxLength} characters long`,
          fieldName,
          'MAX_LENGTH'
        );
      }
      
      if (options.pattern && !options.pattern.test(value)) {
        throw new ValidationError(
          `${fieldName} format is invalid`,
          fieldName,
          'INVALID_FORMAT'
        );
      }
    }
  }

  /**
   * Validate number type and constraints
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name
   * @param {Object} options - Validation options
   * @throws {ValidationError} If validation fails
   */
  static number(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        throw new ValidationError(`${fieldName} must be a valid number`, fieldName, 'INVALID_TYPE');
      }
      
      if (options.min !== undefined && numValue < options.min) {
        throw new ValidationError(
          `${fieldName} must be at least ${options.min}`,
          fieldName,
          'MIN_VALUE'
        );
      }
      
      if (options.max !== undefined && numValue > options.max) {
        throw new ValidationError(
          `${fieldName} must be at most ${options.max}`,
          fieldName,
          'MAX_VALUE'
        );
      }
      
      if (options.integer && !Number.isInteger(numValue)) {
        throw new ValidationError(
          `${fieldName} must be an integer`,
          fieldName,
          'INVALID_TYPE'
        );
      }
    }
  }

  /**
   * Validate boolean type
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If validation fails
   */
  static boolean(value, fieldName) {
    if (value !== undefined && value !== null && typeof value !== 'boolean') {
      throw new ValidationError(`${fieldName} must be a boolean`, fieldName, 'INVALID_TYPE');
    }
  }

  /**
   * Validate array type and constraints
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name
   * @param {Object} options - Validation options
   * @throws {ValidationError} If validation fails
   */
  static array(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`, fieldName, 'INVALID_TYPE');
      }
      
      if (options.minLength && value.length < options.minLength) {
        throw new ValidationError(
          `${fieldName} must contain at least ${options.minLength} items`,
          fieldName,
          'MIN_LENGTH'
        );
      }
      
      if (options.maxLength && value.length > options.maxLength) {
        throw new ValidationError(
          `${fieldName} must contain at most ${options.maxLength} items`,
          fieldName,
          'MAX_LENGTH'
        );
      }
    }
  }

  /**
   * Validate object type
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If validation fails
   */
  static object(value, fieldName) {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an object`, fieldName, 'INVALID_TYPE');
      }
    }
  }

  /**
   * Validate email format
   * @param {string} value - Email to validate
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If email is invalid
   */
  static email(value, fieldName) {
    if (value !== undefined && value !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new ValidationError(`${fieldName} must be a valid email address`, fieldName, 'INVALID_EMAIL');
      }
    }
  }

  /**
   * Validate URL format
   * @param {string} value - URL to validate
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If URL is invalid
   */
  static url(value, fieldName) {
    if (value !== undefined && value !== null) {
      try {
        new URL(value);
      } catch {
        throw new ValidationError(`${fieldName} must be a valid URL`, fieldName, 'INVALID_URL');
      }
    }
  }

  /**
   * Validate UUID format
   * @param {string} value - UUID to validate
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If UUID is invalid
   */
  static uuid(value, fieldName) {
    if (value !== undefined && value !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new ValidationError(`${fieldName} must be a valid UUID`, fieldName, 'INVALID_UUID');
      }
    }
  }

  /**
   * Validate date format
   * @param {string} value - Date to validate
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If date is invalid
   */
  static date(value, fieldName) {
    if (value !== undefined && value !== null) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new ValidationError(`${fieldName} must be a valid date`, fieldName, 'INVALID_DATE');
      }
    }
  }

  /**
   * Validate enum values
   * @param {any} value - Value to validate
   * @param {Array} allowedValues - Allowed values
   * @param {string} fieldName - Field name
   * @throws {ValidationError} If value is not in enum
   */
  static enum(value, allowedValues, fieldName) {
    if (value !== undefined && value !== null) {
      if (!allowedValues.includes(value)) {
        throw new ValidationError(
          `${fieldName} must be one of: ${allowedValues.join(', ')}`,
          fieldName,
          'INVALID_ENUM'
        );
      }
    }
  }
}

/**
 * Schema validator
 */
class SchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  /**
   * Validate data against schema
   * @param {Object} data - Data to validate
   * @returns {Object} Validated data
   * @throws {ValidationError} If validation fails
   */
  validate(data) {
    const errors = [];
    const validatedData = {};

    try {
      for (const [fieldName, rules] of Object.entries(this.schema)) {
        const value = data[fieldName];
        
        try {
          // Check required
          if (rules.required) {
            ValidationUtils.required(value, fieldName);
          }
          
          // Skip further validation if value is undefined/null and not required
          if (value === undefined || value === null) {
            if (rules.default !== undefined) {
              validatedData[fieldName] = rules.default;
            }
            continue;
          }
          
          // Type validation
          switch (rules.type) {
            case 'string':
              ValidationUtils.string(value, fieldName, rules);
              break;
            case 'number':
              ValidationUtils.number(value, fieldName, rules);
              validatedData[fieldName] = Number(value);
              continue;
            case 'boolean':
              ValidationUtils.boolean(value, fieldName);
              break;
            case 'array':
              ValidationUtils.array(value, fieldName, rules);
              break;
            case 'object':
              ValidationUtils.object(value, fieldName);
              break;
            case 'email':
              ValidationUtils.email(value, fieldName);
              break;
            case 'url':
              ValidationUtils.url(value, fieldName);
              break;
            case 'uuid':
              ValidationUtils.uuid(value, fieldName);
              break;
            case 'date':
              ValidationUtils.date(value, fieldName);
              break;
          }
          
          // Enum validation
          if (rules.enum) {
            ValidationUtils.enum(value, rules.enum, fieldName);
          }
          
          // Custom validation
          if (rules.custom && typeof rules.custom === 'function') {
            rules.custom(value, fieldName);
          }
          
          validatedData[fieldName] = value;
        } catch (error) {
          if (error instanceof ValidationError) {
            errors.push({
              field: error.field,
              message: error.message,
              code: error.code
            });
          } else {
            errors.push({
              field: fieldName,
              message: error.message,
              code: 'VALIDATION_ERROR'
            });
          }
        }
      }
      
      if (errors.length > 0) {
        const error = new ValidationError('Validation failed');
        error.errors = errors;
        throw error;
      }
      
      return validatedData;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Schema validation error', {
        error: error.message,
        schema: this.schema
      });
      
      throw new ValidationError('Schema validation failed');
    }
  }
}

/**
 * Express middleware for request validation
 * @param {Object} schema - Validation schema
 * @param {string} source - Source of data ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
function validateRequest(schema, source = 'body') {
  const validator = new SchemaValidator(schema);
  
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = validator.validate(data);
      
      // Replace original data with validated data
      req[source] = validatedData;
      
      logger.debug('Request validation passed', {
        source,
        fields: Object.keys(validatedData)
      });
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Request validation failed', {
          source,
          error: error.message,
          errors: error.errors
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: error.message,
          details: error.errors || [{
            field: error.field,
            message: error.message,
            code: error.code
          }]
        });
      }
      
      logger.error('Validation middleware error', {
        error: error.message
      });
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Validation processing failed'
      });
    }
  };
}

/**
 * Common validation schemas
 */
const commonSchemas = {
  // MCP Protocol schemas
  mcpRequest: {
    method: { type: 'string', required: true },
    params: { type: 'object', default: {} },
    id: { type: 'string' }
  },
  
  mcpResponse: {
    result: { type: 'object' },
    error: { type: 'object' },
    id: { type: 'string' }
  },
  
  // Memory operation schemas
  storeMemory: {
    key: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    data: { type: 'object', required: true },
    metadata: { type: 'object', default: {} },
    tags: { type: 'array', default: [] }
  },
  
  retrieveMemory: {
    key: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    includeMetadata: { type: 'boolean', default: true }
  },
  
  // Git operation schemas
  gitCommit: {
    message: { type: 'string', required: true, minLength: 1, maxLength: 500 },
    author: { type: 'object', default: {} },
    files: { type: 'array', default: [] }
  },
  
  gitClone: {
    url: { type: 'url', required: true },
    branch: { type: 'string', default: 'main' },
    depth: { type: 'number', integer: true, min: 1, default: 1 }
  },
  
  // Server management schemas
  serverConfig: {
    port: { type: 'number', integer: true, min: 1000, max: 65535, required: true },
    host: { type: 'string', default: 'localhost' },
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    enabled: { type: 'boolean', default: true }
  },
  
  // Pagination schema
  pagination: {
    page: { type: 'number', integer: true, min: 1, default: 1 },
    limit: { type: 'number', integer: true, min: 1, max: 100, default: 20 },
    sortBy: { type: 'string', default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
  }
};

module.exports = {
  ValidationError,
  ValidationUtils,
  SchemaValidator,
  validateRequest,
  commonSchemas
};