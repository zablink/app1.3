// src/app/api/shops/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ⬅️ เปลี่ยนจาก new PrismaClient()

export const dynamic = 'force-dynamic';

/**
 * GET /api/shops
 * ดึงรายการร้านค้าทั้งหมด พร้อม package tier
 */
export async function GET() {
  try {
    // ลองใช้ Prisma ORM แทน raw query ก่อน
    const shops = await prisma.simple_shops.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        shop_subscriptions: {
          where: {
            status: 'ACTIVE',
            end_date: {
              gt: new Date(),
            },
          },
          include: {
            subscription_packages: true,
          },
        },
      },
      orderBy: [
        { created_at: 'desc' },
      ],
    });

    // Format ข้อมูล
    const formattedShops = shops.map(shop => {
      const activeSubscription = shop.shop_subscriptions?.[0];
      const packageInfo = activeSubscription?.subscription_packages;

      return {
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
        package_tier: activeSubscription?.current_package_tier || 'FREE',
        display_weight: packageInfo?.display_weight || 1,
        subscription_end_date: activeSubscription?.end_date,
        subscription_status: activeSubscription?.status,
        next_tier: activeSubscription?.next_package_tier,
        badge_emoji: packageInfo?.badge_emoji,
        badge_text: packageInfo?.badge_text,
      };
    });

    // เรียงตาม display_weight
    formattedShops.sort((a, b) => {
      if (b.display_weight !== a.display_weight) {
        return b.display_weight - a.display_weight;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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
        status: 'PENDING_APPROVAL',
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