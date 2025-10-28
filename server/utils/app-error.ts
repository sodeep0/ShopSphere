import { Logger } from './logger';

// Base application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, true, { resource, identifier });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, false, { originalError: originalError?.message });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(`External service error (${service}): ${message}`, 502, false, { 
      service, 
      originalError: originalError?.message 
    });
  }
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    context?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

// Success response interface
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId?: string;
  };
}

// Response utility functions
export function createErrorResponse(
  error: Error | AppError,
  requestId?: string
): ErrorResponse {
  const isAppError = error instanceof AppError;
  
  return {
    success: false,
    error: {
      message: error.message,
      code: isAppError ? error.constructor.name : 'InternalError',
      statusCode: isAppError ? error.statusCode : 500,
      context: isAppError ? error.context : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  meta?: Omit<SuccessResponse<T>['meta'], 'timestamp' | 'requestId'>,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

// Error handler middleware
export function createErrorHandler() {
  const logger = new Logger();

  return (error: Error, req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || req.logger?.context?.requestId;
    const requestLogger = req.logger || logger;

    // Log the error
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        requestLogger.error('Application error', error, {
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      } else {
        requestLogger.warn('Client error', {
          message: error.message,
          statusCode: error.statusCode,
          context: error.context,
          url: req.url,
          method: req.method,
        });
      }
    } else {
      requestLogger.error('Unexpected error', error, {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (error instanceof AppError) {
      const errorResponse = createErrorResponse(error, requestId);
      
      // In production, remove sensitive context
      if (!isDevelopment && error.statusCode >= 500) {
        errorResponse.error.context = undefined;
        errorResponse.error.message = 'Internal server error';
      }
      
      return res.status(error.statusCode).json(errorResponse);
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse(error, requestId);
    
    if (!isDevelopment) {
      errorResponse.error.message = 'Internal server error';
      errorResponse.error.context = undefined;
    }

    res.status(500).json(errorResponse);
  };
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation error formatter
export function formatValidationError(error: any): ValidationError {
  if (error.name === 'ZodError') {
    const issues = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    return new ValidationError('Validation failed', { issues });
  }
  
  return new ValidationError(error.message || 'Validation failed');
}

// Database error handler
export function handleDatabaseError(error: any): DatabaseError {
  // Common database error patterns
  if (error.code === '23505') { // Unique constraint violation
    return new ConflictError('Resource already exists', { 
      constraint: error.constraint,
      detail: error.detail 
    });
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return new ValidationError('Referenced resource does not exist', {
      constraint: error.constraint,
      detail: error.detail
    });
  }
  
  if (error.code === '23502') { // Not null constraint violation
    return new ValidationError('Required field is missing', {
      column: error.column,
      constraint: error.constraint
    });
  }
  
  // Generic database error
  return new DatabaseError('Database operation failed', error);
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  DatabaseError,
  ExternalServiceError,
  createErrorResponse,
  createSuccessResponse,
  createErrorHandler,
  asyncHandler,
  formatValidationError,
  handleDatabaseError,
};
