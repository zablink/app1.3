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

    // Get shops in this category with their subscription info
    const shopMappings = await prisma.shopCategoryMapping.findMany({
      where: {
        categoryId: category.id,
      },
      include: {
        shop: {
          include: {
            shop_subscriptions: {
              where: {
                status: 'ACTIVE',
                end_date: {
                  gt: new Date(),
                },
              },
              include: {
                subscription_package: true,
              },
              orderBy: {
                subscription_package: {
                  tier: 'asc', // PREMIUM first
                },
              },
              take: 1,
            },
            province: true,
            amphure: true,
            tambon: true,
          },
        },
      },
    });

    // Transform to shop list with subscription tier
    const shops = shopMappings.map((mapping) => {
      const shop = mapping.shop;
      const subscription = shop.shop_subscriptions[0];
      
      return {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        image: shop.image,
        address: shop.address,
        province: shop.province?.name_th || null,
        district: shop.amphure?.name_th || null,
        lat: shop.lat,
        lng: shop.lng,
        subscriptionTier: subscription?.subscription_package.tier || 'FREE',
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
