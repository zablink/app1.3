// src/app/api/subscriptions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscriptions?shop_id=123
 * ดึงข้อมูล subscription ปัจจุบันของร้าน
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shop_id');

    if (!shopId) {
      return NextResponse.json(
        { error: 'shop_id is required' },
        { status: 400 }
      );
    }

    // ใช้ function ที่เราสร้างไว้
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM get_active_subscription(${parseInt(shopId)})
    `;

    if (result.length === 0) {
      return NextResponse.json({
        has_subscription: false,
        current_tier: 'FREE',
        message: 'No active subscription'
      });
    }

    const sub = result[0];

    return NextResponse.json({
      has_subscription: true,
      subscription_id: sub.subscription_id,
      current_tier: sub.current_tier,
      next_tier: sub.next_tier,
      status: sub.status,
      start_date: sub.start_date,
      end_date: sub.end_date,
      days_remaining: sub.days_remaining,
      has_scheduled_change: sub.has_scheduled_change
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * สร้าง subscription ใหม่ หรือ อัปเกรด/ดาวน์เกรด
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, action, new_tier, payment_amount } = body;

    if (!shop_id || !action || !new_tier) {
      return NextResponse.json(
        { error: 'shop_id, action, and new_tier are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า tier ถูกต้อง
    const validTiers = ['FREE', 'BASIC', 'PRO', 'PREMIUM'];
    if (!validTiers.includes(new_tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'UPGRADE':
        // อัปเกรดทันที
        if (!payment_amount) {
          return NextResponse.json(
            { error: 'payment_amount is required for upgrade' },
            { status: 400 }
          );
        }

        result = await prisma.$queryRaw<any[]>`
          SELECT upgrade_subscription(
            ${parseInt(shop_id)},
            ${new_tier}::subscription_tier,
            ${parseFloat(payment_amount)}
          ) as new_subscription_id
        `;

        return NextResponse.json({
          success: true,
          action: 'UPGRADED',
          new_subscription_id: result[0].new_subscription_id,
          effective_immediately: true,
          message: 'Subscription upgraded successfully'
        });

      case 'DOWNGRADE':
        // ดาวน์เกรด (มีผลเมื่อหมดเดือน)
        result = await prisma.$queryRaw<any[]>`
          SELECT schedule_downgrade(
            ${parseInt(shop_id)},
            ${new_tier}::subscription_tier
          ) as subscription_id
        `;

        return NextResponse.json({
          success: true,
          action: 'DOWNGRADE_SCHEDULED',
          subscription_id: result[0].subscription_id,
          effective_immediately: false,
          message: 'Downgrade scheduled for end of billing period'
        });

      case 'CREATE':
        // สร้าง subscription ใหม่
        const newSubId = await createNewSubscription(
          parseInt(shop_id),
          new_tier,
          payment_amount
        );

        return NextResponse.json({
          success: true,
          action: 'CREATED',
          subscription_id: newSubId,
          message: 'Subscription created successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use UPGRADE, DOWNGRADE, or CREATE' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage subscription',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function: สร้าง subscription ใหม่
async function createNewSubscription(
  shopId: number,
  tier: string,
  paymentAmount?: number
) {
  const packageInfo = await prisma.$queryRaw<any[]>`
    SELECT price_monthly
    FROM subscription_packages
    WHERE tier = ${tier}::subscription_tier
  `;

  if (packageInfo.length === 0) {
    throw new Error('Package not found');
  }

  const price = packageInfo[0].price_monthly;
  const finalAmount = paymentAmount || price;

  const result = await prisma.$queryRaw<any[]>`
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
      ${tier}::subscription_tier,
      NOW(),
      NOW() + INTERVAL '30 days',
      'ACTIVE',
      ${price},
      ${finalAmount},
      'PAID',
      NOW()
    )
    RETURNING id
  `;

  return result[0].id;
}