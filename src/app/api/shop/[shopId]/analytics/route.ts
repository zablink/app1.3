// app/api/shop/[shopId]/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shopId } = await params;

    // Verify shop ownership
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });

    if (!shop || shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get total views from Analytics table
    const analyticsData = await prisma.analytics.aggregate({
      where: { shopId },
      _sum: {
        views: true,
        clicks: true,
      },
    });

    // Get views from shop_stats (alternative source)
    const statsViews = await prisma.shop_stats.count({
      where: {
        shop_id: shopId,
        event_type: "view",
      },
    });

    // Get total bookmarks
    const bookmarksCount = await prisma.userBookmark.count({
      where: { shopId },
    });

    // Get average rating from reviews
    const reviewStats = await prisma.shopReview.aggregate({
      where: { shopId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // Get recent views (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentViews = await prisma.shop_stats.count({
      where: {
        shop_id: shopId,
        event_type: "view",
        created_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get recent bookmarks (last 7 days)
    const recentBookmarks = await prisma.userBookmark.count({
      where: {
        shopId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get active subscription
    const activeSubscription = await prisma.shopSubscription.findFirst({
      where: {
        shop_id: shopId,
        status: "ACTIVE",
        end_date: {
          gte: new Date(),
        },
      },
      include: {
        subscription_packages: {
          select: {
            name: true,
            tier: true,
            max_images: true,
            max_menu_items: true,
            max_delivery_links: true,
            has_verified_badge: true,
            has_advanced_analytics: true,
            can_pin_on_map: true,
            badge_text: true,
            badge_emoji: true,
          },
        },
      },
      orderBy: {
        end_date: "desc",
      },
    });

    return NextResponse.json({
      totalViews: (analyticsData._sum.views || 0) + statsViews,
      totalClicks: analyticsData._sum.clicks || 0,
      totalBookmarks: bookmarksCount,
      averageRating: reviewStats._avg.rating || 0,
      totalReviews: reviewStats._count.id || 0,
      recentViews,
      recentBookmarks,
      subscription: activeSubscription
        ? {
            packageName: activeSubscription.subscription_packages.name,
            tier: activeSubscription.subscription_packages.tier,
            endDate: activeSubscription.end_date,
            features: {
              maxImages: activeSubscription.subscription_packages.max_images,
              maxMenuItems: activeSubscription.subscription_packages.max_menu_items,
              maxDeliveryLinks:
                activeSubscription.subscription_packages.max_delivery_links,
              hasVerifiedBadge:
                activeSubscription.subscription_packages.has_verified_badge,
              hasAdvancedAnalytics:
                activeSubscription.subscription_packages.has_advanced_analytics,
              canPinOnMap: activeSubscription.subscription_packages.can_pin_on_map,
              badgeText: activeSubscription.subscription_packages.badge_text,
              badgeEmoji: activeSubscription.subscription_packages.badge_emoji,
            },
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching shop analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
