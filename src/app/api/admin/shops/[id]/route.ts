// src/app/api/admin/shops/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

//const prisma = new PrismaClient();
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/shops/[id]
 * ดึงรายละเอียดร้านสำหรับ admin review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: ตรวจสอบ admin authentication
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const shopId = parseInt(params.id);

    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    // ใช้ function get_shop_for_admin_review
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM get_shop_for_admin_review(${shopId})
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const shop = result[0];

    // แปลง BigInt และ format data
    const formattedShop = {
      ...shop,
      id: Number(shop.id),
      lat: shop.lat ? Number(shop.lat) : null,
      lng: shop.lng ? Number(shop.lng) : null,
    };

    return NextResponse.json(formattedShop);

  } catch (error) {
    console.error('Error fetching shop for admin:', error);
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
 * PUT /api/admin/shops/[id]
 * Admin แก้ไขข้อมูลร้าน
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: ตรวจสอบ admin authentication
    const adminId = 'admin_temp'; // จะได้จาก session

    const shopId = parseInt(params.id);
    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { admin_note, ...shopData } = body;

    // บันทึกการแก้ไข
    const updatedShop = await prisma.$executeRaw`
      UPDATE simple_shops
      SET 
        name = COALESCE(${shopData.name}, name),
        category = COALESCE(${shopData.category}, category),
        image = COALESCE(${shopData.image}, image),
        lat = COALESCE(${shopData.lat}, lat),
        lng = COALESCE(${shopData.lng}, lng),
        subdistrict = COALESCE(${shopData.subdistrict}, subdistrict),
        district = COALESCE(${shopData.district}, district),
        province = COALESCE(${shopData.province}, province),
        phone = COALESCE(${shopData.phone}, phone),
        last_edited_by_admin = ${adminId},
        admin_edit_note = ${admin_note || 'Admin edited'},
        admin_edit_at = NOW(),
        updated_at = NOW()
      WHERE id = ${shopId}
    `;

    // Log admin action
    await prisma.$executeRaw`
      INSERT INTO admin_action_logs (admin_id, shop_id, action, reason, changes)
      VALUES (
        ${adminId},
        ${shopId},
        'EDITED',
        ${admin_note},
        ${JSON.stringify(shopData)}::jsonb
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Shop updated by admin'
    });

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