// app/api/shops/[id]/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = params.id;

    // Verify ownership
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (shop.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get analytics data
    const analytics = await prisma.analytics.findMany({
      where: { shopId },
    });

    const views = analytics.reduce((sum, a) => sum + a.views, 0);
    const clicks = analytics.reduce((sum, a) => sum + a.clicks, 0);

    // Get reviews count
    const reviews = await prisma.shop_reviews.count({
      where: { shop_id: shopId },
    });

    // Get average rating
    const ratingData = await prisma.shop_reviews.aggregate({
      where: { shop_id: shopId },
      _avg: { rating: true },
    });

    return NextResponse.json({
      views,
      clicks,
      reviews,
      rating: ratingData._avg.rating || 0,
    });
  } catch (error) {
    console.error("Error fetching shop stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}