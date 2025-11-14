import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireShopOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error, session } = await requireShopOwner();
  if (error) return error;

  try {
    const subscriptions = await prisma.shopSubscription.findMany({
      where: {
        shop: {
          ownerId: session!.user!.id,
        },
      },
      include: {
        subscription_packages: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireShopOwner();
  if (error) return error;

  try {
    const { shopId, packageId } = await request.json();

    const subscription = await prisma.shopSubscription.create({
      data: {
        shop_id: shopId,
        package_id: packageId,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(subscription);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
