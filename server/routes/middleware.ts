import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/index";
import UnauthorizedError from "../utils/app-error";
import ForbiddenError from "../utils/app-error";
import { Logger } from "../utils/logger";

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  logger?: Logger;
}

// Input sanitization helper
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Auth middleware for admin users
export const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No valid token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token.length < 10) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, auth.jwtSecret) as { id: string; email: string; role: string };
    
    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    
    req.user = decoded;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Auth middleware for any authenticated user (admin or customer)
export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No valid token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token.length < 10) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, auth.jwtSecret) as { id: string; email: string; role: string };
    
    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Auth middleware for customers only
export const authenticateCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No valid token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token.length < 10) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, auth.jwtSecret) as { id: string; email: string; role: string };
    
    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    
    req.user = decoded;
    if (decoded.role !== 'customer') {
      return res.status(403).json({ message: 'Customer access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, continue without user
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token.length < 10) {
    return next(); // Invalid token format, continue without user
  }

  try {
    const decoded = jwt.verify(token, auth.jwtSecret) as { id: string; email: string; role: string };
    
    // Validate token payload
    if (decoded.id && decoded.email && decoded.role) {
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    next(); // Invalid token, continue without user
  }
};

// Role-based access control middleware factory
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
    }

    next();
  };
};

// Resource ownership middleware (for user-specific resources)
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    if (resourceUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
    }

    next();
  };
};

// Rate limiting middleware (basic implementation)
export const createRateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(ip);
      }
    }

    const current = requests.get(key);
    if (!current) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }

    if (current.resetTime < windowStart) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests', 
        retryAfter: Math.ceil((current.resetTime + windowMs - now) / 1000)
      });
    }

    current.count++;
    next();
  };
};

// Request validation middleware factory
export const validateRequest = (schema: import('zod').ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};
