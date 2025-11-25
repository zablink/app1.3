// src/app/api/shops/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      categoryIds,
      address,
      phone,
      email,
      website,
      lineId,
      lineManUrl,
      grabFoodUrl,
      foodPandaUrl,
      shopeeUrl,
      hasPhysicalStore,
      showLocationOnMap,
      image,
      galleryImages,
      lat,
      lng,
    } = body;

    // Validate required fields
    if (!name || !categoryIds || categoryIds.length === 0 || !address || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create shop with transaction (increased timeout to 30 seconds)
    const result = await prisma.$transaction(async (tx) => {
      // Create shop first
      const shop = await tx.shop.create({
        data: {
          ownerId: session.user.id,
          name,
          description,
          address,
          image,
          has_physical_store: hasPhysicalStore,
          show_location_on_map: showLocationOnMap,
          lat: lat || null,
          lng: lng || null,
          status: 'PENDING', // ร้านค้าใหม่จะรอการอนุมัติจาก Admin
        },
      });

      // Add category mappings (multiple categories)
      await tx.shopCategoryMapping.createMany({
        data: categoryIds.map((categoryId: string) => ({
          shopId: shop.id,
          categoryId,
        })),
      });

      // Add shop links if provided
      const linksToCreate = [];
      
      if (phone) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'phone',
          url: phone,
        });
      }
      
      if (email) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'email',
          url: email,
        });
      }
      
      if (website) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'website',
          url: website,
        });
      }
      
      if (lineId) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'line',
          url: lineId,
        });
      }

      // Delivery platform links
      if (lineManUrl) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'lineman',
          url: lineManUrl,
        });
      }

      if (grabFoodUrl) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'grab',
          url: grabFoodUrl,
        });
      }

      if (foodPandaUrl) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'foodpanda',
          url: foodPandaUrl,
        });
      }

      if (shopeeUrl) {
        linksToCreate.push({
          shop_id: shop.id,
          type: 'shopee',
          url: shopeeUrl,
        });
      }

      if (linksToCreate.length > 0) {
        await tx.shop_links.createMany({
          data: linksToCreate,
        });
      }

      // Add gallery images if provided
      if (galleryImages && galleryImages.length > 0) {
        await tx.shop_gallery.createMany({
          data: galleryImages.map((imageUrl: string, index: number) => ({
            shop_id: shop.id,
            image_url: imageUrl,
            is_featured: index === 0, // First image is featured
          })),
        });
      }

      // Update user role to SHOP only after everything is created successfully
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: 'SHOP' }
      });

      return shop;
    }, {
      maxWait: 30000, // Maximum time to wait for transaction to start (30s)
      timeout: 30000,  // Maximum time for transaction to complete (30s)
    });

    return NextResponse.json({
      success: true,
      shop: result,
    });
  } catch (error) {
    console.error('Shop registration error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to register shop',
      },
      { status: 500 }
    );
  }
}
