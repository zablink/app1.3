// app/api/creator/check-displayname/route.ts
// API สำหรับตรวจสอบชื่อที่แสดงซ้ำหรือใกล้เคียง

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * ฟังก์ชันคำนวณความคล้ายคลึงของสตริง (Levenshtein Distance)
 * ใช้ตรวจสอบชื่อที่ใกล้เคียงกัน
 */
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * ฟังก์ชันคำนวณความคล้ายคลึงเป็นเปอร์เซ็นต์
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * GET /api/creator/check-displayname?name=xxx
 * ตรวจสอบว่าชื่อซ้ำหรือใกล้เคียงกับที่มีอยู่แล้วหรือไม่
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const displayName = searchParams.get("name");

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อที่ต้องการตรวจสอบ" },
        { status: 400 }
      );
    }

    // ตรวจสอบความยาว
    if (displayName.length < 2) {
      return NextResponse.json(
        { 
          available: false,
          reason: "too_short",
          message: "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร"
        },
        { status: 200 }
      );
    }

    if (displayName.length > 50) {
      return NextResponse.json(
        { 
          available: false,
          reason: "too_long",
          message: "ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร"
        },
        { status: 200 }
      );
    }

    // ดึงผู้ใช้ปัจจุบัน
    const currentUser = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      select: { displayName: true },
    });

    // ถ้าเป็นชื่อเดิมของตัวเอง ให้ผ่าน
    if (currentUser?.displayName === displayName.trim()) {
      return NextResponse.json({
        available: true,
        isCurrent: true,
        message: "นี่คือชื่อปัจจุบันของคุณ",
      });
    }

    // ค้นหาชื่อที่ซ้ำเป๊ะ (exact match)
    const exactMatch = await prisma.creator.findFirst({
      where: {
        displayName: {
          equals: displayName.trim(),
          mode: "insensitive", // case-insensitive
        },
        userId: { not: session.user.id }, // ไม่นับของตัวเอง
      },
      select: {
        displayName: true,
        status: true,
      },
    });

    if (exactMatch) {
      return NextResponse.json({
        available: false,
        reason: "exact_match",
        message: "มีผู้ใช้งานชื่อนี้แล้ว กรุณาเลือกชื่ออื่น",
        existingName: exactMatch.displayName,
      });
    }

    // ค้นหาชื่อที่ใกล้เคียง (similar names)
    const allCreators = await prisma.creator.findMany({
      where: {
        userId: { not: session.user.id },
        status: { in: ["PENDING", "APPROVED"] }, // เช็คเฉพาะที่ active
      },
      select: {
        displayName: true,
      },
    });

    const similarNames: Array<{
      name: string;
      similarity: number;
    }> = [];

    // คำนวณความคล้ายคลึง
    for (const creator of allCreators) {
      const similarity = calculateSimilarity(
        displayName.trim(),
        creator.displayName
      );

      // ถ้าคล้ายกันมากกว่า 80% ถือว่าใกล้เคียงมาก
      if (similarity >= 80) {
        similarNames.push({
          name: creator.displayName,
          similarity: Math.round(similarity),
        });
      }
    }

    // เรียงตามความคล้ายคลึงจากมากไปน้อย
    similarNames.sort((a, b) => b.similarity - a.similarity);

    // ถ้ามีชื่อที่คล้ายกันมากกว่า 90% แนะนำให้เปลี่ยน
    if (similarNames.length > 0 && similarNames[0].similarity >= 90) {
      return NextResponse.json({
        available: false,
        reason: "very_similar",
        message: "ชื่อนี้ใกล้เคียงกับชื่อผู้ใช้งานอื่นมาก กรุณาเลือกชื่อที่แตกต่างชัดเจนกว่านี้",
        similarNames: similarNames.slice(0, 3), // แสดงแค่ 3 อันดับแรก
      });
    }

    // ถ้าคล้ายกัน 80-89% แจ้งเตือน แต่ให้ใช้ได้
    if (similarNames.length > 0) {
      return NextResponse.json({
        available: true,
        warning: true,
        message: "ชื่อนี้ใกล้เคียงกับผู้ใช้งานอื่น แต่สามารถใช้ได้",
        similarNames: similarNames.slice(0, 3),
      });
    }

    // ชื่อพร้อมใช้งาน
    return NextResponse.json({
      available: true,
      message: "ชื่อนี้พร้อมใช้งาน",
    });
  } catch (error) {
    console.error("Error checking display name:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบชื่อ" },
      { status: 500 }
    );
  }
}