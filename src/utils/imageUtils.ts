// Image validation and compression utilities

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_IMAGE_WIDTH = 1920;
export const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateImage(file: File): ImageValidationResult {
  // Check file type
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return { 
      isValid: false, 
      error: `File too large (${sizeMB}MB). Maximum size is 2MB` 
    };
  }

  return { isValid: true };
}

export async function compressImage(file: File): Promise<Blob> {
  // SVG files don't need compression
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (width > MAX_IMAGE_WIDTH) {
          height = (height * MAX_IMAGE_WIDTH) / width;
          width = MAX_IMAGE_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          0.85 // 85% quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export function generateImageFileName(originalName: string, _projectId: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'webp';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  
  return `${sanitizedName}-${timestamp}.${extension}`;
}

export function getImagePreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}