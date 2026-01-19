// GET /api/analytics/stats - Retrieve analytics statistics
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Only admins can view stats
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    const shopId = searchParams.get('shopId');

    // Calculate date range
    const now = new Date();
    const daysAgo = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Overall stats
    const [totalPageViews, uniqueVisitors, totalSessions, totalShopViews] =
      await Promise.all([
        prisma.pageView.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.pageView.groupBy({
          by: ['sessionId'],
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.userSession.count({
          where: {
            startTime: { gte: startDate },
          },
        }),
        prisma.shopView.count({
          where: {
            createdAt: { gte: startDate },
            ...(shopId ? { shopId } : {}),
          },
        }),
      ]);

    // Top pages
    const topPages = await prisma.pageView.groupBy({
      by: ['pagePath'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Top shops (if not filtered by shopId)
    const topShops = shopId
      ? []
      : await prisma.shopView.groupBy({
          by: ['shopId'],
          where: {
            createdAt: { gte: startDate },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        });

    // Get shop names for top shops
    const shopDetails =
      topShops.length > 0
        ? await prisma.shop.findMany({
            where: {
              id: { in: topShops.map((s) => s.shopId) },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [];

    const topShopsWithNames = topShops.map((s) => ({
      shopId: s.shopId,
      views: s._count.id,
      name: shopDetails.find((shop) => shop.id === s.shopId)?.name || 'Unknown',
    }));

    // Event stats
    const eventStats = await prisma.event.groupBy({
      by: ['eventType'],
      where: {
        createdAt: { gte: startDate },
        ...(shopId ? { shopId } : {}),
      },
      _count: {
        id: true,
      },
    });

    // Device breakdown
    const deviceBreakdown = await prisma.pageView.groupBy({
      by: ['deviceType'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Daily trend
    const dailyTrend = await prisma.$queryRaw<any[]>`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as sessions
      FROM page_views
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return NextResponse.json({
      success: true,
      period,
      stats: {
        totalPageViews,
        uniqueVisitors: uniqueVisitors.length,
        totalSessions,
        totalShopViews,
        avgPageViewsPerSession:
          totalSessions > 0
            ? Math.round((totalPageViews / totalSessions) * 10) / 10
            : 0,
        topPages: topPages.map((p) => ({
          path: p.pagePath,
          views: p._count.id,
        })),
        topShops: topShopsWithNames,
        events: eventStats.map((e) => ({
          type: e.eventType,
          count: e._count.id,
        })),
        deviceBreakdown: deviceBreakdown.map((d) => ({
          device: d.deviceType || 'unknown',
          count: d._count.id,
        })),
        dailyTrend: dailyTrend.map((d) => ({
          date: d.date,
          views: Number(d.views),
          sessions: Number(d.sessions),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
