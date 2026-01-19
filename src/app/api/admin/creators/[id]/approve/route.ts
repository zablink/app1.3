import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { priceMin, priceMax } = body;

    if (!priceMin || !priceMax) {
      return NextResponse.json(
        { error: 'กรุณาระบุช่วงราคา' },
        { status: 400 }
      );
    }

    if (priceMin < 0 || priceMax < 0) {
      return NextResponse.json(
        { error: 'ราคาต้องมากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      );
    }

    if (priceMin > priceMax) {
      return NextResponse.json(
        { error: 'ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด' },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Update creator status
      const creator = await tx.creators.update({
        where: { id: (await params).id },
        data: {
          applicationStatus: 'APPROVED',
          approvedAt: now,
          currentPriceMin: parseInt(priceMin),
          currentPriceMax: parseInt(priceMax),
        },
      });

      // Create initial price history
      await tx.creator_price_history.create({
        data: {
          id: `cph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          creatorId: (await params).id,
          priceMin: parseInt(priceMin),
          priceMax: parseInt(priceMax),
          effectiveFrom: now,
          effectiveTo: null,
          changedBy: session!.user!.id!,
          reason: 'Initial approval',
        },
      });

      return creator;
    });

    return NextResponse.json({
      success: true,
      message: 'อนุมัติ Creator เรียบร้อยแล้ว',
      data: result,
    });
  } catch (err) {
    console.error('Approve creator error:', err);
    return NextResponse.json(
      { error: 'Failed to approve creator' },
      { status: 500 }
    );
  }
}
