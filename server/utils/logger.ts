import winston from 'winston';
import { logging } from '../config/index';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: logging.level,
  format: logFormat,
  defaultMeta: { service: 'shopsphere-api' },
  transports: [],
});

// Add console transport if enabled
if (logging.enableConsole) {
  logger.add(new winston.transports.Console({
    format: logging.format === 'json' ? logFormat : consoleFormat,
  }));
}

// Add file transport if enabled
if (logging.enableFile) {
  logger.add(new winston.transports.File({
    filename: logging.logFile,
    maxsize: parseInt(logging.maxFileSize.replace(/[^0-9]/g, '')) * 1024 * 1024, // Convert '10m' to bytes
    maxFiles: logging.maxFiles,
    format: logFormat,
  }));
}

// Add error file transport
if (logging.enableFile) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: parseInt(logging.maxFileSize.replace(/[^0-9]/g, '')) * 1024 * 1024, // Convert '10m' to bytes
    maxFiles: logging.maxFiles,
    format: logFormat,
  }));
}

// Request context interface
export interface RequestContext {
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
}

// Enhanced logger with context support
export class Logger {
  private context: RequestContext = {};

  constructor(context: RequestContext = {}) {
    this.context = context;
  }

  // Create child logger with additional context
  child(additionalContext: Partial<RequestContext>): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  // Log methods with context
  debug(message: string, meta?: Record<string, unknown>): void {
    logger.debug(message, { ...this.context, ...meta });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, { ...this.context, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, { ...this.context, ...meta });
  }

  error(message: string, error?: Error | Record<string, unknown>, meta?: Record<string, unknown>): void {
    const errorMeta = error instanceof Error 
      ? { error: error.message, stack: error.stack, ...meta }
      : { ...error, ...meta };
    
    logger.error(message, { ...this.context, ...errorMeta });
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: Record<string, unknown>): void {
    this.info(`Performance: ${operation}`, { 
      operation, 
      duration, 
      ...meta 
    });
  }

  // Database query logging
  query(sql: string, duration: number, params?: unknown[]): void {
    this.debug('Database query', { 
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''), 
      duration,
      params: params ? params.slice(0, 5) : undefined // Log first 5 params only
    });
  }

  // API request logging
  request(method: string, url: string, statusCode: number, duration: number, meta?: Record<string, unknown>): void {
    this.info('API Request', {
      method,
      url,
      statusCode,
      duration,
      ...meta
    });
  }

  // Security event logging
  security(event: string, meta?: Record<string, unknown>): void {
    this.warn(`Security: ${event}`, meta);
  }

  // Business event logging
  business(event: string, meta?: Record<string, unknown>): void {
    this.info(`Business: ${event}`, meta);
  }
}

// Default logger instance
export const defaultLogger = new Logger();

// Utility functions for backward compatibility
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => defaultLogger.debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => defaultLogger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => defaultLogger.warn(message, meta),
  error: (message: string, error?: Error | Record<string, unknown>, meta?: Record<string, unknown>) => 
    defaultLogger.error(message, error, meta),
};

// Request logger middleware factory
export function createRequestLogger() {
  return (req: Request, res: Response, next: () => void) => {
    const start = Date.now();
    const requestLogger = new Logger({
      method: req.method,
      url: req.url,
      userAgent: (req as any).get('User-Agent'),
      ip: (req as any).ip || (req as any).connection?.remoteAddress,
      requestId: (req as any).headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Add logger to request object
    (req as any).logger = requestLogger;

    // Log request start
    requestLogger.info('Request started');

    // Override res.json to capture response
    const originalJson = (res as any).json.bind(res);
    (res as any).json = function(body: unknown) {
      const duration = Date.now() - start;
      
      // Log request completion
      requestLogger.request(req.method, req.url, (res as any).statusCode, duration, {
        responseSize: JSON.stringify(body).length,
      });

      return originalJson(body);
    };

    next();
  };
}

export default logger;
