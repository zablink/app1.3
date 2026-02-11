import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [
      totalShops,
      pendingShops,
      approvedShops,
      rejectedShops,
      totalCreators,
      pendingCreators,
      approvedCreators,
      totalCampaigns,
      activeCampaigns,
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      totalReviews,
      avgRating,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'PENDING' } }),
      prisma.shop.count({ where: { status: 'APPROVED' } }),
      prisma.shop.count({ where: { status: 'REJECTED' } }),
      prisma.creator.count(),
      prisma.creator.count({ where: { applicationStatus: 'PENDING' } }),
      prisma.creator.count({ where: { applicationStatus: 'APPROVED' } }),
      prisma.campaigns.count(),
      prisma.campaigns.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.shopSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.shopSubscription.count({ where: { status: 'EXPIRED' } }),
      prisma.shopReview.count(),
      prisma.shopReview.aggregate({ _avg: { rating: true } }),
    ]);

    // Calculate revenue from active subscriptions
    const activeSubscriptionsData = await prisma.shopSubscription.findMany({
      where: { status: 'ACTIVE' },
      select: { final_price: true },
    });

    const revenue = activeSubscriptionsData.reduce(
      (sum, sub) => sum + Number(sub.final_price),
      0
    );

    return NextResponse.json({
      shops: {
        total: totalShops,
        pending: pendingShops,
        approved: approvedShops,
        rejected: rejectedShops,
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
        expired: expiredSubscriptions,
        revenue: revenue,
      },
      reviews: {
        total: totalReviews,
        avgRating: avgRating._avg.rating || 0,
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
