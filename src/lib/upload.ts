// lib/upload.ts
/**
 * Upload utilities and helpers
 */

export interface UploadOptions {
  folder?: 'banners' | 'products' | 'gallery' | 'logos' | 'avatars' | 'uploads';
  preserveFormat?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  folder?: string;
  error?: string;
}

/**
 * Upload file to server
 * 
 * @example
 * // Upload banner with compression
 * const result = await uploadFile(file, { folder: 'banners' });
 * 
 * @example
 * // Upload logo without compression (preserve PNG/SVG)
 * const result = await uploadFile(file, { folder: 'logos', preserveFormat: true });
 * 
 * @example
 * // Upload product image with progress callback
 * const result = await uploadFile(file, { 
 *   folder: 'products',
 *   onProgress: (progress) => console.log(`${progress}%`)
 * });
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = 'uploads', preserveFormat = false, onProgress } = options;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (preserveFormat) {
      formData.append('preserveFormat', 'true');
    }

    // Simulate progress if callback provided
    const progressInterval = onProgress ? setInterval(() => {
      onProgress(Math.min(90, Math.random() * 90));
    }, 200) : null;

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (progressInterval) {
      clearInterval(progressInterval);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    
    if (onProgress) {
      onProgress(100);
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

/**
 * Delete file from server
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Delete failed');
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  options: { maxSize?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'] } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }

  const maxSizeBytes = maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize}MB`
    };
  }

  return { valid: true };
}

/**
 * Get upload configuration for specific folder
 */
export function getUploadConfig(folder: string) {
  const configs = {
    banners: {
      maxSize: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      compress: true,
      maxWidth: 1920,
      maxHeight: 1080
    },
    products: {
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      compress: true,
      maxWidth: 1200,
      maxHeight: 1200
    },
    gallery: {
      maxSize: 8,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      compress: true,
      maxWidth: 1920,
      maxHeight: 1920
    },
    logos: {
      maxSize: 2,
      allowedTypes: ['image/png', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'],
      compress: false,
      preserveFormat: true
    },
    avatars: {
      maxSize: 3,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      compress: true,
      maxWidth: 512,
      maxHeight: 512
    }
  };

  return configs[folder as keyof typeof configs] || configs.products;
}
