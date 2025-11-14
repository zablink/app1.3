import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [
      totalShops,
      pendingShops,
      approvedShops,
      totalCreators,
      pendingCreators,
      approvedCreators,
      totalCampaigns,
      activeCampaigns,
      totalUsers,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'PENDING' } }),
      prisma.shop.count({ where: { status: 'APPROVED' } }),
      prisma.creator.count(),
      prisma.creator.count({ where: { applicationStatus: 'PENDING' } }),
      prisma.creator.count({ where: { applicationStatus: 'APPROVED' } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.shopSubscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      shops: {
        total: totalShops,
        pending: pendingShops,
        approved: approvedShops,
      },
      creators: {
        total: totalCreators,
        pending: pendingCreators,
        approved: approvedCreators,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
      users: {
        total: totalUsers,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
