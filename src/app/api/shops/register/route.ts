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
      categoryId,
      address,
      phone,
      email,
      website,
      lineId,
      hasPhysicalStore,
      showLocationOnMap,
      image,
      galleryImages,
      lat,
      lng,
    } = body;

    // Validate required fields
    if (!name || !categoryId || !address || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create shop with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create shop
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
          status: 'ACTIVE',
        },
      });

      // Add category mapping
      await tx.shopCategoryMapping.create({
        data: {
          shopId: shop.id,
          categoryId,
        },
      });

      // Add shop links if provided
      const links: any = {};
      if (phone) links.phone = phone;
      if (email) links.email = email;
      if (website) links.website = website;
      if (lineId) links.line_id = lineId;

      if (Object.keys(links).length > 0) {
        await tx.shop_links.create({
          data: {
            shop_id: shop.id,
            ...links,
          },
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

      return shop;
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
