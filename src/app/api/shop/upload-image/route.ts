// src/app/api/shop/upload-image/route.ts (Updated with Smart Crop)

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
 * POST /api/shop/upload-image
 * Upload and compress shop image with smart cropping
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const shopId = formData.get('shopId') as string;
    const useSmartCrop = formData.get('smartCrop') === 'true';

    if (!file || !shopId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalSize = buffer.length;

    // Process main image
    let mainImagePipeline = sharp(buffer);

    if (useSmartCrop) {
      // Smart crop using attention strategy (finds salient features)
      mainImagePipeline = mainImagePipeline
        .resize(1920, 1920, {
          fit: 'cover',
          position: 'attention', // Smart crop - focuses on important regions
        });
    } else {
      // Standard resize
      mainImagePipeline = mainImagePipeline
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        });
    }

    const compressedImage = await mainImagePipeline
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    // Create smart-cropped thumbnail (square)
    const thumbnail = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'attention', // Always use smart crop for thumbnails
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    // Create additional sizes for responsive images
    const mediumImage = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const compressedSize = compressedImage.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    const metadata = await sharp(compressedImage).metadata();

    // Generate filenames
    const timestamp = Date.now();
    const mainFileName = `${shopId}/${timestamp}.jpg`;
    const thumbnailFileName = `${shopId}/${timestamp}_thumb.jpg`;
    const mediumFileName = `${shopId}/${timestamp}_medium.jpg`;

    // Upload all versions
    const uploads = await Promise.all([
      supabase.storage.from('shops').upload(mainFileName, compressedImage, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      }),
      supabase.storage.from('shops').upload(thumbnailFileName, thumbnail, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      }),
      supabase.storage.from('shops').upload(mediumFileName, mediumImage, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      }),
    ]);

    if (uploads[0].error) throw uploads[0].error;

    // Get public URLs
    const { data: mainUrl } = supabase.storage.from('shops').getPublicUrl(mainFileName);
    const { data: thumbUrl } = supabase.storage.from('shops').getPublicUrl(thumbnailFileName);
    const { data: mediumUrl } = supabase.storage.from('shops').getPublicUrl(mediumFileName);

    return NextResponse.json({
      success: true,
      url: mainUrl.publicUrl,
      thumbnail: thumbUrl.publicUrl,
      medium: mediumUrl.publicUrl,
      metadata: {
        originalSize,
        compressedSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}