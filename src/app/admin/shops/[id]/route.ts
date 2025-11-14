import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: params.id },
      include: {
        User: true,
        ShopCategory: true,
        shop_gallery: true,
        links: true,
        shop_subscriptions: {
          include: {
            subscription_packages: true,
          },
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(shop);
  } catch (err) {
    console.error('Fetch shop error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch shop' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const data = await request.json();

    const shop = await prisma.shop.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(shop);
  } catch (err) {
    console.error('Update shop error:', err);
    return NextResponse.json(
      { error: 'Failed to update shop' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.shop.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Shop deleted successfully',
    });
  } catch (err) {
    console.error('Delete shop error:', err);
    return NextResponse.json(
      { error: 'Failed to delete shop' },
      { status: 500 }
    );
  }
}
