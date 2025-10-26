// src/app/api/shops/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // ดึงข้อมูลร้านจาก simple_shops (ไม่มี subscription system)
    const shop = await prisma.simple_shops.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Format response with default values (simple_shops ไม่มี subscription)
    const formattedShop = {
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
        lat: lat !== undefined ? (lat ? parseFloat(lat) : null) : existingShop.lat,
        lng: lng !== undefined ? (lng ? parseFloat(lng) : null) : existingShop.lng,
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

    // ลบร้าน
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