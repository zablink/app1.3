// src/app/api/shops/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/shops/[id]
 * ดึงข้อมูลร้านค้าเดี่ยวตาม ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = parseInt(params.id);

    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลร้านพร้อม subscription info
    const shop = await prisma.$queryRaw<any[]>`
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
      
      WHERE s.id = ${shopId}
      LIMIT 1
    `;

    if (shop.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // แปลง BigInt เป็น Number
    const formattedShop = {
      ...shop[0],
      id: Number(shop[0].id),
      display_weight: Number(shop[0].display_weight),
      lat: shop[0].lat ? Number(shop[0].lat) : null,
      lng: shop[0].lng ? Number(shop[0].lng) : null,
    };

    return NextResponse.json(formattedShop);
    
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shop',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shops/[id]
 * อัปเดตข้อมูลร้านค้า
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = parseInt(params.id);

    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, category, image, lat, lng, subdistrict, district, province } = body;

    // ตรวจสอบว่าร้านมีอยู่จริง
    const existingShop = await prisma.simple_shops.findUnique({
      where: { id: shopId },
    });

    if (!existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // อัปเดตข้อมูล
    const updatedShop = await prisma.simple_shops.update({
      where: { id: shopId },
      data: {
        name: name || existingShop.name,
        category: category !== undefined ? category : existingShop.category,
        image: image !== undefined ? image : existingShop.image,
        lat: lat !== undefined ? lat : existingShop.lat,
        lng: lng !== undefined ? lng : existingShop.lng,
        subdistrict: subdistrict !== undefined ? subdistrict : existingShop.subdistrict,
        district: district !== undefined ? district : existingShop.district,
        province: province !== undefined ? province : existingShop.province,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedShop);
    
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update shop',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shops/[id]
 * ลบร้านค้า
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = parseInt(params.id);

    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าร้านมีอยู่จริง
    const existingShop = await prisma.simple_shops.findUnique({
      where: { id: shopId },
    });

    if (!existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // ลบร้าน (cascade จะลบ subscriptions ที่เกี่ยวข้องด้วย)
    await prisma.simple_shops.delete({
      where: { id: shopId },
    });

    return NextResponse.json({
      success: true,
      message: 'Shop deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete shop',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}