import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { newPriceMin, newPriceMax, reason } = body;

    if (!newPriceMin || !newPriceMax) {
      return NextResponse.json(
        { error: 'กรุณาระบุราคาใหม่' },
        { status: 400 }
      );
    }

    if (newPriceMin < 0 || newPriceMax < 0) {
      return NextResponse.json(
        { error: 'ราคาต้องมากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      );
    }

    if (newPriceMin > newPriceMax) {
      return NextResponse.json(
        { error: 'ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด' },
        { status: 400 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { id: params.id },
      include: {
        priceHistory: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'ไม่พบ Creator' },
        { status: 404 }
      );
    }

    if (creator.applicationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Creator ต้องได้รับการอนุมัติก่อน' },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      if (creator.priceHistory.length > 0) {
        await tx.creatorPriceHistory.update({
          where: { id: creator.priceHistory[0].id },
          data: { effectiveTo: now },
        });
      }

      const newHistory = await tx.creatorPriceHistory.create({
        data: {
          creatorId: params.id,
          priceMin: parseInt(newPriceMin),
          priceMax: parseInt(newPriceMax),
          effectiveFrom: now,
          effectiveTo: null,
          changedBy: session!.user!.id!,
          reason: reason || 'Admin updated pricing',
        },
      });

      const updatedCreator = await tx.creator.update({
        where: { id: params.id },
        data: {
          currentPriceMin: parseInt(newPriceMin),
          currentPriceMax: parseInt(newPriceMax),
          updatedAt: now,
        },
      });

      return { updatedCreator, newHistory };
    });

    return NextResponse.json({
      success: true,
      message: 'อัพเดทราคาเรียบร้อยแล้ว',
      data: result,
    });
  } catch (err) {
    console.error('Update pricing error:', err);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const priceHistory = await prisma.creatorPriceHistory.findMany({
      where: { creatorId: params.id },
      orderBy: { effectiveFrom: 'desc' },
      include: {
        creator: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: priceHistory,
      count: priceHistory.length,
    });
  } catch (err) {
    console.error('Fetch price history error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
