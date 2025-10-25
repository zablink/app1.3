// src/app/api/admin/shops/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/admin/shops/[id]/approve
 * Admin อนุมัติร้าน
 */
export async function POST(
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

    // ตรวจสอบว่าร้านอยู่ในสถานะ PENDING_APPROVAL
    const shop = await prisma.simple_shops.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    if (shop.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: `Shop is already ${shop.status}` },
        { status: 400 }
      );
    }

    // อนุมัติร้าน
    await prisma.simple_shops.update({
      where: { id: shopId },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
        approved_by: adminId,
        rejection_reason: null,
        updated_at: new Date(),
      },
    });

    // สร้าง FREE subscription ให้ร้าน
    await prisma.$executeRaw`
      INSERT INTO shop_subscriptions (
        shop_id,
        current_package_tier,
        start_date,
        end_date,
        status,
        original_price,
        final_price,
        payment_status,
        paid_at
      ) VALUES (
        ${shopId},
        'FREE',
        NOW(),
        NOW() + INTERVAL '100 years',
        'ACTIVE',
        0,
        0,
        'PAID',
        NOW()
      )
      ON CONFLICT (shop_id) DO NOTHING
    `;

    // Log admin action
    await prisma.$executeRaw`
      INSERT INTO admin_action_logs (admin_id, shop_id, action)
      VALUES (${adminId}, ${shopId}, 'APPROVED')
    `;

    // TODO: ส่ง email แจ้ง owner
    // await sendEmail({
    //   to: shop.email,
    //   subject: 'ร้านของคุณได้รับการอนุมัติแล้ว!',
    //   template: 'shop-approved',
    //   data: { shopName: shop.name }
    // });

    return NextResponse.json({
      success: true,
      message: 'Shop approved successfully',
      shopId: shopId,
    });

  } catch (error) {
    console.error('Error approving shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve shop',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


// src/app/api/admin/shops/[id]/decline/route.ts

/**
 * POST /api/admin/shops/[id]/decline
 * Admin ปฏิเสธร้าน
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: ตรวจสอบ admin authentication
    const adminId = 'admin_temp';

    const shopId = parseInt(params.id);
    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // ตรวจสอบร้าน
    const shop = await prisma.simple_shops.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // ปฏิเสธร้าน
    await prisma.$executeRaw`
      UPDATE simple_shops
      SET 
        status = 'REJECTED',
        rejection_reason = ${rejection_reason},
        rejection_count = rejection_count + 1,
        updated_at = NOW()
      WHERE id = ${shopId}
    `;

    // Log admin action
    await prisma.$executeRaw`
      INSERT INTO admin_action_logs (admin_id, shop_id, action, reason)
      VALUES (${adminId}, ${shopId}, 'REJECTED', ${rejection_reason})
    `;

    // TODO: ส่ง email แจ้ง owner
    // await sendEmail({
    //   to: shop.email,
    //   subject: 'การสมัครร้านค้าของคุณต้องการแก้ไข',
    //   template: 'shop-rejected',
    //   data: {
    //     shopName: shop.name,
    //     reason: rejection_reason,
    //     editLink: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/edit/${shopId}`
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Shop declined successfully',
      shopId: shopId,
    });

  } catch (error) {
    console.error('Error declining shop:', error);
    return NextResponse.json(
      { 
        error: 'Failed to decline shop',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}