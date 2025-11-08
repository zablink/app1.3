// app/api/creator/register/route.ts
// สมัครเป็น Reviewer พร้อมข้อมูลราคาและพื้นที่รับงานหลายแห่ง

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
    // ✅ รับ session แบบถูกต้อง
    const session = await getServerSession(authOptions);
    
    console.log('DEBUG session in Creator Register');
    console.log('📝 [Creator Register] Session check:', {
      hasSession: !!session,
      email: session?.user?.email,
      userId: session?.user?.id,
    });

    // ✅ ตรวจสอบ session
    if (!session?.user?.id) {
      console.error('❌ [Creator Register] No session or user ID');
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน กรุณา logout แล้ว login ใหม่อีกครั้ง" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    console.log('📝 [Creator Register] Request body:', {
      displayName: body.displayName,
      coverageLevel: body.coverageLevel,
      coverageAreasCount: body.coverageAreas?.length || 0,
      hasExperience: body.hasExperience,
      hasPricing: !!(body.priceRangeMin && body.priceRangeMax),
    });

    const {
      displayName,
      bio,
      phone,
      coverageLevel,
      coverageAreas,
      // Social Media
      youtubeUrl,
      youtubeSubscribers,
      facebookUrl,
      facebookFollowers,
      instagramUrl,
      instagramFollowers,
      tiktokUrl,
      tiktokFollowers,
      // Portfolio
      portfolioLinks,
      // Pricing (NEW)
      hasExperience,
      priceRangeMin,
      priceRangeMax,
      // Terms
      agreedToTerms,
    } = body;

    // ✅ Validation - Basic Info
    if (!displayName || !bio || !phone) {
      console.error('❌ Missing basic info');
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน (ชื่อ, คำแนะนำตัว, เบอร์โทร)" },
        { status: 400 }
      );
    }

    // ✅ Validation - Coverage Level
    if (!coverageLevel || !['tambon', 'amphure', 'province'].includes(coverageLevel)) {
      console.error('❌ Invalid coverage level:', coverageLevel);
      return NextResponse.json(
        { error: "กรุณาเลือกระดับการให้บริการ" },
        { status: 400 }
      );
    }

    // ✅ Validation - Coverage Areas (multiple)
    if (!coverageAreas || !Array.isArray(coverageAreas) || coverageAreas.length === 0) {
      console.error('❌ No coverage areas');
      return NextResponse.json(
        { error: "กรุณาเลือกพื้นที่ที่พร้อมรับงานอย่างน้อย 1 แห่ง" },
        { status: 400 }
      );
    }

    if (coverageAreas.length > 5) {
      console.error('❌ Too many coverage areas:', coverageAreas.length);
      return NextResponse.json(
        { error: "เลือกพื้นที่ได้สูงสุด 5 แห่ง" },
        { status: 400 }
      );
    }

    // ✅ Validation - Pricing (NEW)
    if (hasExperience === undefined || hasExperience === null) {
      console.error('❌ hasExperience not specified');
      return NextResponse.json(
        { error: "กรุณาระบุประสบการณ์การรับงานรีวิว" },
        { status: 400 }
      );
    }

    if (hasExperience) {
      // ถ้ามีประสบการณ์ ต้องกรอกราคา
      if (!priceRangeMin || !priceRangeMax) {
        console.error('❌ Missing price range');
        return NextResponse.json(
          { error: "กรุณากรอกช่วงราคาที่เคยรับงาน" },
          { status: 400 }
        );
      }

      const minPrice = parseInt(priceRangeMin);
      const maxPrice = parseInt(priceRangeMax);

      if (minPrice < 0 || maxPrice < 0) {
        console.error('❌ Negative price');
        return NextResponse.json(
          { error: "ราคาต้องมากกว่าหรือเท่ากับ 0" },
          { status: 400 }
        );
      }

      if (minPrice > maxPrice) {
        console.error('❌ Invalid price range');
        return NextResponse.json(
          { error: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด" },
          { status: 400 }
        );
      }

      // Optional: ช่วงราคาไม่ควรกว้างเกินไป
      if (maxPrice - minPrice > 50000) {
        console.error('❌ Price range too wide');
        return NextResponse.json(
          { error: "ช่วงราคากว้างเกินไป กรุณาระบุให้แม่นยำขึ้น" },
          { status: 400 }
        );
      }
    }

    // ✅ Validation - Social Media
    if (!youtubeUrl && !facebookUrl && !instagramUrl && !tiktokUrl) {
      console.error('❌ No social media');
      return NextResponse.json(
        { error: "กรุณากรอก Social Media อย่างน้อย 1 ช่องทาง" },
        { status: 400 }
      );
    }

    // ✅ Validation - Terms
    if (!agreedToTerms) {
      console.error('❌ Terms not agreed');
      return NextResponse.json(
        { error: "กรุณายอมรับเงื่อนไขการให้บริการ" },
        { status: 400 }
      );
    }

    // ✅ เช็คว่าเคยสมัครแล้วหรือไม่
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: userId },
    });

    if (existingCreator) {
      console.error('❌ Already registered:', userId);
      return NextResponse.json(
        { error: "คุณได้สมัครเป็นนักรีวิวแล้ว" },
        { status: 400 }
      );
    }

    // ✅ สร้าง Creator ในฐานข้อมูล
    console.log('✅ Creating creator...');
    
    const creator = await prisma.creator.create({
      data: {
        userId: userId,
        displayName: displayName,
        bio: bio,
        phone: phone,
        coverageLevel: coverageLevel,
        
        // Social media (แบบละเอียด - แยก fields)
        youtubeUrl: youtubeUrl || null,
        youtubeSubscribers: youtubeSubscribers ? parseInt(youtubeSubscribers) : null,
        facebookUrl: facebookUrl || null,
        facebookFollowers: facebookFollowers ? parseInt(facebookFollowers) : null,
        instagramUrl: instagramUrl || null,
        instagramFollowers: instagramFollowers ? parseInt(instagramFollowers) : null,
        tiktokUrl: tiktokUrl || null,
        tiktokFollowers: tiktokFollowers ? parseInt(tiktokFollowers) : null,
        
        // Pricing (NEW)
        hasExperience: hasExperience,
        priceRangeMin: hasExperience && priceRangeMin ? parseInt(priceRangeMin) : null,
        priceRangeMax: hasExperience && priceRangeMax ? parseInt(priceRangeMax) : null,
        
        // Status
        status: 'pending', // รอการอนุมัติจาก admin
        appliedAt: new Date(), // บันทึกวันที่สมัคร
      },
    });

    console.log('✅ Creator created:', creator.id);

    // ✅ บันทึก Coverage Areas (multiple)
    console.log('✅ Creating coverage areas...');
    
    const coverageAreaRecords = coverageAreas.map((area: CoverageArea) => ({
      creatorId: creator.id,
      provinceId: area.type === 'province' ? area.id : null,
      amphureId: area.type === 'amphure' ? area.id : null,
      tambonId: area.type === 'tambon' ? area.id : null,
    }));

    await prisma.creatorCoverageArea.createMany({
      data: coverageAreaRecords,
    });

    console.log('✅ Coverage areas created:', coverageAreaRecords.length);

    // ✅ บันทึก Portfolio Links (ถ้ามี)
    if (portfolioLinks && Array.isArray(portfolioLinks)) {
      const validLinks = portfolioLinks.filter((link: string) => link && link.trim() !== '');
      if (validLinks.length > 0) {
        console.log('✅ Portfolio links:', validLinks.length);
        
        // บันทึกลง CreatorPortfolio table (ถ้ามี)
        try {
          const portfolioRecords = validLinks.map((link: string) => ({
            creatorId: creator.id,
            url: link,
          }));
          
          await prisma.creatorPortfolio.createMany({
            data: portfolioRecords,
            skipDuplicates: true,
          });
          
          console.log('✅ Portfolio saved to database');
        } catch (error) {
          console.warn('⚠️ Could not save portfolio links:', error);
          // ไม่ error เพราะ creator ถูกสร้างแล้ว
        }
      }
    }

    // ✅ อัพเดท User role เป็น CREATOR (Optional)
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'CREATOR' },
      });
      console.log('✅ User role updated to CREATOR');
    } catch (error) {
      console.warn('⚠️ Could not update user role:', error);
      // ไม่ error เพราะ creator ถูกสร้างแล้ว
    }

    console.log('🎉 Registration complete!');

    // TODO: Send notification to admin
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: "ส่งคำขอสมัครเรียบร้อยแล้ว! กรุณารอการอนุมัติจากทีมงาน (1-3 วันทำการ)",
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        status: creator.status,
        coverageLevel: creator.coverageLevel,
        coverageAreasCount: coverageAreaRecords.length,
        hasExperience: creator.hasExperience,
        priceRange: creator.hasExperience ? {
          min: creator.priceRangeMin,
          max: creator.priceRangeMax,
        } : null,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 [Creator Register] Error:', error);
    console.error('💥 Stack:', error.stack);
    
    // ✅ จัดการ Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "ข้อมูลซ้ำกับที่มีอยู่แล้ว กรุณาตรวจสอบอีกครั้ง" },
        { status: 400 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "ข้อมูลพื้นที่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้ กรุณา login ใหม่" },
        { status: 404 }
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

// ✅ GET - ตรวจสอบสถานะการสมัคร
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
        hasExperience: creator.hasExperience,
        priceRange: creator.hasExperience ? {
          min: creator.priceRangeMin,
          max: creator.priceRangeMax,
        } : null,
        appliedAt: creator.appliedAt,
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