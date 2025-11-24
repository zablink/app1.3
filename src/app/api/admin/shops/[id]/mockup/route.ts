// src/app/api/admin/shops/[id]/mockup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// PATCH: Toggle mockup status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id: shopId } = params;
    const body = await request.json();
    const { isMockup } = body as { isMockup: boolean };

    if (typeof isMockup !== 'boolean') {
      return NextResponse.json(
        { error: 'isMockup must be a boolean' },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isMockup },
      select: {
        id: true,
        name: true,
        isMockup: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ร้าน ${shop.name} ${isMockup ? 'ถูกทำเครื่องหมายเป็นร้านตัวอย่าง' : 'ถูกยกเลิกเครื่องหมายร้านตัวอย่าง'}`,
      shop,
    });
  } catch (error) {
    console.error('Error updating mockup status:', error);
    return NextResponse.json(
      { error: 'Failed to update mockup status' },
      { status: 500 }
    );
  }
}
