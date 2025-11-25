// src/app/api/admin/shops/bulk-update-categories/route.ts
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

    const { shopIds, categoryIds } = await request.json();

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return NextResponse.json({ error: 'Shop IDs are required' }, { status: 400 });
    }

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: 'Category IDs must be an array' }, { status: 400 });
    }

    // อัปเดตหมวดหมู่สำหรับทุกร้านที่เลือก
    await Promise.all(shopIds.map(async (shopId) => {
      // ลบหมวดหมู่เก่าทั้งหมด
      await prisma.shopCategoryMapping.deleteMany({
        where: { shopId }
      });

      // เพิ่มหมวดหมู่ใหม่
      if (categoryIds.length > 0) {
        await prisma.shopCategoryMapping.createMany({
          data: categoryIds.map(categoryId => ({
            shopId,
            categoryId
          })),
          skipDuplicates: true
        });
      }
    }));

    return NextResponse.json({
      success: true,
      message: `อัปเดตหมวดหมู่สำหรับ ${shopIds.length} ร้านสำเร็จ`,
      updatedCount: shopIds.length
    });
  } catch (error) {
    console.error('Bulk update categories error:', error);
    return NextResponse.json(
      { error: 'Failed to update categories' },
      { status: 500 }
    );
  }
}
