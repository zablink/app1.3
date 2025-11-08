// app/api/admin/reviewers/[id]/update-pricing/route.ts
// Admin เปลี่ยนราคา Reviewer พร้อมบันทึก History

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newPriceMin, newPriceMax, reason } = body;

    // Validation
    if (!newPriceMin || !newPriceMax) {
      return NextResponse.json(
        { error: "กรุณาระบุราคาใหม่" },
        { status: 400 }
      );
    }

    if (newPriceMin < 0 || newPriceMax < 0) {
      return NextResponse.json(
        { error: "ราคาต้องมากกว่าหรือเท่ากับ 0" },
        { status: 400 }
      );
    }

    if (newPriceMin > newPriceMax) {
      return NextResponse.json(
        { error: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด" },
        { status: 400 }
      );
    }

    // Find creator
    const creator = await prisma.creator.findUnique({
      where: { id: params.id },
      include: {
        priceHistory: {
          where: { effectiveTo: null }, // ราคาปัจจุบัน
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "ไม่พบ Creator" },
        { status: 404 }
      );
    }

    if (creator.applicationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Creator ต้องได้รับการอนุมัติก่อน" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Close current price history (set effectiveTo)
      if (creator.priceHistory.length > 0) {
        await tx.creatorPriceHistory.update({
          where: { id: creator.priceHistory[0].id },
          data: { effectiveTo: now },
        });
      }

      // 2. Create new price history record
      const newHistory = await tx.creatorPriceHistory.create({
        data: {
          creatorId: params.id,
          priceMin: parseInt(newPriceMin),
          priceMax: parseInt(newPriceMax),
          effectiveFrom: now,
          effectiveTo: null, // Current price
          changedBy: session.user.id,
          reason: reason || "Admin updated pricing",
        },
      });

      // 3. Update creator's current price
      const updatedCreator = await tx.creator.update({
        where: { id: params.id },
        data: {
          currentPriceMin: parseInt(newPriceMin),
          currentPriceMax: parseInt(newPriceMax),
          updatedAt: now,
        },
      });

      return { updatedCreator, newHistory };
    });

    // TODO: Send notification to creator about price change

    return NextResponse.json({
      success: true,
      message: "อัพเดทราคาเรียบร้อยแล้ว",
      data: {
        creator: result.updatedCreator,
        priceHistory: result.newHistory,
      },
    });
  } catch (error) {
    console.error("Error updating creator pricing:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

// GET - ดึงประวัติราคา
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    // Admin หรือ Creator เจ้าของ profile เท่านั้นที่ดูได้
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const creator = await prisma.creator.findUnique({
      where: { id: params.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "ไม่พบ Creator" },
        { status: 404 }
      );
    }

    // Check permission
    const isAdmin = user?.role === "ADMIN";
    const isOwner = creator.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการดูข้อมูลนี้" },
        { status: 403 }
      );
    }

    // ดึงประวัติราคาทั้งหมด
    const priceHistory = await prisma.creatorPriceHistory.findMany({
      where: { creatorId: params.id },
      orderBy: { effectiveFrom: "desc" },
      include: {
        creator: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: priceHistory,
      count: priceHistory.length,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
