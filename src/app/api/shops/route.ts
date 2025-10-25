// src/app/api/shops/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/shops
 * ดึงรายการร้านค้าทั้งหมด พร้อม package tier
 */
export async function GET() {
  try {
    // ใช้ raw query เพื่อ join กับ subscriptions
    const shops = await prisma.$queryRaw<any[]>`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.image,
        s.lat,
        s.lng,
        s.subdistrict,
        s.district,
        s.province,
        s.created_at,
        s.updated_at,
        
        -- ดึง package tier จาก active subscription
        COALESCE(ss.current_package_tier, 'FREE') as package_tier,
        
        -- ดึง display_weight สำหรับเรียงลำดับ
        COALESCE(sp.display_weight, 1) as display_weight,
        
        -- ข้อมูล subscription (ถ้ามี)
        ss.end_date as subscription_end_date,
        ss.status as subscription_status,
        ss.next_package_tier as next_tier,
        
        -- Badge info
        sp.badge_emoji,
        sp.badge_text
        
      FROM simple_shops s
      
      -- Left join เพื่อรวมร้านที่ไม่มี subscription ด้วย
      LEFT JOIN shop_subscriptions ss ON (
        s.id = ss.shop_id 
        AND ss.status = 'ACTIVE'
        AND ss.end_date > NOW()
      )
      
      -- Join package info
      LEFT JOIN subscription_packages sp ON (
        COALESCE(ss.current_package_tier, 'FREE') = sp.tier
      )
      
      ORDER BY 
        sp.display_weight DESC NULLS LAST,  -- เรียงตาม weight (premium → free)
        s.created_at DESC                    -- ร้านใหม่ก่อน
    `;

    // แปลง BigInt เป็น Number
    const formattedShops = shops.map(shop => ({
      ...shop,
      id: Number(shop.id),
      display_weight: Number(shop.display_weight),
      lat: shop.lat ? Number(shop.lat) : null,
      lng: shop.lng ? Number(shop.lng) : null,
    }));

    return NextResponse.json(formattedShops);
    
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shops',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shops
 * สร้างร้านค้าใหม่
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, category, image, lat, lng, subdistrict, district, province } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Shop name is required' },
        { status: 400 }
      );
    }

    const shop = await prisma.simple_shops.create({
      data: {
        name,
        category: category || null,
        image: image || null,
        lat: lat || null,
        lng: lng || null,
        subdistrict: subdistrict || null,
        district: district || null,
        province: province || null,
      },
    });

    return NextResponse.json(shop, { status: 201 });
    
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create shop',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}