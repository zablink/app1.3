// src/app/api/creator/register/route.ts (CamelCase version)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CoverageArea {
  id: number;
  name: string;
  type: 'province' | 'amphure' | 'tambon';
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('📝 [Creator Register] Session:', session?.user?.email);
    
    if (!session?.user?.id) {
      console.error('❌ [Creator Register] No session');
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 [Creator Register] Request body:', {
      displayName: body.displayName,
      coverageLevel: body.coverageLevel,
      coverageAreasCount: body.coverageAreas?.length || 0,
    });

    const {
      displayName,
      bio,
      phone,
      coverageLevel,
      coverageAreas,
      youtubeUrl,
      youtubeSubscribers,
      facebookUrl,
      facebookFollowers,
      instagramUrl,
      instagramFollowers,
      tiktokUrl,
      tiktokFollowers,
      portfolioLinks,
    } = body;

    // Validation
    if (!displayName || !bio || !phone) {
      console.error('❌ [Creator Register] Missing basic info');
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!coverageLevel || !['tambon', 'amphure', 'province'].includes(coverageLevel)) {
      console.error('❌ [Creator Register] Invalid coverage level:', coverageLevel);
      return NextResponse.json(
        { error: "กรุณาเลือกระดับการให้บริการ" },
        { status: 400 }
      );
    }

    if (!coverageAreas || !Array.isArray(coverageAreas) || coverageAreas.length === 0) {
      console.error('❌ [Creator Register] No coverage areas');
      return NextResponse.json(
        { error: "กรุณาเลือกพื้นที่ที่พร้อมรับงานอย่างน้อย 1 แห่ง" },
        { status: 400 }
      );
    }

    if (coverageAreas.length > 5) {
      console.error('❌ [Creator Register] Too many coverage areas:', coverageAreas.length);
      return NextResponse.json(
        { error: "เลือกพื้นที่ได้สูงสุด 5 แห่ง" },
        { status: 400 }
      );
    }

    if (!youtubeUrl && !facebookUrl && !instagramUrl && !tiktokUrl) {
      console.error('❌ [Creator Register] No social media');
      return NextResponse.json(
        { error: "กรุณากรอก Social Media อย่างน้อย 1 ช่องทาง" },
        { status: 400 }
      );
    }

    // เช็คว่าเคยสมัครแล้วหรือไม่
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (existingCreator) {
      console.error('❌ [Creator Register] Already registered:', session.user.id);
      return NextResponse.json(
        { error: "คุณได้สมัครเป็นนักรีวิวแล้ว" },
        { status: 400 }
      );
    }

    // สร้าง Creator (ใช้ camelCase)
    console.log('✅ [Creator Register] Creating creator...');
    
    const creator = await prisma.creator.create({
      data: {
        userId: session.user.id,
        displayName,
        bio,
        phone,
        coverageLevel,
        
        // Social media (camelCase)
        youtubeUrl: youtubeUrl || null,
        youtubeSubscribers: youtubeSubscribers ? parseInt(youtubeSubscribers) : null,
        facebookUrl: facebookUrl || null,
        facebookFollowers: facebookFollowers ? parseInt(facebookFollowers) : null,
        instagramUrl: instagramUrl || null,
        instagramFollowers: instagramFollowers ? parseInt(instagramFollowers) : null,
        tiktokUrl: tiktokUrl || null,
        tiktokFollowers: tiktokFollowers ? parseInt(tiktokFollowers) : null,
        
        status: 'pending',
      },
    });

    console.log('✅ [Creator Register] Creator created:', creator.id);

    // บันทึก Coverage Areas (ใช้ camelCase)
    console.log('✅ [Creator Register] Creating coverage areas...');
    
    const coverageAreaRecords = coverageAreas.map((area: CoverageArea) => ({
      creatorId: creator.id,
      provinceId: area.type === 'province' ? area.id : null,
      amphureId: area.type === 'amphure' ? area.id : null,
      tambonId: area.type === 'tambon' ? area.id : null,
    }));

    await prisma.creatorCoverageArea.createMany({
      data: coverageAreaRecords,
    });

    console.log('✅ [Creator Register] Coverage areas created:', coverageAreaRecords.length);

    // Portfolio Links (ถ้ามี)
    if (portfolioLinks && Array.isArray(portfolioLinks)) {
      const validLinks = portfolioLinks.filter((link: string) => link && link.trim() !== '');
      if (validLinks.length > 0) {
        console.log('✅ [Creator Register] Portfolio links:', validLinks.length);
      }
    }

    // Update user role (optional)
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'CREATOR' }, // ตามที่กำหนดใน enum Role
      });
      console.log('✅ [Creator Register] User role updated');
    } catch (error) {
      console.warn('⚠️ [Creator Register] Could not update user role:', error);
    }

    console.log('🎉 [Creator Register] Registration complete!');

    return NextResponse.json({
      success: true,
      message: "ส่งคำขอสมัครเรียบร้อยแล้ว กรุณารอการอนุมัติจากทีมงาน",
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        status: creator.status,
      },
    });

  } catch (error: any) {
    console.error('💥 [Creator Register] Error:', error);
    console.error('💥 [Creator Register] Error stack:', error.stack);
    console.error('💥 [Creator Register] Error message:', error.message);
    
    // Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "ข้อมูลซ้ำกับที่มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "ข้อมูลพื้นที่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET - ตรวจสอบสถานะการสมัคร
export async function GET(request: Request) {
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
        coverageAreas: true,
      },
    });

    if (!creator) {
      return NextResponse.json({
        registered: false,
      });
    }

    return NextResponse.json({
      registered: true,
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        status: creator.status,
        coverageLevel: creator.coverageLevel,
        coverageAreasCount: creator.coverageAreas.length,
      },
    });

  } catch (error) {
    console.error('Error checking creator status:', error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}