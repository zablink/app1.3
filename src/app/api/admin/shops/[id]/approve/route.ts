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
      data: { status: 'APPROVED' },
    });

    return NextResponse.json(shop);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to approve shop' }, { status: 500 });
  }
}
