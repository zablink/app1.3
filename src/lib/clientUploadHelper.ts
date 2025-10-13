// src/lib/clientUploadHelper.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UploadMetadata {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  fileName: string;
  fileType: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  metadata?: UploadMetadata;
}

export type ProgressCallback = (progress: number) => void;

/**
 * Upload shop image to Supabase Storage
 * @param file - Image file to upload
 * @param shopId - Shop ID
 * @param onProgress - Optional progress callback (0-100)
 * @param folder - Optional folder name (default: 'shop-images')
 * @returns Upload result with URL
 */
export async function uploadShopImage(
  file: File,
  shopId: string,
  onProgress?: ProgressCallback | string,
  folder: string = 'shop-images'
): Promise<UploadResult> {
  // Handle if third parameter is a string (folder name)
  let progressCallback: ProgressCallback | undefined;
  let actualFolder = folder;
  
  if (typeof onProgress === 'string') {
    actualFolder = onProgress;
    progressCallback = undefined;
  } else {
    progressCallback = onProgress;
  }
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Store original file size
    const originalSize = file.size;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: 'File size too large. Maximum size is 5MB.' 
      };
    }

    // Report initial progress
    if (progressCallback) progressCallback(10);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${shopId}_${timestamp}_${randomString}.${fileExt}`;
    const filePath = `${actualFolder}/${fileName}`;

    if (progressCallback) progressCallback(30);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('shop-images') // Bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (progressCallback) progressCallback(70);

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    if (progressCallback) progressCallback(90);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('shop-images')
      .getPublicUrl(filePath);

    if (progressCallback) progressCallback(100);

    // Calculate compression ratio (file.size might be different after upload)
    const compressedSize = file.size;
    const compressionRatio = originalSize > 0 
      ? ((originalSize - compressedSize) / originalSize) * 100 
      : 0;

    return {
      success: true,
      url: publicUrl,
      metadata: {
        originalSize,
        compressedSize,
        compressionRatio,
        fileName: file.name,
        fileType: file.type,
      },
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete shop image from Supabase Storage
 * @param imageUrl - Full URL of the image
 * @returns Success status
 */
export async function deleteShopImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'shop-images');
    
    if (bucketIndex === -1) {
      console.error('Invalid image URL');
      return false;
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    // Delete from storage
    const { error } = await supabase.storage
      .from('shop-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return false;
  }
}

/**
 * Upload multiple shop images
 * @param files - Array of image files
 * @param shopId - Shop ID
 * @param onProgress - Optional progress callback for overall progress (0-100)
 * @returns Array of upload results
 */
export async function uploadMultipleShopImages(
  files: File[],
  shopId: string,
  onProgress?: ProgressCallback
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const totalFiles = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadShopImage(file, shopId);
    results.push(result);
    
    // Update overall progress
    if (onProgress) {
      const progress = Math.round(((i + 1) / totalFiles) * 100);
      onProgress(progress);
    }
  }
  
  return results;
}

/**
 * Get signed URL for private images (if needed)
 * @param filePath - File path in storage
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Signed URL
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('shop-images')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Unexpected error getting signed URL:', error);
    return null;
  }
}