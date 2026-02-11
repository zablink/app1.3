import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผล' },
        { status: 400 }
      );
    }

    const creator = await prisma.creators.update({
      where: { id: (await params).id },
      data: {
        applicationStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectReason: reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ปฏิเสธ Creator เรียบร้อยแล้ว',
      data: creator,
    });
  } catch (err) {
    console.error('Reject creator error:', err);
    return NextResponse.json(
      { error: 'Failed to reject creator' },
      { status: 500 }
    );
  }
}
