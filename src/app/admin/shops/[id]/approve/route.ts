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
    const shop = await prisma.shop.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'อนุมัติร้านค้าเรียบร้อยแล้ว',
      data: shop,
    });
  } catch (err) {
    console.error('Approve shop error:', err);
    return NextResponse.json(
      { error: 'Failed to approve shop' },
      { status: 500 }
    );
  }
}
