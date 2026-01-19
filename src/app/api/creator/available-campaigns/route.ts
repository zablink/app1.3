// src/app/api/creator/available-campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
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
    const creator = await prisma.creator.findUnique({
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
    const campaigns = await prisma.campaign.findMany({
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

    // Calculate distance if creator has location
    // Note: This is simplified. You may want to use PostGIS for accurate distance
    const campaignsWithDistance = campaigns.map((campaign) => {
      let distance = null;
      if (creator.lat && creator.lng && campaign.Shop.lat && campaign.Shop.lng) {
        // Simple distance calculation (Haversine formula would be better)
        const lat1 = creator.lat;
        const lon1 = creator.lng;
        const lat2 = campaign.Shop.lat;
        const lon2 = campaign.Shop.lng;
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c; // Distance in km
      }

      return {
        ...campaign,
        distance: distance ? Math.round(distance * 10) / 10 : null, // Round to 1 decimal
        availableSlots:
          (campaign.targetReviewers || 1) - campaign.campaign_jobs.length,
      };
    });

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
