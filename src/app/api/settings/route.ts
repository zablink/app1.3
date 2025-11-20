// app/api/settings/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings
 * Public API - ไม่ต้อง Authentication
 * ดึง Settings ทั้งหมด
 */
export const revalidate = 300; // Cache 5 minutes

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      select: {
        key: true,
        value: true,
        dataType: true,
        category: true
      },
      orderBy: {
        key: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings'
      },
      { status: 500 }
    );
  }
}

// ============================================
// Helper: Server-side Settings Getter
// ============================================

/**
 * ใช้ใน Server Components หรือ API Routes
 * เพื่อดึง Settings โดยตรง (with caching)
 */
export async function getPublicSettings() {
  const settings = await prisma.siteSetting.findMany({
    select: {
      key: true,
      value: true,
      dataType: true
    },
    // Cache for 5 minutes
    cacheStrategy: { ttl: 300 }
  });

  // แปลงเป็น Object
  const settingsObj = settings.reduce((acc, setting) => {
    if (setting.dataType === 'json') {
      try {
        acc[setting.key] = JSON.parse(setting.value);
      } catch {
        acc[setting.key] = setting.value;
      }
    } else if (setting.dataType === 'boolean') {
      acc[setting.key] = setting.value === 'true';
    } else {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, any>);

  return settingsObj;
}

/**
 * ดึง Setting เดียว
 */
export async function getSetting(key: string): Promise<any> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key }
  });

  if (!setting) return null;

  if (setting.dataType === 'json') {
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  } else if (setting.dataType === 'boolean') {
    return setting.value === 'true';
  }

  return setting.value;
}
