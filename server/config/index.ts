import { z } from 'zod';

// Database configuration schema
const databaseSchema = z.object({
  url: z.string().min(1, 'DATABASE_URL is required'),
  poolSize: z.number().min(1).max(100).default(10),
  connectionTimeout: z.number().min(1000).default(30000),
  idleTimeout: z.number().min(1000).default(30000),
});

// Auth configuration schema
const authSchema = z.object({
  jwtSecret: z.string().min(1, 'JWT_SECRET is required'),
  jwtExpiresIn: z.union([z.string(), z.number()]).default('24h'),
  jwtCustomerExpiresIn: z.union([z.string(), z.number()]).default('7d'),
  bcryptRounds: z.number().min(1).max(20).default(10),
});

// Upload configuration schema
const uploadSchema = z.object({
  maxFileSize: z.number().min(1024 * 1024).default(10 * 1024 * 1024), // 10MB
  allowedImageTypes: z.array(z.string()).default(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  uploadDir: z.string().default('server/uploads/images'),
  imageSizes: z.object({
    thumbnail: z.object({ width: z.number(), height: z.number() }).default({ width: 150, height: 150 }),
    medium: z.object({ width: z.number(), height: z.number() }).default({ width: 400, height: 400 }),
    large: z.object({ width: z.number(), height: z.number() }).default({ width: 800, height: 800 }),
    original: z.object({ width: z.number(), height: z.number() }).default({ width: 1200, height: 1200 }),
  }),
  imageQuality: z.number().min(1).max(100).default(85),
});

// Cache configuration schema
const cacheSchema = z.object({
  enabled: z.boolean().default(true),
  defaultTtl: z.number().min(60).default(300), // 5 minutes
  categoriesTtl: z.number().min(300).default(3600), // 1 hour
  productsTtl: z.number().min(60).default(300), // 5 minutes
  statsTtl: z.number().min(60).default(300), // 5 minutes
  analyticsTtl: z.number().min(60).default(300), // 5 minutes
  maxKeys: z.number().min(100).default(1000),
});

// Server configuration schema
const serverSchema = z.object({
  port: z.number().min(1).max(65535).default(5000),
  host: z.string().default('127.0.0.1'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  cors: z.object({
    enabled: z.boolean().default(true),
    origin: z.string().default('*'),
    credentials: z.boolean().default(true),
  }),
});

// Rate limiting configuration
const rateLimitSchema = z.object({
  enabled: z.boolean().default(true),
  windowMs: z.number().min(1000).default(15 * 60 * 1000), // 15 minutes
  maxRequests: z.number().min(1).default(100),
  authWindowMs: z.number().min(1000).default(15 * 60 * 1000), // 15 minutes
  authMaxRequests: z.number().min(1).default(5),
});

// Logging configuration
const loggingSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  format: z.enum(['json', 'simple', 'combined']).default('combined'),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(false),
  logFile: z.string().default('logs/app.log'),
  maxFileSize: z.string().default('10m'),
  maxFiles: z.number().min(1).default(5),
});

// Complete configuration schema
const configSchema = z.object({
  database: databaseSchema,
  auth: authSchema,
  upload: uploadSchema,
  cache: cacheSchema,
  server: serverSchema,
  rateLimit: rateLimitSchema,
  logging: loggingSchema,
});

// Configuration type
export type Config = z.infer<typeof configSchema>;

// Load and validate configuration
function loadConfig(): Config {
  const rawConfig = {
    database: {
      url: process.env.DATABASE_URL,
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      jwtCustomerExpiresIn: process.env.JWT_CUSTOMER_EXPIRES_IN || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    },
    upload: {
      maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760'), // 10MB
      allowedImageTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(','),
      uploadDir: process.env.UPLOAD_DIR || 'server/uploads/images',
      imageSizes: {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 400, height: 400 },
        large: { width: 800, height: 800 },
        original: { width: 1200, height: 1200 },
      },
      imageQuality: parseInt(process.env.IMAGE_QUALITY || '85'),
    },
    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300'),
      categoriesTtl: parseInt(process.env.CACHE_CATEGORIES_TTL || '3600'),
      productsTtl: parseInt(process.env.CACHE_PRODUCTS_TTL || '300'),
      statsTtl: parseInt(process.env.CACHE_STATS_TTL || '300'),
      analyticsTtl: parseInt(process.env.CACHE_ANALYTICS_TTL || '300'),
      maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '1000'),
    },
    server: {
      port: parseInt(process.env.PORT || '5000'),
      host: process.env.HOST || '127.0.0.1',
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      cors: {
        enabled: process.env.CORS_ENABLED !== 'false',
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS !== 'false',
      },
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 minutes
      authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5'),
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      format: (process.env.LOG_FORMAT as 'json' | 'simple' | 'combined') || 'combined',
      enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
      enableFile: process.env.LOG_ENABLE_FILE === 'true',
      logFile: process.env.LOG_FILE || 'logs/app.log',
      maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

// Export validated configuration
export const config = loadConfig();

// Export individual config sections for convenience
export const { database, auth, upload, cache, server, rateLimit, logging } = config;
