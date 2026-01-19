// src/app/api/promotion-campaigns/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // PACKAGE, TOKEN, RENEWAL
    const packageTier = searchParams.get("packageTier");
    const packageId = searchParams.get("packageId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    if (type) where.campaignType = type;
    if (packageTier) where.packageTier = packageTier;
    if (packageId) where.packageId = packageId;
    if (activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const campaigns = await prisma.promotionCampaign.findMany({
      where,
      include: {
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      campaignType,
      packageTier,
      packageId,
      discountType,
      discountValue,
      tokenMultiplier,
      freeTokens,
      startDate,
      endDate,
      isActive = true,
      maxUses,
    } = body;

    if (!name || !campaignType || !discountType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const campaign = await prisma.promotionCampaign.create({
      data: {
        name,
        description,
        campaignType,
        packageTier: packageTier || null,
        packageId: packageId || null,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        tokenMultiplier: tokenMultiplier ? parseFloat(tokenMultiplier) : null,
        freeTokens: freeTokens ? parseInt(freeTokens) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        maxUses: maxUses ? parseInt(maxUses) : null,
        createdBy: session.user?.id || null,
      },
      include: {
        package: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("Error creating campaign:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
