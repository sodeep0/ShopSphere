import { Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse, AppError } from './app-error';

// Response helper class
export class ResponseHelper {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  // Success responses
  success<T>(data: T, statusCode: number = 200, meta?: Record<string, unknown>): void {
    const requestId = this.getRequestId();
    const response = createSuccessResponse(data, meta, requestId);
    this.res.status(statusCode).json(response);
  }

  created<T>(data: T, meta?: Record<string, unknown>): void {
    this.success(data, 201, meta);
  }

  // Paginated response
  paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    statusCode: number = 200
  ): void {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const meta = {
      pagination: {
        ...pagination,
        totalPages,
      },
    };
    this.success(data, statusCode, meta);
  }

  // Error responses
  error(error: Error | AppError, statusCode?: number): void {
    const requestId = this.getRequestId();
    const errorResponse = createErrorResponse(error, requestId);
    
    // Override status code if provided
    if (statusCode) {
      errorResponse.error.statusCode = statusCode;
    }
    
    this.res.status(errorResponse.error.statusCode).json(errorResponse);
  }

  badRequest(message: string, context?: Record<string, unknown>): void {
    const error = new AppError(message, 400, true, context);
    this.error(error);
  }

  unauthorized(message: string = 'Unauthorized'): void {
    const error = new AppError(message, 401);
    this.error(error);
  }

  forbidden(message: string = 'Forbidden'): void {
    const error = new AppError(message, 403);
    this.error(error);
  }

  notFound(resource: string, identifier?: string): void {
    const error = new AppError(
      identifier 
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`,
      404
    );
    this.error(error);
  }

  conflict(message: string, context?: Record<string, unknown>): void {
    const error = new AppError(message, 409, true, context);
    this.error(error);
  }

  tooManyRequests(message: string = 'Too many requests'): void {
    const error = new AppError(message, 429);
    this.error(error);
  }

  internalError(message: string = 'Internal server error'): void {
    const error = new AppError(message, 500);
    this.error(error);
  }

  // Validation error response
  validationError(message: string, errors?: unknown[]): void {
    const error = new AppError(message, 400, true, { errors });
    this.error(error);
  }

  // File upload response
  fileUploaded(fileInfo: {
    filename: string;
    size: number;
    url: string;
    mimeType: string;
  }): void {
    this.created(fileInfo, {
      message: 'File uploaded successfully',
    });
  }

  // Bulk operation response
  bulkOperation(
    operation: string,
    results: {
      total: number;
      successful: number;
      failed: number;
      errors?: string[];
    }
  ): void {
    const data = {
      operation,
      ...results,
    };
    
    const statusCode = results.failed > 0 ? 207 : 200; // 207 Multi-Status for partial success
    this.success(data, statusCode, {
      message: `${operation} completed: ${results.successful} successful, ${results.failed} failed`,
    });
  }

  // Analytics response
  analytics<T>(data: T, type: string): void {
    this.success(data, 200, {
      analyticsType: type,
      generatedAt: new Date().toISOString(),
    });
  }

  // Health check response
  healthCheck(status: 'healthy' | 'unhealthy', details?: Record<string, unknown>): void {
    const data = {
      status,
      timestamp: new Date().toISOString(),
      ...details,
    };
    
    const statusCode = status === 'healthy' ? 200 : 503;
    this.res.status(statusCode).json(data);
  }

  // No content response
  noContent(): void {
    this.res.status(204).send();
  }

  // Private helper methods
  private getRequestId(): string | undefined {
    return this.req.headers['x-request-id'] as string || 
           (this.req as Request & { logger?: { context?: { requestId?: string } } }).logger?.context?.requestId;
  }
}

// Middleware to add response helper to request
export function responseHelperMiddleware(req: Request, res: Response, next: () => void) {
  (req as Request & { response: ResponseHelper }).response = new ResponseHelper(req, res);
  next();
}

// Convenience function to get response helper from request
export function getResponseHelper(req: Request): ResponseHelper {
  return (req as Request & { response: ResponseHelper }).response;
}

// Legacy compatibility functions (for gradual migration)
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.success(data, statusCode);
}

export function sendError(res: Response, error: Error | AppError, statusCode?: number): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.error(error, statusCode);
}

export function sendNotFound(res: Response, resource: string, identifier?: string): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.notFound(resource, identifier);
}

export function sendBadRequest(res: Response, message: string, context?: Record<string, unknown>): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.badRequest(message, context);
}

export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.unauthorized(message);
}

export function sendForbidden(res: Response, message: string = 'Forbidden'): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.forbidden(message);
}

export function sendConflict(res: Response, message: string, context?: Record<string, unknown>): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.conflict(message, context);
}

export function sendInternalError(res: Response, message: string = 'Internal server error'): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.internalError(message);
}

export function sendValidationError(res: Response, message: string, errors?: unknown[]): void {
  const helper = new ResponseHelper({} as Request, res);
  helper.validationError(message, errors);
}

export default ResponseHelper;
