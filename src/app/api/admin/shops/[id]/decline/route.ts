// src/app/api/admin/shops/[id]/decline/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

//const prisma = new PrismaClient();
import { prisma } from '@/lib/prisma';

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
