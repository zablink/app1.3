// src/app/api/shops/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shops
 * ดึงรายการร้านค้าทั้งหมด (simple_shops ไม่มี subscription system)
 */
export async function GET() {
  try {
    const shops = await prisma.simple_shops.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    // simple_shops ไม่มี subscription ให้ return ข้อมูลตรงๆ
    const formattedShops = shops.map(shop => ({
      id: shop.id,
      name: shop.name,
      category: shop.category,
      image: shop.image,
      lat: shop.lat,
      lng: shop.lng,
      subdistrict: shop.subdistrict,
      district: shop.district,
      province: shop.province,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
      // Default values สำหรับ compatibility
      package_tier: 'FREE',
      display_weight: 1,
      subscription_end_date: null,
      subscription_status: null,
      next_tier: null,
      badge_emoji: null,
      badge_text: null,
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
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
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