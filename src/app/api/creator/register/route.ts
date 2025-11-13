// app/api/creator/register/route.ts
// สมัครเป็น Reviewer พร้อมข้อมูลราคา

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
      hasExperience, // NEW
      priceRangeMin, // NEW
      priceRangeMax, // NEW
    } = body;

    // Validation
    if (!displayName || !phone || !coverageLevel) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Validate pricing fields
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

      // Optional: ตรวจสอบว่าช่วงราคาสมเหตุสมผล
      if (priceRangeMax - priceRangeMin > 50000) {
        return NextResponse.json(
          { error: "ช่วงราคากว้างเกินไป กรุณาระบุให้แม่นยำขึ้น" },
          { status: 400 }
        );
      }
    }

    // Validate social media (ต้องมีอย่างน้อย 1 ช่องทาง)
    const social = socialMedia || {};
    const hasSocialMedia = Object.values(social).some(
      (value) => value && value !== ""
    );

    if (!hasSocialMedia) {
      return NextResponse.json(
        { error: "กรุณาระบุ Social Media อย่างน้อย 1 ช่องทาง" },
        { status: 400 }
      );
    }

    // Check if already applied
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (existingCreator) {
      return NextResponse.json(
        { error: "คุณได้สมัครเป็น Reviewer ไปแล้ว" },
        { status: 400 }
      );
    }

    // Create creator application
    const creator = await prisma.creator.create({
      data: {
        userId: session.user.id,
        displayName,
        bio,
        phone,
        coverageLevel,
        provinceId: provinceId ? parseInt(provinceId) : null,
        amphureId: amphureId ? parseInt(amphureId) : null,
        tambonId: tambonId ? parseInt(tambonId) : null,
        socialMedia: social,
        portfolioLinks: portfolioLinks || [],
        hasExperience: hasExperience ?? true,
        priceRangeMin: hasExperience ? parseInt(priceRangeMin) : null,
        priceRangeMax: hasExperience ? parseInt(priceRangeMax) : null,
        applicationStatus: "PENDING",
        appliedAt: new Date(),
      },
    });

    // TODO: Send notification to admin
    // TODO: Send confirmation email to user

    return NextResponse.json(
      {
        success: true,
        message: "ส่งคำขอสมัครเรียบร้อยแล้ว! กรุณารอการอนุมัติจากทีมงาน",
        data: creator,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating creator:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}