// src/app/api/promotion-campaigns/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.promotionCampaign.findUnique({
      where: { id },
      include: {
        package: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("Error fetching campaign:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.campaignType !== undefined) updateData.campaignType = body.campaignType;
    if (body.packageTier !== undefined) updateData.packageTier = body.packageTier;
    if (body.packageId !== undefined) updateData.packageId = body.packageId;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined)
      updateData.discountValue = body.discountValue ? parseFloat(body.discountValue) : null;
    if (body.tokenMultiplier !== undefined)
      updateData.tokenMultiplier = body.tokenMultiplier ? parseFloat(body.tokenMultiplier) : null;
    if (body.freeTokens !== undefined)
      updateData.freeTokens = body.freeTokens ? parseInt(body.freeTokens) : null;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.maxUses !== undefined)
      updateData.maxUses = body.maxUses ? parseInt(body.maxUses) : null;

    const campaign = await prisma.promotionCampaign.update({
      where: { id },
      data: updateData,
      include: {
        package: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("Error updating campaign:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.promotionCampaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting campaign:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
