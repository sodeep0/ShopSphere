/**
 * Image utility functions for handling uploaded, Cloudinary, and external images
 */

export type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

/**
 * Get the appropriate image URL based on size and type
 */
export function getImageUrl(imagePath: string, size: ImageSize = 'medium'): string {
  if (!imagePath) return '';
  
  // Cloudinary URL - apply transformations
  if (imagePath.startsWith('https://res.cloudinary.com/') || imagePath.startsWith('http://res.cloudinary.com/')) {
    return applyCloudinaryTransformation(imagePath, size);
  }
  
  // External URL (non-Cloudinary) - return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Legacy local uploaded image - handle as before
  if (imagePath.startsWith('/uploads/images/')) {
    const filename = imagePath.split('/').pop();
    if (filename) {
      const nameWithoutExt = filename.replace(/\.(webp|jpg|jpeg|png)$/i, '');
      const parts = nameWithoutExt.split('_');
      
      if (parts.length >= 3) {
        const timestampIndex = parts.length - 1;
        const sizeIndex = timestampIndex - 1;
        parts[sizeIndex] = size;
        const newFilename = parts.join('_') + '.webp';
        return `/uploads/images/${newFilename}`;
      }
    }
    return imagePath;
  }
  
  // Fallback to original path
  return imagePath;
}

/**
 * Apply Cloudinary transformations based on size
 */
function applyCloudinaryTransformation(url: string, size: ImageSize): string {
  // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/[version/]path/filename.format
  const sizeMap = {
    thumbnail: 'c_fill,w_150,h_150,q_auto',
    medium: 'c_fill,w_400,h_400,q_auto',
    large: 'c_fill,w_800,h_800,q_auto',
    original: 'c_fill,w_1200,h_1200,q_auto'
  };

  // Check if URL already has transformations
  if (url.includes('/upload/v')) {
    // Has version number, replace existing transformation
    return url.replace(/\/upload\/v\d+\//, `/upload/${sizeMap[size]}/`);
  } else if (url.includes('/upload/')) {
    // No version, insert transformation
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${sizeMap[size]}/${parts[1]}`;
    }
  }

  return url;
}

/**
 * Get multiple image sizes for responsive loading
 */
export function getImageSizes(imagePath: string): {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
} {
  return {
    thumbnail: getImageUrl(imagePath, 'thumbnail'),
    medium: getImageUrl(imagePath, 'medium'),
    large: getImageUrl(imagePath, 'large'),
    original: getImageUrl(imagePath, 'original')
  };
}

/**
 * Check if image is a Cloudinary URL
 */
export function isCloudinaryImage(imagePath: string): boolean {
  return imagePath.startsWith('https://res.cloudinary.com/') || imagePath.startsWith('http://res.cloudinary.com/');
}

/**
 * Check if an image is an uploaded file (vs external URL)
 */
export function isUploadedImage(imagePath: string): boolean {
  return imagePath.startsWith('/uploads/images/') || isCloudinaryImage(imagePath);
}

/**
 * Get image alt text for accessibility
 */
export function getImageAlt(productName: string, size?: string): string {
  const sizeText = size ? ` (${size})` : '';
  return `${productName}${sizeText}`;
}

/**
 * Generate responsive image srcSet for uploaded images
 */
export function getImageSrcSet(imagePath: string): string {
  if (!isUploadedImage(imagePath)) {
    return '';
  }
  
  const sizes = getImageSizes(imagePath);
  return [
    `${sizes.thumbnail} 150w`,
    `${sizes.medium} 400w`,
    `${sizes.large} 800w`,
    `${sizes.original} 1200w`
  ].join(', ');
}

/**
 * Get image loading priority based on position
 */
export function getImageLoading(index: number): 'eager' | 'lazy' {
  return index < 3 ? 'eager' : 'lazy';
}
