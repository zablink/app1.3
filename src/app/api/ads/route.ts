// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

/**
 * GET /api/ads?shopId=xxx
 * ดึงโฆษณาทั้งหมดของร้าน
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // Check authorization
    const authErr = await requireOwnerOrAdmin(req, shopId);
    if (authErr) return authErr;

    // Fetch ads
    // Note: AdPurchase model may need to be checked in schema
    // Using raw query as fallback if model doesn't exist
    try {
      const ads = await prisma.adPurchase.findMany({
        where: { shopId },
        include: {
          adPackage: {
            select: {
              id: true,
              name: true,
              scope: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ads });
    } catch (error: any) {
      // If model doesn't exist, return empty array
      if (error.message?.includes("does not exist") || error.message?.includes("Unknown arg")) {
        return NextResponse.json({ ads: [] });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
