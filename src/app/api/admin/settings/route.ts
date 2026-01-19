// app/api/admin/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clearSettingsCache } from '@/lib/settings';

/**
 * GET /api/admin/settings
 * ดึง Settings ทั้งหมด หรือตาม category
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่าเป็น Admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const settings = await prisma.siteSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        ...setting,
        // Parse JSON values
        parsedValue: setting.dataType === 'json' 
          ? JSON.parse(setting.value) 
          : setting.value
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      settings: grouped,
      allSettings: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * อัปเดต Setting
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value, reason } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing key or value' },
        { status: 400 }
      );
    }

    // ดึง setting เดิม
    const oldSetting = await prisma.siteSetting.findUnique({
      where: { key }
    });

    if (!oldSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    // บันทึก History
    await prisma.siteSettingHistory.create({
      data: {
        settingKey: key,
        oldValue: oldSetting.value,
        newValue: typeof value === 'string' ? value : JSON.stringify(value),
        changedBy: session.user.id,
        reason
      }
    });

    // อัปเดต Setting
    const updated = await prisma.siteSetting.update({
      where: { key },
      data: {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        updatedBy: session.user.id
      }
    });

    // Clear cache after updating
    clearSettingsCache();

    return NextResponse.json({
      success: true,
      setting: updated
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/bulk
 * อัปเดตหลาย Settings พร้อมกัน
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates, reason } = body; // updates = [{ key, value }, ...]

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid updates format' },
        { status: 400 }
      );
    }

    // อัปเดตทีละตัว พร้อมบันทึก History
    const results = await Promise.all(
      updates.map(async ({ key, value }) => {
        const oldSetting = await prisma.siteSetting.findUnique({
          where: { key }
        });

        if (!oldSetting) return null;

        // บันทึก History
        await prisma.siteSettingHistory.create({
          data: {
            settingKey: key,
            oldValue: oldSetting.value,
            newValue: typeof value === 'string' ? value : JSON.stringify(value),
            changedBy: session.user.id,
            reason
          }
        });

        // อัปเดต Setting
        return await prisma.siteSetting.update({
          where: { key },
          data: {
            value: typeof value === 'string' ? value : JSON.stringify(value),
            updatedBy: session.user.id
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      updated: results.filter(Boolean).length,
      settings: results.filter(Boolean)
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
