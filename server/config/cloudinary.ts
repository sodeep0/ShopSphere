import cloudinary from 'cloudinary';
import { Logger } from '../utils/logger';

const logger = new Logger();

// Configure Cloudinary
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

// Only configure if credentials are available
if (cloud_name && api_key && api_secret) {
  cloudinary.v2.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
    secure: true, // Use HTTPS
  });
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('Cloudinary credentials not found in environment variables. Image uploads will fail without CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
}

export default cloudinary.v2;
