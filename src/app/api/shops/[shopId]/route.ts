// src/app/api/shops/[shopId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const shopId = (await params).shopId;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    // Fetch shop with basic info using Prisma
    const shop: any = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        shop_gallery: {
          orderBy: [
            { is_featured: 'desc' },
            { uploaded_at: 'desc' }
          ]
        }
      }
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get subscription tier using raw query (for complex join)
    let packageTier = 'FREE';
    try {
      const tierResult = await prisma.$queryRaw<Array<{ tier: string }>>` 
        SELECT sp.tier
        FROM shop_subscriptions ss
        JOIN subscription_packages sp ON ss.package_id = sp.id
        WHERE ss.shop_id = ${shopId}
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
      `;      if (tierResult && tierResult.length > 0) {
        packageTier = tierResult[0].tier;
      }
    } catch (err) {
      console.error('Error fetching tier:', err);
      // Continue with FREE tier
    }

    // Get location data if available
    let locationData: {
      subdistrict: string | null;
      district: string | null;
      province: string | null;
    } = {
      subdistrict: null,
      district: null,
      province: null
    };

    // Always try to get location data based on lat/lng
    if (shop.lat && shop.lng) {
      try {
        const location = await prisma.$queryRaw<Array<{
          subdistrict: string | null;
          district: string | null;
          province: string | null;
        }>>` 
          SELECT 
            t.name_th as subdistrict,
            a.name_th as district,
            p.name_th as province
          FROM "Shop" s
          LEFT JOIN loc_tambons t ON ST_Contains(t.geom, ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326))
          LEFT JOIN loc_amphures a ON ST_Contains(a.geom, ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326))
          LEFT JOIN loc_provinces p ON ST_Contains(p.geom, ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326))
          WHERE s.id = ${shopId}
          LIMIT 1
        `;        if (location && location.length > 0) {
          locationData = location[0];
        }
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    }

    // Add badge emoji and text based on package tier
    const PACKAGE_BADGES: Record<string, { emoji: string; text: string }> = {
      PREMIUM: { emoji: '👑', text: 'Premium Partner' },
      PRO: { emoji: '🔥', text: 'Pro Shop' },
      BASIC: { emoji: '⭐', text: 'Verified' },
      FREE: { emoji: '', text: '' },
    };

    const badge = PACKAGE_BADGES[packageTier] || PACKAGE_BADGES.FREE;

    // Transform categories to array format
    const categories = shop.categories?.map((sc: any) => ({
      id: sc.category.id,
      name: sc.category.name,
      slug: sc.category.slug,
      icon: sc.category.icon
    })) || [];

    // Transform gallery images
    const galleryImages = shop.shop_gallery?.map((img: any) => ({
      id: img.id,
      url: img.image_url,
      isFeatured: img.is_featured,
      uploadedAt: img.uploaded_at
    })) || [];

    return NextResponse.json({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      address: shop.address,
      image: shop.image,
      gallery: galleryImages,
      lat: shop.lat,
      lng: shop.lng,
      phone: null, // Not in schema, will need to add if needed
      website: null, // Not in schema, will need to add if needed
      status: shop.status,
      createdAt: shop.createdAt,
      categories: categories,
      package_tier: packageTier,
      badge_emoji: badge.emoji,
      badge_text: badge.text,
      lineManUrl: shop.lineManUrl,
      grabFoodUrl: shop.grabFoodUrl,
      foodPandaUrl: shop.foodPandaUrl,
      shopeeUrl: shop.shopeeUrl,
      has_physical_store: shop.has_physical_store,
      show_location_on_map: shop.show_location_on_map,
      ...locationData
    });

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

// PUT - Update shop
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const shopId = (await params).id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check shop ownership
    const shop = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    if (shop.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      categoryIds,
      address,
      hasPhysicalStore,
      showLocationOnMap,
      lat,
      lng,
    } = body;

    // Update shop with transaction
    await prisma.$transaction(async (tx) => {
      // Update basic shop info
      await tx.shop.update({
        where: { id: shopId },
        data: {
          name,
          description,
          address,
          has_physical_store: hasPhysicalStore,
          show_location_on_map: showLocationOnMap,
          lat: lat || null,
          lng: lng || null,
        },
      });

      // Update categories - delete all existing and create new ones
      if (categoryIds && Array.isArray(categoryIds)) {
        // Delete existing category mappings
        await tx.shopCategoryMapping.deleteMany({
          where: { shopId },
        });

        // Create new category mappings
        if (categoryIds.length > 0) {
          await tx.shopCategoryMapping.createMany({
            data: categoryIds.map((categoryId: string) => ({
              shopId,
              categoryId,
            })),
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Shop updated successfully',
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json(
      {
        error: 'Failed to update shop',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
