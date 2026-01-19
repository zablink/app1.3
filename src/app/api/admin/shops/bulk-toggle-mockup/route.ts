// src/app/api/admin/shops/bulk-toggle-mockup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopIds, isMockup } = await request.json();

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return NextResponse.json({ error: 'Shop IDs are required' }, { status: 400 });
    }

    if (typeof isMockup !== 'boolean') {
      return NextResponse.json({ error: 'isMockup must be a boolean' }, { status: 400 });
    }

    // อัปเดตสถานะ mockup สำหรับทุกร้านที่เลือก
    const result = await prisma.shop.updateMany({
      where: {
        id: { in: shopIds }
      },
      data: {
        isMockup,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${isMockup ? 'ทำเครื่องหมาย' : 'ยกเลิก'} DEMO สำหรับ ${result.count} ร้านสำเร็จ`,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Bulk toggle mockup error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle mockup status' },
      { status: 500 }
    );
  }
}
