import validator from 'validator';
import xss from 'xss';
import { createLogger } from 'winston';

const logger = createLogger({
  level: 'info',
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.json()
  )
});

export class InputValidator {
  constructor(options = {}) {
    this.config = {
      // General validation settings
      maxStringLength: options.maxStringLength || 10000,
      maxArrayLength: options.maxArrayLength || 1000,
      maxObjectDepth: options.maxObjectDepth || 10,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      
      // Allowed patterns
      allowedFileExtensions: options.allowedFileExtensions || [
        '.js', '.json', '.md', '.txt', '.yml', '.yaml', '.xml', '.csv'
      ],
      allowedMimeTypes: options.allowedMimeTypes || [
        'text/plain', 'application/json', 'text/markdown', 'text/xml'
      ],
      
      // Security settings
      enableXssProtection: options.enableXssProtection !== false,
      enableSqlInjectionProtection: options.enableSqlInjectionProtection !== false,
      enableCommandInjectionProtection: options.enableCommandInjectionProtection !== false,
      strictMode: options.strictMode || false,
      
      // Custom validation rules
      customRules: options.customRules || {},
      
      ...options
    };
    
    this.validationRules = this.setupValidationRules();
    this.securityPatterns = this.setupSecurityPatterns();
  }

  // Setup validation rules for different data types
  setupValidationRules() {
    return {
      // Git-related validations
      gitBranch: {
        pattern: /^[a-zA-Z0-9\-_./]+$/,
        maxLength: 255,
        description: 'Git branch name'
      },
      
      gitCommitHash: {
        pattern: /^[a-f0-9]{7,40}$/,
        maxLength: 40,
        description: 'Git commit hash'
      },
      
      gitPath: {
        pattern: /^[a-zA-Z0-9\-_./\\:]+$/,
        maxLength: 4096,
        description: 'Git file path'
      },
      
      // File system validations
      filename: {
        pattern: /^[a-zA-Z0-9\-_. ]+$/,
        maxLength: 255,
        description: 'Filename'
      },
      
      filepath: {
        pattern: /^[a-zA-Z0-9\-_./\\: ]+$/,
        maxLength: 4096,
        description: 'File path'
      },
      
      // Network validations
      url: {
        validator: (value) => validator.isURL(value, { protocols: ['http', 'https'] }),
        description: 'URL'
      },
      
      email: {
        validator: (value) => validator.isEmail(value),
        description: 'Email address'
      },
      
      ip: {
        validator: (value) => validator.isIP(value),
        description: 'IP address'
      },
      
      // Data format validations
      json: {
        validator: (value) => {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        },
        description: 'JSON string'
      },
      
      base64: {
        validator: (value) => validator.isBase64(value),
        description: 'Base64 string'
      },
      
      uuid: {
        validator: (value) => validator.isUUID(value),
        description: 'UUID'
      },
      
      // Numeric validations
      integer: {
        validator: (value) => validator.isInt(String(value)),
        description: 'Integer'
      },
      
      positiveInteger: {
        validator: (value) => validator.isInt(String(value), { min: 1 }),
        description: 'Positive integer'
      },
      
      float: {
        validator: (value) => validator.isFloat(String(value)),
        description: 'Float number'
      },
      
      // Text validations
      alphanumeric: {
        validator: (value) => validator.isAlphanumeric(value),
        description: 'Alphanumeric string'
      },
      
      ascii: {
        validator: (value) => validator.isAscii(value),
        description: 'ASCII string'
      },
      
      // Custom MCP validations
      mcpMethod: {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        maxLength: 100,
        description: 'MCP method name'
      },
      
      mcpId: {
        pattern: /^[a-zA-Z0-9\-_]+$/,
        maxLength: 100,
        description: 'MCP identifier'
      }
    };
  }

  // Setup security patterns for detecting malicious input
  setupSecurityPatterns() {
    return {
      // SQL injection patterns
      sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(--|\/\*|\*\/|;)/,
        /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
        /(\bONLOAD\s*=)/i,
        /(\b(EXEC|EXECUTE)\s*\()/i,
        /(\bUNION\s+SELECT)/i
      ],
      
      // Command injection patterns
      commandInjection: [
        /[;&|`$(){}[\]]/,
        /\b(rm|del|format|shutdown|reboot|kill|ps|ls|dir|cat|type|echo|curl|wget|nc|netcat|chmod|chown)\b/i,
        /(>|<|>>|<<|\|)/,
        /\$\{.*\}/,
        /`.*`/,
        /\$\(.*\)/,
        /\b(eval|exec|system|shell_exec|passthru|popen)\b/i
      ],
      
      // XSS patterns
      xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /onclick\s*=/i
      ],
      
      // Path traversal patterns
      pathTraversal: [
        /\.\./,
        /~\//,
        /\0/,
        /\%2e\%2e/i,
        /\%2f/i,
        /\%5c/i
      ],
      
      // LDAP injection patterns
      ldapInjection: [
        /\*\)/,
        /\|\|/,
        /&&/,
        /\(\|/,
        /\(&/
      ]
    };
  }

  // Main validation method
  validate(data, schema = {}) {
    const errors = [];
    const sanitized = {};
    
    try {
      const result = this.validateValue(data, schema, '', errors, sanitized);
      
      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: result,
        originalData: data
      };
    } catch (error) {
      logger.error('Validation error:', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        sanitizedData: null,
        originalData: data
      };
    }
  }

  // Validate individual value
  validateValue(value, schema, path = '', errors = [], sanitized = {}) {
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (schema.required) {
        errors.push(`${path || 'root'}: Required field is missing`);
      }
      return schema.default || null;
    }
    
    // Type validation
    if (schema.type) {
      if (!this.validateType(value, schema.type)) {
        errors.push(`${path || 'root'}: Expected type ${schema.type}, got ${typeof value}`);
        return null;
      }
    }
    
    // String validations
    if (typeof value === 'string') {
      return this.validateString(value, schema, path, errors);
    }
    
    // Number validations
    if (typeof value === 'number') {
      return this.validateNumber(value, schema, path, errors);
    }
    
    // Array validations
    if (Array.isArray(value)) {
      return this.validateArray(value, schema, path, errors);
    }
    
    // Object validations
    if (typeof value === 'object') {
      return this.validateObject(value, schema, path, errors);
    }
    
    return value;
  }

  // Validate data type
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      default:
        return true;
    }
  }

  // Validate string
  validateString(value, schema, path, errors) {
    let sanitized = value;
    
    // Length validation
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push(`${path}: String exceeds maximum length of ${schema.maxLength}`);
    }
    
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${path}: String is shorter than minimum length of ${schema.minLength}`);
    }
    
    // Pattern validation
    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push(`${path}: String does not match required pattern`);
    }
    
    // Rule-based validation
    if (schema.rule && this.validationRules[schema.rule]) {
      const rule = this.validationRules[schema.rule];
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${path}: Invalid ${rule.description}`);
      }
      
      if (rule.validator && !rule.validator(value)) {
        errors.push(`${path}: Invalid ${rule.description}`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${path}: ${rule.description} exceeds maximum length`);
      }
    }
    
    // Security validations
    if (this.config.enableXssProtection) {
      const xssResult = this.checkXss(value);
      if (!xssResult.safe) {
        errors.push(`${path}: Potential XSS detected`);
        this.logSecurityViolation('xss_attempt', { path, value: value.substring(0, 100) });
      }
      sanitized = xssResult.sanitized;
    }
    
    if (this.config.enableSqlInjectionProtection) {
      if (this.checkSqlInjection(value)) {
        errors.push(`${path}: Potential SQL injection detected`);
        this.logSecurityViolation('sql_injection_attempt', { path, value: value.substring(0, 100) });
      }
    }
    
    if (this.config.enableCommandInjectionProtection) {
      if (this.checkCommandInjection(value)) {
        errors.push(`${path}: Potential command injection detected`);
        this.logSecurityViolation('command_injection_attempt', { path, value: value.substring(0, 100) });
      }
    }
    
    // Path traversal check for path-like strings
    if (schema.rule === 'filepath' || schema.rule === 'gitPath') {
      if (this.checkPathTraversal(value)) {
        errors.push(`${path}: Path traversal attempt detected`);
        this.logSecurityViolation('path_traversal_attempt', { path, value });
      }
    }
    
    return sanitized;
  }

  // Validate number
  validateNumber(value, schema, path, errors) {
    if (schema.min !== undefined && value < schema.min) {
      errors.push(`${path}: Number is less than minimum value of ${schema.min}`);
    }
    
    if (schema.max !== undefined && value > schema.max) {
      errors.push(`${path}: Number exceeds maximum value of ${schema.max}`);
    }
    
    if (schema.multipleOf && value % schema.multipleOf !== 0) {
      errors.push(`${path}: Number must be a multiple of ${schema.multipleOf}`);
    }
    
    return value;
  }

  // Validate array
  validateArray(value, schema, path, errors) {
    if (schema.maxItems && value.length > schema.maxItems) {
      errors.push(`${path}: Array exceeds maximum length of ${schema.maxItems}`);
    }
    
    if (schema.minItems && value.length < schema.minItems) {
      errors.push(`${path}: Array is shorter than minimum length of ${schema.minItems}`);
    }
    
    // Validate array items
    if (schema.items) {
      return value.map((item, index) => 
        this.validateValue(item, schema.items, `${path}[${index}]`, errors)
      );
    }
    
    return value;
  }

  // Validate object
  validateObject(value, schema, path, errors) {
    const sanitized = {};
    
    // Validate object properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const propPath = path ? `${path}.${key}` : key;
        sanitized[key] = this.validateValue(value[key], propSchema, propPath, errors);
      }
    }
    
    // Check for additional properties
    if (schema.additionalProperties === false) {
      const allowedKeys = Object.keys(schema.properties || {});
      const extraKeys = Object.keys(value).filter(key => !allowedKeys.includes(key));
      
      if (extraKeys.length > 0) {
        errors.push(`${path}: Additional properties not allowed: ${extraKeys.join(', ')}`);
      }
    }
    
    return sanitized;
  }

  // Check for XSS patterns
  checkXss(input) {
    let sanitized = input;
    let safe = true;
    
    // Check for XSS patterns
    for (const pattern of this.securityPatterns.xss) {
      if (pattern.test(input)) {
        safe = false;
        break;
      }
    }
    
    // Sanitize if XSS protection is enabled
    if (this.config.enableXssProtection) {
      sanitized = xss(input, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style']
      });
    }
    
    return { safe, sanitized };
  }

  // Check for SQL injection patterns
  checkSqlInjection(input) {
    return this.securityPatterns.sqlInjection.some(pattern => pattern.test(input));
  }

  // Check for command injection patterns
  checkCommandInjection(input) {
    return this.securityPatterns.commandInjection.some(pattern => pattern.test(input));
  }

  // Check for path traversal patterns
  checkPathTraversal(input) {
    return this.securityPatterns.pathTraversal.some(pattern => pattern.test(input));
  }

  // Log security violations
  logSecurityViolation(type, details) {
    logger.warn(`Security violation detected: ${type}`, details);
  }

  // Create validation middleware for Express
  createMiddleware(schema) {
    return (req, res, next) => {
      const validation = this.validate(req.body, schema);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validation.errors,
          message: 'The request contains invalid or potentially malicious data'
        });
      }
      
      // Replace request body with sanitized data
      req.body = validation.sanitizedData;
      req.validationResult = validation;
      
      next();
    };
  }

  // Validate MCP request
  validateMcpRequest(request) {
    const schema = {
      type: 'object',
      required: ['method'],
      properties: {
        method: {
          type: 'string',
          rule: 'mcpMethod'
        },
        params: {
          type: 'object',
          additionalProperties: true
        },
        id: {
          type: 'string',
          rule: 'mcpId'
        }
      }
    };
    
    return this.validate(request, schema);
  }

  // Validate Git operation parameters
  validateGitParams(params, operation) {
    const schemas = {
      getBranch: {
        type: 'object',
        properties: {
          path: { type: 'string', rule: 'gitPath' }
        }
      },
      
      getCommits: {
        type: 'object',
        properties: {
          path: { type: 'string', rule: 'gitPath' },
          limit: { type: 'number', min: 1, max: 1000 },
          branch: { type: 'string', rule: 'gitBranch' }
        }
      },
      
      getCommitDetails: {
        type: 'object',
        required: ['hash'],
        properties: {
          hash: { type: 'string', rule: 'gitCommitHash' },
          path: { type: 'string', rule: 'gitPath' }
        }
      },
      
      getFileContent: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', rule: 'gitPath' },
          branch: { type: 'string', rule: 'gitBranch' }
        }
      }
    };
    
    const schema = schemas[operation];
    if (!schema) {
      return {
        isValid: false,
        errors: [`Unknown Git operation: ${operation}`],
        sanitizedData: null
      };
    }
    
    return this.validate(params, schema);
  }

  // Get validation statistics
  getValidationStats() {
    return {
      rulesCount: Object.keys(this.validationRules).length,
      securityPatternsCount: Object.values(this.securityPatterns).reduce((sum, patterns) => sum + patterns.length, 0),
      config: {
        xssProtection: this.config.enableXssProtection,
        sqlInjectionProtection: this.config.enableSqlInjectionProtection,
        commandInjectionProtection: this.config.enableCommandInjectionProtection,
        strictMode: this.config.strictMode
      }
    };
  }
}

export default InputValidator;