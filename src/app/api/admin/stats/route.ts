import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [
      totalShops,
      totalCreators,
      totalCampaigns,
      totalUsers,
      pendingShops,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.creator.count(),
      prisma.campaign.count(),
      prisma.user.count(),
      prisma.shop.count({ where: { status: 'PENDING' } }),
      prisma.shopSubscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      totalShops,
      totalCreators,
      totalCampaigns,
      totalUsers,
      pendingShops,
      activeSubscriptions,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
