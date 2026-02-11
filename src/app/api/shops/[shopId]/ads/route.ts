// src/app/api/shops/[shopId]/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

/**
 * GET /api/shops/[shopId]/ads
 * ดึงโฆษณาทั้งหมดของร้าน
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const shopId = (await params).shopId;
    const authErr = await requireOwnerOrAdmin(req, shopId);
    if (authErr) return authErr;

    // Fetch ads
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
