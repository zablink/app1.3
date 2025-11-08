// app/api/shop/campaigns/create/route.ts
// สร้าง Campaign และ Lock ราคา Creator ณ เวลานั้น

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    // Check if user is shop owner
    const shop = await prisma.shop.findFirst({
      where: { userId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลร้านค้า" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, creatorIds, tokensPerReview } = body;

    // Validation
    if (!title || !creatorIds || creatorIds.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อ campaign และเลือก reviewer อย่างน้อย 1 คน" },
        { status: 400 }
      );
    }

    // Fetch selected creators with current pricing
    const creators = await prisma.creator.findMany({
      where: {
        id: { in: creatorIds },
        applicationStatus: "APPROVED",
      },
      select: {
        id: true,
        displayName: true,
        currentPriceMin: true,
        currentPriceMax: true,
      },
    });

    if (creators.length !== creatorIds.length) {
      return NextResponse.json(
        { error: "พบ Reviewer บางคนที่ยังไม่ได้รับการอนุมัติ" },
        { status: 400 }
      );
    }

    // Use transaction to create campaign and jobs atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create campaign
      const campaign = await tx.campaign.create({
        data: {
          shopId: shop.id,
          title,
          description,
          // Lock the FIRST creator's price as reference (if applicable)
          // Or you can average them, or handle differently
          creatorPriceAtCreation: tokensPerReview || creators[0].currentPriceMax,
          status: "ACTIVE",
        },
      });

      // 2. Create campaign jobs for each creator
      // IMPORTANT: Lock each creator's price at THIS moment
      const jobs = await Promise.all(
        creators.map((creator) =>
          tx.campaignJob.create({
            data: {
              campaignId: campaign.id,
              creatorId: creator.id,
              // LOCK: Use current price (ราคา ณ วินาทีนี้)
              agreedPrice: tokensPerReview || creator.currentPriceMax!,
              status: "PENDING", // รอ creator รับงาน
            },
          })
        )
      );

      return { campaign, jobs };
    });

    // TODO: Send notifications to creators

    return NextResponse.json({
      success: true,
      message: "สร้าง Campaign เรียบร้อยแล้ว",
      data: {
        campaign: result.campaign,
        jobsCreated: result.jobs.length,
        jobs: result.jobs,
      },
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

// GET - ดึงรายการ campaigns ของร้าน
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const shop = await prisma.shop.findFirst({
      where: { userId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลร้านค้า" },
        { status: 404 }
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: { shopId: shop.id },
      include: {
        jobs: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                currentPriceMin: true,
                currentPriceMax: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
