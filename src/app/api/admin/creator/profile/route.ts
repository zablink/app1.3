// app/api/creator/profile/route.ts
// ดึงและแก้ไขข้อมูล Reviewer Profile

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - ดึงข้อมูล creator profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Creator" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: creator });
  } catch (error) {
    console.error("Error fetching creator profile:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขข้อมูล creator profile (เฉพาะ APPROVED)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    // Check if creator exists and is approved
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingCreator) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Creator" },
        { status: 404 }
      );
    }

    if (existingCreator.applicationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "คุณต้องได้รับการอนุมัติก่อนจึงจะแก้ไขข้อมูลได้" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      displayName,
      bio,
      phone,
      coverageLevel,
      provinceId,
      amphureId,
      tambonId,
      socialMedia,
      portfolioLinks,
      hasExperience,
      priceRangeMin,
      priceRangeMax,
    } = body;

    // Validation
    if (!displayName || !phone || !coverageLevel) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Validate pricing
    if (hasExperience) {
      if (!priceRangeMin || !priceRangeMax) {
        return NextResponse.json(
          { error: "กรุณากรอกช่วงราคาที่เคยรับงาน" },
          { status: 400 }
        );
      }

      if (priceRangeMin < 0 || priceRangeMax < 0) {
        return NextResponse.json(
          { error: "ราคาต้องมากกว่าหรือเท่ากับ 0" },
          { status: 400 }
        );
      }

      if (priceRangeMin > priceRangeMax) {
        return NextResponse.json(
          { error: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด" },
          { status: 400 }
        );
      }
    }

    // Update creator
    const updatedCreator = await prisma.creator.update({
      where: { userId: session.user.id },
      data: {
        displayName,
        bio,
        phone,
        coverageLevel,
        provinceId: provinceId ? parseInt(provinceId) : null,
        amphureId: amphureId ? parseInt(amphureId) : null,
        tambonId: tambonId ? parseInt(tambonId) : null,
        socialMedia,
        portfolioLinks: portfolioLinks || [],
        hasExperience: hasExperience ?? true,
        priceRangeMin: hasExperience ? parseInt(priceRangeMin) : null,
        priceRangeMax: hasExperience ? parseInt(priceRangeMax) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลเรียบร้อยแล้ว",
      data: updatedCreator,
    });
  } catch (error) {
    console.error("Error updating creator profile:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
