// src/app/api/categories/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Find category by slug
    const category = await prisma.shopCategory.findUnique({
      where: { slug },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get shops in this category using raw SQL to get latest subscription
    const shopsWithSubscription = await prisma.$queryRaw<any[]>`
      WITH latest_subscriptions AS (
        SELECT DISTINCT ON (s.id)
          s.id as shop_id,
          ss.id as subscription_id,
          sp.tier as subscription_tier,
          ss.status as subscription_status,
          ss.start_date,
          ss.end_date
        FROM "Shop" s
        INNER JOIN shop_category_mapping scm ON scm.shop_id = s.id
        LEFT JOIN shop_subscriptions ss ON s.id = ss.shop_id
        LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
        WHERE scm.category_id = ${category.id}
          AND s.status = 'APPROVED'
        ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
      )
      SELECT 
        s.id,
        s.name,
        s.description,
        s.image,
        s.address,
        s.lat,
        s.lng,
        p.name_th as province,
        a.name_th as district,
        ls.subscription_tier,
        ls.subscription_status,
        ls.end_date
      FROM "Shop" s
      INNER JOIN shop_category_mapping scm ON scm.shop_id = s.id
      LEFT JOIN latest_subscriptions ls ON s.id = ls.shop_id
      LEFT JOIN loc_provinces p ON s.province_id = p.id
      LEFT JOIN loc_amphures a ON s.amphure_id = a.id
      WHERE scm.category_id = ${category.id}
        AND s.status = 'APPROVED'
      ORDER BY 
        CASE 
          WHEN ls.subscription_tier = 'PREMIUM' THEN 1
          WHEN ls.subscription_tier = 'PRO' THEN 2
          WHEN ls.subscription_tier = 'BASIC' THEN 3
          ELSE 4
        END,
        s."createdAt" DESC;
    `;

    // Transform to shop list
    const shops = shopsWithSubscription.map((shop) => {
      // Determine if subscription is active
      const isActive = shop.subscription_status === 'ACTIVE' && 
                      shop.end_date && 
                      new Date(shop.end_date) > new Date();
      
      return {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        image: shop.image,
        address: shop.address,
        province: shop.province || null,
        district: shop.district || null,
        lat: shop.lat,
        lng: shop.lng,
        subscriptionTier: isActive ? shop.subscription_tier : 'FREE',
      };
    });

    return NextResponse.json({
      success: true,
      category,
      shops,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
