// src/app/api/admin/shops/bulk-update-status/route.ts
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

    const { shopIds, status } = await request.json();

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return NextResponse.json({ error: 'Shop IDs are required' }, { status: 400 });
    }

    if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // อัปเดตสถานะสำหรับทุกร้านที่เลือก
    const result = await prisma.shop.updateMany({
      where: {
        id: { in: shopIds }
      },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะเป็น ${status} สำหรับ ${result.count} ร้านสำเร็จ`,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Bulk update status error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
