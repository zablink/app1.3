// src/app/api/cron/process-subscriptions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/cron/process-subscriptions
 * 
 * Cron Job ที่รันทุกวัน เพื่อ:
 * 1. Process scheduled downgrades
 * 2. Expire old subscriptions
 * 3. Send renewal reminders
 * 
 * ตั้งค่าใน Vercel Cron Jobs หรือใช้ external service เช่น:
 * - Vercel Cron: ตั้งค่าใน vercel.json
 * - Uptime Robot: Ping URL นี้ทุกวัน
 * - GitHub Actions: Scheduled workflow
 */
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authorization (ควรมี secret key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'change-this-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Processing subscription changes...');

    // 1. Process scheduled changes (downgrades)
    const processedChanges = await processScheduledChanges();

    // 2. Expire old subscriptions
    const expiredCount = await expireOldSubscriptions();

    // 3. Get upcoming renewals (within 7 days)
    const upcomingRenewals = await getUpcomingRenewals();

    console.log('[CRON] Completed:', {
      processed: processedChanges.length,
      expired: expiredCount,
      renewals: upcomingRenewals.length
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        processed_changes: processedChanges,
        expired_subscriptions: expiredCount,
        upcoming_renewals: upcomingRenewals
      }
    });

  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 1. Process scheduled changes (downgrades)
 * หา subscriptions ที่มี status = 'PENDING_DOWNGRADE' และถึงเวลาแล้ว
 * แล้วสร้าง subscription ใหม่ตาม tier ที่ต้องการ downgrade
 */
async function processScheduledChanges() {
  const results: any[] = [];

  try {
    // หา subscriptions ที่ถึงเวลา downgrade
    const pendingDowngrades = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        shop_id,
        current_package_tier,
        next_package_tier,
        change_scheduled_at,
        end_date
      FROM shop_subscriptions
      WHERE status = 'PENDING_DOWNGRADE'
        AND change_scheduled_at <= NOW()
      ORDER BY change_scheduled_at ASC
    `;

    console.log(`[CRON] Found ${pendingDowngrades.length} pending downgrades`);

    for (const subscription of pendingDowngrades) {
      try {
        const shopId = Number(subscription.shop_id);
        const oldTier = subscription.current_package_tier;
        const newTier = subscription.next_package_tier;

        // ดึงราคาของ package ใหม่
        const packageInfo = await prisma.$queryRaw<any[]>`
          SELECT price_monthly
          FROM subscription_packages
          WHERE tier = ${newTier}::subscription_tier
          LIMIT 1
        `;

        if (packageInfo.length === 0) {
          console.error(`[CRON] Package not found: ${newTier}`);
          continue;
        }

        const newPrice = Number(packageInfo[0].price_monthly);

        // สร้าง subscription ใหม่
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
            paid_at,
            parent_subscription_id
          ) VALUES (
            ${shopId},
            ${newTier}::subscription_tier,
            NOW(),
            NOW() + INTERVAL '30 days',
            'ACTIVE',
            ${newPrice},
            ${newPrice},
            'PAID',
            NOW(),
            ${subscription.id}
          )
        `;

        // ปิด subscription เก่า
        await prisma.$executeRaw`
          UPDATE shop_subscriptions
          SET status = 'EXPIRED', updated_at = NOW()
          WHERE id = ${subscription.id}
        `;

        // บันทึกประวัติ
        await prisma.$executeRaw`
          INSERT INTO subscription_history (
            shop_id,
            subscription_id,
            action,
            from_tier,
            to_tier,
            amount,
            effective_date
          ) VALUES (
            ${shopId},
            (SELECT id FROM shop_subscriptions WHERE shop_id = ${shopId} AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1),
            'DOWNGRADED',
            ${oldTier}::subscription_tier,
            ${newTier}::subscription_tier,
            ${newPrice},
            NOW()
          )
        `;

        results.push({
          shop_id: shopId,
          action: 'DOWNGRADED',
          from_tier: oldTier,
          to_tier: newTier,
          processed_at: new Date().toISOString()
        });

        console.log(`[CRON] ✅ Processed downgrade for shop ${shopId}: ${oldTier} → ${newTier}`);

      } catch (error) {
        console.error(`[CRON] Error processing downgrade:`, error);
      }
    }

  } catch (error) {
    console.error('[CRON] Error in processScheduledChanges:', error);
  }

  return results;
}

/**
 * 2. Expire old subscriptions
 * หา subscriptions ที่หมดอายุแล้ว (end_date < NOW) และยัง status = 'ACTIVE'
 * แล้วเปลี่ยน status เป็น 'EXPIRED'
 */
async function expireOldSubscriptions() {
  try {
    const result = await prisma.$executeRaw`
      UPDATE shop_subscriptions
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE status = 'ACTIVE'
        AND end_date < NOW()
    `;

    console.log(`[CRON] ✅ Expired ${result} subscriptions`);
    return Number(result);

  } catch (error) {
    console.error('[CRON] Error in expireOldSubscriptions:', error);
    return 0;
  }
}

/**
 * 3. Get upcoming renewals (within 7 days)
 * หา subscriptions ที่จะหมดอายุในอีก 7 วัน
 * เพื่อส่ง notification ให้เจ้าของร้าน
 */
async function getUpcomingRenewals() {
  try {
    const upcomingRenewals = await prisma.$queryRaw<any[]>`
      SELECT 
        ss.id as subscription_id,
        ss.shop_id,
        s.name as shop_name,
        ss.current_package_tier as tier,
        ss.end_date,
        ss.final_price as price,
        DATE_PART('day', ss.end_date - NOW()) as days_remaining
      FROM shop_subscriptions ss
      INNER JOIN simple_shops s ON s.id = ss.shop_id
      WHERE ss.status = 'ACTIVE'
        AND ss.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY ss.end_date ASC
    `;

    // แปลง days_remaining เป็น integer
    const formatted = upcomingRenewals.map(renewal => ({
      ...renewal,
      shop_id: Number(renewal.shop_id),
      days_remaining: Math.ceil(Number(renewal.days_remaining)),
      price: Number(renewal.price)
    }));

    console.log(`[CRON] ✅ Found ${formatted.length} upcoming renewals`);
    
    return formatted;

  } catch (error) {
    console.error('[CRON] Error in getUpcomingRenewals:', error);
    return [];
  }
}