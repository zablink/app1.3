// src/app/api/creator/available-campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/creator/available-campaigns
 * ดึง Campaigns ที่เปิดรับ Creator (ยังไม่มี Creator รับงาน)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find creator
    const creator = await prisma.creators.findUnique({
      where: { userId: session.user.id },
      include: {
        creator_coverage_areas: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Get creator's coverage areas
    const coverageAreas = creator.creator_coverage_areas || [];
    const provinceIds = coverageAreas
      .map((a) => a.provinceId)
      .filter((id) => id !== null);
    const amphureIds = coverageAreas
      .map((a) => a.amphureId)
      .filter((id) => id !== null);
    const tambonIds = coverageAreas
      .map((a) => a.tambonId)
      .filter((id) => id !== null);

    // Find campaigns that:
    // 1. Status is ACTIVE or PENDING
    // 2. Not already assigned to this creator
    // 3. Within date range
    // 4. In creator's coverage area (optional - can be removed if want all campaigns)

    const now = new Date();
    const campaigns = await prisma.campaigns.findMany({
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
        startDate: { lte: now },
        endDate: { gte: now },
        campaign_jobs: {
          none: {
            creatorId: creator.id,
          },
        },
        Shop: {
          OR: [
            ...(provinceIds.length > 0
              ? [{ province_id: { in: provinceIds } }]
              : []),
            ...(amphureIds.length > 0
              ? [{ amphure_id: { in: amphureIds } }]
              : []),
            ...(tambonIds.length > 0
              ? [{ tambon_id: { in: tambonIds } }]
              : []),
          ],
        },
      },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
            image: true,
            lat: true,
            lng: true,
            tambon_id: true,
            amphure_id: true,
            province_id: true,
          },
        },
        campaign_jobs: {
          select: {
            id: true,
            creatorId: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Distance skipped: `creators` has no lat/lng in schema. Add coords to DB + select here if needed.
    const campaignsWithDistance = campaigns.map((campaign) => ({
      ...campaign,
      distance: null as number | null,
      availableSlots:
        (campaign.targetReviewers || 1) - campaign.campaign_jobs.length,
    }));

    return NextResponse.json({
      campaigns: campaignsWithDistance,
      total: campaignsWithDistance.length,
    });
  } catch (error) {
    console.error("Error fetching available campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
