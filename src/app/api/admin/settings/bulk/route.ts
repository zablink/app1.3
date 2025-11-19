// app/api/admin/settings/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
