import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { reason } = body;

    const shop = await prisma.shop.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ปฏิเสธร้านค้าเรียบร้อยแล้ว',
      data: shop,
      reason,
    });
  } catch (err) {
    console.error('Reject shop error:', err);
    return NextResponse.json(
      { error: 'Failed to reject shop' },
      { status: 500 }
    );
  }
}
