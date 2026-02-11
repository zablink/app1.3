// src/app/api/shops/[shopId]/ads/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

/**
 * GET /api/shops/[shopId]/ads/stats
 * ดึงสถิติโฆษณาของร้าน
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const shopId = (await params).shopId;
    const authErr = await requireOwnerOrAdmin(req, shopId);
    if (authErr) return authErr;

    // Fetch active ads
    let activeAds: any[] = [];
    let allAds: any[] = [];
    
    try {
      activeAds = await prisma.adPurchase.findMany({
        where: {
          shopId,
          startAt: { lte: new Date() },
          endAt: { gte: new Date() },
        },
      });

      // Fetch all ads for stats
      allAds = await prisma.adPurchase.findMany({
        where: { shopId },
      });
    } catch (error: any) {
      // If model doesn't exist, return empty stats
      if (error.message?.includes("does not exist") || error.message?.includes("Unknown arg")) {
        return NextResponse.json({
          totalAds: 0,
          activeAds: 0,
          totalSpent: 0,
          activeSpent: 0,
          totalViews: 0,
          totalClicks: 0,
        });
      }
      throw error;
    }

    // Calculate stats
    const totalAds = allAds.length;
    const activeAdsCount = activeAds.length;
    const totalSpent = allAds.reduce((sum, ad) => sum + (ad.tokenCost || 0), 0);
    const activeSpent = activeAds.reduce((sum, ad) => sum + (ad.tokenCost || 0), 0);

    // Get impressions (from AdImpression if available)
    // Note: This is a simplified version. You may need to join with AdImpression table
    const stats = {
      totalAds,
      activeAds: activeAdsCount,
      totalSpent,
      activeSpent,
      // TODO: Add views and clicks from AdImpression table
      totalViews: 0,
      totalClicks: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching ad stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
