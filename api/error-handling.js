/**
 * TripleThink API Error Handling System
 * Standardized error types and handlers for consistent API responses
 */

// ============================================================
// ERROR CODES AND TYPES
// ============================================================

const ErrorCodes = {
  // Client Errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',           // 400 - Invalid input
  UNAUTHORIZED: 'UNAUTHORIZED',                    // 401 - Auth required
  FORBIDDEN: 'FORBIDDEN',                          // 403 - Insufficient permissions
  NOT_FOUND: 'NOT_FOUND',                          // 404 - Resource not found
  CONFLICT: 'CONFLICT',                            // 409 - Resource conflict

  // Domain-Specific Errors (422 - Unprocessable Entity)
  EPISTEMIC_VIOLATION: 'EPISTEMIC_VIOLATION',      // Character knowledge conflict
  TEMPORAL_INCONSISTENCY: 'TEMPORAL_INCONSISTENCY', // Timeline conflict
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',     // Business rule violation
  FICTION_SCOPE_VIOLATION: 'FICTION_SCOPE_VIOLATION', // Fiction audience violation
  CAUSAL_VIOLATION: 'CAUSAL_VIOLATION',            // Causal link conflict

  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',                // 500 - Unexpected error
  DATABASE_ERROR: 'DATABASE_ERROR',                // 500 - DB operation failed
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'       // 503 - Service temporarily unavailable
};

// ============================================================
// BASE ERROR CLASS
// ============================================================

/**
 * Base error class for all TripleThink API errors
 */
class TripleThinkError extends Error {
  constructor(code, message, details = null, suggestion = null) {
    super(message);
    this.name = 'TripleThinkError';
    this.code = code;
    this.details = details;
    this.suggestion = suggestion;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get HTTP status code for this error
   */
  getStatusCode() {
    const statusMap = {
      [ErrorCodes.VALIDATION_ERROR]: 400,
      [ErrorCodes.UNAUTHORIZED]: 401,
      [ErrorCodes.FORBIDDEN]: 403,
      [ErrorCodes.NOT_FOUND]: 404,
      [ErrorCodes.CONFLICT]: 409,
      [ErrorCodes.EPISTEMIC_VIOLATION]: 422,
      [ErrorCodes.TEMPORAL_INCONSISTENCY]: 422,
      [ErrorCodes.CONSTRAINT_VIOLATION]: 422,
      [ErrorCodes.FICTION_SCOPE_VIOLATION]: 422,
      [ErrorCodes.CAUSAL_VIOLATION]: 422,
      [ErrorCodes.INTERNAL_ERROR]: 500,
      [ErrorCodes.DATABASE_ERROR]: 500,
      [ErrorCodes.SERVICE_UNAVAILABLE]: 503
    };
    return statusMap[this.code] || 500;
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    const response = {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp
      }
    };

    if (this.details) {
      response.error.details = this.details;
    }

    if (this.suggestion) {
      response.error.suggestion = this.suggestion;
    }

    return response;
  }
}

// ============================================================
// SPECIFIC ERROR CLASSES
// ============================================================

/**
 * Validation error - invalid input data
 */
class ValidationError extends TripleThinkError {
  constructor(message, details = null) {
    super(
      ErrorCodes.VALIDATION_ERROR,
      message,
      details,
      'Check the request body and parameters for correct format and required fields'
    );
    this.name = 'ValidationError';
  }
}

/**
 * Not found error - resource doesn't exist
 */
class NotFoundError extends TripleThinkError {
  constructor(resourceType, resourceId) {
    super(
      ErrorCodes.NOT_FOUND,
      `${resourceType} not found: ${resourceId}`,
      { resource_type: resourceType, resource_id: resourceId },
      `Verify the ${resourceType.toLowerCase()} ID is correct and exists in the database`
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Epistemic violation - character knowledge state conflict
 */
class EpistemicViolationError extends TripleThinkError {
  constructor(characterId, factId, timestamp, violation, details = {}) {
    super(
      ErrorCodes.EPISTEMIC_VIOLATION,
      `Character knowledge state conflict: ${violation}`,
      {
        character_id: characterId,
        fact_id: factId,
        timestamp: timestamp,
        violation: violation,
        ...details
      },
      'Check the character\'s knowledge state timeline and fiction audience constraints'
    );
    this.name = 'EpistemicViolationError';
  }
}

/**
 * Temporal inconsistency - timeline conflict
 */
class TemporalInconsistencyError extends TripleThinkError {
  constructor(entityId, conflict, details = {}) {
    super(
      ErrorCodes.TEMPORAL_INCONSISTENCY,
      `Timeline inconsistency: ${conflict}`,
      {
        entity_id: entityId,
        conflict: conflict,
        ...details
      },
      'Verify event timestamps and causal ordering are consistent'
    );
    this.name = 'TemporalInconsistencyError';
  }
}

/**
 * Constraint violation - business rule violation
 */
class ConstraintViolationError extends TripleThinkError {
  constructor(constraint, message, details = {}) {
    super(
      ErrorCodes.CONSTRAINT_VIOLATION,
      message,
      {
        constraint: constraint,
        ...details
      },
      'Review the constraint rules for this entity type'
    );
    this.name = 'ConstraintViolationError';
  }
}

/**
 * Fiction scope violation - fiction audience violation
 */
class FictionScopeViolationError extends TripleThinkError {
  constructor(fictionId, targetAudience, violatingCharacterId, violation) {
    super(
      ErrorCodes.FICTION_SCOPE_VIOLATION,
      `Fiction scope violation: ${violation}`,
      {
        fiction_id: fictionId,
        target_audience: targetAudience,
        violating_character_id: violatingCharacterId,
        violation: violation
      },
      'Fiction target audiences must not be expanded without explicit design. Check who should know about this fiction.'
    );
    this.name = 'FictionScopeViolationError';
  }
}

/**
 * Causal violation - causal link conflict
 */
class CausalViolationError extends TripleThinkError {
  constructor(causeEventId, effectEventId, violation) {
    super(
      ErrorCodes.CAUSAL_VIOLATION,
      `Causal link violation: ${violation}`,
      {
        cause_event_id: causeEventId,
        effect_event_id: effectEventId,
        violation: violation
      },
      'Effects cannot precede their causes. Check event timestamps.'
    );
    this.name = 'CausalViolationError';
  }
}

/**
 * Database error - DB operation failed
 */
class DatabaseError extends TripleThinkError {
  constructor(operation, originalError) {
    super(
      ErrorCodes.DATABASE_ERROR,
      `Database operation failed: ${operation}`,
      {
        operation: operation,
        original_message: originalError?.message
      },
      'This may be a transient error. Try again or check database connection.'
    );
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  };

  console.error('[ERROR]', JSON.stringify(logEntry));

  // Handle TripleThink errors
  if (err instanceof TripleThinkError) {
    return res.status(err.getStatusCode()).json(err.toJSON());
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString(),
        suggestion: 'Ensure the request body is valid JSON'
      }
    });
  }

  // Handle SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    const response = {
      error: {
        code: ErrorCodes.CONSTRAINT_VIOLATION,
        message: 'Database constraint violation',
        timestamp: new Date().toISOString(),
        details: { original_message: err.message },
        suggestion: 'Check for duplicate IDs or foreign key references'
      }
    };
    return res.status(422).json(response);
  }

  // Handle SQLite foreign key errors
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    const response = {
      error: {
        code: ErrorCodes.CONSTRAINT_VIOLATION,
        message: 'Foreign key constraint violation',
        timestamp: new Date().toISOString(),
        details: { original_message: err.message },
        suggestion: 'Referenced entity does not exist'
      }
    };
    return res.status(422).json(response);
  }

  // Generic error fallback
  const response = {
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      timestamp: new Date().toISOString()
    }
  };

  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  return res.status(500).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler for unmatched routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      suggestion: 'Check the API documentation for available endpoints'
    }
  });
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate required fields in request body
 */
function validateRequired(body, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing_fields: missing }
    );
  }
}

/**
 * Validate ID format (must be prefixed string)
 */
function validateId(id, expectedPrefix) {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`Invalid ID: ${id}`);
  }

  if (expectedPrefix && !id.startsWith(expectedPrefix)) {
    throw new ValidationError(
      `Invalid ID format: expected ${expectedPrefix}-* prefix`,
      { id: id, expected_prefix: expectedPrefix }
    );
  }
}

/**
 * Validate timestamp format
 */
function validateTimestamp(timestamp, fieldName = 'timestamp') {
  if (!timestamp) return;

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new ValidationError(
      `Invalid ${fieldName}: must be ISO 8601 format`,
      { field: fieldName, value: timestamp }
    );
  }
}

/**
 * Validate entity type
 */
function validateEntityType(type) {
  const validTypes = ['event', 'character', 'object', 'location', 'system', 'fiction'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(
      `Invalid entity type: ${type}`,
      { valid_types: validTypes }
    );
  }
}

/**
 * Validate metadata mode
 */
function validateMetadataMode(mode) {
  const validModes = ['auto', 'always', 'never'];
  if (mode && !validModes.includes(mode)) {
    throw new ValidationError(
      `Invalid include_metadata value: ${mode}`,
      { valid_values: validModes }
    );
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Error codes enum
  ErrorCodes,

  // Error classes
  TripleThinkError,
  ValidationError,
  NotFoundError,
  EpistemicViolationError,
  TemporalInconsistencyError,
  ConstraintViolationError,
  FictionScopeViolationError,
  CausalViolationError,
  DatabaseError,

  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,

  // Validators
  validateRequired,
  validateId,
  validateTimestamp,
  validateEntityType,
  validateMetadataMode
};
