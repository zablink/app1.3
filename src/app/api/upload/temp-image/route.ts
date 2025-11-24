// src/app/api/upload/temp-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/upload/temp-image
 * Upload temporary image (for shop registration before shop is created)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isGallery = formData.get('isGallery') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalSize = buffer.length;

    // Process main image
    const compressedImage = await sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    // Create thumbnail
    const thumbnail = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'attention',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    const compressedSize = compressedImage.length;
    const metadata = await sharp(compressedImage).metadata();

    // Generate filenames in temp folder
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const mainFileName = `temp/${timestamp}_${randomId}.jpg`;
    const thumbnailFileName = `temp/${timestamp}_${randomId}_thumb.jpg`;

    // Upload both versions
    const uploads = await Promise.all([
      supabase.storage.from('shop-images').upload(mainFileName, compressedImage, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      }),
      supabase.storage.from('shop-images').upload(thumbnailFileName, thumbnail, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      }),
    ]);

    if (uploads[0].error) {
      console.error('Upload error:', uploads[0].error);
      throw uploads[0].error;
    }

    // Get public URLs
    const { data: mainUrl } = supabase.storage.from('shop-images').getPublicUrl(mainFileName);
    const { data: thumbUrl } = supabase.storage.from('shop-images').getPublicUrl(thumbnailFileName);

    return NextResponse.json({
      success: true,
      url: mainUrl.publicUrl,
      thumbnail: thumbUrl.publicUrl,
      metadata: {
        originalSize,
        compressedSize,
        compressionRatio: Math.round(((originalSize - compressedSize) / originalSize) * 10000) / 100,
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}
