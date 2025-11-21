// src/app/api/shops/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Use raw query for better performance with all necessary joins
    const shops = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.address,
        s.image,
        s.lat,
        s.lng,
        s.phone,
        s.website,
        s.status,
        s."createdAt",
        sc.name as category,
        COALESCE(
          (
            SELECT sp.tier
            FROM shop_subscriptions ss
            JOIN subscription_packages sp ON ss.plan_id = sp.id
            WHERE ss.shop_id = s.id
              AND ss.status = 'ACTIVE'
              AND ss.end_date > NOW()
            ORDER BY 
              CASE sp.tier
                WHEN 'PREMIUM' THEN 1
                WHEN 'PRO' THEN 2
                WHEN 'BASIC' THEN 3
                ELSE 4
              END
            LIMIT 1
          ),
          'FREE'
        ) as package_tier
      FROM "Shop" s
      LEFT JOIN "ShopCategory" sc ON s."categoryId" = sc.id
      WHERE s.id = $1
      LIMIT 1
    `, shopId);

    if (!shops || shops.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const shop = shops[0];

    // Get location data if available
    if (shop.lat && shop.lng) {
      try {
        const locationData = await prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            t.name_th as subdistrict,
            a.name_th as district,
            p.name_th as province
          FROM "Shop" s
          LEFT JOIN loc_tambons t ON s.tambon_id = t.id
          LEFT JOIN loc_amphures a ON s.amphure_id = a.id
          LEFT JOIN loc_provinces p ON s.province_id = p.id
          WHERE s.id = $1
          LIMIT 1
        `, shopId);

        if (locationData && locationData.length > 0) {
          shop.subdistrict = locationData[0].subdistrict;
          shop.district = locationData[0].district;
          shop.province = locationData[0].province;
        }
      } catch (err) {
        console.error('Error fetching location data:', err);
        // Continue without location data
      }
    }

    // Add badge emoji and text based on package tier
    const PACKAGE_BADGES: Record<string, { emoji: string; text: string }> = {
      PREMIUM: { emoji: '👑', text: 'Premium Partner' },
      PRO: { emoji: '🔥', text: 'Pro Shop' },
      BASIC: { emoji: '⭐', text: 'Verified' },
      FREE: { emoji: '', text: '' },
    };

    const badge = PACKAGE_BADGES[shop.package_tier] || PACKAGE_BADGES.FREE;
    shop.badge_emoji = badge.emoji;
    shop.badge_text = badge.text;

    return NextResponse.json(shop);

  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shop details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
