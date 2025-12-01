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
    const { ownerId } = await request.json();
    const shopId = (await params).id;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update shop owner
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ownerId: ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      shop,
      message: 'Owner assigned successfully',
    });
  } catch (err) {
    console.error('Assign owner error:', err);
    return NextResponse.json(
      { error: 'Failed to assign owner' },
      { status: 500 }
    );
  }
}
