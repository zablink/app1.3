// app/api/admin/reviewers/[id]/approve/route.ts
// Admin อนุมัติ/ปฏิเสธ Reviewer Application และกำหนดราคา

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { action, currentPriceMin, currentPriceMax, rejectReason } = body;

    // Validate
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "กรุณาระบุ action: approve หรือ reject" },
        { status: 400 }
      );
    }

    // Find creator
    const creator = await prisma.creator.findUnique({
      where: { id: (await params).id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "ไม่พบ Creator" },
        { status: 404 }
      );
    }

    if (creator.applicationStatus !== "PENDING") {
      return NextResponse.json(
        { error: "สถานะนี้ได้รับการดำเนินการไปแล้ว" },
        { status: 400 }
      );
    }

    // Approve
    if (action === "approve") {
      // Validate pricing
      if (!currentPriceMin || !currentPriceMax) {
        return NextResponse.json(
          { error: "กรุณากำหนดราคาสำหรับ Reviewer คนนี้" },
          { status: 400 }
        );
      }

      if (currentPriceMin < 0 || currentPriceMax < 0) {
        return NextResponse.json(
          { error: "ราคาต้องมากกว่าหรือเท่ากับ 0" },
          { status: 400 }
        );
      }

      if (currentPriceMin > currentPriceMax) {
        return NextResponse.json(
          { error: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด" },
          { status: 400 }
        );
      }

      const updatedCreator = await prisma.creator.update({
        where: { id: (await params).id },
        data: {
          applicationStatus: "APPROVED",
          currentPriceMin: parseInt(currentPriceMin),
          currentPriceMax: parseInt(currentPriceMax),
          approvedAt: new Date(),
          rejectReason: null,
        },
      });

      // TODO: Update user role to CREATOR
      await prisma.user.update({
        where: { id: creator.userId },
        data: { role: "CREATOR" },
      });

      // TODO: Send approval email
      // TODO: Create notification

      return NextResponse.json({
        success: true,
        message: "อนุมัติ Reviewer เรียบร้อยแล้ว",
        data: updatedCreator,
      });
    }

    // Reject
    if (action === "reject") {
      if (!rejectReason) {
        return NextResponse.json(
          { error: "กรุณาระบุเหตุผลในการปฏิเสธ" },
          { status: 400 }
        );
      }

      const updatedCreator = await prisma.creator.update({
        where: { id: (await params).id },
        data: {
          applicationStatus: "REJECTED",
          rejectReason,
          rejectedAt: new Date(),
        },
      });

      // TODO: Send rejection email
      // TODO: Create notification

      return NextResponse.json({
        success: true,
        message: "ปฏิเสธ Reviewer เรียบร้อยแล้ว",
        data: updatedCreator,
      });
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error approving/rejecting creator:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

// GET - ดึงรายการ pending reviewers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const creators = await prisma.creator.findMany({
      where: {
        applicationStatus: status as any,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: creators,
      count: creators.length,
    });
  } catch (error) {
    console.error("Error fetching pending creators:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}