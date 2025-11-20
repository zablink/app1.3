// app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

/**
 * Upload configuration per folder/type
 */
const UPLOAD_CONFIG = {
  banners: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    description: 'Banner images'
  },
  products: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'Product images'
  },
  gallery: {
    maxSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    description: 'Gallery images'
  },
  logos: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/png', 'image/svg+xml', 'image/webp'],
    description: 'Logo and icon files'
  },
  avatars: {
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'User avatars'
  },
  uploads: {
    maxSize: 5 * 1024 * 1024, // 5MB (default)
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    description: 'General uploads'
  }
};

/**
 * POST /api/upload
 * อัปโหลดไฟล์ไปยัง Supabase Storage
 * 
 * Form data parameters:
 * - file: File (required) - ไฟล์ที่จะอัปโหลด
 * - folder: string (optional) - โฟลเดอร์ปลายทาง (banners, products, gallery, logos, avatars)
 * - preserveFormat: boolean (optional) - เก็บ format เดิม (true = ไม่แปลงเป็น jpg, สำหรับ logo/icon)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบ Authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';
    const preserveFormat = formData.get('preserveFormat') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get config for this folder
    const config = UPLOAD_CONFIG[folder as keyof typeof UPLOAD_CONFIG] || UPLOAD_CONFIG.uploads;

    // ตรวจสอบประเภทไฟล์
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: `Invalid file type for ${config.description}. Allowed: ${config.allowedTypes.join(', ')}`,
          allowedTypes: config.allowedTypes
        },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์
    if (file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSizeMB}MB for ${config.description}.` },
        { status: 400 }
      );
    }

    // สร้าง Supabase Client
    const supabaseUrl = 'https://vygryagvxjewxdzgipea.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    
    // ถ้า preserveFormat = true หรือเป็น SVG/PNG สำหรับ logo, ใช้ extension เดิม
    // ถ้าไม่ และ client-side ส่ง jpg มา ก็ใช้ jpg (จาก compression)
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // แปลง File เป็น Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // อัปโหลดไป Supabase Storage
    const { data, error } = await supabase.storage
      .from('Public')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file', details: error.message },
        { status: 500 }
      );
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Public')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      filePath: filePath,
      fileSize: file.size,
      fileType: file.type,
      folder: folder
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload?path={filePath}
 * ลบไฟล์จาก Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.storage
      .from('Public')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file'
      },
      { status: 500 }
    );
  }
}

// ============================================
// Alternative: Local File System Upload (สำหรับ Development)
// ============================================

/*
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // สร้างโฟลเดอร์ถ้าไม่มี
    const uploadDir = path.join(process.cwd(), 'public', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // สร้างชื่อไฟล์
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // เขียนไฟล์
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
*/
